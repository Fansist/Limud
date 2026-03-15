import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      name, email, password, role, accountType,
      gradeLevel, childName, childGrade,
      children: childrenList, districtName,
    } = body;

    // Validate required fields
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Name, email, password, and role are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // BUG FIX: Allow ADMIN role for district administrators
    const validRoles = ['STUDENT', 'TEACHER', 'PARENT', 'ADMIN'];
    if (!validRoles.includes(role.toUpperCase())) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    const userRole = role.toUpperCase() as 'STUDENT' | 'TEACHER' | 'PARENT' | 'ADMIN';
    const userAccountType = accountType || (userRole === 'PARENT' && childName ? 'HOMESCHOOL' : userRole === 'ADMIN' ? 'DISTRICT' : 'INDIVIDUAL');

    let districtId: string | undefined;

    // BUG FIX: Create district for ADMIN accounts (District Administrator flow)
    if (userRole === 'ADMIN') {
      const district = await prisma.schoolDistrict.create({
        data: {
          name: districtName || `${name}'s District`,
          subdomain: `district-${Date.now()}`,
          contactEmail: email,
          subscriptionStatus: 'TRIAL',
          subscriptionTier: 'FREE',
          pricePerYear: 0,
          maxStudents: 50,
          maxTeachers: 10,
          maxSchools: 3,
          isHomeschool: false,
        },
      });
      districtId = district.id;
    }

    // Create district for homeschool parents
    if (userAccountType === 'HOMESCHOOL') {
      const district = await prisma.schoolDistrict.create({
        data: {
          name: `${name}'s Homeschool`,
          subdomain: `homeschool-${Date.now()}`,
          contactEmail: email,
          subscriptionStatus: 'TRIAL',
          subscriptionTier: 'FREE',
          pricePerYear: 0,
          maxStudents: 10,
          maxTeachers: 2,
          isHomeschool: true,
        },
      });
      districtId = district.id;
    }

    // Create the user
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: userRole,
        accountType: userAccountType as any,
        districtId: districtId || null,
        gradeLevel: userRole === 'STUDENT' ? gradeLevel || null : null,
        isActive: true,
        onboardingComplete: false,
      },
    });

    // BUG FIX: Create DistrictAdmin record for ADMIN users so they have proper permissions
    if (userRole === 'ADMIN' && districtId) {
      await prisma.districtAdmin.create({
        data: {
          userId: user.id,
          districtId,
          accessLevel: 'SUPERINTENDENT',
          canCreateAccounts: true,
          canManageSchools: true,
          canManageBilling: true,
          canViewAllData: true,
          canManageClasses: true,
        },
      });
    }

    // If student, create reward stats
    if (userRole === 'STUDENT') {
      await prisma.rewardStats.create({ data: { userId: user.id } });
    }

    // Handle children creation for homeschool parents
    if (userAccountType === 'HOMESCHOOL' && districtId) {
      const childrenToCreate = childrenList || (childName ? [{ name: childName, grade: childGrade }] : []);

      for (let i = 0; i < childrenToCreate.length; i++) {
        const child = childrenToCreate[i];
        if (!child.name) continue;

        const childEmailLocal = email.split('@')[0];
        const childEmailDomain = email.split('@')[1];
        const childEmail = `${childEmailLocal}+${child.name.toLowerCase().replace(/\s+/g, '')}@${childEmailDomain}`;

        // Check if email already exists
        const existingChild = await prisma.user.findUnique({ where: { email: childEmail } });
        if (existingChild) continue;

        const childPassword = await bcrypt.hash(password, 12);
        const childUser = await prisma.user.create({
          data: {
            email: childEmail,
            name: child.name,
            password: childPassword,
            role: 'STUDENT',
            accountType: 'HOMESCHOOL',
            districtId,
            gradeLevel: child.grade || null,
            parentId: user.id,
            isActive: true,
          },
        });
        await prisma.rewardStats.create({ data: { userId: childUser.id } });

        // Create a default course for each child if this is the first child
        if (i === 0) {
          const course = await prisma.course.create({
            data: {
              name: 'General Studies',
              description: 'Default course for homeschool curriculum',
              subject: 'General',
              gradeLevel: child.grade || 'K-12',
              districtId,
            },
          });

          // Enroll the child in the course
          await prisma.enrollment.create({
            data: {
              courseId: course.id,
              studentId: childUser.id,
            },
          });
        } else {
          // Enroll in existing courses
          const courses = await prisma.course.findMany({
            where: { districtId },
          });
          for (const course of courses) {
            await prisma.enrollment.create({
              data: { courseId: course.id, studentId: childUser.id },
            }).catch(() => {}); // Ignore duplicates
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: userRole === 'ADMIN'
        ? 'Admin account created! Choose a plan to get started.'
        : 'Account created successfully!',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        accountType: user.accountType,
        districtId: districtId || null,
      },
    }, { status: 201 });

  } catch (error: any) {
    console.error('Registration error:', error);

    // Provide more specific error messages for common Prisma errors
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
    }
    if (error?.code === 'P2003') {
      return NextResponse.json({ error: 'Invalid reference. Please try again.' }, { status: 400 });
    }

    // Handle database connection errors gracefully
    if (error?.message?.includes('connect') || error?.message?.includes('ECONNREFUSED') || error?.code === 'P1001') {
      return NextResponse.json({
        error: 'Unable to connect to the database. Please try again later or contact support.',
      }, { status: 503 });
    }

    return NextResponse.json({ error: 'Failed to create account. Please try again.' }, { status: 500 });
  }
}
