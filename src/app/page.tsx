import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import LandingPage from '@/components/landing/LandingPage';

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (session?.user) {
    const role = (session.user as any).role;
    switch (role) {
      case 'STUDENT': redirect('/student/dashboard');
      case 'TEACHER': redirect('/teacher/dashboard');
      case 'ADMIN': redirect('/admin/dashboard');
      case 'PARENT': redirect('/parent/dashboard');
    }
  }

  return <LandingPage />;
}
