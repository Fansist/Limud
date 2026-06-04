'use client';
import { useIsDemo } from '@/lib/hooks';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { CreditCard, DollarSign, Calendar, CheckCircle2, ArrowUpRight, Zap, Star, Crown, Shield, Users, Building2, TrendingUp, Info, Mail } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { DEMO_DISTRICT } from '@/lib/demo-data';

const DEMO_PAYMENTS = [
  { id: 'p1', amount: 2400, status: 'COMPLETED', description: 'STANDARD plan - 300 students', tier: 'STANDARD', paidAt: new Date().toISOString(), createdAt: new Date().toISOString() },
  { id: 'p2', amount: 300, status: 'COMPLETED', description: 'Initial STARTER plan - 100 students', tier: 'STARTER', paidAt: new Date(Date.now() - 180 * 86400000).toISOString(), createdAt: new Date(Date.now() - 180 * 86400000).toISOString() },
];

// v17.6 — These prices MUST stay in sync with TIER_PRICES in
// src/app/api/payments/route.ts (the canonical-price gate). The backend
// rejects ADMIN upgrade/renew requests whose computed amount doesn't match
// the canonical price for the requested tier and emits a
// PRIVILEGE_ESCALATION audit log. Previously this UI advertised
// non-canonical numbers (STARTER $5, ENTERPRISE $15) which guaranteed every
// ADMIN upgrade attempt 403'd. ENTERPRISE has no canonical price and always
// requires OWNER, so it is intentionally NOT in this list — it's surfaced
// as a contact-sales card below.
type AdminPlan = {
  tier: 'STARTER' | 'GROWTH' | 'STANDARD' | 'PREMIUM';
  price: number;
  students: number;
  icon: React.ReactNode;
  color: string;
  label: string;
  popular?: boolean;
};

const PLANS: AdminPlan[] = [
  { tier: 'STARTER', price: 3, students: 50, icon: <Zap size={18} />, color: 'from-blue-500 to-cyan-500', label: 'Small Schools' },
  { tier: 'GROWTH', price: 5, students: 200, icon: <TrendingUp size={18} />, color: 'from-indigo-500 to-blue-500', label: 'Growing Schools' },
  { tier: 'STANDARD', price: 8, students: 500, icon: <Star size={18} />, color: 'from-emerald-500 to-teal-500', label: 'Districts', popular: true },
  { tier: 'PREMIUM', price: 12, students: 2000, icon: <Crown size={18} />, color: 'from-purple-500 to-pink-500', label: 'Large Districts' },
];

