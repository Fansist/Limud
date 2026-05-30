/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  LIMUD v17 — NextAuth Configuration                                      ║
 * ║                                                                        ║
 * ║  v17 adds the OWNER role + Resend-based 2FA login challenge:          ║
 * ║  • OWNER_EMAIL (set in env) gets elevated to role='OWNER' at sign-in. ║
 * ║  • OWNER login flow: email+password ─→ MFA_REQUIRED:<challengeId> ─→  ║
 * ║    user enters 6-digit code ─→ POST /api/auth/verify-otp returns      ║
 * ║    mfaProof JWT ─→ second authorize() call with mfaProof completes.   ║
 * ║  • Master demo can be the OWNER too (when MASTER_DEMO_EMAIL ===       ║
 * ║    OWNER_EMAIL). Its session still carries isMasterDemo=true so write ║
 * ║    gates downstream can synthesize demo data.                         ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import { createHash } from 'crypto';
import jwt from 'jsonwebtoken';
import { NextAuthOptions, User } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import {
  checkAccountLocked,
  recordFailedLogin,
  recordSuccessfulLogin,
  createAuditLog,
  trackSecurityEvent,
  SECURITY_CONFIG,
} from '@/lib/security';
import { AUTH_SECRET, COOKIE_SECURE, MFA_CODE_TTL_SECONDS, OWNER_EMAIL, isOwnerEmail } from '@/lib/config';
import {
  MASTER_DEMO_EMAIL,
  MASTER_DEMO_PASSWORD,
  isDemoEmail,
} from '@/lib/demo-accounts';
import { extractSubdomain } from './district-host';
import { sendEmail } from '@/lib/email';
import { otpCodeEmail } from '@/lib/email-templates';

// ═══════════════════════════════════════════════════════════════════
// DEMO ACCOUNTS
// ═══════════════════════════════════════════════════════════════════

// Master Demo account — full access to all features across all roles
const MASTER_DEMO: { email: string; password: string; user: User } = {
  email: MASTER_DEMO_EMAIL,
  password: MASTER_DEMO_PASSWORD,
  user: {
    id: 'master-demo',
    email: MASTER_DEMO_EMAIL,
    name: 'Master Demo',
    role: 'TEACHER',
    accountType: 'DISTRICT',
    districtId: 'demo-district',
    districtName: 'Ofer Academy',
    selectedAvatar: 'default',
    isHomeschoolParent: false,
    gradeLevel: '',
    isMasterDemo: true,
  },
};

