'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const DEMO_ACCOUNTS = [
  { role: 'Student', email: 'student@limud.edu', icon: '🎓' },
  { role: 'Teacher', email: 'teacher@limud.edu', icon: '👩‍🏫' },
  { role: 'Admin', email: 'admin@limud.edu', icon: '🏫' },
  { role: 'Parent', email: 'parent@limud.edu', icon: '👨‍👩‍👧' },
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast.error('Invalid email or password');
      } else {
        toast.success('Welcome to Limud!');
        router.push('/');
        router.refresh();
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email: demoEmail,
        password: 'password123',
        redirect: false,
      });

      if (result?.error) {
        toast.error('Demo login failed');
      } else {
        toast.success('Welcome to Limud!');
        router.push('/');
        router.refresh();
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-accent-700 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="text-4xl">📚</span>
            <h1 className="text-4xl font-extrabold text-white">Limud</h1>
          </div>
          <p className="text-white/70">Sign in to continue learning</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <form onSubmit={handleLogin} className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input-field"
                placeholder="you@school.edu"
                required
                aria-label="Email address"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input-field"
                placeholder="Enter your password"
                required
                aria-label="Password"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-base"
              aria-label="Sign in"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-white text-gray-400">Quick Demo Access</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {DEMO_ACCOUNTS.map(account => (
              <motion.button
                key={account.role}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleDemoLogin(account.email)}
                disabled={loading}
                className="flex items-center gap-2 p-3 rounded-xl border-2 border-gray-100 hover:border-primary-200 hover:bg-primary-50 transition-all text-sm font-medium text-gray-700 disabled:opacity-50"
                aria-label={`Sign in as demo ${account.role}`}
              >
                <span className="text-xl">{account.icon}</span>
                <span>{account.role}</span>
              </motion.button>
            ))}
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            Demo password: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">password123</code>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
