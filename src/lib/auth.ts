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
    districtName: 'Demo School District',
    selectedAvatar: 'default',
    isHomeschoolParent: false,
    gradeLevel: '',
    isMasterDemo: true,
  },
};

// Role-specific demo accounts that bypass database
const DEMO_ACCOUNTS: Record<string, any> = {
  'student@limud.edu': {
    id: 'demo-student',
    email: 'student@limud.edu',
    name: 'Alex Rivera',
    role: 'STUDENT',
    accountType: 'DISTRICT',
    districtId: 'demo-district',
    districtName: 'Demo School District',
    selectedAvatar: 'default',
    isHomeschoolParent: false,
    gradeLevel: '8th',
    isMasterDemo: false,
  },
  'teacher@limud.edu': {
    id: 'demo-teacher',
    email: 'teacher@limud.edu',
    name: 'Dr. Sarah Chen',
    role: 'TEACHER',
    accountType: 'DISTRICT',
    districtId: 'demo-district',
    districtName: 'Demo School District',
    selectedAvatar: 'default',
    isHomeschoolParent: false,
    gradeLevel: '',
    isMasterDemo: false,
  },
  'admin@limud.edu': {
    id: 'demo-admin',
    email: 'admin@limud.edu',
    name: 'Michael Torres',
    role: 'ADMIN',
    accountType: 'DISTRICT',
    districtId: 'demo-district',
    districtName: 'Demo School District',
    selectedAvatar: 'default',
    isHomeschoolParent: false,
    gradeLevel: '',
    isMasterDemo: false,
  },
  'parent@limud.edu': {
    id: 'demo-parent',
    email: 'parent@limud.edu',
    name: 'Jessica Rivera',
    role: 'PARENT',
    accountType: 'DISTRICT',
    districtId: 'demo-district',
    districtName: 'Demo School District',
    selectedAvatar: 'default',
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
  secret: process.env.NEXTAUTH_SECRET,
};