// Fully connected demo accounts — Ofer Academy district
const DEMO_ACCOUNTS: Record<string, User> = {
  'lior@ofer-academy.edu': {
    id: 'demo-student-lior', email: 'lior@ofer-academy.edu', name: 'Lior Betzalel',
    role: 'STUDENT', accountType: 'DISTRICT', districtId: 'demo-district', districtName: 'Ofer Academy',
    selectedAvatar: 'astronaut', isHomeschoolParent: false, gradeLevel: '10th', isMasterDemo: false,
  },
  'eitan@ofer-academy.edu': {
    id: 'demo-student-eitan', email: 'eitan@ofer-academy.edu', name: 'Eitan Balan',
    role: 'STUDENT', accountType: 'DISTRICT', districtId: 'demo-district', districtName: 'Ofer Academy',
    selectedAvatar: 'robot', isHomeschoolParent: false, gradeLevel: '9th', isMasterDemo: false,
  },
  'noam@ofer-academy.edu': {
    id: 'demo-student-noam', email: 'noam@ofer-academy.edu', name: 'Noam Elgarisi',
    role: 'STUDENT', accountType: 'DISTRICT', districtId: 'demo-district', districtName: 'Ofer Academy',
    selectedAvatar: 'wizard', isHomeschoolParent: false, gradeLevel: '10th', isMasterDemo: false,
  },
  'strachen@ofer-academy.edu': {
    id: 'demo-teacher', email: 'strachen@ofer-academy.edu', name: 'Gregory Strachen',
    role: 'TEACHER', accountType: 'DISTRICT', districtId: 'demo-district', districtName: 'Ofer Academy',
    selectedAvatar: 'owl', isHomeschoolParent: false, gradeLevel: '', isMasterDemo: false,
  },
  'erez@ofer-academy.edu': {
    id: 'demo-admin', email: 'erez@ofer-academy.edu', name: 'Erez Ofer',
    role: 'ADMIN', accountType: 'DISTRICT', districtId: 'demo-district', districtName: 'Ofer Academy',
    selectedAvatar: 'shield', isHomeschoolParent: false, gradeLevel: '', isMasterDemo: false,
  },
  'david@ofer-academy.edu': {
    id: 'demo-parent', email: 'david@ofer-academy.edu', name: 'David Betzalel',
    role: 'PARENT', accountType: 'DISTRICT', districtId: 'demo-district', districtName: 'Ofer Academy',
    selectedAvatar: 'heart', isHomeschoolParent: false, gradeLevel: '', isMasterDemo: false,
  },
  // Legacy backward-compatible aliases
  'student@limud.edu': { id: 'demo-student-lior', email: 'lior@ofer-academy.edu', name: 'Lior Betzalel', role: 'STUDENT', accountType: 'DISTRICT', districtId: 'demo-district', districtName: 'Ofer Academy', selectedAvatar: 'astronaut', isHomeschoolParent: false, gradeLevel: '10th', isMasterDemo: false },
  'teacher@limud.edu': { id: 'demo-teacher', email: 'strachen@ofer-academy.edu', name: 'Gregory Strachen', role: 'TEACHER', accountType: 'DISTRICT', districtId: 'demo-district', districtName: 'Ofer Academy', selectedAvatar: 'owl', isHomeschoolParent: false, gradeLevel: '', isMasterDemo: false },
  'admin@limud.edu': { id: 'demo-admin', email: 'erez@ofer-academy.edu', name: 'Erez Ofer', role: 'ADMIN', accountType: 'DISTRICT', districtId: 'demo-district', districtName: 'Ofer Academy', selectedAvatar: 'shield', isHomeschoolParent: false, gradeLevel: '', isMasterDemo: false },
  'parent@limud.edu': { id: 'demo-parent', email: 'david@ofer-academy.edu', name: 'David Betzalel', role: 'PARENT', accountType: 'DISTRICT', districtId: 'demo-district', districtName: 'Ofer Academy', selectedAvatar: 'heart', isHomeschoolParent: false, gradeLevel: '', isMasterDemo: false },
};

/** Check if an email is a demo account */
export function isDemoAccount(email: string): boolean {
  return email === MASTER_DEMO.email || email in DEMO_ACCOUNTS;
}

/**
 * Pull the host header out of the NextAuth `req` argument safely.
 * `req.headers` is typed as a plain record (IncomingHttpHeaders shape) where
 * each value may be string | string[] | undefined.
 */
function getHostFromReq(
  headers: Record<string, string | string[] | undefined> | undefined,
): string | undefined {
  if (!headers) return undefined;
  const raw = headers['host'];
  if (Array.isArray(raw)) return raw[0];
  return raw;
}

/**
 * v15.0 district subdomain lockdown.
 * If the request host has a district subdomain, ensure the authenticating
 * user's `districtId` matches that subdomain's district. Throws a clear
 * NextAuth error otherwise. The master demo email bypasses this check.
 */
async function enforceDistrictLockdown(
  host: string | undefined,
  email: string,
  userDistrictId: string,
): Promise<void> {
  if (email === MASTER_DEMO.email) return;
  const subdomain = extractSubdomain(host);
  if (!subdomain) return;

  const { default: prisma } = await import('@/lib/prisma');
  const district = await prisma.schoolDistrict.findUnique({
    where: { subdomain },
    select: { id: true, name: true },
  });
  if (!district) {
    throw new Error('This subdomain does not match a Limud district.');
  }
  if (userDistrictId !== district.id) {
    throw new Error(`This account is not a member of ${district.name}.`);
  }
}

/** Get role for an email (used for client-side redirect) */
export function getDemoRole(email: string): string | null {
  // v17: master demo can be elevated to OWNER if its email matches OWNER_EMAIL.
  if (email === MASTER_DEMO.email) {
    return OWNER_EMAIL && isOwnerEmail(email) ? 'OWNER' : 'TEACHER';
  }
  const account = DEMO_ACCOUNTS[email];
  return account ? account.role : null;
}

// ═══════════════════════════════════════════════════════════════════
// 2FA HELPERS (v17)
// ═══════════════════════════════════════════════════════════════════

interface MfaProofPayload {
  challengeId: string;
  userId: string;
  purpose: string;
}

/**
 * Generate a fresh 6-digit code, persist its SHA-256 hash in the
 * TwoFactorChallenge table, and email the cleartext code via Resend.
 * Returns the challenge id so the client can correlate the OTP screen.
 */
