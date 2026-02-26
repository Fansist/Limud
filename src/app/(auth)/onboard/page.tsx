'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import Link from 'next/link';
import {
  Building2, CreditCard, Users, ArrowRight, ArrowLeft, CheckCircle2,
  Sparkles, Shield, Zap, Crown, Star, Eye, EyeOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const PLANS = [
  { tier: 'STARTER', price: 5, students: 100, teachers: 10, schools: 1, color: 'from-blue-500 to-cyan-500', icon: <Zap size={20} />,
    features: ['AI Tutoring', 'Gamification', 'Progress Tracking', 'Parent Portal', 'Up to 100 students'] },
  { tier: 'STANDARD', price: 8, students: 500, teachers: 50, schools: 5, color: 'from-emerald-500 to-teal-500', icon: <Star size={20} />, popular: true,
    features: ['Everything in Starter', 'Up to 500 students', '5 schools', 'Advanced Analytics', 'LMS Integration'] },
  { tier: 'PREMIUM', price: 12, students: 2000, teachers: 200, schools: 20, color: 'from-purple-500 to-pink-500', icon: <Crown size={20} />,
    features: ['Everything in Standard', 'Up to 2000 students', '20 schools', 'Premium Support', 'Custom Branding'] },
  { tier: 'ENTERPRISE', price: 15, students: 10000, teachers: 1000, schools: 100, color: 'from-amber-500 to-red-500', icon: <Shield size={20} />,
    features: ['Everything in Premium', 'Unlimited students', '100 schools', '24/7 Support', 'SLA & Custom Dev'] },
];

export default function OnboardPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [selectedPlan, setSelectedPlan] = useState('STANDARD');
  const [studentCount, setStudentCount] = useState(100);
  const [form, setForm] = useState({
    districtName: '', contactEmail: '', contactPhone: '', address: '', city: '', state: '', zipCode: '',
    adminName: '', adminEmail: '', adminPassword: '', confirmPassword: '',
    billingName: '', billingEmail: '', paymentMethod: 'card',
    cardNumber: '', cardExpiry: '', cardCvc: '',
  });

  const plan = PLANS.find(p => p.tier === selectedPlan)!;
  const totalCost = plan.price * studentCount;

  async function handleSubmit() {
    if (form.adminPassword !== form.confirmPassword) { toast.error('Passwords do not match'); return; }
    if (form.adminPassword.length < 8) { toast.error('Password must be at least 8 characters'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/payments', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'onboard',
          districtName: form.districtName,
          contactEmail: form.contactEmail,
          contactPhone: form.contactPhone,
          address: form.address, city: form.city, state: form.state, zipCode: form.zipCode,
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
        const signInResult = await signIn('credentials', { email: form.adminEmail, password: form.adminPassword, redirect: false });
        if (signInResult?.ok) {
          router.push('/admin/dashboard');
        } else {
          router.push('/login');
        }
      } else {
        toast.error(data.error || 'Failed to create district');
      }
    } catch { toast.error('Something went wrong'); }
    finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Sparkles className="text-primary-600" size={24} />
            <span className="text-xl font-bold text-gray-900">Limud</span>
          </Link>
          <Link href="/login" className="text-sm text-gray-500 hover:text-gray-700">Already have an account? Sign in</Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Steps */}
        <div className="flex items-center gap-2 mb-8 justify-center">
          {[{s:1,l:'Plan'},{s:2,l:'District'},{s:3,l:'Admin'},{s:4,l:'Payment'}].map((s, i) => (
            <div key={s.s} className="flex items-center gap-2">
              <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                step >= s.s ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-400'
              )}>{step > s.s ? <CheckCircle2 size={16} /> : s.s}</div>
              <span className={cn('text-sm hidden sm:inline', step >= s.s ? 'text-gray-900 font-medium' : 'text-gray-400')}>{s.l}</span>
              {i < 3 && <div className={cn('w-12 h-0.5 rounded', step > s.s ? 'bg-primary-500' : 'bg-gray-200')} />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Choose Plan */}
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="text-center"><h1 className="text-3xl font-bold text-gray-900">Choose Your Plan</h1>
                <p className="text-gray-500 mt-2">Select the perfect plan for your district</p></div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {PLANS.map(p => (
                  <button key={p.tier} onClick={() => setSelectedPlan(p.tier)}
                    className={cn('card text-left relative transition-all',
                      selectedPlan === p.tier ? 'border-2 border-primary-500 ring-2 ring-primary-200 shadow-lg' : 'border-2 border-transparent hover:border-gray-200'
                    )}>
                    {p.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-600 text-white text-xs px-3 py-0.5 rounded-full font-medium">Most Popular</div>}
                    <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white mb-3', p.color)}>{p.icon}</div>
                    <p className="font-bold text-gray-900">{p.tier}</p>
                    <p className="text-2xl font-bold mt-1">${p.price}<span className="text-sm text-gray-400 font-normal">/student/yr</span></p>
                    <ul className="mt-3 space-y-1">{p.features.map(f => (
                      <li key={f} className="text-xs text-gray-500 flex items-start gap-1"><CheckCircle2 size={10} className="text-green-500 mt-0.5 flex-shrink-0" /> {f}</li>
                    ))}</ul>
                  </button>
                ))}
              </div>

              <div className="card max-w-md mx-auto">
                <label className="block text-sm font-medium text-gray-700 mb-2">How many students?</label>
                <input type="number" value={studentCount} onChange={e => setStudentCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="input-field text-center text-2xl font-bold" min={1} />
                <p className="text-center text-lg font-bold text-primary-600 mt-2">Total: ${totalCost.toLocaleString()}/year</p>
              </div>

              <div className="text-center">
                <button onClick={() => setStep(2)} className="btn-primary px-8 py-3 text-lg flex items-center gap-2 mx-auto">Continue <ArrowRight size={18} /></button>
              </div>
            </motion.div>
          )}

          {/* Step 2: District Info */}
          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="max-w-2xl mx-auto space-y-6">
              <div><h1 className="text-3xl font-bold text-gray-900">District Information</h1>
                <p className="text-gray-500 mt-2">Tell us about your school district</p></div>
              <div className="card space-y-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">District Name *</label>
                  <input value={form.districtName} onChange={e => setForm(f => ({ ...f, districtName: e.target.value }))} className="input-field" placeholder="e.g., Springfield School District" /></div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Contact Email *</label>
                    <input type="email" value={form.contactEmail} onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))} className="input-field" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input value={form.contactPhone} onChange={e => setForm(f => ({ ...f, contactPhone: e.target.value }))} className="input-field" /></div>
                </div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="input-field" /></div>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} className="input-field" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                    <input value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} className="input-field" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
                    <input value={form.zipCode} onChange={e => setForm(f => ({ ...f, zipCode: e.target.value }))} className="input-field" /></div>
                </div>
              </div>
              <div className="flex justify-between">
                <button onClick={() => setStep(1)} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"><ArrowLeft size={14} /> Back</button>
                <button onClick={() => { if (!form.districtName || !form.contactEmail) { toast.error('District name and email required'); return; } setStep(3); }}
                  className="btn-primary flex items-center gap-2">Continue <ArrowRight size={16} /></button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Admin Account */}
          {step === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="max-w-2xl mx-auto space-y-6">
              <div><h1 className="text-3xl font-bold text-gray-900">Administrator Account</h1>
                <p className="text-gray-500 mt-2">Create the superintendent account for your district</p></div>
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm">
                <p className="font-medium text-blue-800">This will be the superintendent account</p>
                <p className="text-blue-600 mt-1">This account has full access to manage schools, students, teachers, classes, and billing. You can create additional admin accounts with different access levels later.</p>
              </div>
              <div className="card space-y-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input value={form.adminName} onChange={e => setForm(f => ({ ...f, adminName: e.target.value }))} className="input-field" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input type="email" value={form.adminEmail} onChange={e => setForm(f => ({ ...f, adminEmail: e.target.value }))} className="input-field" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} value={form.adminPassword}
                      onChange={e => setForm(f => ({ ...f, adminPassword: e.target.value }))} className="input-field pr-10" placeholder="Min 8 characters" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
                  <input type="password" value={form.confirmPassword} onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))} className="input-field" /></div>
              </div>
              <div className="flex justify-between">
                <button onClick={() => setStep(2)} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"><ArrowLeft size={14} /> Back</button>
                <button onClick={() => { if (!form.adminName || !form.adminEmail || !form.adminPassword) { toast.error('All fields required'); return; } setStep(4); }}
                  className="btn-primary flex items-center gap-2">Continue <ArrowRight size={16} /></button>
              </div>
            </motion.div>
          )}

          {/* Step 4: Payment */}
          {step === 4 && (
            <motion.div key="s4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="max-w-2xl mx-auto space-y-6">
              <div><h1 className="text-3xl font-bold text-gray-900">Complete Payment</h1>
                <p className="text-gray-500 mt-2">Review your order and complete payment</p></div>

              {/* Order Summary */}
              <div className="card bg-gray-50">
                <h3 className="font-bold text-gray-900 mb-3">Order Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-600">Plan</span><span className="font-medium">{selectedPlan}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">Students</span><span className="font-medium">{studentCount}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">Price per student</span><span className="font-medium">${plan.price}/year</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">District</span><span className="font-medium">{form.districtName}</span></div>
                  <hr />
                  <div className="flex justify-between text-lg"><span className="font-bold text-gray-900">Total</span><span className="font-bold text-primary-600">${totalCost.toLocaleString()}/year</span></div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="card space-y-4">
                <h3 className="font-bold text-gray-900">Payment Method</h3>
                <div className="flex gap-3">
                  {['card', 'purchase_order'].map(m => (
                    <button key={m} onClick={() => setForm(f => ({ ...f, paymentMethod: m }))}
                      className={cn('flex-1 p-3 rounded-xl border-2 text-center text-sm font-medium transition',
                        form.paymentMethod === m ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                      )}>
                      {m === 'card' ? '💳 Credit Card' : '📄 Purchase Order'}
                    </button>
                  ))}
                </div>

                {form.paymentMethod === 'card' && (
                  <div className="space-y-3">
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
                      <input value={form.cardNumber} onChange={e => setForm(f => ({ ...f, cardNumber: e.target.value }))}
                        className="input-field" placeholder="4242 4242 4242 4242" /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">Expiry</label>
                        <input value={form.cardExpiry} onChange={e => setForm(f => ({ ...f, cardExpiry: e.target.value }))} className="input-field" placeholder="MM/YY" /></div>
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">CVC</label>
                        <input value={form.cardCvc} onChange={e => setForm(f => ({ ...f, cardCvc: e.target.value }))} className="input-field" placeholder="123" /></div>
                    </div>
                    <p className="text-xs text-gray-400">Payment is simulated for demo purposes. No real charges will be made.</p>
                  </div>
                )}
              </div>

              <div className="flex justify-between">
                <button onClick={() => setStep(3)} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"><ArrowLeft size={14} /> Back</button>
                <button onClick={handleSubmit} disabled={loading}
                  className={cn('btn-primary px-8 py-3 text-lg flex items-center gap-2', loading && 'opacity-50 cursor-not-allowed')}>
                  {loading ? (<><div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" /> Processing...</>) : (
                    <><CreditCard size={18} /> Pay ${totalCost.toLocaleString()} & Create District</>
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
