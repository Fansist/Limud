'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Home, Shield, ArrowRight, ArrowLeft,
  Eye, EyeOff, CheckCircle2, UserPlus, GraduationCap, Plus, Trash2,
  BookOpen, Building2, Brain, Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

type AccountType = 'homeschool' | 'admin' | 'self_education' | 'student_standalone';

const QUICK_LEARNING_STYLES = [
  { id: 'visual', label: 'Visual', emoji: '👀' },
  { id: 'auditory', label: 'Auditory', emoji: '👂' },
  { id: 'kinesthetic', label: 'Hands-On', emoji: '🤲' },
  { id: 'reading_writing', label: 'Reading/Writing', emoji: '📝' },
  { id: 'adhd_friendly', label: 'ADHD-Friendly', emoji: '⚡' },
  { id: 'structured', label: 'Structured', emoji: '📋' },
];

const ACCOUNT_OPTIONS = [
  {
    value: 'student_standalone' as const,
    label: 'Student',
    icon: GraduationCap,
    color: 'from-blue-500 to-cyan-500',
    desc: 'I want to join my school\'s district',
    detail: 'Create a student account and request to link to your school district. Use AI features while waiting for approval.',
    tags: ['Free', 'AI Tutor', 'Request district link', 'Full features on approval'],
  },
  {
    value: 'self_education' as const,
    label: 'Self Education',
    icon: Brain,
    color: 'from-teal-500 to-emerald-500',
    desc: 'I want to learn at my own pace',
    detail: 'Create a student account to learn independently with AI-powered personalized methods. No teacher or parent needed.',
    tags: ['Free forever', 'AI Tutor', 'Personalized learning', 'Self-paced'],
  },
  {
    value: 'homeschool' as const,
    label: 'Homeschool Family',
    icon: Home,
    color: 'from-amber-500 to-orange-500',
    desc: 'I educate my children at home',
    detail: 'Create a parent account and add your children as student accounts. Use AI tutoring and track their progress — all free.',
    tags: ['Free forever', 'AI Tutor', 'Parent dashboard', 'Add students'],
  },
  {
    value: 'admin' as const,
    label: 'District Administrator',
    icon: Building2,
    color: 'from-blue-500 to-indigo-600',
    desc: 'I manage a school or district',
    detail: 'Create an admin account to manage schools, teachers, and students. Choose a plan to unlock features for your district.',
    tags: ['Multi-school', 'Bulk provisioning', 'Plans from $2/student/mo'],
  },
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
  const [accountType, setAccountType] = useState<AccountType | ''>('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Homeschool fields - multiple children support
  const [childrenList, setChildrenList] = useState<{name: string; grade: string}[]>([{ name: '', grade: '' }]);

  // District admin fields
  const [districtName, setDistrictName] = useState('');

  // Self Education fields
  const [gradeLevel, setGradeLevel] = useState('');
  const [learningStyle, setLearningStyle] = useState('visual');

  // Password validation matching NIST SP 800-63B backend rules
  const passwordErrors = (pw: string): string[] => {
    const errs: string[] = [];
    if (pw.length < 10) errs.push('At least 10 characters');
    if (!/[A-Z]/.test(pw)) errs.push('One uppercase letter');
    if (!/[a-z]/.test(pw)) errs.push('One lowercase letter');
    if (!/[0-9]/.test(pw)) errs.push('One number');
    if (/(.)\1{3,}/.test(pw)) errs.push('No 4+ repeated characters');
    if (/(?:abcd|bcde|cdef|defg|1234|2345|3456|4567|5678|6789|0123)/i.test(pw)) errs.push('No sequential characters');
    return errs;
  };

  const passwordStrength = (pw: string) => {
    let score = 0;
    if (pw.length >= 10) score++;
    if (pw.length >= 14) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  };

  const pwErrors = passwordErrors(password);
  const strength = passwordStrength(password);
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent'][strength];
  const strengthColor = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-emerald-500'][strength];

  async function handleRegister() {
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (pwErrors.length > 0) {
      toast.error('Password requirements: ' + pwErrors.join(', '));
      return;
    }

    setLoading(true);
    try {
      if (accountType === 'student_standalone') {
        // v9.6: Standalone student — creates account without a district (NOT demo, NOT self_education)
        // They can then request to link to a district from the dashboard
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name, email, password,
            role: 'STUDENT',
            accountType: 'INDIVIDUAL',
            gradeLevel: gradeLevel || null,
            learningStyle,
          }),
        });

        const data = await res.json();

        if (res.ok) {
          toast.success('Account created! You can now request to join a district.');
          const signInResult = await signIn('credentials', {
            email, password, redirect: false,
          });
          if (signInResult?.ok) {
            // Clear any stale demo flags
            try {
              localStorage.removeItem('limud-demo-mode');
              localStorage.removeItem('limud-demo-role');
            } catch {}
            router.push('/student/link-district');
          } else {
            router.push('/login');
          }
        } else {
          if (data.passwordErrors && data.passwordErrors.length > 0) {
            toast.error('Password: ' + data.passwordErrors.join('. '));
          } else {
            toast.error(data.error || 'Registration failed');
          }
        }
      } else if (accountType === 'self_education') {
        // Self Education flow: register as STUDENT with SELF_EDUCATION type
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name, email, password,
            role: 'STUDENT',
            accountType: 'SELF_EDUCATION',
            gradeLevel: gradeLevel || null,
            learningStyle,
          }),
        });

        const data = await res.json();

        if (res.ok) {
          toast.success('Account created! Let\u2019s personalize your learning!');
          const signInResult = await signIn('credentials', {
            email, password, redirect: false,
          });
          if (signInResult?.ok) {
            router.push('/student/survey?first=true');
          } else {
            router.push('/login');
          }
        } else {
          if (data.passwordErrors && data.passwordErrors.length > 0) {
            toast.error('Password: ' + data.passwordErrors.join('. '));
          } else {
            toast.error(data.error || 'Registration failed');
          }
        }
      } else if (accountType === 'homeschool') {
        // Homeschool flow: register as PARENT with HOMESCHOOL type
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name, email, password,
            role: 'PARENT',
            accountType: 'HOMESCHOOL',
            children: childrenList.filter(c => c.name.trim()),
          }),
        });

        const data = await res.json();

        if (res.ok) {
          toast.success('Account created! Signing you in...');
          const signInResult = await signIn('credentials', {
            email, password, redirect: false,
          });
          if (signInResult?.ok) {
            router.push('/parent/dashboard');
          } else {
            router.push('/login');
          }
        } else {
          if (data.passwordErrors && data.passwordErrors.length > 0) {
            toast.error('Password: ' + data.passwordErrors.join('. '));
          } else {
            toast.error(data.error || 'Registration failed');
          }
        }
      } else {
        // District admin flow: register as ADMIN
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name, email, password,
            role: 'ADMIN',
            accountType: 'DISTRICT',
            districtName: districtName || undefined,
          }),
        });

        const data = await res.json();

        if (res.ok) {
          toast.success('Admin account created! Choose a plan to get started.');
          const signInResult = await signIn('credentials', {
            email, password, redirect: false,
          });
          if (signInResult?.ok) {
            router.push('/pricing');
          } else {
            router.push('/login');
          }
        } else {
          if (data.passwordErrors && data.passwordErrors.length > 0) {
            toast.error('Password: ' + data.passwordErrors.join('. '));
          } else {
            toast.error(data.error || 'Registration failed');
          }
        }
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const canProceedStep1 = accountType !== '';
  const canProceedStep2 = name.trim() !== '' && email.trim() !== '' &&
    (accountType === 'homeschool' ? childrenList.filter(c => c.name.trim()).length > 0 : true) &&
    ((accountType === 'self_education' || accountType === 'student_standalone') ? gradeLevel !== '' : true);
  const canProceedStep3 = pwErrors.length === 0 && password === confirmPassword;

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
            <img src="/logo.png" alt="Limud" className="w-10 h-10 rounded-xl object-cover" />
            <span className="text-xl font-extrabold">Limud</span>
          </Link>

          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Every mind learns<br />differently.
          </h2>
          <p className="text-white/70 text-lg">
            Create your free account and unlock AI-powered personalized learning for every student.
          </p>
        </div>

        <div className="relative z-10 space-y-4">
          {[
            { icon: '🧠', text: 'AI adapts to each student\u2019s learning style' },
            { icon: '⚡', text: 'ADHD-friendly, visual, auditory & more formats' },
            { icon: '🏠', text: 'Self-education, homeschool, or district accounts' },
            { icon: '🏆', text: 'Gamification that makes learning engaging' },
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
            {/* Step 1: Choose Account Type */}
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
                  <p className="text-gray-500 mt-2">Choose your account type to get started</p>
                </div>

                <div className="space-y-3">
                  {ACCOUNT_OPTIONS.map(opt => (
                    <motion.button
                      key={opt.value}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => setAccountType(opt.value)}
                      className={cn(
                        'w-full p-5 rounded-2xl border-2 flex items-start gap-4 transition-all text-left',
                        accountType === opt.value
                          ? 'border-primary-500 bg-primary-50 shadow-md shadow-primary-100'
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                      )}
                    >
                      <div className={cn(
                        'w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-white flex-shrink-0',
                        opt.color
                      )}>
                        <opt.icon size={22} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900">{opt.label}</p>
                        <p className="text-sm text-gray-500">{opt.desc}</p>
                        <p className="text-xs text-gray-400 mt-1">{opt.detail}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {opt.tags.map(tag => (
                            <span key={tag} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{tag}</span>
                          ))}
                        </div>
                      </div>
                      <div className={cn(
                        'w-5 h-5 rounded-full border-2 flex items-center justify-center transition flex-shrink-0 mt-1',
                        accountType === opt.value ? 'border-primary-500 bg-primary-500' : 'border-gray-300'
                      )}>
                        {accountType === opt.value && <div className="w-2 h-2 bg-white rounded-full" />}
                      </div>
                    </motion.button>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-2">
                  <Link href="/login" className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
                    <ArrowLeft size={14} /> Already have an account?
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

            {/* Step 2: Details */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {accountType === 'student_standalone' ? 'Your Student Account' : accountType === 'self_education' ? 'Your Learning Account' : accountType === 'homeschool' ? 'Your Homeschool Account' : 'District Admin Account'}
                  </h1>
                  <p className="text-gray-500 mt-2">
                    {accountType === 'student_standalone'
                      ? 'Create your account, then request to join your school district'
                      : accountType === 'self_education'
                      ? 'Set up your account and tell us how you learn best'
                      : accountType === 'homeschool'
                      ? 'Set up your parent account and add your children'
                      : 'Create your administrator account'}
                  </p>
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

                {/* District Name for admins */}
                {accountType === 'admin' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">District / School Name</label>
                    <input
                      type="text"
                      value={districtName}
                      onChange={e => setDistrictName(e.target.value)}
                      className="input-field"
                      placeholder="e.g., Springfield School District"
                    />
                    <p className="text-xs text-gray-400 mt-1">You can add this later if you prefer.</p>
                  </div>
                )}

                {/* Homeschool children fields */}
                {accountType === 'homeschool' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-4 p-4 bg-amber-50 rounded-2xl border border-amber-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-amber-700">
                        <GraduationCap size={16} />
                        <p className="text-sm font-medium">Your Children</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setChildrenList(prev => [...prev, { name: '', grade: '' }])}
                        className="text-xs text-amber-700 font-medium hover:underline flex items-center gap-1"
                      >
                        <Plus size={12} /> Add another child
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
                              className="text-xs text-red-500 hover:underline flex items-center gap-1"
                            >
                              <Trash2 size={10} /> Remove
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

                {/* Standalone Student fields */}
                {accountType === 'student_standalone' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-4 p-4 bg-blue-50 rounded-2xl border border-blue-200"
                  >
                    <div className="flex items-center gap-2 text-blue-700">
                      <GraduationCap size={16} />
                      <p className="text-sm font-medium">Your Info</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Grade Level</label>
                      <select value={gradeLevel} onChange={e => setGradeLevel(e.target.value)} className="input-field">
                        <option value="">Select your grade</option>
                        {GRADE_LEVELS.map(g => (<option key={g} value={g}>{g}</option>))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2">How do you learn best?</label>
                      <div className="grid grid-cols-3 gap-2">
                        {QUICK_LEARNING_STYLES.map(ls => (
                          <button
                            key={ls.id} type="button"
                            onClick={() => setLearningStyle(ls.id)}
                            className={cn(
                              'p-2 rounded-xl border-2 text-center text-xs font-medium transition',
                              learningStyle === ls.id
                                ? 'border-blue-500 bg-blue-100 text-blue-800 ring-1 ring-blue-300'
                                : 'border-gray-200 hover:border-gray-300 text-gray-600'
                            )}
                          >
                            <span className="text-lg block">{ls.emoji}</span>
                            {ls.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-blue-600">
                      After creating your account, you&apos;ll be able to search for and request to join your school&apos;s district.
                    </p>
                  </motion.div>
                )}

                {/* Self Education fields */}
                {accountType === 'self_education' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-4 p-4 bg-teal-50 rounded-2xl border border-teal-200"
                  >
                    <div className="flex items-center gap-2 text-teal-700">
                      <Brain size={16} />
                      <p className="text-sm font-medium">Your Learning Profile</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Grade Level</label>
                      <select value={gradeLevel} onChange={e => setGradeLevel(e.target.value)} className="input-field">
                        <option value="">Select your grade</option>
                        {GRADE_LEVELS.map(g => (<option key={g} value={g}>{g}</option>))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2">How do you learn best?</label>
                      <div className="grid grid-cols-3 gap-2">
                        {QUICK_LEARNING_STYLES.map(ls => (
                          <button
                            key={ls.id} type="button"
                            onClick={() => setLearningStyle(ls.id)}
                            className={cn(
                              'p-2 rounded-xl border-2 text-center text-xs font-medium transition',
                              learningStyle === ls.id
                                ? 'border-teal-500 bg-teal-100 text-teal-800 ring-1 ring-teal-300'
                                : 'border-gray-200 hover:border-gray-300 text-gray-600'
                            )}
                          >
                            <span className="text-lg block">{ls.emoji}</span>
                            {ls.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-teal-600">
                      You can customize your full learning profile after sign-up. Every mind learns differently!
                    </p>
                  </motion.div>
                )}

                {/* Admin info callout */}
                {accountType === 'admin' && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl">
                    <div className="flex items-start gap-3">
                      <Shield size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-blue-900">District Admin Account</p>
                        <p className="text-xs text-blue-600 mt-1">
                          After creating your account, you&apos;ll be directed to choose a plan. Once subscribed,
                          you can create and manage teacher and student accounts, provision schools, and access district analytics.
                        </p>
                      </div>
                    </div>
                  </div>
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
                      placeholder="Min. 10 characters"
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
                      {pwErrors.length > 0 && (
                        <ul className="mt-2 space-y-0.5">
                          {pwErrors.map((err, i) => (
                            <li key={i} className="text-xs text-red-500 flex items-center gap-1">
                              <span className="w-1 h-1 bg-red-400 rounded-full flex-shrink-0" />
                              {err}
                            </li>
                          ))}
                        </ul>
                      )}
                      {pwErrors.length === 0 && password.length > 0 && (
                        <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                          <CheckCircle2 size={12} /> Password meets all requirements
                        </p>
                      )}
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
                    <p><span className="text-gray-400">Type:</span> {accountType === 'student_standalone' ? 'Student (Join a District)' : accountType === 'self_education' ? 'Self Education Student' : accountType === 'homeschool' ? 'Homeschool Parent' : 'District Administrator'}</p>
                    <p><span className="text-gray-400">Name:</span> {name}</p>
                    <p><span className="text-gray-400">Email:</span> {email}</p>
                    {(accountType === 'self_education' || accountType === 'student_standalone') && gradeLevel && <p><span className="text-gray-400">Grade:</span> {gradeLevel}</p>}
                    {(accountType === 'self_education' || accountType === 'student_standalone') && <p><span className="text-gray-400">Learning Style:</span> {QUICK_LEARNING_STYLES.find(l => l.id === learningStyle)?.label}</p>}
                    {accountType === 'admin' && districtName && <p><span className="text-gray-400">District:</span> {districtName}</p>}
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