async function issueMfaChallenge(opts: {
  userId: string;
  email: string;
  ip: string;
  userAgent: string;
}): Promise<string> {
  const { userId, email, ip, userAgent } = opts;
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const codeHash = createHash('sha256').update(code).digest('hex');
  const expiresAt = new Date(Date.now() + MFA_CODE_TTL_SECONDS * 1000);

  const { default: prisma } = await import('@/lib/prisma');
  const challenge = await prisma.twoFactorChallenge.create({
    data: {
      userId,
      codeHash,
      expiresAt,
      ip: ip || null,
      userAgent: userAgent ? userAgent.slice(0, 256) : null,
    },
    select: { id: true },
  });

  const ttlMin = Math.max(1, Math.round(MFA_CODE_TTL_SECONDS / 60));
  const tmpl = otpCodeEmail(code, ttlMin);
  try {
    await sendEmail({ to: email, subject: tmpl.subject, html: tmpl.html });
  } catch (err) {
    // Don't leak the code or the failure to the client; log only.
    console.error('[Limud Auth] OTP email send failed:', err);
  }

  return challenge.id;
}

/**
 * Verify an mfaProof JWT against a consumed challenge.
 * Returns `true` only when the proof is well-formed, signed by AUTH_SECRET,
 * has `purpose === 'mfa'`, and its `challengeId` points to a consumed row
 * whose userId matches the expected user.
 */
async function verifyMfaProof(opts: {
  mfaProof: string;
  expectedUserId: string;
}): Promise<boolean> {
  const { mfaProof, expectedUserId } = opts;
  let payload: MfaProofPayload;
  try {
    const decoded = jwt.verify(mfaProof, AUTH_SECRET) as Partial<MfaProofPayload>;
    if (
      !decoded ||
      typeof decoded.challengeId !== 'string' ||
      typeof decoded.userId !== 'string' ||
      decoded.purpose !== 'mfa'
    ) {
      return false;
    }
    payload = decoded as MfaProofPayload;
  } catch {
    return false;
  }

  if (payload.userId !== expectedUserId) return false;

  const { default: prisma } = await import('@/lib/prisma');
  const challenge = await prisma.twoFactorChallenge.findUnique({
    where: { id: payload.challengeId },
    select: { userId: true, consumedAt: true },
  });
  if (!challenge) return false;
  if (!challenge.consumedAt) return false;
  if (challenge.userId !== expectedUserId) return false;
  return true;
}

