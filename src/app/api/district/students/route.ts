import { NextResponse } from 'next/server';
import { requireRole, apiHandler } from '@/lib/middleware';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Prisma } from '@prisma/client';

function generateTempPassword(): string {
  return crypto.randomBytes(12).toString('base64url');
}

// GET /api/district/students - List students in district
export const GET = apiHandler(async (req: Request) => {
  const user = await requireRole('ADMIN');
  const { searchParams } = new URL(req.url);
  const schoolId = searchParams.get('schoolId');
  const gradeLevel = searchParams.get('gradeLevel');

  const where: Prisma.UserWhereInput = { districtId: user.districtId, role: 'STUDENT' };
  if (schoolId) where.schoolId = schoolId;
  if (gradeLevel) where.gradeLevel = gradeLevel;

  const students = await prisma.user.findMany({
    where,
    select: {
      id: true, email: true, name: true, firstName: true, lastName: true,
      gradeLevel: true, schoolId: true, parentId: true, siblingGroupId: true,
      address: true, city: true, state: true, zipCode: true, phone: true,
      dateOfBirth: true, emergencyContact: true, emergencyPhone: true,
      isActive: true, createdAt: true,
      school: { select: { id: true, name: true } },
      parent: { select: { id: true, name: true, email: true } },
      rewardStats: { select: { totalXP: true, level: true, currentStreak: true } },
      classroomStudents: { include: { classroom: { select: { id: true, name: true } } } },
    },
    orderBy: { name: 'asc' },
  });

  return NextResponse.json({ students });
});

// POST /api/district/students - Create student account(s) with full personal info
export const POST = apiHandler(async (req: Request) => {
  const user = await requireRole('ADMIN');
  const body = await req.json();

  // Check district admin access level
  const adminRecord = await prisma.districtAdmin.findUnique({
    where: { userId_districtId: { userId: user.id, districtId: user.districtId } },
  });
  if (adminRecord && !adminRecord.canCreateAccounts) {
    return NextResponse.json({ error: 'You do not have permission to create accounts' }, { status: 403 });
  }

  // Check district capacity
  const district = await prisma.schoolDistrict.findUnique({ where: { id: user.districtId } });
  if (!district) {
    return NextResponse.json({ error: 'District not found' }, { status: 404 });
  }

  const currentStudentCount = await prisma.user.count({
    where: { districtId: user.districtId, role: 'STUDENT' },
  });

  const { students } = body;
  if (!students || !Array.isArray(students) || students.length === 0) {
    return NextResponse.json({ error: 'students array is required' }, { status: 400 });
  }

  if (currentStudentCount + students.length > district.maxStudents) {
    return NextResponse.json({
      error: `Cannot create ${students.length} students. District limit: ${district.maxStudents}, current: ${currentStudentCount}`,
    }, { status: 400 });
  }

  // Security: each student and each auto-generated parent gets a unique random
  // temp password. Previously all of them shared the hardcoded 'limud2024!',
  // which was a credential-reuse vulnerability at district scale.
  interface ProvisionResult {
    email: string;
    success: boolean;
    error?: string;
    studentId?: string;
    studentTempPassword?: string;
    parentAccounts?: { id: string; email: string; role: string; tempPassword: string }[];
    siblingGroupId?: string | null;
  }
  const results: ProvisionResult[] = [];

  for (const student of students) {
    try {
      const {
        firstName, lastName, email, gradeLevel, schoolId,
        address, city, state, zipCode, phone, dateOfBirth,
        emergencyContact, emergencyPhone,
        siblingGroupId, // If set, skip parent creation (sibling of existing student)
        password,
      } = student;

      // Validate required fields
      if (!firstName || !lastName || !email || !gradeLevel) {
        results.push({ email: email || 'unknown', success: false, error: 'firstName, lastName, email, and gradeLevel are required' });
        continue;
      }

      // Check duplicate email
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        results.push({ email, success: false, error: 'Email already exists' });
        continue;
      }

      // Generate a unique random temp password per student if none supplied.
      const studentTempPassword = password || generateTempPassword();
      const hashedPw = await bcrypt.hash(studentTempPassword, 12);
      const fullName = `${firstName} ${lastName}`;

      // Determine if this student is a sibling (shares parents with another student)
      let parentId: string | null = null;
      let actualSiblingGroupId = siblingGroupId || null;

      if (siblingGroupId) {
        // Find existing student in the same sibling group to get parent
        const sibling = await prisma.user.findFirst({
          where: { siblingGroupId, role: 'STUDENT', districtId: user.districtId },
          select: { parentId: true },
        });
        if (!sibling) {
          results.push({ email, success: false, error: 'No matching sibling found in your district' });
          continue;
        }
        if (sibling.parentId) {
          parentId = sibling.parentId;
        }
      }

      // Create the student
      const newStudent = await prisma.user.create({
        data: {
          email,
          name: fullName,
          firstName,
          lastName,
          password: hashedPw,
          role: 'STUDENT',
          accountType: 'DISTRICT',
          districtId: user.districtId,
          schoolId: schoolId || null,
          gradeLevel,
          parentId,
          siblingGroupId: actualSiblingGroupId,
          address: address || null,
          city: city || null,
          state: state || null,
          zipCode: zipCode || null,
          phone: phone || null,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
          emergencyContact: emergencyContact || null,
          emergencyPhone: emergencyPhone || null,
          isActive: true,
        },
      });

      // Create reward stats
      await prisma.rewardStats.create({ data: { userId: newStudent.id } });

      // Auto-create 2 parent accounts if NOT a sibling
      const parentAccounts: { id: string; email: string; role: string; tempPassword: string }[] = [];
      if (!siblingGroupId) {
        const newSiblingGroupId = newStudent.id; // Use student ID as sibling group

        // Update student with sibling group
        await prisma.user.update({
          where: { id: newStudent.id },
          data: { siblingGroupId: newSiblingGroupId },
        });

        // Create Parent 1 (Guardian 1)
        const parent1Email = `parent1.${email.split('@')[0]}@${email.split('@')[1]}`;
        const existingP1 = await prisma.user.findUnique({ where: { email: parent1Email } });
        if (!existingP1) {
          const p1Temp = generateTempPassword();
          const parent1 = await prisma.user.create({
            data: {
              email: parent1Email,
              name: `Parent of ${fullName}`,
              firstName: `Parent 1`,
              lastName: lastName,
              password: await bcrypt.hash(p1Temp, 12),
              role: 'PARENT',
              accountType: 'DISTRICT',
              districtId: user.districtId,
              isActive: true,
            },
          });
          parentAccounts.push({ id: parent1.id, email: parent1Email, role: 'Parent 1', tempPassword: p1Temp });

          // Link student to parent 1
          await prisma.user.update({
            where: { id: newStudent.id },
            data: { parentId: parent1.id },
          });
        }

        // Create Parent 2 (Guardian 2)
        const parent2Email = `parent2.${email.split('@')[0]}@${email.split('@')[1]}`;
        const existingP2 = await prisma.user.findUnique({ where: { email: parent2Email } });
        if (!existingP2) {
          const p2Temp = generateTempPassword();
          const parent2 = await prisma.user.create({
            data: {
              email: parent2Email,
              name: `Parent 2 of ${fullName}`,
              firstName: `Parent 2`,
              lastName: lastName,
              password: await bcrypt.hash(p2Temp, 12),
              role: 'PARENT',
              accountType: 'DISTRICT',
              districtId: user.districtId,
              isActive: true,
            },
          });
          parentAccounts.push({ id: parent2.id, email: parent2Email, role: 'Parent 2', tempPassword: p2Temp });
        }
      }

      results.push({
        email,
        success: true,
        studentId: newStudent.id,
        // Only include tempPassword if we generated one (caller didn't supply).
        ...(password ? {} : { studentTempPassword }),
        parentAccounts,
        siblingGroupId: actualSiblingGroupId || newStudent.id,
      });

    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Creation failed';
      console.error('[district/students] create failed:', msg);
      results.push({ email: student.email || 'unknown', success: false, error: 'Creation failed' });
    }
  }

  const successCount = results.filter(r => r.success).length;
  return NextResponse.json({
    message: `Created ${successCount} of ${students.length} students`,
    results,
  });
});

