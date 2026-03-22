/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  LIMUD v9.1 — NextAuth Configuration                                   ║
 * ║  Zero-env-var authentication — all defaults are embedded.              ║
 * ║                                                                        ║
 * ║  Key v9.1 fixes:                                                       ║
 * ║  • Cookie names use plain names (no __Secure- / __Host- prefix)       ║
 * ║    so login works on both HTTP and HTTPS without any config.           ║
 * ║  • Secret is embedded — no NEXTAUTH_SECRET env var required.          ║
 * ║  • NEXTAUTH_URL is auto-derived from the request when not set.        ║
 * ║  • Brute-force + audit logging remain fully active.                   ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import {
  checkAccountLocked,
  recordFailedLogin,
  recordSuccessfulLogin,
  createAuditLog,
  trackSecurityEvent,
  SECURITY_CONFIG,
} from '@/lib/security';
import { AUTH_SECRET, COOKIE_SECURE } from '@/lib/config';

// ═══════════════════════════════════════════════════════════════════
// DEMO ACCOUNTS
// ═══════════════════════════════════════════════════════════════════

// Master Demo account — full access to all features across all roles
const MASTER_DEMO = {
  email: 'master@limud.edu',
  password: 'LimudMaster2026!',
  user: {
    id: 'master-demo',
    email: 'master@limud.edu',
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
const DEMO_ACCOUNTS: Record<string, any> = {
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

/** Get role for an email (used for client-side redirect) */
export function getDemoRole(email: string): string | null {
  if (email === MASTER_DEMO.email) return 'TEACHER';
  const account = DEMO_ACCOUNTS[email];
  return account ? account.role : null;
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
  // v9.1: Use plain cookie names so login works on both HTTP and HTTPS.
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
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        const email = credentials.email.toLowerCase().trim();
        const password = credentials.password;
        const ip = (req as any)?.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
                   (req as any)?.headers?.['x-real-ip'] || '0.0.0.0';

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

        // ── 1. Master Demo ──
        if (email === MASTER_DEMO.email && password === MASTER_DEMO.password) {
          recordSuccessfulLogin(email);
          trackSecurityEvent('success_login', ip);
          createAuditLog({
            action: 'LOGIN_SUCCESS', userEmail: email, ip, userAgent: 'auth',
            resource: '/api/auth/callback/credentials',
            details: { type: 'master_demo' }, severity: 'info', success: true,
          });
          return MASTER_DEMO.user as any;
        }

        // ── 2. Demo accounts (password: password123) ──
        const demoAccount = DEMO_ACCOUNTS[email];
        if (demoAccount && password === 'password123') {
          recordSuccessfulLogin(email);
          trackSecurityEvent('success_login', ip);
          createAuditLog({
            action: 'LOGIN_SUCCESS', userEmail: email, ip, userAgent: 'auth',
            resource: '/api/auth/callback/credentials',
            details: { type: 'demo', role: demoAccount.role }, severity: 'info', success: true,
          });
          return demoAccount as any;
        }

        // ── 3. Database authentication ──
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

          // Success
          recordSuccessfulLogin(email);
          trackSecurityEvent('success_login', ip);
          createAuditLog({
            action: 'LOGIN_SUCCESS', userId: user.id, userEmail: email,
            userRole: user.role, ip, userAgent: 'auth',
            resource: '/api/auth/callback/credentials',
            details: { type: 'database' }, severity: 'info', success: true,
          });

          const isHomeschoolParent = user.role === 'PARENT' && user.accountType === 'HOMESCHOOL';
          return {
            id: user.id, email: user.email, name: user.name, role: user.role,
            accountType: user.accountType || 'DISTRICT',
            districtId: user.districtId || '', districtName: user.district?.name || '',
            selectedAvatar: user.selectedAvatar, isHomeschoolParent,
            gradeLevel: user.gradeLevel || '', isMasterDemo: false,
          } as any;
        } catch (e: any) {
          // Re-throw known auth errors
          if (e.message.includes('locked') || e.message === 'Invalid email or password' || e.message === 'Email and password are required') {
            throw e;
          }
          // Database unreachable — fall through to generic error
          console.error('[Limud Auth] Database error during login:', e.message);
          throw new Error('Invalid email or password');
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.accountType = (user as any).accountType;
        token.districtId = (user as any).districtId;
        token.districtName = (user as any).districtName;
        token.selectedAvatar = (user as any).selectedAvatar;
        token.isHomeschoolParent = (user as any).isHomeschoolParent;
        token.gradeLevel = (user as any).gradeLevel;
        token.isMasterDemo = (user as any).isMasterDemo || false;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as string;
        (session.user as any).accountType = token.accountType as string;
        (session.user as any).districtId = token.districtId as string;
        (session.user as any).districtName = token.districtName as string;
        (session.user as any).selectedAvatar = token.selectedAvatar as string;
        (session.user as any).isHomeschoolParent = token.isHomeschoolParent as boolean;
        (session.user as any).gradeLevel = token.gradeLevel as string;
        (session.user as any).isMasterDemo = token.isMasterDemo as boolean;
      }
      return session;
    },
  },

  // Embedded secret — works with zero env vars
  secret: AUTH_SECRET,
  debug: false,
};
