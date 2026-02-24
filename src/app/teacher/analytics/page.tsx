'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { BarChart3, Users, AlertTriangle, TrendingUp, Search } from 'lucide-react';

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  async function fetchAnalytics() {
    try {
      const res = await fetch('/api/analytics');
      if (res.ok) setAnalytics(await res.json());
    } catch {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
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

  const summary = analytics?.summary || {};
  const students = (analytics?.students || []).filter((s: any) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BarChart3 className="text-primary-500" />
          Student Analytics
        </h1>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Students', value: summary.totalStudents, icon: <Users className="text-blue-500" />, bg: 'bg-blue-50' },
            { label: 'At Risk', value: summary.atRisk, icon: <AlertTriangle className="text-red-500" />, bg: 'bg-red-50' },
            { label: 'Avg Score', value: `${summary.averageScore}%`, icon: <TrendingUp className="text-green-500" />, bg: 'bg-green-50' },
            { label: 'Pending Review', value: summary.pendingSubmissions, icon: <BarChart3 className="text-amber-500" />, bg: 'bg-amber-50' },
          ].map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="card"
            >
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-3', card.bg)}>
                {card.icon}
              </div>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              <p className="text-xs text-gray-500">{card.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Score Distribution Visual */}
        <div className="card">
          <h3 className="font-bold text-gray-900 mb-4">Score Distribution</h3>
          <div className="flex items-end gap-2 h-32">
            {(() => {
              const ranges = [
                { label: '90-100', min: 90, color: 'bg-green-500' },
                { label: '80-89', min: 80, color: 'bg-blue-500' },
                { label: '70-79', min: 70, color: 'bg-yellow-500' },
                { label: '60-69', min: 60, color: 'bg-orange-500' },
                { label: '<60', min: 0, color: 'bg-red-500' },
              ];

              return ranges.map(range => {
                const count = students.filter((s: any) => {
                  if (s.averageScore === null) return false;
                  if (range.min === 0) return s.averageScore < 60;
                  return s.averageScore >= range.min && s.averageScore < range.min + 10;
                }).length;

                const maxCount = Math.max(students.length, 1);
                const pct = (count / maxCount) * 100;

                return (
                  <div key={range.label} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs font-medium text-gray-700">{count}</span>
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(pct, 4)}%` }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                      className={cn('w-full rounded-t-lg', range.color)}
                    />
                    <span className="text-xs text-gray-400">{range.label}</span>
                  </div>
                );
              });
            })()}
          </div>
        </div>

        {/* Student List */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">All Students</h3>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search students..."
                className="input-field pl-9 w-64"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm" role="table">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-2 font-medium text-gray-500">Student</th>
                  <th className="text-center py-3 px-2 font-medium text-gray-500">Avg Score</th>
                  <th className="text-center py-3 px-2 font-medium text-gray-500">Submissions</th>
                  <th className="text-center py-3 px-2 font-medium text-gray-500">Streak</th>
                  <th className="text-center py-3 px-2 font-medium text-gray-500">Level</th>
                  <th className="text-center py-3 px-2 font-medium text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student: any) => (
                  <tr key={student.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                    <td className="py-3 px-2">
                      <div>
                        <p className="font-medium text-gray-900">{student.name}</p>
                        <p className="text-xs text-gray-400">{student.email}</p>
                      </div>
                    </td>
                    <td className="text-center py-3 px-2">
                      <span className={cn(
                        'font-bold',
                        student.averageScore === null ? 'text-gray-300' :
                        student.averageScore >= 90 ? 'text-green-600' :
                        student.averageScore >= 70 ? 'text-yellow-600' :
                        'text-red-600'
                      )}>
                        {student.averageScore !== null ? `${student.averageScore}%` : '—'}
                      </span>
                    </td>
                    <td className="text-center py-3 px-2 text-gray-700">{student.totalSubmissions}</td>
                    <td className="text-center py-3 px-2">
                      {student.currentStreak > 0 ? (
                        <span className="text-gamify-streak font-medium">{student.currentStreak}🔥</span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="text-center py-3 px-2">
                      <span className="text-gamify-xp font-medium">Lv.{student.level}</span>
                    </td>
                    <td className="text-center py-3 px-2">
                      <span className={cn(
                        'badge',
                        student.riskLevel === 'high' ? 'badge-danger' :
                        student.riskLevel === 'medium' ? 'badge-warning' :
                        student.riskLevel === 'low' ? 'badge-success' :
                        'bg-gray-100 text-gray-500'
                      )}>
                        {student.riskLevel === 'high' ? '⚠️ At Risk' :
                         student.riskLevel === 'medium' ? '⚡ Watch' :
                         student.riskLevel === 'low' ? '✅ On Track' :
                         '❓ New'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
