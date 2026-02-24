import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-accent-700 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <span className="text-4xl">📚</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold text-white tracking-tight">
              Limud
            </h1>
          </div>
          <p className="text-xl md:text-2xl text-white/90 font-medium mb-2">
            Learn Together, Grow Together
          </p>
          <p className="text-white/70 text-lg max-w-2xl mx-auto">
            An all-in-one educational platform with AI tutoring, gamified learning,
            and personalized feedback that makes school engaging for every student.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {[
            {
              icon: '🤖',
              title: 'AI Tutor',
              desc: 'A friendly AI companion that guides students through tough topics without giving away the answers.',
            },
            {
              icon: '🎮',
              title: 'Gamified Learning',
              desc: 'Earn XP, level up, unlock avatars, and maintain streaks. Learning has never been this fun.',
            },
            {
              icon: '📊',
              title: 'Smart Grading',
              desc: 'AI-powered auto-grading with personalized feedback, so teachers can focus on teaching.',
            },
          ].map((feature, i) => (
            <div
              key={i}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-white/70 text-sm">{feature.desc}</p>
            </div>
          ))}
        </div>

        <div className="text-center space-y-4">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-white text-primary-700 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            Sign In to Get Started
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          <p className="text-white/50 text-sm">
            Demo accounts available for all roles
          </p>
        </div>
      </div>
    </div>
  );
}
