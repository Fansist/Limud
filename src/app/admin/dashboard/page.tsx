'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion } from 'framer-motion';
import { cn, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import Link from 'next/link';
import {
  Building2, Users, GraduationCap, DollarSign,
  Upload, ArrowRight, Shield, Settings,
} from 'lucide-react';

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const [districts, setDistricts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'authenticated') {
      if ((session?.user as any)?.role !== 'ADMIN') redirect('/');
      fetchDistricts();
    }
  }, [status]);

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
          <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" />
        </div>
      </DashboardLayout>
    );
  }

  const district = districts[0];

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="text-primary-500" />
            District Administration
          </h1>
          <p className="text-gray-500 mt-1">
            {(session?.user as any)?.districtName || 'District'} Management Console
          </p>
        </motion.div>

        {district && (
          <>
            {/* Subscription Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-3xl p-6 lg:p-8 text-white"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold">{district.name}</h2>
                  <p className="text-white/70 mt-1">Subscription: {district.subdomain}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    'badge text-sm',
                    district.subscriptionStatus === 'ACTIVE' ? 'bg-green-400/20 text-green-200' :
                    district.subscriptionStatus === 'TRIAL' ? 'bg-yellow-400/20 text-yellow-200' :
                    'bg-red-400/20 text-red-200'
                  )}>
                    {district.subscriptionStatus}
                  </span>
                </div>
              </div>

              <div className="grid sm:grid-cols-4 gap-6 mt-6">
                <div>
                  <p className="text-3xl font-bold">${district.pricePerYear.toLocaleString()}</p>
                  <p className="text-xs text-white/60">Per Year</p>
                </div>
                <div>
                  <p className="text-3xl font-bold">{district.studentCount}</p>
                  <p className="text-xs text-white/60">Students (max {district.maxStudents})</p>
                </div>
                <div>
                  <p className="text-3xl font-bold">{district.teacherCount}</p>
                  <p className="text-xs text-white/60">Teachers (max {district.maxTeachers})</p>
                </div>
                <div>
                  <p className="text-3xl font-bold">
                    ${district.costPerStudent > 0 ? district.costPerStudent.toFixed(2) : '—'}
                  </p>
                  <p className="text-xs text-white/60">Per Student / Year</p>
                </div>
              </div>

              {district.subscriptionEnd && (
                <p className="text-xs text-white/50 mt-4">
                  Subscription expires: {formatDate(district.subscriptionEnd)}
                </p>
              )}
            </motion.div>

            {/* Quick Actions */}
            <div className="grid sm:grid-cols-2 gap-4">
              <Link
                href="/admin/provision"
                className="card hover:shadow-lg transition-all flex items-center gap-4 group"
              >
                <div className="p-3 bg-green-100 rounded-xl group-hover:bg-green-200 transition">
                  <Upload className="text-green-600" size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">Bulk Provisioning</h3>
                  <p className="text-xs text-gray-400">CSV upload to create student & teacher accounts</p>
                </div>
                <ArrowRight size={16} className="text-gray-300 group-hover:text-gray-500 transition" />
              </Link>

              <div className="card flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-xl">
                  <Settings className="text-purple-600" size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">LMS Integrations</h3>
                  <p className="text-xs text-gray-400">Google Classroom & Canvas sync ready</p>
                </div>
                <span className="badge badge-info">Available</span>
              </div>
            </div>

            {/* Usage Chart Placeholder */}
            <div className="card">
              <h3 className="font-bold text-gray-900 mb-4">Capacity Overview</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Students</span>
                    <span className="font-medium">
                      {district.studentCount} / {district.maxStudents}
                    </span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(district.studentCount / district.maxStudents) * 100}%` }}
                      className="h-full bg-primary-500 rounded-full"
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Teachers</span>
                    <span className="font-medium">
                      {district.teacherCount} / {district.maxTeachers}
                    </span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(district.teacherCount / district.maxTeachers) * 100}%` }}
                      className="h-full bg-green-500 rounded-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