// ═══════════════════════════════════════════════════════════════════
// NEXTAUTH OPTIONS
// ═══════════════════════════════════════════════════════════════════

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: SECURITY_CONFIG.session.maxAgeHours * 60 * 60, // 24 hours
    updateAge: 60 * 60, // Refresh token every hour
  },

  // ── Cookie config ──────────────────────────────────────────────
  // v9.3.5: Use plain cookie names so login works on both HTTP and HTTPS.
  // The `secure` flag is derived from the canonical APP_URL scheme,
  // not from NODE_ENV, preventing the mismatch that broke v9.0 logins.
  cookies: {
    sessionToken: {
      name: 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: COOKIE_SECURE,
      },
    },
    callbackUrl: {
      name: 'next-auth.callback-url',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: COOKIE_SECURE,
      },
    },
    csrfToken: {
      name: 'next-auth.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: COOKIE_SECURE,
      },
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        // v17: optional MFA proof JWT issued by /api/auth/verify-otp.
        mfaProof: { label: 'MFA Proof', type: 'text' },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        const email = credentials.email.toLowerCase().trim();
        const password = credentials.password;
        const mfaProof = credentials.mfaProof?.trim() || '';
        const headers = req?.headers;
        const xff = headers?.['x-forwarded-for'];
        const xfwd = Array.isArray(xff) ? xff[0] : xff;
        const xreal = headers?.['x-real-ip'];
        const xrealStr = Array.isArray(xreal) ? xreal[0] : xreal;
        const ip = xfwd?.split(',')[0]?.trim() || xrealStr || '0.0.0.0';
        const uaRaw = headers?.['user-agent'];
        const userAgent = Array.isArray(uaRaw) ? (uaRaw[0] || '') : (uaRaw || '');

        // ── BRUTE-FORCE PROTECTION ──
        const lockStatus = checkAccountLocked(email);
        if (lockStatus.locked) {
          const minutesLeft = Math.ceil((lockStatus.lockedUntilMs - Date.now()) / 60000);
          trackSecurityEvent('blocked', ip);
          createAuditLog({
            action: 'LOGIN_FAILURE', userEmail: email, ip, userAgent: 'auth',
            resource: '/api/auth/callback/credentials',
            details: { reason: 'Account locked', minutesLeft },
            severity: 'warning', success: false,
          });
          throw new Error(`Account temporarily locked. Try again in ${minutesLeft} minutes.`);
        }

        // Pull host once for district subdomain lockdown checks below.
        const host = getHostFromReq(headers);

        // The user object we'll return at the end of the function. Each
        // primary-credential branch below sets `verifiedUser`; the
        // post-verification block handles the OWNER MFA gate uniformly.
        let verifiedUser: User | null = null;

        // ── 1. Master Demo ──
        if (email === MASTER_DEMO.email && password === MASTER_DEMO.password) {
          // Master demo intentionally bypasses district subdomain lockdown.
          verifiedUser = MASTER_DEMO.user;
        }

        // ── 2. Demo accounts (password: password123) ──
        if (!verifiedUser) {
          const demoAccount = DEMO_ACCOUNTS[email];
          if (demoAccount && password === 'password123') {
            await enforceDistrictLockdown(host, email, demoAccount.districtId || '');
            verifiedUser = demoAccount;
          }
        }

        // ── 3. Database authentication ──
        if (!verifiedUser) {
          try {
            const { default: prisma } = await import('@/lib/prisma');
            const user = await prisma.user.findUnique({
              where: { email },
              include: { district: true },
            });

            if (!user || !user.isActive) {
              const lockResult = recordFailedLogin(email, ip);
              trackSecurityEvent('failed_login', ip);
              createAuditLog({
                action: 'LOGIN_FAILURE', userEmail: email, ip, userAgent: 'auth',
                resource: '/api/auth/callback/credentials',
                details: { reason: 'Invalid credentials', remainingAttempts: lockResult.remainingAttempts },
                severity: lockResult.locked ? 'critical' : 'warning', success: false,
              });
              if (lockResult.locked) {
                trackSecurityEvent('lockout', ip);
                throw new Error(`Too many failed attempts. Account locked for ${Math.ceil(lockResult.lockoutDurationMs / 60000)} minutes.`);
              }
              throw new Error('Invalid email or password');
            }

            const bcrypt = (await import('bcryptjs')).default;
            const isValid = await bcrypt.compare(password, user.password);
            if (!isValid) {
              const lockResult = recordFailedLogin(email, ip);
              trackSecurityEvent('failed_login', ip);
              createAuditLog({
                action: 'LOGIN_FAILURE', userEmail: email, ip, userAgent: 'auth',
                resource: '/api/auth/callback/credentials',
                details: { reason: 'Wrong password', remainingAttempts: lockResult.remainingAttempts },
                severity: lockResult.locked ? 'critical' : 'warning', success: false,
              });
              if (lockResult.locked) {
                trackSecurityEvent('lockout', ip);
                throw new Error(`Too many failed attempts. Account locked for ${Math.ceil(lockResult.lockoutDurationMs / 60000)} minutes.`);
              }
              throw new Error('Invalid email or password');
            }

            // ── District subdomain lockdown (v15.0) ──
            await enforceDistrictLockdown(host, email, user.districtId || '');

            const isHomeschoolParent = user.role === 'PARENT' && user.accountType === 'HOMESCHOOL';
            verifiedUser = {
              id: user.id, email: user.email, name: user.name, role: user.role,
              accountType: user.accountType || 'DISTRICT',
              districtId: user.districtId || '', districtName: user.district?.name || '',
              selectedAvatar: user.selectedAvatar, isHomeschoolParent,
              gradeLevel: user.gradeLevel || '', isMasterDemo: false,
            };
          } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            // Re-throw known auth errors (district lockdown, account locked,
            // invalid creds, missing fields).
            if (
              msg.includes('locked') ||
              msg === 'Invalid email or password' ||
              msg === 'Email and password are required' ||
              msg === 'This subdomain does not match a Limud district.' ||
              msg.startsWith('This account is not a member of ')
            ) {
              throw e;
            }
            console.error('[Limud Auth] Database error during login:', msg);
            throw new Error('Invalid email or password');
          }
        }

        if (!verifiedUser) {
          // Defensive — every branch above either set verifiedUser or threw.
          throw new Error('Invalid email or password');
        }

        // ── 4. OWNER 2FA gate ──
        // If this email is the configured OWNER_EMAIL, the user must
        // present a valid mfaProof. The proof is issued by
        // /api/auth/verify-otp after the user enters the 6-digit code
        // we mailed them. Master demo is included: when OWNER_EMAIL
        // === MASTER_DEMO_EMAIL, the demo session is also gated.
        if (isOwnerEmail(email)) {
          const ownerUserId = verifiedUser.id;

          if (!mfaProof) {
            // First call: mint a challenge, email the code, signal the client.
            const challengeId = await issueMfaChallenge({
              userId: ownerUserId,
              email,
              ip,
              userAgent,
            });
            createAuditLog({
              action: 'LOGIN_FAILURE', userId: ownerUserId, userEmail: email,
              ip, userAgent: 'auth',
              resource: '/api/auth/callback/credentials',
              details: { reason: 'MFA challenge issued', challengeId },
              severity: 'info', success: false,
            });
            // NextAuth surfaces this string as `result.error` on the
            // client; the login UI parses it to switch to the OTP screen.
            throw new Error(`MFA_REQUIRED:${challengeId}`);
          }

          const proofValid = await verifyMfaProof({
            mfaProof,
            expectedUserId: ownerUserId,
          });
          if (!proofValid) {
            trackSecurityEvent('failed_login', ip);
            createAuditLog({
              action: 'LOGIN_FAILURE', userId: ownerUserId, userEmail: email,
              ip, userAgent: 'auth',
              resource: '/api/auth/callback/credentials',
              details: { reason: 'Invalid MFA proof' },
              severity: 'critical', success: false,
            });
            throw new Error('Invalid MFA proof');
          }

          // Override role to OWNER for this session.
          verifiedUser = {
            ...verifiedUser,
            role: 'OWNER',
          };
        }

        // Success — record audit + brute-force success and return.
        recordSuccessfulLogin(email);
        trackSecurityEvent('success_login', ip);
        createAuditLog({
          action: 'LOGIN_SUCCESS',
          userId: verifiedUser.id,
          userEmail: email,
          userRole: verifiedUser.role,
          ip, userAgent: 'auth',
          resource: '/api/auth/callback/credentials',
          details: {
            type:
              email === MASTER_DEMO.email
                ? 'master_demo'
                : isDemoEmail(email)
                  ? 'demo'
                  : 'database',
            ownerElevated: verifiedUser.role === 'OWNER',
          },
          severity: 'info', success: true,
        });

        return verifiedUser;
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.accountType = user.accountType;
        token.districtId = user.districtId;
        token.districtName = user.districtName;
        token.selectedAvatar = user.selectedAvatar;
        token.isHomeschoolParent = user.isHomeschoolParent;
        token.gradeLevel = user.gradeLevel;
        token.isMasterDemo = user.isMasterDemo || false;
      }
      // Always recompute isDemo from the canonical demo email list so
      // consumers (e.g. /api/district/announcements) can rely on it.
      token.isDemo = isDemoEmail(token.email);
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.accountType = token.accountType;
        session.user.districtId = token.districtId;
        session.user.districtName = token.districtName;
        session.user.selectedAvatar = token.selectedAvatar;
        session.user.isHomeschoolParent = token.isHomeschoolParent;
        session.user.gradeLevel = token.gradeLevel;
        session.user.isMasterDemo = token.isMasterDemo;
        session.user.isDemo = token.isDemo;
      }
      return session;
    },
    /**
     * v17.1 — explicit redirect allowlist.
     * NextAuth's default redirect callback only blocks cross-origin URLs,
     * but it can be tricked by malformed callbackUrl values into open-
     * redirecting to a same-suffix attacker domain. We resolve everything
     * against `baseUrl` and refuse anything that isn't either a
     * same-origin absolute URL or a relative path on this app.
     */
    async redirect({ url, baseUrl }) {
      // Relative paths: fine, resolve against baseUrl. We explicitly reject
      // protocol-relative URLs ('//evil.com/...') because url.startsWith('/')
      // alone would let them through; some downstream URL parsers treat the
      // path component as authority and end up redirecting off-origin.
      // This mirrors the guard used in src/app/(auth)/login/page.tsx for
      // callbackUrl handling. (REVIEWER v17.1 HIGH-2.)
      if (url.startsWith('/') && !url.startsWith('//')) return baseUrl + url;
      // Absolute URLs: only accept if origin matches baseUrl.
      try {
        if (new URL(url).origin === baseUrl) return url;
      } catch {
        // Malformed URL — fall through to baseUrl.
      }
      return baseUrl;
    },
  },

  // Embedded secret — works with zero env vars
  secret: AUTH_SECRET,
  debug: false,
};
