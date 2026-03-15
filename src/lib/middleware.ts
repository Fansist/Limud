import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';

export type UserSession = {
  id: string;
  email: string;
  name: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN' | 'PARENT';
  accountType: 'DISTRICT' | 'HOMESCHOOL' | 'INDIVIDUAL';
  districtId: string;
  districtName: string;
  selectedAvatar: string;
  isHomeschoolParent: boolean;
  gradeLevel: string;
  isMasterDemo?: boolean;
};

/**
 * Get the current authenticated user session.
 * Returns null if not authenticated.
 */
export async function getSession(): Promise<UserSession | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return session.user as unknown as UserSession;
}

/**
 * Require authentication. Returns 401 if not logged in.
 */
export async function requireAuth(): Promise<UserSession> {
  const user = await getSession();
  if (!user) {
    throw new AuthError('Unauthorized', 401);
  }
  return user;
}

/**
 * Require a specific role. Returns 403 if wrong role.
 * Homeschool parents (PARENT + HOMESCHOOL) are automatically granted TEACHER-level access.
 */
export async function requireRole(...roles: string[]): Promise<UserSession> {
  const user = await requireAuth();

  // Homeschool parents can access teacher endpoints
  if (user.role === 'PARENT' && user.isHomeschoolParent && roles.includes('TEACHER')) {
    return user;
  }

  if (!roles.includes(user.role)) {
    throw new AuthError('Forbidden: insufficient permissions', 403);
  }
  return user;
}

/**
 * Check if the user has teacher-equivalent access.
 * This includes actual teachers AND homeschool parents.
 */
export function hasTeacherAccess(user: UserSession): boolean {
  return user.role === 'TEACHER' || (user.role === 'PARENT' && user.isHomeschoolParent);
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number = 401) {
    super(message);
    this.status = status;
  }
}

/**
 * Wraps an API handler with comprehensive error handling.
 * Catches auth errors, Prisma/DB errors, and general errors.
 */
export function apiHandler(
  handler: (req: Request) => Promise<NextResponse>
): (req: Request) => Promise<NextResponse> {
  return async (req: Request) => {
    try {
      return await handler(req);
    } catch (error: any) {
      if (error instanceof AuthError) {
        return NextResponse.json(
          { error: error.message },
          { status: error.status }
        );
      }

      // Handle Prisma/Database connection errors gracefully
      if (error?.code === 'P1001' || error?.code === 'P1002' || error?.code === 'P1003') {
        console.error('Database connection error:', error.message);
        return NextResponse.json(
          { error: 'Database is temporarily unavailable. Please try again later.' },
          { status: 503 }
        );
      }

      // Handle Prisma query errors
      if (error?.code === 'P2002') {
        return NextResponse.json(
          { error: 'A record with this data already exists.' },
          { status: 409 }
        );
      }

      if (error?.code === 'P2025') {
        return NextResponse.json(
          { error: 'Record not found.' },
          { status: 404 }
        );
      }

      // Handle general Prisma errors
      if (error?.code?.startsWith?.('P')) {
        console.error('Prisma error:', error.code, error.message);
        return NextResponse.json(
          { error: 'A database error occurred. Please try again.' },
          { status: 500 }
        );
      }

      // Handle connection refused (DB not running)
      if (error?.message?.includes('ECONNREFUSED') || error?.message?.includes('connect')) {
        console.error('Database connection refused:', error.message);
        return NextResponse.json(
          { error: 'Unable to connect to the database. Please check your DATABASE_URL configuration.' },
          { status: 503 }
        );
      }

      console.error('API Error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}
