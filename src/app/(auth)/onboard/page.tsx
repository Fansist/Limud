'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import Link from 'next/link';
import {
  Building2, CreditCard, Users, ArrowRight, ArrowLeft, CheckCircle2,
  Sparkles, Shield, Zap, Crown, Star, Eye, EyeOff, Home, GraduationCap,
  Plus, Trash2, Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const PLANS = [
  { tier: 'FREE', price: 0, students: 5, teachers: 2, schools: 0, color: 'from-gray-400 to-gray-500', icon: <Home size={20} />,
    features: ['Up to 5 students', 'AI Tutor (50/mo)', 'Basic gamification', 'Parent dashboard'] },
  { tier: 'STARTER', price: 5, students: 100, teachers: 10, schools: 1, color: 'from-blue-500 to-cyan-500', icon: <Zap size={20} />,
    features: ['AI Tutor (unlimited)', 'AI Auto-Grader', 'Full gamification', 'Game Store', 'Up to 100 students'] },
  { tier: 'STANDARD', price: 8, students: 500, teachers: 50, schools: 5, color: 'from-emerald-500 to-teal-500', icon: <Star size={20} />, popular: true,
    features: ['Everything in Starter', 'Up to 500 students', '5 schools', 'Advanced Analytics', 'LMS Integration'] },
  { tier: 'PREMIUM', price: 12, students: 2000, teachers: 200, schools: 20, color: 'from-purple-500 to-pink-500', icon: <Crown size={20} />,
    features: ['Everything in Standard', 'Up to 2000 students', '20 schools', 'Premium Support', 'Custom Branding'] },
  { tier: 'ENTERPRISE', price: 15, students: 10000, teachers: 1000, schools: 100, color: 'from-amber-500 to-red-500', icon: <Shield size={20} />,
    features: ['Everything in Premium', 'Unlimited students', '100 schools', '24/7 Support', 'SLA & Custom Dev'] },
];

const GRADE_LEVELS = [
  'Kindergarten', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th',
  '9th', '10th', '11th', '12th',
];

type CustomerType = 'district' | 'homeschool';
type Child = { name: string; grade: string };

export default function OnboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedPlan = searchParams.get('plan') || 'STANDARD';
  const preselectedType = searchParams.get('type') as CustomerType | null;
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [customerType, setCustomerType] = useState<CustomerType>(preselectedType || 'district');
  const [selectedPlan, setSelectedPlan] = useState(preselectedPlan);
  const [studentCount, setStudentCount] = useState(100);

  // Shared fields
  const [form, setForm] = useState({
    // District fields
    districtName: '', contactEmail: '', contactPhone: '', address: '', city: '', state: '', zipCode: '',
    // Admin account (district) or parent account (homeschool)
    adminName: '', adminEmail: '', adminPassword: '', confirmPassword: '',
    // Payment
    billingName: '', billingEmail: '', paymentMethod: 'card',
    cardNumber: '', cardExpiry: '', cardCvc: '',
  });

  // Homeschool-specific
  const [children, setChildren] = useState<Child[]>([{ name: '', grade: '' }]);

  const plan = PLANS.find(p => p.tier === selectedPlan)!;
  const isHomeschool = customerType === 'homeschool';
  const isFree = selectedPlan === 'FREE';
  const totalCost = isFree ? 0 : plan.price * studentCount;

  // Determine total steps based on customer type & plan
  const totalSteps = isFree ? 3 : 4; // type -> plan -> details -> payment (skip payment for free)

  useEffect(() => {
    if (preselectedType === 'homeschool') {
      setCustomerType('homeschool');
      if (!searchParams.get('plan')) setSelectedPlan('FREE');
    }
  }, [preselectedType]);

  function updateForm(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }));
  }

  function addChild() {
    setChildren(prev => [...prev, { name: '', grade: '' }]);
  }

  function removeChild(idx: number) {
    if (children.length <= 1) return;
    setChildren(prev => prev.filter((_, i) => i !== idx));
  }

  function updateChild(idx: number, field: keyof Child, value: string) {
    setChildren(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  }

  async function handleSubmit() {
    if (form.adminPassword !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (form.adminPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      if (isHomeschool) {
        // Homeschool flow: create via register API with homeschool type
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.adminName,
            email: form.adminEmail,
            password: form.adminPassword,
            role: 'PARENT',
            accountType: 'HOMESCHOOL',
            children: children.filter(c => c.name.trim()),
          }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          // If paid plan, also process the payment
          if (!isFree) {
            await fetch('/api/payments', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'homeschool-upgrade',
                email: form.adminEmail,
                tier: selectedPlan,
                studentCount: Math.max(children.filter(c => c.name.trim()).length, 5),
                paymentMethod: form.paymentMethod,
              }),
            });
          }
          toast.success('Account created! Signing you in...');
          const signInResult = await signIn('credentials', {
            email: form.adminEmail,
            password: form.adminPassword,
            redirect: false,
          });
          if (signInResult?.ok) {
            router.push('/parent/dashboard');
          } else {
            router.push('/login');
          }
        } else {
          toast.error(data.error || 'Failed to create account');
        }
      } else {
        // District flow: onboard API
        const res = await fetch('/api/payments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'onboard',
            districtName: form.districtName,
            contactEmail: form.contactEmail,
            contactPhone: form.contactPhone,
            address: form.address,
            city: form.city,
            state: form.state,
            zipCode: form.zipCode,
            tier: selectedPlan,
            studentCount,
            adminName: form.adminName,
            adminEmail: form.adminEmail,
            adminPassword: form.adminPassword,
            billingName: form.billingName || form.districtName,
            billingEmail: form.billingEmail || form.contactEmail,
            paymentMethod: form.paymentMethod,
          }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          toast.success('District created! Signing you in...');
          const signInResult = await signIn('credentials', {
            email: form.adminEmail,
            password: form.adminPassword,
            redirect: false,
          });
          if (signInResult?.ok) {
            router.push('/admin/dashboard');
          } else {
            router.push('/login');
          }
        } else {
          toast.error(data.error || 'Failed to create district');
        }
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function nextStep() {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      // Validate plan step
      setStep(3);
    } else if (step === 3) {
      // Validate details step
      if (isHomeschool) {
        if (!form.adminName || !form.adminEmail) {
          toast.error('Name and email are required');
          return;
        }
        if (children.filter(c => c.name.trim()).length === 0) {
          toast.error('Add at least one child');
          return;
        }
      } else {
        if (!form.districtName || !form.contactEmail) {
          toast.error('District name and email are required');
          return;
        }
        if (!form.adminName || !form.adminEmail) {
          toast.error('Admin name and email are required');
          return;
        }
      }
      if (isFree) {
        // Skip payment for free plan, go straight to submit
        if (!form.adminPassword || form.adminPassword.length < 8) {
          toast.error('Password must be at least 8 characters');
          return;
        }
        handleSubmit();
      } else {
        setStep(4);
      }
    } else if (step === 4) {
      handleSubmit();
    }
  }

  const stepLabels = isHomeschool
    ? (isFree ? ['Type', 'Plan', 'Account'] : ['Type', 'Plan', 'Account', 'Payment'])
    : ['Type', 'Plan', 'District & Admin', 'Payment'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Sparkles className="text-primary-600" size={24} />
            <span className="text-xl font-bold text-gray-900">Limud</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/pricing" className="text-sm text-gray-500 hover:text-gray-700">View Plans</Link>
            <Link href="/login" className="text-sm text-gray-500 hover:text-gray-700">Sign in</Link>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Step Indicator */}
        <div className="flex items-center gap-2 mb-8 justify-center">
          {stepLabels.map((label, i) => {
            const s = i + 1;
            return (
              <div key={s} className="flex items-center gap-2">
                <button
                  onClick={() => s < step && setStep(s)}
                  className={cn('w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition',
                    step >= s ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-400',
                    s < step && 'cursor-pointer hover:bg-primary-700'
                  )}>
                  {step > s ? <CheckCircle2 size={16} /> : s}
                </button>
                <span className={cn('text-sm hidden sm:inline', step >= s ? 'text-gray-900 font-medium' : 'text-gray-400')}>{label}</span>
                {i < stepLabels.length - 1 && <div className={cn('w-8 sm:w-12 h-0.5 rounded', step > s ? 'bg-primary-500' : 'bg-gray-200')} />}
              </div>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          {/* ═══ Step 1: Choose Customer Type ═══ */}
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="max-w-2xl mx-auto space-y-6">
              <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-900">Welcome to Limud</h1>
                <p className="text-gray-500 mt-2">What type of account are you setting up?</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <button
                  onClick={() => setCustomerType('district')}
                  className={cn(
                    'card text-left p-6 rounded-2xl border-2 transition-all',
                    customerType === 'district'
                      ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200 shadow-lg'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white mb-4">
                    <Building2 size={24} />
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg">School District</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    For K-12 school districts, charter schools, and private schools managing multiple students and teachers.
                  </p>
                  <div className="flex flex-wrap gap-1 mt-3">
                    {['Multi-school', 'Bulk provisioning', 'Admin portal'].map(tag => (
                      <span key={tag} className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{tag}</span>
                    ))}
                  </div>
                </button>

                <button
                  onClick={() => { setCustomerType('homeschool'); if (selectedPlan !== 'FREE') setSelectedPlan('FREE'); }}
                  className={cn(
                    'card text-left p-6 rounded-2xl border-2 transition-all',
                    customerType === 'homeschool'
                      ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200 shadow-lg'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center text-white mb-4">
                    <Home size={24} />
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg">Homeschool Family</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    For parents educating children at home. Start free and upgrade anytime as your family grows.
                  </p>
                  <div className="flex flex-wrap gap-1 mt-3">
                    {['Free plan available', 'AI Tutor', 'Parent dashboard'].map(tag => (
                      <span key={tag} className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{tag}</span>
                    ))}
                  </div>
                </button>
              </div>

              <div className="text-center">
                <button onClick={() => setStep(2)} className="btn-primary px-8 py-3 text-lg flex items-center gap-2 mx-auto">
                  Continue <ArrowRight size={18} />
                </button>
              </div>
            </motion.div>
          )}

          {/* ═══ Step 2: Choose Plan ═══ */}
          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-900">
                  {isHomeschool ? 'Choose Your Homeschool Plan' : 'Choose Your District Plan'}
                </h1>
                <p className="text-gray-500 mt-2">
                  {isHomeschool ? 'Start free or upgrade for unlimited AI features' : 'Select the perfect plan for your school district'}
                </p>
              </div>

              <div className={cn('grid gap-4', isHomeschool ? 'sm:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto' : 'sm:grid-cols-2 lg:grid-cols-4')}>
                {PLANS.filter(p => isHomeschool ? true : p.tier !== 'FREE').map(p => (
                  <button key={p.tier} onClick={() => setSelectedPlan(p.tier)}
                    className={cn('card text-left relative transition-all rounded-2xl p-5',
                      selectedPlan === p.tier ? 'border-2 border-primary-500 ring-2 ring-primary-200 shadow-lg' : 'border-2 border-transparent hover:border-gray-200'
                    )}>
                    {p.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-600 text-white text-xs px-3 py-0.5 rounded-full font-medium">Most Popular</div>}
                    <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white mb-3', p.color)}>{p.icon}</div>
                    <p className="font-bold text-gray-900">{p.tier}</p>
                    <p className="text-2xl font-bold mt-1">
                      {p.price === 0 ? 'Free' : `$${p.price}`}
                      {p.price > 0 && <span className="text-sm text-gray-400 font-normal">/student/yr</span>}
                    </p>
                    <ul className="mt-3 space-y-1">
                      {p.features.map(f => (
                        <li key={f} className="text-xs text-gray-500 flex items-start gap-1">
                          <CheckCircle2 size={10} className="text-green-500 mt-0.5 flex-shrink-0" /> {f}
                        </li>
                      ))}
                    </ul>
                  </button>
                ))}
              </div>

              {!isFree && !isHomeschool && (
                <div className="card max-w-md mx-auto p-5">
                  <label className="block text-sm font-medium text-gray-700 mb-2">How many students?</label>
                  <input type="number" value={studentCount} onChange={e => setStudentCount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="input-field text-center text-2xl font-bold" min={1} />
                  <p className="text-center text-lg font-bold text-primary-600 mt-2">
                    Total: ${totalCost.toLocaleString()}/year
                  </p>
                </div>
              )}

              <div className="flex justify-between max-w-2xl mx-auto">
                <button onClick={() => setStep(1)} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
                  <ArrowLeft size={14} /> Back
                </button>
                <button onClick={() => setStep(3)} className="btn-primary flex items-center gap-2">
                  Continue <ArrowRight size={16} />
                </button>
              </div>
            </motion.div>
          )}

          {/* ═══ Step 3: Details ═══ */}
          {step === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="max-w-2xl mx-auto space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {isHomeschool ? 'Your Homeschool Account' : 'District & Admin Setup'}
                </h1>
                <p className="text-gray-500 mt-2">
                  {isHomeschool ? 'Set up your parent account and add your children' : 'Enter your district info and create the superintendent account'}
                </p>
              </div>

              {/* District-specific fields */}
              {!isHomeschool && (
                <div className="card space-y-4">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2"><Building2 size={18} /> District Information</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">District Name *</label>
                    <input value={form.districtName} onChange={e => updateForm('districtName', e.target.value)} className="input-field" placeholder="e.g., Springfield School District" />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email *</label>
                      <input type="email" value={form.contactEmail} onChange={e => updateForm('contactEmail', e.target.value)} className="input-field" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <input value={form.contactPhone} onChange={e => updateForm('contactPhone', e.target.value)} className="input-field" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <input value={form.address} onChange={e => updateForm('address', e.target.value)} className="input-field" />
                  </div>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                      <input value={form.city} onChange={e => updateForm('city', e.target.value)} className="input-field" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                      <input value={form.state} onChange={e => updateForm('state', e.target.value)} className="input-field" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
                      <input value={form.zipCode} onChange={e => updateForm('zipCode', e.target.value)} className="input-field" />
                    </div>
                  </div>
                </div>
              )}

              {/* Account fields */}
              <div className="card space-y-4">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  {isHomeschool ? <><Users size={18} /> Parent Account</> : <><Shield size={18} /> Superintendent Account</>}
                </h3>
                {!isHomeschool && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-700">
                    This account has full access to manage schools, students, teachers, classes, and billing.
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input value={form.adminName} onChange={e => updateForm('adminName', e.target.value)} className="input-field" placeholder="Your full name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input type="email" value={form.adminEmail} onChange={e => updateForm('adminEmail', e.target.value)} className="input-field" placeholder="you@example.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} value={form.adminPassword}
                      onChange={e => updateForm('adminPassword', e.target.value)} className="input-field pr-10" placeholder="Min 8 characters" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
                  <input type="password" value={form.confirmPassword} onChange={e => updateForm('confirmPassword', e.target.value)} className="input-field" placeholder="Re-enter password" />
                  {form.confirmPassword && form.adminPassword !== form.confirmPassword && (
                    <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                  )}
                </div>
              </div>

              {/* Homeschool children */}
              {isHomeschool && (
                <div className="card space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                      <GraduationCap size={18} /> Your Children
                    </h3>
                    <button onClick={addChild} className="text-sm text-primary-600 font-medium flex items-center gap-1 hover:text-primary-700">
                      <Plus size={14} /> Add Child
                    </button>
                  </div>
                  {children.map((child, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-700">Child {idx + 1}</p>
                        {children.length > 1 && (
                          <button onClick={() => removeChild(idx)} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1">
                            <Trash2 size={12} /> Remove
                          </button>
                        )}
                      </div>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
                          <input value={child.name} onChange={e => updateChild(idx, 'name', e.target.value)}
                            className="input-field" placeholder="Child's name" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Grade Level</label>
                          <select value={child.grade} onChange={e => updateChild(idx, 'grade', e.target.value)} className="input-field">
                            <option value="">Select grade</option>
                            {GRADE_LEVELS.map(g => <option key={g} value={g}>{g}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                  <p className="text-xs text-gray-400">
                    Student accounts will be created automatically for each child. They'll use the same password as your parent account.
                  </p>
                </div>
              )}

              <div className="flex justify-between">
                <button onClick={() => setStep(2)} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
                  <ArrowLeft size={14} /> Back
                </button>
                <button onClick={nextStep} disabled={loading}
                  className={cn('btn-primary flex items-center gap-2', loading && 'opacity-50')}>
                  {loading ? (
                    <><div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> Creating...</>
                  ) : isFree ? (
                    <><CheckCircle2 size={16} /> Create Free Account</>
                  ) : (
                    <>Continue to Payment <ArrowRight size={16} /></>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* ═══ Step 4: Payment ═══ */}
          {step === 4 && (
            <motion.div key="s4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="max-w-2xl mx-auto space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Complete Payment</h1>
                <p className="text-gray-500 mt-2">Review your order and complete payment</p>
              </div>

              {/* Order Summary */}
              <div className="card bg-gray-50">
                <h3 className="font-bold text-gray-900 mb-3">Order Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-600">Account Type</span><span className="font-medium">{isHomeschool ? 'Homeschool' : 'District'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">Plan</span><span className="font-medium">{selectedPlan}</span></div>
                  {!isHomeschool && (
                    <>
                      <div className="flex justify-between"><span className="text-gray-600">Students</span><span className="font-medium">{studentCount}</span></div>
                      <div className="flex justify-between"><span className="text-gray-600">Price per student</span><span className="font-medium">${plan.price}/year</span></div>
                      <div className="flex justify-between"><span className="text-gray-600">District</span><span className="font-medium">{form.districtName}</span></div>
                    </>
                  )}
                  {isHomeschool && (
                    <>
                      <div className="flex justify-between"><span className="text-gray-600">Children</span><span className="font-medium">{children.filter(c => c.name.trim()).length}</span></div>
                      <div className="flex justify-between"><span className="text-gray-600">Annual price</span><span className="font-medium">${(plan.price * Math.max(children.filter(c => c.name.trim()).length, 5)).toLocaleString()}</span></div>
                    </>
                  )}
                  <hr />
                  <div className="flex justify-between text-lg">
                    <span className="font-bold text-gray-900">Total</span>
                    <span className="font-bold text-primary-600">
                      ${isHomeschool ? (plan.price * Math.max(children.filter(c => c.name.trim()).length, 5)).toLocaleString() : totalCost.toLocaleString()}/year
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="card space-y-4">
                <h3 className="font-bold text-gray-900 flex items-center gap-2"><CreditCard size={18} /> Payment Method</h3>
                <div className="flex gap-3">
                  {['card', 'purchase_order'].map(m => (
                    <button key={m} onClick={() => updateForm('paymentMethod', m)}
                      className={cn('flex-1 p-3 rounded-xl border-2 text-center text-sm font-medium transition',
                        form.paymentMethod === m ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                      )}>
                      {m === 'card' ? '💳 Credit Card' : '📄 Purchase Order'}
                    </button>
                  ))}
                </div>

                {form.paymentMethod === 'card' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
                      <input value={form.cardNumber} onChange={e => updateForm('cardNumber', e.target.value)}
                        className="input-field" placeholder="4242 4242 4242 4242" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Expiry</label>
                        <input value={form.cardExpiry} onChange={e => updateForm('cardExpiry', e.target.value)} className="input-field" placeholder="MM/YY" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">CVC</label>
                        <input value={form.cardCvc} onChange={e => updateForm('cardCvc', e.target.value)} className="input-field" placeholder="123" />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-xl">
                  <Lock size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-green-700">
                    <p className="font-medium">Secure Payment</p>
                    <p className="mt-0.5">Payment is processed securely. Your card details are encrypted and never stored on our servers. 30-day money-back guarantee.</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <button onClick={() => setStep(3)} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
                  <ArrowLeft size={14} /> Back
                </button>
                <button onClick={handleSubmit} disabled={loading}
                  className={cn('btn-primary px-8 py-3 text-lg flex items-center gap-2', loading && 'opacity-50 cursor-not-allowed')}>
                  {loading ? (
                    <><div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" /> Processing...</>
                  ) : (
                    <><CreditCard size={18} /> Pay ${isHomeschool ? (plan.price * Math.max(children.filter(c => c.name.trim()).length, 5)).toLocaleString() : totalCost.toLocaleString()} & {isHomeschool ? 'Create Account' : 'Create District'}</>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
