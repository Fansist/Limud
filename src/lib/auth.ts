import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

// Master Demo account - full access to all features across all roles
const MASTER_DEMO = {
  email: 'master@limud.edu',
  password: 'LimudMaster2026!',
  user: {
    id: 'master-demo',
    email: 'master@limud.edu',
    name: 'Master Demo',
    role: 'TEACHER', // Default role, can switch in-app
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
// Students: Lior Betzalel, Eitan Balan, Noam Elgarisi
// Teacher: Gregory Strachen
// Admin: Erez Ofer (Superintendent)
// Parent: David Betzalel (Lior's parent)
// All use password: password123
const DEMO_ACCOUNTS: Record<string, any> = {
  // ─── Students ───
  'lior@ofer-academy.edu': {
    id: 'demo-student-lior',
    email: 'lior@ofer-academy.edu',
    name: 'Lior Betzalel',
    role: 'STUDENT',
    accountType: 'DISTRICT',
    districtId: 'demo-district',
    districtName: 'Ofer Academy',
    selectedAvatar: 'astronaut',
    isHomeschoolParent: false,
    gradeLevel: '10th',
    isMasterDemo: false,
  },
  'eitan@ofer-academy.edu': {
    id: 'demo-student-eitan',
    email: 'eitan@ofer-academy.edu',
    name: 'Eitan Balan',
    role: 'STUDENT',
    accountType: 'DISTRICT',
    districtId: 'demo-district',
    districtName: 'Ofer Academy',
    selectedAvatar: 'robot',
    isHomeschoolParent: false,
    gradeLevel: '9th',
    isMasterDemo: false,
  },
  'noam@ofer-academy.edu': {
    id: 'demo-student-noam',
    email: 'noam@ofer-academy.edu',
    name: 'Noam Elgarisi',
    role: 'STUDENT',
    accountType: 'DISTRICT',
    districtId: 'demo-district',
    districtName: 'Ofer Academy',
    selectedAvatar: 'wizard',
    isHomeschoolParent: false,
    gradeLevel: '10th',
    isMasterDemo: false,
  },
  // ─── Teacher ───
  'strachen@ofer-academy.edu': {
    id: 'demo-teacher',
    email: 'strachen@ofer-academy.edu',
    name: 'Gregory Strachen',
    role: 'TEACHER',
    accountType: 'DISTRICT',
    districtId: 'demo-district',
    districtName: 'Ofer Academy',
    selectedAvatar: 'owl',
    isHomeschoolParent: false,
    gradeLevel: '',
    isMasterDemo: false,
  },
  // ─── Admin (Superintendent) ───
  'erez@ofer-academy.edu': {
    id: 'demo-admin',
    email: 'erez@ofer-academy.edu',
    name: 'Erez Ofer',
    role: 'ADMIN',
    accountType: 'DISTRICT',
    districtId: 'demo-district',
    districtName: 'Ofer Academy',
    selectedAvatar: 'shield',
    isHomeschoolParent: false,
    gradeLevel: '',
    isMasterDemo: false,
  },
  // ─── Parent ───
  'david@ofer-academy.edu': {
    id: 'demo-parent',
    email: 'david@ofer-academy.edu',
    name: 'David Betzalel',
    role: 'PARENT',
    accountType: 'DISTRICT',
    districtId: 'demo-district',
    districtName: 'Ofer Academy',
    selectedAvatar: 'heart',
    isHomeschoolParent: false,
    gradeLevel: '',
    isMasterDemo: false,
  },
  // Legacy accounts (backward compatibility)
  'student@limud.edu': {
    id: 'demo-student-lior',
    email: 'lior@ofer-academy.edu',
    name: 'Lior Betzalel',
    role: 'STUDENT',
    accountType: 'DISTRICT',
    districtId: 'demo-district',
    districtName: 'Ofer Academy',
    selectedAvatar: 'astronaut',
    isHomeschoolParent: false,
    gradeLevel: '10th',
    isMasterDemo: false,
  },
  'teacher@limud.edu': {
    id: 'demo-teacher',
    email: 'strachen@ofer-academy.edu',
    name: 'Gregory Strachen',
    role: 'TEACHER',
    accountType: 'DISTRICT',
    districtId: 'demo-district',
    districtName: 'Ofer Academy',
    selectedAvatar: 'owl',
    isHomeschoolParent: false,
    gradeLevel: '',
    isMasterDemo: false,
  },
  'admin@limud.edu': {
    id: 'demo-admin',
    email: 'erez@ofer-academy.edu',
    name: 'Erez Ofer',
    role: 'ADMIN',
    accountType: 'DISTRICT',
    districtId: 'demo-district',
    districtName: 'Ofer Academy',
    selectedAvatar: 'shield',
    isHomeschoolParent: false,
    gradeLevel: '',
    isMasterDemo: false,
  },
  'parent@limud.edu': {
    id: 'demo-parent',
    email: 'david@ofer-academy.edu',
    name: 'David Betzalel',
    role: 'PARENT',
    accountType: 'DISTRICT',
    districtId: 'demo-district',
    districtName: 'Ofer Academy',
    selectedAvatar: 'heart',
    isHomeschoolParent: false,
    gradeLevel: '',
    isMasterDemo: false,
  },
};

/**
 * Helper: Check if an email is a demo account
 */
export function isDemoAccount(email: string): boolean {
  return email === MASTER_DEMO.email || email in DEMO_ACCOUNTS;
}

/**
 * Helper: Get role for an email (used for client-side redirect)
 */
export function getDemoRole(email: string): string | null {
  if (email === MASTER_DEMO.email) return 'TEACHER';
  const account = DEMO_ACCOUNTS[email];
  return account ? account.role : null;
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
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
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        const email = credentials.email.toLowerCase().trim();
        const password = credentials.password;

        // ── 1. Check Master Demo account ──
        if (email === MASTER_DEMO.email && password === MASTER_DEMO.password) {
          console.log('[Limud Auth] Master demo login successful');
          return MASTER_DEMO.user as any;
        }

        // ── 2. Check role-specific demo accounts (password: password123) ──
        const demoAccount = DEMO_ACCOUNTS[email];
        if (demoAccount && password === 'password123') {
          console.log(`[Limud Auth] Demo login successful: ${email} (${demoAccount.role})`);
          return demoAccount as any;
        }

        // ── 3. Fall through to database authentication ──
        try {
          // Dynamic import prisma to prevent module-level crash if DB is unavailable
          const { default: prisma } = await import('@/lib/prisma');
          const user = await prisma.user.findUnique({
            where: { email },
            include: { district: true },
          });

          if (!user || !user.isActive) {
            throw new Error('Invalid email or password');
          }

          const bcrypt = (await import('bcryptjs')).default;
          const isValid = await bcrypt.compare(password, user.password);
          if (!isValid) {
            throw new Error('Invalid email or password');
          }

          const isHomeschoolParent = user.role === 'PARENT' && user.accountType === 'HOMESCHOOL';

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            accountType: user.accountType || 'DISTRICT',
            districtId: user.districtId || '',
            districtName: user.district?.name || '',
            selectedAvatar: user.selectedAvatar,
            isHomeschoolParent,
            gradeLevel: user.gradeLevel || '',
            isMasterDemo: false,
          } as any;
        } catch (e: any) {
          // If user explicitly entered wrong credentials, pass that through
          if (e.message === 'Invalid email or password') throw e;
          if (e.message === 'Email and password are required') throw e;

          // For all other errors (DB unavailable, connection refused, module errors):
          // Log and return a clear message
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
  // NEXTAUTH_SECRET is required in production.
  // Set it in Render Dashboard → Environment → NEXTAUTH_SECRET
  // Generate with: openssl rand -base64 32
  // CRITICAL v8.9.1: A STABLE secret is mandatory — random secrets break every session on restart.
  // This hardcoded fallback ensures demo accounts ALWAYS work even without env var set.
  secret: process.env.NEXTAUTH_SECRET || 'limud-stable-secret-v8-ofer-academy-2026-kj3nf92md',
};