// PUT /api/district/students - Update student info
export const PUT = apiHandler(async (req: Request) => {
  const user = await requireRole('ADMIN');
  const { studentId, ...updates } = await req.json();

  if (!studentId) return NextResponse.json({ error: 'studentId required' }, { status: 400 });

  const student = await prisma.user.findFirst({
    where: { id: studentId, districtId: user.districtId, role: 'STUDENT' },
  });
  if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

  const allowedFields = [
    'firstName', 'lastName', 'gradeLevel', 'schoolId', 'address', 'city',
    'state', 'zipCode', 'phone', 'emergencyContact', 'emergencyPhone', 'isActive',
  ] as const;

  const data: Prisma.UserUpdateInput = {};
  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      (data as Record<string, unknown>)[field] = updates[field];
    }
  }
  if (updates.firstName || updates.lastName) {
    data.name = `${updates.firstName || student.firstName || ''} ${updates.lastName || student.lastName || ''}`.trim();
  }

  const updated = await prisma.user.update({ where: { id: studentId }, data });
  return NextResponse.json({ student: updated });
});

// DELETE /api/district/students - Deactivate student
export const DELETE = apiHandler(async (req: Request) => {
  const user = await requireRole('ADMIN');
  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get('id');

  if (!studentId) return NextResponse.json({ error: 'Student ID required' }, { status: 400 });

  const result = await prisma.user.updateMany({
    where: { id: studentId, districtId: user.districtId, role: 'STUDENT' },
    data: { isActive: false },
  });

  if (result.count === 0) {
    return NextResponse.json({ error: 'Student not found in your district' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
});