export default function AdminPaymentsPage() {
  const { data: session } = useSession();
  const isDemo = useIsDemo();
  const [payments, setPayments] = useState<any[]>([]);
  const [district, setDistrict] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [showStudentInput, setShowStudentInput] = useState<string | null>(null);
  const [studentCount, setStudentCount] = useState(100);

  useEffect(() => { fetchPayments(); }, [isDemo]);

  async function fetchPayments() {
    if (isDemo) {
      setPayments(DEMO_PAYMENTS);
      setDistrict({
        name: 'Demo School District',
        subscriptionTier: 'STANDARD',
        subscriptionStatus: 'ACTIVE',
        subscriptionEnd: new Date(Date.now() + 200 * 24 * 3600 * 1000).toISOString(),
        pricePerYear: 2400,
        maxStudents: 500,
        maxTeachers: 50,
      });
      setLoading(false);
      return;
    }
    try {
      const res = await fetch('/api/payments');
      if (!res.ok) {
        toast.error('Failed to load payments');
        return;
      }
      const data = await res.json();
      setPayments(data.payments || []);
      setDistrict(data.district);
    } catch { toast.error('Failed to load billing data'); }
    finally { setLoading(false); }
  }

  async function handleUpgrade(tier: string) {
    if (isDemo) {
      toast.success(`Upgraded to ${tier} plan! (Demo mode)`);
      return;
    }

    setUpgrading(tier);
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'upgrade', tier, studentCount }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Successfully upgraded to ${tier} plan!`);
        setShowStudentInput(null);
        fetchPayments();
      } else {
        toast.error(data.error || 'Upgrade failed');
      }
    } catch { toast.error('Upgrade failed. Please try again.'); }
    finally { setUpgrading(null); }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <CreditCard size={28} /> Billing & Payments
          </h1>
          <p className="text-gray-500 mt-1">Manage your district subscription and payment history</p>
        </motion.div>

        {/* v17.1: Honest pricing scope banner. v17 locked custom pricePerYear
            edits to OWNER, but this page still upgrades to canonical tier
            prices. Be explicit so admins know what this UI can and can't do. */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3"
        >
          <Info size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-900">
            This page can upgrade your district to a canonical tier price
            (Starter $3/student/yr, Growth $5, Standard $8, Premium $12).
            Enterprise and any other custom rate is OWNER-only — contact us
            if you need a different price.
          </p>
        </motion.div>

        {/* Current Plan */}
        {district && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-gradient-to-r from-primary-600 to-accent-600 rounded-3xl p-6 text-white">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-white/60 text-sm">Current Plan</p>
                <h2 className="text-3xl font-bold">{district.subscriptionTier}</h2>
                <p className="text-white/80 mt-1">${district.pricePerYear?.toLocaleString()}/year</p>
                {district.name && (
                  <p className="text-white/50 text-sm mt-1 flex items-center gap-1">
                    <Building2 size={12} /> {district.name}
                  </p>
                )}
              </div>
              <div className="text-left sm:text-right">
                <span className={cn('px-3 py-1 rounded-full text-sm font-medium',
                  district.subscriptionStatus === 'ACTIVE' ? 'bg-green-400/20 text-green-200' :
                  district.subscriptionStatus === 'TRIAL' ? 'bg-yellow-400/20 text-yellow-200' :
                  'bg-red-400/20 text-red-200'
                )}>{district.subscriptionStatus}</span>
                {district.subscriptionEnd && (
                  <p className="text-white/50 text-xs mt-2 flex items-center gap-1 justify-end">
                    <Calendar size={12} /> Renews {formatDate(district.subscriptionEnd)}
                  </p>
                )}
                <div className="flex gap-4 mt-2 text-white/70 text-xs">
                  {district.maxStudents && <span className="flex items-center gap-1"><Users size={10} /> {district.maxStudents} students</span>}
                  {district.maxTeachers && <span className="flex items-center gap-1"><Users size={10} /> {district.maxTeachers} teachers</span>}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Upgrade Options */}
        <div>
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp size={18} /> Available Plans
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PLANS.map((plan) => {
              const isCurrent = district?.subscriptionTier === plan.tier;
              return (
                <motion.div
                  key={plan.tier}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    'card border-2 transition-all relative',
                    isCurrent ? 'border-primary-500 ring-2 ring-primary-200' : 'border-transparent hover:border-gray-200'
                  )}
                >
                  {plan.popular && !isCurrent && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-primary-600 text-white text-[10px] px-3 py-0.5 rounded-full font-medium">
                      Most Popular
                    </div>
                  )}
                  {isCurrent && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-primary-600 text-white text-[10px] px-3 py-0.5 rounded-full font-medium flex items-center gap-1">
                      <CheckCircle2 size={10} /> Current plan
                    </div>
                  )}
                  <div className={cn('w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center text-white mb-2', plan.color)}>
                    {plan.icon}
                  </div>
                  <p className="text-sm font-bold text-gray-900">{plan.tier}</p>
                  <p className="text-xs text-gray-500">{plan.label}</p>
                  <p className="text-2xl font-bold mt-2">${plan.price}<span className="text-xs text-gray-400 font-normal">/student/yr</span></p>
                  <p className="text-xs text-gray-400">Up to {plan.students.toLocaleString()} students</p>

                  {isCurrent ? (
                    <div className="flex items-center gap-1 text-primary-600 text-sm mt-3 font-medium">
                      <CheckCircle2 size={14} /> Current Plan
                    </div>
                  ) : showStudentInput === plan.tier ? (
                    <div className="mt-3 space-y-2">
                      <input
                        type="number"
                        value={studentCount}
                        onChange={e => setStudentCount(Math.max(1, parseInt(e.target.value) || 1))}
                        className="input-field text-center text-sm"
                        placeholder="# students"
                        min={1}
                      />
                      <p className="text-xs text-center text-primary-600 font-bold">
                        ${(plan.price * studentCount).toLocaleString()}/year
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowStudentInput(null)}
                          className="flex-1 text-xs text-gray-500 py-1.5 rounded-lg border border-gray-200"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleUpgrade(plan.tier)}
                          disabled={upgrading === plan.tier}
                          className="flex-1 text-xs bg-primary-600 text-white py-1.5 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50"
                        >
                          {upgrading === plan.tier ? 'Processing...' : 'Confirm'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setStudentCount(plan.students); setShowStudentInput(plan.tier); }}
                      className="text-sm text-primary-600 font-medium mt-3 flex items-center gap-1 hover:underline"
                    >
                      {district?.subscriptionTier && PLANS.findIndex(p => p.tier === district.subscriptionTier) < PLANS.findIndex(p => p.tier === plan.tier)
                        ? 'Upgrade' : 'Switch'} <ArrowUpRight size={12} />
                    </button>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* v17.6 — ENTERPRISE is intentionally not a clickable upgrade
              tile. It has no canonical price (canonicalAmount returns null),
              so ADMIN attempts always 403 with a PRIVILEGE_ESCALATION audit
              log. Surface it as a contact-sales card instead. */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="card border-2 border-transparent hover:border-gray-200 transition-all mt-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-red-500 flex items-center justify-center text-white flex-shrink-0">
                <Shield size={18} />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">ENTERPRISE</p>
                <p className="text-xs text-gray-500">States &amp; mega-districts — unlimited students &amp; schools</p>
                <p className="text-xs text-gray-400 mt-1">
                  Contact us for custom pricing. Negotiated rates require an OWNER on our side, so this can&apos;t be self-served from this page.
                </p>
              </div>
            </div>
            <a
              href="mailto:sales@limud.co?subject=Enterprise%20pricing%20inquiry"
              className="text-sm bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 inline-flex items-center gap-1.5 flex-shrink-0"
            >
              <Mail size={14} /> Contact sales
            </a>
          </motion.div>

          <p className="text-xs text-gray-500 mt-3">
            Custom pricing requires OWNER role. Contact{' '}
            <a href="mailto:sales@limud.co" className="text-primary-600 hover:underline">sales@limud.co</a>
            {' '}for non-canonical rates.
          </p>
        </div>

        {/* Payment History */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <DollarSign size={18} /> Payment History
          </h3>
          {payments.length > 0 ? (
            <div className="space-y-2">
              {payments.map(p => (
                <div key={p.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="font-medium text-gray-900">{p.description}</p>
                    <p className="text-xs text-gray-500">{formatDate(p.paidAt || p.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">${p.amount?.toLocaleString()}</p>
                    <span className={cn('text-xs px-2 py-0.5 rounded-full',
                      p.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    )}>{p.status}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No payments yet</p>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
