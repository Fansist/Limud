'use client';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { CreditCard, DollarSign, Calendar, CheckCircle2, ArrowUpRight } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';

const DEMO_PAYMENTS = [
  { id: 'p1', amount: 2400, status: 'COMPLETED', description: 'STANDARD plan - 300 students', tier: 'STANDARD', paidAt: new Date().toISOString(), createdAt: new Date().toISOString() },
];

export default function AdminPaymentsPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const isDemo = searchParams.get('demo') === 'true' || (typeof window !== 'undefined' && localStorage.getItem('limud-demo-mode') === 'true');
  const [payments, setPayments] = useState<any[]>([]);
  const [district, setDistrict] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchPayments(); }, [isDemo]);

  async function fetchPayments() {
    if (isDemo) {
      setPayments(DEMO_PAYMENTS);
      setDistrict({ subscriptionTier: 'STANDARD', subscriptionStatus: 'ACTIVE', subscriptionEnd: new Date(Date.now() + 200 * 24 * 3600 * 1000).toISOString(), pricePerYear: 2400 });
      setLoading(false); return;
    }
    try {
      const res = await fetch('/api/payments');
      if (res.ok) { const data = await res.json(); setPayments(data.payments || []); setDistrict(data.district); }
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }

  async function handleUpgrade(tier: string) {
    if (isDemo) { toast.success(`Upgraded to ${tier} (Demo)`); return; }
    try {
      const res = await fetch('/api/payments', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'upgrade', tier, studentCount: 500 }),
      });
      if (res.ok) { toast.success('Plan upgraded!'); fetchPayments(); }
    } catch { toast.error('Upgrade failed'); }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-3"><CreditCard size={28} /> Billing & Payments</h1>
        <p className="text-gray-500 mt-1">Manage your district subscription and payment history</p>
      </motion.div>

      {/* Current Plan */}
      {district && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-primary-600 to-accent-600 rounded-3xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-sm">Current Plan</p>
              <h2 className="text-3xl font-bold">{district.subscriptionTier}</h2>
              <p className="text-white/80 mt-1">${district.pricePerYear?.toLocaleString()}/year</p>
            </div>
            <div className="text-right">
              <span className={cn('px-3 py-1 rounded-full text-sm font-medium',
                district.subscriptionStatus === 'ACTIVE' ? 'bg-green-400/20 text-green-200' : 'bg-yellow-400/20 text-yellow-200'
              )}>{district.subscriptionStatus}</span>
              {district.subscriptionEnd && (
                <p className="text-white/50 text-xs mt-2 flex items-center gap-1 justify-end"><Calendar size={12} /> Renews {formatDate(district.subscriptionEnd)}</p>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Upgrade Options */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { tier: 'STARTER', price: 5, students: 100, color: 'from-blue-500 to-cyan-500' },
          { tier: 'STANDARD', price: 8, students: 500, color: 'from-emerald-500 to-teal-500' },
          { tier: 'PREMIUM', price: 12, students: 2000, color: 'from-purple-500 to-pink-500' },
          { tier: 'ENTERPRISE', price: 15, students: 10000, color: 'from-amber-500 to-red-500' },
        ].map((plan) => (
          <div key={plan.tier} className={cn('card border-2 transition-all', district?.subscriptionTier === plan.tier ? 'border-primary-500 ring-2 ring-primary-200' : 'border-transparent hover:border-gray-200')}>
            <p className="text-sm font-bold text-gray-900">{plan.tier}</p>
            <p className="text-2xl font-bold mt-1">${plan.price}<span className="text-sm text-gray-400">/student/yr</span></p>
            <p className="text-xs text-gray-500 mt-1">Up to {plan.students.toLocaleString()} students</p>
            {district?.subscriptionTier === plan.tier ? (
              <div className="flex items-center gap-1 text-primary-600 text-sm mt-3"><CheckCircle2 size={14} /> Current</div>
            ) : (
              <button onClick={() => handleUpgrade(plan.tier)} className="text-sm text-primary-600 font-medium mt-3 flex items-center gap-1 hover:underline">
                Upgrade <ArrowUpRight size={12} />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Payment History */}
      <div className="card">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><DollarSign size={18} /> Payment History</h3>
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
      </div>
    </div>
  );
}
