import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

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

        // Check Master Demo account first
        if (credentials.email === MASTER_DEMO.email && credentials.password === MASTER_DEMO.password) {
          return MASTER_DEMO.user as any;
        }

        // Check role-specific demo accounts (password: password123)
        const demoAccount = DEMO_ACCOUNTS[credentials.email];
        if (demoAccount && credentials.password === 'password123') {
          return demoAccount as any;
        }

        // Fall through to database authentication
        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            include: { district: true },
          });

          if (!user || !user.isActive) {
            throw new Error('Invalid email or password');
          }

          const isValid = await bcrypt.compare(credentials.password, user.password);
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
          // If Prisma/DB is unavailable, only demo accounts work
          if (e.message === 'Invalid email or password') throw e;
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
  secret: process.env.NEXTAUTH_SECRET || (process.env.NODE_ENV === 'production'
    ? (() => {
        console.warn('[Limud] WARNING: NEXTAUTH_SECRET is not set! Using auto-generated fallback. Set NEXTAUTH_SECRET in your Render environment variables for persistent sessions.');
        return require('crypto').randomBytes(32).toString('base64');
      })()
    : 'dev-secret-not-for-production'),
};
