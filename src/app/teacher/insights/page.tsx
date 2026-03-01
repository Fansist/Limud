'use client';
import { useIsDemo } from '@/lib/hooks';
import { useEffect, useState } from 'react';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Brain, AlertTriangle, TrendingUp, Target, Users, BarChart3, Flame } from 'lucide-react';

export default function InsightsPage() {
  const isDemo = useIsDemo();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemo) {
      setData({
        heatmap: [
          { skill: 'Fractions', count: 15, studentCount: 6, severity: 'high', types: ['sign_error', 'concept_confusion'] },
          { skill: 'Linear Equations', count: 10, studentCount: 4, severity: 'medium', types: ['formula_misapplication'] },
          { skill: 'Photosynthesis', count: 8, studentCount: 3, severity: 'medium', types: ['concept_confusion'] },
          { skill: 'Essay Structure', count: 6, studentCount: 5, severity: 'medium', types: ['organization'] },
          { skill: 'Grammar', count: 4, studentCount: 2, severity: 'low', types: ['spelling'] },
          { skill: 'Vocabulary', count: 3, studentCount: 2, severity: 'low', types: [] },
        ],
        skillGaps: [
          { skill: 'Fractions', avgMastery: 42, studentCount: 8, belowThreshold: 5, pctStruggling: 63 },
          { skill: 'Vocabulary', avgMastery: 48, studentCount: 7, belowThreshold: 4, pctStruggling: 57 },
          { skill: 'Essay Writing', avgMastery: 55, studentCount: 6, belowThreshold: 3, pctStruggling: 50 },
          { skill: 'Cell Biology', avgMastery: 62, studentCount: 8, belowThreshold: 2, pctStruggling: 25 },
          { skill: 'Geometry', avgMastery: 68, studentCount: 8, belowThreshold: 1, pctStruggling: 13 },
        ],
        studentInsights: [
          { id: 's1', name: 'Noah Davis', course: 'Biology 101', averageScore: 58, currentStreak: 0, level: 3, prediction: { predictedGrade: 'D+', predictedScore: 65, confidence: 60 }, riskLevel: 'high', indicators: ['Inactive for 5 days', 'Average below 60%'] },
          { id: 's2', name: 'Mason Wilson', course: 'Biology 101', averageScore: 68, currentStreak: 1, level: 4, prediction: { predictedGrade: 'C', predictedScore: 72, confidence: 55 }, riskLevel: 'medium', indicators: ['Declining trend'] },
          { id: 's3', name: 'Emma Johnson', course: 'Biology 101', averageScore: 86, currentStreak: 7, level: 8, prediction: { predictedGrade: 'B+', predictedScore: 87, confidence: 72 }, riskLevel: 'low', indicators: [] },
          { id: 's4', name: 'Sophia Brown', course: 'Biology 101', averageScore: 95, currentStreak: 21, level: 14, prediction: { predictedGrade: 'A', predictedScore: 96, confidence: 85 }, riskLevel: 'low', indicators: [] },
          { id: 's5', name: 'Alex Rivera', course: 'Biology 101', averageScore: 91, currentStreak: 14, level: 12, prediction: { predictedGrade: 'A-', predictedScore: 92, confidence: 78 }, riskLevel: 'low', indicators: [] },
        ],
        summary: { totalStudents: 8, totalMistakes: 46, atRisk: 1, avgScore: 79 },
      });
      setLoading(false);
      return;
    }
    fetch('/api/teacher/insights').then(r => r.ok ? r.json() : null).then(d => { if (d) setData(d); }).catch(() => {}).finally(() => setLoading(false));
  }, [isDemo]);

  if (loading || !data) {
    return <DashboardLayout><div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" /></div></DashboardLayout>;
  }

  const severityColors: Record<string, string> = { high: 'bg-red-500', medium: 'bg-amber-500', low: 'bg-green-500' };
  const riskBadge: Record<string, string> = { high: 'bg-red-100 text-red-700', medium: 'bg-amber-100 text-amber-700', low: 'bg-green-100 text-green-700' };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Brain size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Insights & Misconception Heatmap</h1>
            <p className="text-xs text-gray-400">AI-powered misconception detection & student performance prediction</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total Students', value: data.summary.totalStudents, icon: <Users size={18} />, color: 'bg-blue-50 text-blue-600' },
            { label: 'At Risk', value: data.summary.atRisk, icon: <AlertTriangle size={18} />, color: 'bg-red-50 text-red-600' },
            { label: 'Avg Score', value: `${data.summary.avgScore}%`, icon: <BarChart3 size={18} />, color: 'bg-green-50 text-green-600' },
            { label: 'Misconceptions', value: data.summary.totalMistakes, icon: <Brain size={18} />, color: 'bg-purple-50 text-purple-600' },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className={cn('card flex items-center gap-3')}>
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', s.color)}>{s.icon}</div>
              <div>
                <p className="text-xl font-bold text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-400">{s.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Misconception Heatmap */}
          <div className="card">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Brain size={16} className="text-purple-500" /> Misconception Heatmap
            </h3>
            <div className="space-y-3">
              {data.heatmap.map((item: any) => (
                <div key={item.skill} className="flex items-center gap-3">
                  <div className={cn('w-3 h-3 rounded-full flex-shrink-0', severityColors[item.severity])} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-gray-900">{item.skill}</span>
                      <span className="text-xs text-gray-400">{item.count} errors by {item.studentCount} students</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={cn('h-full rounded-full', severityColors[item.severity])} style={{ width: `${Math.min(100, item.count * 7)}%`, opacity: 0.7 }} />
                    </div>
                    {item.types.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {item.types.map((t: string) => (
                          <span key={t} className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{t.replace('_', ' ')}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Skill Gaps */}
          <div className="card">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Target size={16} className="text-red-500" /> Skill Gaps (Class-wide)
            </h3>
            <div className="space-y-3">
              {data.skillGaps.map((gap: any) => (
                <div key={gap.skill} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0', gap.avgMastery < 50 ? 'bg-red-100 text-red-600' : gap.avgMastery < 70 ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600')}>
                    {gap.avgMastery}%
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">{gap.skill}</p>
                    <p className="text-xs text-gray-400">{gap.pctStruggling}% of class struggling &middot; {gap.studentCount} students</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Student Performance Predictions */}
        <div className="card">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-primary-500" /> Student Performance Predictions
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                  <th className="pb-3 font-medium">Student</th>
                  <th className="pb-3 font-medium">Current Avg</th>
                  <th className="pb-3 font-medium">Predicted</th>
                  <th className="pb-3 font-medium">Streak</th>
                  <th className="pb-3 font-medium">Level</th>
                  <th className="pb-3 font-medium">Risk</th>
                </tr>
              </thead>
              <tbody>
                {data.studentInsights.map((s: any) => (
                  <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                    <td className="py-3">
                      <p className="font-semibold text-gray-900">{s.name}</p>
                      <p className="text-xs text-gray-400">{s.course}</p>
                    </td>
                    <td className="py-3">
                      <span className={cn('text-sm font-bold', s.averageScore >= 80 ? 'text-green-600' : s.averageScore >= 60 ? 'text-amber-600' : 'text-red-600')}>{s.averageScore}%</span>
                    </td>
                    <td className="py-3">
                      <span className="text-sm font-bold text-primary-600">{s.prediction.predictedGrade}</span>
                      <span className="text-xs text-gray-400 ml-1">({s.prediction.predictedScore}%)</span>
                    </td>
                    <td className="py-3">
                      {s.currentStreak > 0 ? (
                        <span className="flex items-center gap-0.5 text-orange-500 text-sm font-bold"><Flame size={14} />{s.currentStreak}</span>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td className="py-3 text-sm font-medium text-gray-700">Lv.{s.level}</td>
                    <td className="py-3">
                      <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', riskBadge[s.riskLevel] || 'bg-gray-100 text-gray-600')}>{s.riskLevel}</span>
                      {s.indicators.length > 0 && (
                        <p className="text-[10px] text-gray-400 mt-0.5">{s.indicators[0]}</p>
                      )}
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
