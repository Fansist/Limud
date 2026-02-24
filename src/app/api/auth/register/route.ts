import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, role, accountType, gradeLevel, childName, childGrade } = body;

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

    // Validate role
    const validRoles = ['STUDENT', 'TEACHER', 'PARENT'];
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
    const userRole = role.toUpperCase() as 'STUDENT' | 'TEACHER' | 'PARENT';
    const userAccountType = accountType || (userRole === 'PARENT' && childName ? 'HOMESCHOOL' : 'INDIVIDUAL');

    // For homeschool parents, create a district for them
    let districtId: string | undefined;

    if (userAccountType === 'HOMESCHOOL') {
      const district = await prisma.schoolDistrict.create({
        data: {
          name: `${name}'s Homeschool`,
          subdomain: `homeschool-${Date.now()}`,
          contactEmail: email,
          subscriptionStatus: 'TRIAL',
          subscriptionTier: 'FREE',
          pricePerYear: 0,
          maxStudents: 5,
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

    // If student, create reward stats
    if (userRole === 'STUDENT') {
      await prisma.rewardStats.create({ data: { userId: user.id } });
    }

    // If homeschool parent with child info, create the child account
    if (userAccountType === 'HOMESCHOOL' && childName && districtId) {
      const childPassword = await bcrypt.hash(password, 12); // Same password for simplicity
      const childUser = await prisma.user.create({
        data: {
          email: `${email.split('@')[0]}+child@${email.split('@')[1]}`,
          name: childName,
          password: childPassword,
          role: 'STUDENT',
          accountType: 'HOMESCHOOL',
          districtId,
          gradeLevel: childGrade || null,
          parentId: user.id,
          isActive: true,
        },
      });
      await prisma.rewardStats.create({ data: { userId: childUser.id } });

      // Create a default course for the homeschool
      const course = await prisma.course.create({
        data: {
          name: 'General Studies',
          description: 'Default course for homeschool curriculum',
          subject: 'General',
          gradeLevel: childGrade || 'K-12',
          districtId,
        },
      });

      // Enroll child in the course
      await prisma.enrollment.create({
        data: {
          courseId: course.id,
          studentId: childUser.id,
        },
      });

      // If parent also acts as teacher, link them to the course
      if (userRole === 'PARENT') {
        // We'll handle teacher functionality through the parent role for homeschool
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Account created successfully!',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        accountType: user.accountType,
      },
    }, { status: 201 });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
  }
}
