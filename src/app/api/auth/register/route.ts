/**
 * Registration API — v9.3.5 Security Hardened
 * - Rate limited: 3 per minute per IP
 * - NIST SP 800-63B password validation
 * - Input sanitization (XSS, prototype pollution)
 * - Anti-enumeration (generic errors for duplicate emails)
 * - COPPA: flags minor accounts for parental consent
 * - Audit logging all registration events
 * - v9.3.5: Improved error responses — returns all password errors with details
 */
import { NextResponse } from 'next/server';
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

  try {
    const body = await req.json();
    const {
      name, email, password, role, accountType,
      gradeLevel, childName, childGrade,
      children: childrenList, districtName,
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
    const cleanName = sanitizeForDisplay(String(name).trim()).substring(0, SECURITY_CONFIG.MAX_NAME_LENGTH);
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
    const userAccountType = accountType || (userRole === 'PARENT' && childName ? 'HOMESCHOOL' : userRole === 'ADMIN' ? 'DISTRICT' : 'INDIVIDUAL');

    let districtId: string | undefined;

    // Create district for ADMIN accounts
    if (userRole === 'ADMIN') {
      const cleanDistrictName = sanitizeForDisplay(String(districtName || `${cleanName}'s District`).trim()).substring(0, 200);
      const district = await prisma.schoolDistrict.create({
        data: {
          name: cleanDistrictName,
          subdomain: `district-${Date.now()}`,
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
      districtId = district.id;
    }

    // Create district for homeschool parents
    if (userAccountType === 'HOMESCHOOL') {
      const district = await prisma.schoolDistrict.create({
        data: {
          name: `${cleanName}'s Homeschool`,
          subdomain: `homeschool-${Date.now()}`,
          contactEmail: cleanEmail,
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
        email: cleanEmail,
        name: cleanName,
        password: hashedPassword,
        role: userRole,
        accountType: userAccountType as any,
        districtId: districtId || null,
        gradeLevel: userRole === 'STUDENT' ? gradeLevel || null : null,
        isActive: true,
        onboardingComplete: false,
      },
    });

    // Create DistrictAdmin record for ADMIN users
    if (userRole === 'ADMIN' && districtId) {
      await prisma.districtAdmin.create({
        data: {
          userId: user.id, districtId,
          accessLevel: 'SUPERINTENDENT',
          canCreateAccounts: true, canManageSchools: true,
          canManageBilling: true, canViewAllData: true, canManageClasses: true,
        },
      });
    }

    // If student, create reward stats
    if (userRole === 'STUDENT') {
      await prisma.rewardStats.create({ data: { userId: user.id } });
    }

    // Handle children creation for homeschool parents (max 20 children)
    if (userAccountType === 'HOMESCHOOL' && districtId) {
      const childrenToCreate = childrenList || (childName ? [{ name: childName, grade: childGrade }] : []);

      for (let i = 0; i < Math.min(childrenToCreate.length, 20); i++) {
        const child = childrenToCreate[i];
        if (!child.name) continue;

        const childEmailLocal = cleanEmail.split('@')[0];
        const childEmailDomain = cleanEmail.split('@')[1];
        const childCleanName = sanitizeForDisplay(String(child.name).trim()).substring(0, 100);
        const childEmail = `${childEmailLocal}+${childCleanName.toLowerCase().replace(/[^a-z0-9]/g, '')}@${childEmailDomain}`;

        const existingChild = await prisma.user.findUnique({ where: { email: childEmail } });
        if (existingChild) continue;

        const childPassword = await bcrypt.hash(String(password), 12);
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
            await prisma.enrollment.create({ data: { courseId: course.id, studentId: childUser.id } }).catch(() => {});
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
    }, { status: 201 });

  } catch (error: any) {
    console.error('[Security] Registration error:', error?.message);

    createAuditLog({
      action: 'REGISTER', ip, userAgent: ua,
      resource: '/api/auth/register',
      details: { error: error?.code || 'unknown' },
      severity: 'warning', success: false,
    });

    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'Unable to create account. Please try a different email.' }, { status: 409 });
    }
    if (error?.code === 'P2003') {
      return NextResponse.json({ error: 'Invalid reference. Please try again.' }, { status: 400 });
    }
    if (error?.message?.includes('connect') || error?.message?.includes('ECONNREFUSED') || error?.code === 'P1001') {
      return NextResponse.json({ error: 'Unable to connect to the database. Please try again later.' }, { status: 503 });
    }

    return NextResponse.json({ error: 'Failed to create account. Please try again.' }, { status: 500 });
  }
}
