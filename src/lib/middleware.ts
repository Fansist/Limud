import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';

export type UserSession = {
  id: string;
  email: string;
  name: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN' | 'PARENT';
  districtId: string;
  districtName: string;
  selectedAvatar: string;
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
 */
export async function requireRole(...roles: string[]): Promise<UserSession> {
  const user = await requireAuth();
  if (!roles.includes(user.role)) {
    throw new AuthError('Forbidden: insufficient permissions', 403);
  }
  return user;
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number = 401) {
    super(message);
    this.status = status;
  }
}

/**
 * Wraps an API handler with error handling.
 */
export function apiHandler(
  handler: (req: Request) => Promise<NextResponse>
): (req: Request) => Promise<NextResponse> {
  return async (req: Request) => {
    try {
      return await handler(req);
    } catch (error) {
      if (error instanceof AuthError) {
        return NextResponse.json(
          { error: error.message },
          { status: error.status }
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
