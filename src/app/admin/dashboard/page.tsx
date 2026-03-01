'use client';
import { useIsDemo } from '@/lib/hooks';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion } from 'framer-motion';
import { cn, formatDate } from '@/lib/utils';
import { DEMO_DISTRICT } from '@/lib/demo-data';
import toast from 'react-hot-toast';
import Link from 'next/link';
import {
  Building2, Users, GraduationCap, DollarSign, Upload, ArrowRight, Shield, TrendingUp, Calendar, CreditCard,
} from 'lucide-react';

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const isDemo = useIsDemo();
  const [districts, setDistricts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemo) {
      setDistricts([DEMO_DISTRICT]);
      setLoading(false);
      return;
    }
    if (status === 'authenticated') {
      if ((session?.user as any)?.role !== 'ADMIN') redirect('/');
      fetchDistricts();
    }
  }, [status, isDemo]);

  async function fetchDistricts() {
    try {
      const res = await fetch('/api/admin/districts');
      if (res.ok) {
        const data = await res.json();
        setDistricts(data.districts || []);
      }
    } catch {
      toast.error('Failed to load districts');
    } finally {
      setLoading(false);
    }
  }

  if (status === 'loading' || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" />
            <p className="text-sm text-gray-400">Loading district data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const district = districts[0];
  const districtName = (session?.user as any)?.districtName || 'District';

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
              District Administration
            </h1>
            <p className="text-gray-500 mt-1">{districtName} Management Console</p>
          </div>
        </motion.div>

        {district && (
          <>
            {/* Subscription Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-accent-600 rounded-3xl p-6 lg:p-8 text-white overflow-hidden"
            >
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVHJhbnNmb3JtPSJyb3RhdGUoNDUpIj48cGF0aCBkPSJNLTEwIDMwaDYwdjJILTEweiIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNhKSIvPjwvc3ZnPg==')] opacity-50" />
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4 blur-2xl" />
              
              <div className="relative">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center">
                      <Building2 size={24} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">{district.name}</h2>
                      <p className="text-white/60 text-sm">ID: {district.subdomain}</p>
                    </div>
                  </div>
                  <span className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold self-start',
                    district.subscriptionStatus === 'ACTIVE' ? 'bg-green-400/20 text-green-200' :
                    district.subscriptionStatus === 'TRIAL' ? 'bg-yellow-400/20 text-yellow-200' :
                    'bg-red-400/20 text-red-200'
                  )}>
                    <div className={cn('w-2 h-2 rounded-full', district.subscriptionStatus === 'ACTIVE' ? 'bg-green-400' : 'bg-yellow-400')} />
                    {district.subscriptionStatus}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
                  {[
                    { icon: <CreditCard size={18} />, value: `$${district.pricePerYear.toLocaleString()}`, label: 'Annual Cost' },
                    { icon: <Users size={18} />, value: district.studentCount, label: `Students (max ${district.maxStudents})` },
                    { icon: <GraduationCap size={18} />, value: district.teacherCount, label: `Teachers (max ${district.maxTeachers})` },
                    { icon: <DollarSign size={18} />, value: `$${district.costPerStudent > 0 ? district.costPerStudent.toFixed(2) : '—'}`, label: 'Per Student / Year' },
                  ].map((stat, i) => (
                    <div key={stat.label} className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2 text-white/60">{stat.icon}</div>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-xs text-white/50 mt-0.5">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {district.subscriptionEnd && (
                  <div className="flex items-center gap-2 mt-4 text-white/40 text-sm">
                    <Calendar size={14} />
                    Subscription expires: {formatDate(district.subscriptionEnd)}
                  </div>
                )}
              </div>
            </motion.div>

            {/* Quick Actions */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Link
                  href="/admin/students"
                  className="card hover:shadow-lg transition-all flex items-center gap-4 group h-full"
                >
                  <div className="p-3 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition">
                    <Users className="text-blue-600" size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">Student Accounts</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Create students with auto parent accounts</p>
                  </div>
                  <ArrowRight size={16} className="text-gray-300 group-hover:text-gray-500 group-hover:translate-x-1 transition-all" />
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.22 }}
              >
                <Link
                  href="/admin/schools"
                  className="card hover:shadow-lg transition-all flex items-center gap-4 group h-full"
                >
                  <div className="p-3 bg-emerald-100 rounded-xl group-hover:bg-emerald-200 transition">
                    <Building2 className="text-emerald-600" size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">Schools</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Manage schools & transfer users</p>
                  </div>
                  <ArrowRight size={16} className="text-gray-300 group-hover:text-gray-500 group-hover:translate-x-1 transition-all" />
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.24 }}
              >
                <Link
                  href="/admin/classrooms"
                  className="card hover:shadow-lg transition-all flex items-center gap-4 group h-full"
                >
                  <div className="p-3 bg-violet-100 rounded-xl group-hover:bg-violet-200 transition">
                    <GraduationCap className="text-violet-600" size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">Classrooms</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Create classes & control game access</p>
                  </div>
                  <ArrowRight size={16} className="text-gray-300 group-hover:text-gray-500 group-hover:translate-x-1 transition-all" />
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.26 }}
              >
                <Link
                  href="/admin/provision"
                  className="card hover:shadow-lg transition-all flex items-center gap-4 group h-full"
                >
                  <div className="p-3 bg-green-100 rounded-xl group-hover:bg-green-200 transition">
                    <Upload className="text-green-600" size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">Bulk Provisioning</h3>
                    <p className="text-xs text-gray-400 mt-0.5">CSV upload for student & teacher accounts</p>
                  </div>
                  <ArrowRight size={16} className="text-gray-300 group-hover:text-gray-500 group-hover:translate-x-1 transition-all" />
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.28 }}
              >
                <Link
                  href="/admin/payments"
                  className="card hover:shadow-lg transition-all flex items-center gap-4 group h-full"
                >
                  <div className="p-3 bg-amber-100 rounded-xl group-hover:bg-amber-200 transition">
                    <CreditCard className="text-amber-600" size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">Billing & Payments</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Manage subscription & payment history</p>
                  </div>
                  <ArrowRight size={16} className="text-gray-300 group-hover:text-gray-500 group-hover:translate-x-1 transition-all" />
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="card flex items-center gap-4 h-full">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <Shield className="text-blue-600" size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">Security & Compliance</h3>
                    <p className="text-xs text-gray-400 mt-0.5">FERPA, COPPA, WCAG AA</p>
                  </div>
                  <span className="badge badge-success text-[10px]">Active</span>
                </div>
              </motion.div>
            </div>

            {/* Capacity Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="card"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center">
                    <TrendingUp size={16} className="text-primary-500" />
                  </div>
                  Capacity Overview
                </h3>
              </div>
              <div className="space-y-6">
                {[
                  {
                    label: 'Students',
                    current: district.studentCount,
                    max: district.maxStudents,
                    color: 'bg-primary-500',
                    icon: <Users size={16} />,
                  },
                  {
                    label: 'Teachers',
                    current: district.teacherCount,
                    max: district.maxTeachers,
                    color: 'bg-green-500',
                    icon: <GraduationCap size={16} />,
                  },
                ].map(item => {
                  const pct = Math.round((item.current / item.max) * 100);
                  return (
                    <div key={item.label}>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <div className="flex items-center gap-2 text-gray-600 font-medium">
                          {item.icon}
                          {item.label}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-gray-900">{item.current} / {item.max}</span>
                          <span className={cn(
                            'text-xs font-medium px-2 py-0.5 rounded-full',
                            pct >= 90 ? 'bg-red-100 text-red-600' : pct >= 70 ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'
                          )}>
                            {pct}%
                          </span>
                        </div>
                      </div>
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                          className={cn('h-full rounded-full', item.color)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
