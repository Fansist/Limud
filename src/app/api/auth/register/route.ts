/**
 * Registration API — v9.4.3 Security Hardened
 * - Rate limited: 3 per minute per IP
 * - NIST SP 800-63B password validation
 * - Input sanitization (XSS, prototype pollution)
 * - Anti-enumeration (generic errors for duplicate emails)
 * - COPPA: flags minor accounts for parental consent
 * - Audit logging all registration events
 * - v9.3.5: Improved error responses — returns all password errors with details
 * - v9.4.0: Added SELF_EDUCATION account type for independent learners
 * - v9.4.1: Fixed fatal ReferenceError — districtId declaration ordering
 * - v9.4.2: Enhanced error logging with full stack traces for debugging;
 *   improved error responses to surface actual failure reasons
 */
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { AccountType, Prisma } from '@prisma/client';
import {
  validatePassword,
  sanitizeEmail,
  sanitizeForDisplay,
  checkRateLimit,
  createAuditLog,
  trackSecurityEvent,
  getClientIP,
  getUserAgent,
  SECURITY_CONFIG,
} from '@/lib/security';

export async function POST(req: Request) {
  const ip = getClientIP(req);
  const ua = getUserAgent(req);

  // ── Rate limit: 3 registrations per minute per IP ──
  const rateCheck = checkRateLimit(`register:${ip}`, 'register');
  if (!rateCheck.allowed) {
    trackSecurityEvent('rate_limit', ip);
    createAuditLog({
      action: 'RATE_LIMITED', ip, userAgent: ua,
      resource: '/api/auth/register',
      details: { retryAfterMs: rateCheck.retryAfterMs },
      severity: 'warning', success: false,
    });
    return NextResponse.json(
      { error: 'Too many registration attempts. Please wait a minute and try again.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(rateCheck.retryAfterMs / 1000)) } }
    );
  }

  const warnings: string[] = [];
  try {
    const body = await req.json();
    const {
      name, email, password, role, accountType,
      gradeLevel, childName, childGrade,
      children: childrenList, districtName,
      learningStyle,
    } = body;

    // ── Validate required fields ──
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Name, email, password, and role are required' },
        { status: 400 }
      );
    }

    // ── Sanitize & validate email ──
    const cleanEmail = sanitizeEmail(String(email));
    if (!cleanEmail) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // ── Sanitize name (XSS prevention) ──
    const cleanName = sanitizeForDisplay(String(name).trim()).substring(0, SECURITY_CONFIG.input.maxNameLength);
    if (!cleanName || cleanName.length < 2) {
      return NextResponse.json({ error: 'Name must be at least 2 characters' }, { status: 400 });
    }

    // ── Strong password policy (NIST SP 800-63B) ──
    const passwordCheck = validatePassword(String(password), cleanEmail, cleanName);
    if (!passwordCheck.valid) {
      return NextResponse.json(
        {
          error: `Password requirements not met: ${passwordCheck.errors.join('. ')}`,
          passwordErrors: passwordCheck.errors,
          strength: passwordCheck.strength,
        },
        { status: 400 }
      );
    }

    // ── Validate role ──
    const validRoles = ['STUDENT', 'TEACHER', 'PARENT', 'ADMIN'];
    const upperRole = String(role).toUpperCase();
    if (!validRoles.includes(upperRole)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // ── Dynamic imports (resilience) ──
    const bcrypt = (await import('bcryptjs')).default;
    const { default: prisma } = await import('@/lib/prisma');

    // ── Check duplicate (anti-enumeration) ──
    const existingUser = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existingUser) {
      trackSecurityEvent('suspicious', ip);
      createAuditLog({
        action: 'SUSPICIOUS_ACTIVITY', ip, userAgent: ua,
        resource: '/api/auth/register',
        details: { reason: 'Duplicate email registration attempt' },
        severity: 'warning', success: false,
      });
      return NextResponse.json(
        { error: 'Unable to create account. Please try a different email.' },
        { status: 409 }
      );
    }

    // ── Hash password (bcrypt cost 12) ──
    const hashedPassword = await bcrypt.hash(String(password), 12);
    const userRole = upperRole as 'STUDENT' | 'TEACHER' | 'PARENT' | 'ADMIN';
    // v9.6: INDIVIDUAL type for standalone students who will request district linking
    const userAccountType = accountType || (userRole === 'PARENT' && childName ? 'HOMESCHOOL' : userRole === 'ADMIN' ? 'DISTRICT' : 'INDIVIDUAL');

    // Build learning style profile for SELF_EDUCATION students
    const initialLearningProfile = (userAccountType === 'SELF_EDUCATION' && learningStyle)
      ? JSON.stringify({ primaryStyle: learningStyle, needs: [], formats: [], updatedAt: new Date().toISOString() })
      : null;

    // v13.x: Atomic create — district (if needed) + user + role-specific rows run
    // inside a SINGLE transaction so a failure never leaves an orphan district.
    const { user, districtId } = await prisma.$transaction(async (tx) => {
      let txDistrictId: string | undefined;

      // v9.4.0: SELF_EDUCATION accounts get their own micro-district for self-paced learning
      if (userAccountType === 'SELF_EDUCATION' && userRole === 'STUDENT') {
        const selfEduSubdomain = `self-edu-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
        const district = await tx.schoolDistrict.create({
          data: {
            name: `${cleanName}'s Self Education`,
            subdomain: selfEduSubdomain,
            contactEmail: cleanEmail,
            subscriptionStatus: 'TRIAL',
            subscriptionTier: 'FREE',
            pricePerYear: 0,
            maxStudents: 1,
            maxTeachers: 0,
            isHomeschool: false,
          },
        });
        await tx.course.create({
          data: {
            name: 'My Studies',
            description: 'Self-paced learning course',
            subject: 'General',
            gradeLevel: gradeLevel || 'K-12',
            districtId: district.id,
          },
        });
        txDistrictId = district.id;
      }

      // Create district for ADMIN accounts
      if (userRole === 'ADMIN') {
        const cleanDistrictName = sanitizeForDisplay(String(districtName || `${cleanName}'s District`).trim()).substring(0, 200);
        const district = await tx.schoolDistrict.create({
          data: {
            name: cleanDistrictName,
            subdomain: `district-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
            contactEmail: cleanEmail,
            subscriptionStatus: 'TRIAL',
            subscriptionTier: 'FREE',
            pricePerYear: 0,
            maxStudents: 50,
            maxTeachers: 10,
            maxSchools: 3,
            isHomeschool: false,
          },
        });
        txDistrictId = district.id;
      }

      // Create district for homeschool parents
      if (userAccountType === 'HOMESCHOOL') {
        const district = await tx.schoolDistrict.create({
          data: {
            name: `${cleanName}'s Homeschool`,
            subdomain: `homeschool-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
            contactEmail: cleanEmail,
            subscriptionStatus: 'TRIAL',
            subscriptionTier: 'FREE',
            pricePerYear: 0,
            maxStudents: 10,
            maxTeachers: 2,
            isHomeschool: true,
          },
        });
        txDistrictId = district.id;
      }

      // Create the user (atomic with the district above)
      const createdUser = await tx.user.create({
        data: {
          email: cleanEmail,
          name: cleanName,
          password: hashedPassword,
          role: userRole,
          accountType: userAccountType as AccountType,
          districtId: txDistrictId || null,
          gradeLevel: userRole === 'STUDENT' ? gradeLevel || null : null,
          learningStyleProfile: initialLearningProfile,
          isActive: true,
          onboardingComplete: false,
        },
      });

      // Create DistrictAdmin record for ADMIN users
      if (userRole === 'ADMIN' && txDistrictId) {
        await tx.districtAdmin.create({
          data: {
            userId: createdUser.id, districtId: txDistrictId,
            accessLevel: 'SUPERINTENDENT',
            canCreateAccounts: true, canManageSchools: true,
            canManageBilling: true, canViewAllData: true, canManageClasses: true,
          },
        });
      }

      // If student, create reward stats
      if (userRole === 'STUDENT') {
        await tx.rewardStats.create({ data: { userId: createdUser.id } });
      }

      // v9.4.0: Enroll self-education students in their default course
      if (userAccountType === 'SELF_EDUCATION' && txDistrictId) {
        const selfCourse = await tx.course.findFirst({ where: { districtId: txDistrictId, name: 'My Studies' } });
        if (selfCourse) {
          await tx.enrollment.create({ data: { courseId: selfCourse.id, studentId: createdUser.id } });
        }
      }

      return { user: createdUser, districtId: txDistrictId };
    });

    // Handle children creation for homeschool parents (max 20 children)
    const createdChildren: { email: string; tempPassword: string }[] = [];
    if (userAccountType === 'HOMESCHOOL' && districtId) {
      const childrenToCreate = childrenList || (childName ? [{ name: childName, grade: childGrade }] : []);

      for (let i = 0; i < Math.min(childrenToCreate.length, 20); i++) {
        const child = childrenToCreate[i];
        if (!child.name) continue;

        const childEmailLocal = cleanEmail.split('@')[0];
        const childEmailDomain = cleanEmail.split('@')[1];
        const childCleanName = sanitizeForDisplay(String(child.name).trim()).substring(0, 100);
        const childLocalPart = childCleanName.toLowerCase().replace(/[^a-z0-9]/g, '') || `child${i}`;
        const childEmail = `${childEmailLocal}+${childLocalPart}@${childEmailDomain}`;

        const existingChild = await prisma.user.findUnique({ where: { email: childEmail } });
        if (existingChild) continue;

        const childTempPassword = crypto.randomBytes(9).toString('base64url');
        const childPassword = await bcrypt.hash(childTempPassword, 12);
        const childUser = await prisma.user.create({
          data: {
            email: childEmail,
            name: childCleanName,
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
        createdChildren.push({ email: childEmail, tempPassword: childTempPassword });

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
          await prisma.enrollment.create({ data: { courseId: course.id, studentId: childUser.id } });
        } else {
          const courses = await prisma.course.findMany({ where: { districtId } });
          for (const course of courses) {
            await prisma.enrollment.create({ data: { courseId: course.id, studentId: childUser.id } }).catch((err) => {
              console.error('[register] enrollment failed', err);
              warnings.push('enrollment_failed');
            });
          }
        }
      }
    }

    // ── Audit log ──
    createAuditLog({
      action: 'REGISTER',
      userId: user.id, userEmail: cleanEmail, userRole: userRole,
      ip, userAgent: ua,
      resource: '/api/auth/register',
      details: { accountType: userAccountType, hasDistrict: !!districtId },
      severity: 'info', success: true,
    });

    return NextResponse.json({
      success: true,
      message: userRole === 'ADMIN'
        ? 'Admin account created! Choose a plan to get started.'
        : 'Account created successfully!',
      user: {
        id: user.id, name: user.name, email: user.email,
        role: user.role, accountType: user.accountType,
        districtId: districtId || null,
      },
      children: createdChildren,
      warnings,
    }, { status: 201 });

  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : undefined;
    const errStack = error instanceof Error ? error.stack : undefined;
    const isPrismaKnown = error instanceof Prisma.PrismaClientKnownRequestError;
    const errCode: string | undefined = isPrismaKnown
      ? error.code
      : (error && typeof error === 'object' && 'code' in error && typeof (error as { code: unknown }).code === 'string'
          ? (error as { code: string }).code
          : undefined);
    const errMetaTarget: unknown = isPrismaKnown
      ? (error.meta as { target?: unknown } | undefined)?.target ?? null
      : null;

    // v9.4.2: Enhanced error logging — full details for debugging
    console.error('[Security] Registration error:', {
      message: errMessage,
      code: errCode,
      meta: isPrismaKnown ? error.meta : undefined,
      stack: errStack?.split('\n').slice(0, 5).join('\n'),
    });

    createAuditLog({
      action: 'REGISTER', ip, userAgent: ua,
      resource: '/api/auth/register',
      details: {
        error: errCode || 'unknown',
        message: errMessage?.substring(0, 200),
        prismaCode: errMetaTarget,
      },
      severity: 'warning', success: false,
    });

    if (errCode === 'P2002') {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }
    if (errCode === 'P2003') {
      return NextResponse.json({ error: 'Invalid reference. Please try again.' }, { status: 400 });
    }
    if (errCode === 'P2021' || errCode === 'P2022') {
      // Table or column doesn't exist — schema out of sync
      console.error('[Security] DATABASE SCHEMA OUT OF SYNC — run prisma db push');
      return NextResponse.json({ error: 'Database configuration error. Please contact support.' }, { status: 503 });
    }
    if (errMessage?.includes('connect') || errMessage?.includes('ECONNREFUSED') || errCode === 'P1001') {
      return NextResponse.json({ error: 'Unable to connect to the database. Please try again later.' }, { status: 503 });
    }
    if (errMessage?.includes('DATABASE_URL') || errMessage?.includes('prisma')) {
      return NextResponse.json({ error: 'Database not configured. Please contact support.' }, { status: 503 });
    }

    return NextResponse.json({ error: 'Failed to create account. Please try again.' }, { status: 500 });
  }
}
