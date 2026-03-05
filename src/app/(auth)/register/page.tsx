'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  GraduationCap, BookOpen, Shield, Users, Home, ArrowRight, ArrowLeft,
  Eye, EyeOff, CheckCircle2, UserPlus,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

type AccountTypeOption = 'district' | 'homeschool' | 'individual';
type RoleOption = 'STUDENT' | 'TEACHER' | 'PARENT';

const ROLE_OPTIONS = [
  { value: 'STUDENT' as const, label: 'Student', icon: GraduationCap, color: 'from-blue-500 to-cyan-500', desc: 'I\'m a learner ready to grow' },
  { value: 'TEACHER' as const, label: 'Teacher', icon: BookOpen, color: 'from-emerald-500 to-teal-500', desc: 'I educate and inspire' },
  { value: 'PARENT' as const, label: 'Parent', icon: Users, color: 'from-purple-500 to-pink-500', desc: 'I support my child\'s learning' },
];

const GRADE_LEVELS = [
  'Kindergarten', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th',
  '9th', '10th', '11th', '12th',
];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form state
  const [accountType, setAccountType] = useState<AccountTypeOption>('individual');
  const [role, setRole] = useState<RoleOption | ''>('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');

  // Homeschool fields - multiple children support
  const [childrenList, setChildrenList] = useState<{name: string; grade: string}[]>([{ name: '', grade: '' }]);

  const passwordStrength = (pw: string) => {
    let score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  };

  const strength = passwordStrength(password);
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent'][strength];
  const strengthColor = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-emerald-500'][strength];

  async function handleRegister() {
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, email, password, role,
          accountType: accountType === 'homeschool' ? 'HOMESCHOOL' : accountType === 'district' ? 'DISTRICT' : 'INDIVIDUAL',
          gradeLevel: role === 'STUDENT' ? gradeLevel : undefined,
          children: accountType === 'homeschool' ? childrenList.filter(c => c.name.trim()) : undefined,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Account created! Signing you in...');

        // Auto sign in
        const signInResult = await signIn('credentials', {
          email, password, redirect: false,
        });

        if (signInResult?.ok) {
          const redirectPath = role === 'STUDENT' ? '/student/dashboard' :
            role === 'TEACHER' ? '/teacher/dashboard' :
            role === 'PARENT' ? '/parent/dashboard' : '/';
          router.push(redirectPath);
        } else {
          router.push('/login');
        }
      } else {
        toast.error(data.error || 'Registration failed');
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const canProceedStep1 = role !== '';
  const canProceedStep2 = name.trim() !== '' && email.trim() !== '';
  const canProceedStep3 = password.length >= 8 && password === confirmPassword;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex">
      {/* Left side - branding */}
      <div className="hidden lg:flex lg:w-5/12 bg-gradient-to-br from-primary-600 via-primary-700 to-indigo-800 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-40 h-40 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-40 right-10 w-60 h-60 bg-cyan-300 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/3 w-32 h-32 bg-pink-300 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-2.5 text-white mb-12">
            <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <BookOpen className="text-white" size={20} />
            </div>
            <span className="text-xl font-extrabold">Limud</span>
          </Link>

          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Join thousands of<br />learners today
          </h2>
          <p className="text-white/70 text-lg">
            Create your free account and start your personalized learning journey.
          </p>
        </div>

        <div className="relative z-10 space-y-4">
          {[
            { icon: '🎓', text: 'AI-powered tutoring that adapts to you' },
            { icon: '🏆', text: 'Earn rewards and track your progress' },
            { icon: '🏠', text: 'Perfect for homeschool families' },
            { icon: '📊', text: 'Real-time analytics for parents & teachers' },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.15 }}
              className="flex items-center gap-3 text-white/80"
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.text}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Right side - form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-lg">
          {/* Progress bar */}
          <div className="flex items-center gap-2 mb-8">
            {[1, 2, 3].map(s => (
              <div key={s} className="flex-1 flex items-center gap-2">
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all',
                  step >= s ? 'bg-primary-600 text-white scale-100' : 'bg-gray-200 text-gray-400 scale-90'
                )}>
                  {step > s ? <CheckCircle2 size={16} /> : s}
                </div>
                {s < 3 && (
                  <div className={cn(
                    'flex-1 h-1 rounded-full transition-all',
                    step > s ? 'bg-primary-500' : 'bg-gray-200'
                  )} />
                )}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* Step 1: Choose Role */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Create your account</h1>
                  <p className="text-gray-500 mt-2">First, tell us who you are</p>
                </div>

                <div className="space-y-3">
                  {ROLE_OPTIONS.map(opt => (
                    <motion.button
                      key={opt.value}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => setRole(opt.value)}
                      className={cn(
                        'w-full p-4 rounded-2xl border-2 flex items-center gap-4 transition-all text-left',
                        role === opt.value
                          ? 'border-primary-500 bg-primary-50 shadow-md shadow-primary-100'
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                      )}
                    >
                      <div className={cn(
                        'w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-white',
                        opt.color
                      )}>
                        <opt.icon size={22} />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{opt.label}</p>
                        <p className="text-sm text-gray-500">{opt.desc}</p>
                      </div>
                      <div className={cn(
                        'w-5 h-5 rounded-full border-2 flex items-center justify-center transition',
                        role === opt.value ? 'border-primary-500 bg-primary-500' : 'border-gray-300'
                      )}>
                        {role === opt.value && <div className="w-2 h-2 bg-white rounded-full" />}
                      </div>
                    </motion.button>
                  ))}
                </div>

                {/* Account type for parents */}
                {role === 'PARENT' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-3"
                  >
                    <p className="text-sm font-medium text-gray-700">Are you a homeschool family?</p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setAccountType('homeschool')}
                        className={cn(
                          'flex-1 p-3 rounded-xl border-2 flex items-center gap-3 transition',
                          accountType === 'homeschool'
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        )}
                      >
                        <Home size={18} className="text-primary-500" />
                        <div className="text-left">
                          <p className="text-sm font-medium">Yes, homeschool</p>
                          <p className="text-xs text-gray-400">I teach my children at home</p>
                        </div>
                      </button>
                      <button
                        onClick={() => setAccountType('district')}
                        className={cn(
                          'flex-1 p-3 rounded-xl border-2 flex items-center gap-3 transition',
                          accountType !== 'homeschool'
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        )}
                      >
                        <Shield size={18} className="text-emerald-500" />
                        <div className="text-left">
                          <p className="text-sm font-medium">School district</p>
                          <p className="text-xs text-gray-400">My child attends a school</p>
                        </div>
                      </button>
                    </div>
                  </motion.div>
                )}

                <div className="flex justify-between items-center pt-2">
                  <Link href="/login" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                    Already have an account?
                  </Link>
                  <button
                    onClick={() => setStep(2)}
                    disabled={!canProceedStep1}
                    className={cn(
                      'btn-primary flex items-center gap-2',
                      !canProceedStep1 && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    Continue <ArrowRight size={16} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Personal Details */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Your details</h1>
                  <p className="text-gray-500 mt-2">Tell us a little about yourself</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="input-field"
                    placeholder="Enter your full name"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="input-field"
                    placeholder="you@example.com"
                  />
                </div>

                {role === 'STUDENT' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Grade Level</label>
                    <select
                      value={gradeLevel}
                      onChange={e => setGradeLevel(e.target.value)}
                      className="input-field"
                    >
                      <option value="">Select your grade</option>
                      {GRADE_LEVELS.map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Homeschool child fields - multiple children */}
                {accountType === 'homeschool' && role === 'PARENT' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-4 p-4 bg-amber-50 rounded-2xl border border-amber-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-amber-700">
                        <Home size={16} />
                        <p className="text-sm font-medium">Your Children</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setChildrenList(prev => [...prev, { name: '', grade: '' }])}
                        className="text-xs text-amber-700 font-medium hover:underline"
                      >
                        + Add another child
                      </button>
                    </div>
                    {childrenList.map((child, idx) => (
                      <div key={idx} className="space-y-2 bg-white/50 rounded-xl p-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-medium text-gray-500">Child {idx + 1}</p>
                          {childrenList.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setChildrenList(prev => prev.filter((_, i) => i !== idx))}
                              className="text-xs text-red-500 hover:underline"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        <input
                          type="text"
                          value={child.name}
                          onChange={e => {
                            const updated = [...childrenList];
                            updated[idx] = { ...updated[idx], name: e.target.value };
                            setChildrenList(updated);
                          }}
                          className="input-field"
                          placeholder="Child's name"
                        />
                        <select
                          value={child.grade}
                          onChange={e => {
                            const updated = [...childrenList];
                            updated[idx] = { ...updated[idx], grade: e.target.value };
                            setChildrenList(updated);
                          }}
                          className="input-field"
                        >
                          <option value="">Select grade</option>
                          {GRADE_LEVELS.map(g => (
                            <option key={g} value={g}>{g}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                    <p className="text-xs text-amber-600">
                      Student accounts will be created automatically for each child. You can add more children later.
                    </p>
                  </motion.div>
                )}

                <div className="flex justify-between items-center pt-2">
                  <button
                    onClick={() => setStep(1)}
                    className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                  >
                    <ArrowLeft size={14} /> Back
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    disabled={!canProceedStep2}
                    className={cn(
                      'btn-primary flex items-center gap-2',
                      !canProceedStep2 && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    Continue <ArrowRight size={16} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Password & Submit */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Secure your account</h1>
                  <p className="text-gray-500 mt-2">Create a strong password</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="input-field pr-10"
                      placeholder="Min. 8 characters"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {password && (
                    <div className="mt-2">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(i => (
                          <div
                            key={i}
                            className={cn(
                              'h-1.5 flex-1 rounded-full transition-all',
                              i <= strength ? strengthColor : 'bg-gray-200'
                            )}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Strength: {strengthLabel}</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className={cn(
                      'input-field',
                      confirmPassword && password !== confirmPassword && 'border-red-300 focus:border-red-500 focus:ring-red-200'
                    )}
                    placeholder="Re-enter your password"
                  />
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                  )}
                </div>

                {/* Summary */}
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200">
                  <p className="text-sm font-medium text-gray-700 mb-2">Account Summary</p>
                  <div className="space-y-1 text-sm text-gray-500">
                    <p><span className="text-gray-400">Role:</span> {role}</p>
                    <p><span className="text-gray-400">Name:</span> {name}</p>
                    <p><span className="text-gray-400">Email:</span> {email}</p>
                    {accountType === 'homeschool' && <p><span className="text-gray-400">Type:</span> Homeschool</p>}
                    {gradeLevel && <p><span className="text-gray-400">Grade:</span> {gradeLevel}</p>}
                    {accountType === 'homeschool' && childrenList.filter(c => c.name.trim()).length > 0 && (
                      <p><span className="text-gray-400">Children:</span> {childrenList.filter(c => c.name.trim()).map(c => `${c.name}${c.grade ? ` (${c.grade})` : ''}`).join(', ')}</p>
                    )}
                  </div>
                </div>

                <p className="text-xs text-gray-400">
                  By creating an account, you agree to our{' '}
                  <Link href="/terms" className="text-primary-600 hover:underline">Terms of Service</Link> and{' '}
                  <Link href="/privacy" className="text-primary-600 hover:underline">Privacy Policy</Link>.
                  Limud is FERPA & COPPA compliant.
                </p>

                <div className="flex justify-between items-center pt-2">
                  <button
                    onClick={() => setStep(2)}
                    className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                  >
                    <ArrowLeft size={14} /> Back
                  </button>
                  <button
                    onClick={handleRegister}
                    disabled={loading || !canProceedStep3}
                    className={cn(
                      'btn-primary flex items-center gap-2',
                      (!canProceedStep3 || loading) && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                        Creating account...
                      </>
                    ) : (
                      <>
                        <UserPlus size={16} />
                        Create Account
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
