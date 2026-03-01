'use client';
import { useIsDemo } from '@/lib/hooks';
import { useEffect, useState } from 'react';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  TrendingUp, Brain, Flame, AlertTriangle,
} from 'lucide-react';

export default function GrowthPage() {
  const isDemo = useIsDemo();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemo) {
      setData({
        skills: [
          { skillName: 'Linear Equations', skillCategory: 'Math', masteryLevel: 85, streak: 5, totalAttempts: 20, correctAttempts: 17 },
          { skillName: 'Fractions', skillCategory: 'Math', masteryLevel: 62, streak: 2, totalAttempts: 15, correctAttempts: 9 },
          { skillName: 'Geometry', skillCategory: 'Math', masteryLevel: 78, streak: 3, totalAttempts: 12, correctAttempts: 9 },
          { skillName: 'Photosynthesis', skillCategory: 'Science', masteryLevel: 91, streak: 7, totalAttempts: 18, correctAttempts: 16 },
          { skillName: 'Cell Biology', skillCategory: 'Science', masteryLevel: 73, streak: 4, totalAttempts: 10, correctAttempts: 7 },
          { skillName: 'Essay Writing', skillCategory: 'English', masteryLevel: 68, streak: 1, totalAttempts: 8, correctAttempts: 5 },
          { skillName: 'Grammar', skillCategory: 'English', masteryLevel: 82, streak: 6, totalAttempts: 14, correctAttempts: 11 },
          { skillName: 'Vocabulary', skillCategory: 'English', masteryLevel: 55, streak: 0, totalAttempts: 10, correctAttempts: 5 },
        ],
        overallMastery: 74,
        totalSkills: 8,
        masteredSkills: 3,
        needsWorkSkills: 2,
        dueReviews: 5,
        prediction: { predictedGrade: 'B+', predictedScore: 84.5, confidence: 72 },
        struggle: {
          riskLevel: 'low', isStruggling: false, isBurnedOut: false,
          indicators: [], recommendations: [],
        },
        skillsByCategory: {
          Math: [
            { skillName: 'Linear Equations', masteryLevel: 85 },
            { skillName: 'Fractions', masteryLevel: 62 },
            { skillName: 'Geometry', masteryLevel: 78 },
          ],
          Science: [
            { skillName: 'Photosynthesis', masteryLevel: 91 },
            { skillName: 'Cell Biology', masteryLevel: 73 },
          ],
          English: [
            { skillName: 'Essay Writing', masteryLevel: 68 },
            { skillName: 'Grammar', masteryLevel: 82 },
            { skillName: 'Vocabulary', masteryLevel: 55 },
          ],
        },
      });
      setLoading(false);
      return;
    }
    fetch('/api/skills').then(r => r.ok ? r.json() : null).then(d => { if (d) setData(d); }).catch(() => {}).finally(() => setLoading(false));
  }, [isDemo]);

  if (loading || !data) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" />
        </div>
      </DashboardLayout>
    );
  }

  const getMasteryColor = (level: number) => {
    if (level >= 80) return 'text-green-600 bg-green-100';
    if (level >= 60) return 'text-amber-600 bg-amber-100';
    return 'text-red-600 bg-red-100';
  };
  const getMasteryBar = (level: number) => {
    if (level >= 80) return 'bg-green-500';
    if (level >= 60) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
            <TrendingUp size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Growth Analytics</h1>
            <p className="text-xs text-gray-400">Track your skill mastery, predictions & progress</p>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card text-center">
            <div className="text-3xl font-extrabold text-gray-900">{data.overallMastery}%</div>
            <p className="text-xs text-gray-400 mt-1">Overall Mastery</p>
            <div className="w-full h-2 bg-gray-200 rounded-full mt-2 overflow-hidden">
              <div className={cn('h-full rounded-full', getMasteryBar(data.overallMastery))} style={{ width: `${data.overallMastery}%` }} />
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="card text-center">
            <div className="text-3xl font-extrabold text-primary-600">{data.prediction.predictedGrade}</div>
            <p className="text-xs text-gray-400 mt-1">Predicted Grade</p>
            <p className="text-[10px] text-gray-300 mt-1">{data.prediction.confidence}% confidence</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card text-center">
            <div className="text-3xl font-extrabold text-green-600">{data.masteredSkills}</div>
            <p className="text-xs text-gray-400 mt-1">Mastered Skills</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card text-center">
            <div className="text-3xl font-extrabold text-red-600">{data.needsWorkSkills}</div>
            <p className="text-xs text-gray-400 mt-1">Needs Work</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card text-center">
            <div className="text-3xl font-extrabold text-purple-600">{data.dueReviews}</div>
            <p className="text-xs text-gray-400 mt-1">Due Reviews</p>
          </motion.div>
        </div>

        {/* Risk Alert */}
        {data.struggle.riskLevel !== 'low' && (
          <div className={cn('p-4 rounded-2xl border-2 flex items-start gap-3', data.struggle.riskLevel === 'high' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200')}>
            <AlertTriangle size={20} className={data.struggle.riskLevel === 'high' ? 'text-red-500' : 'text-amber-500'} />
            <div>
              <p className="font-semibold text-gray-900">
                {data.struggle.riskLevel === 'high' ? 'Attention needed' : 'Keep an eye on'}
              </p>
              <ul className="text-sm text-gray-600 mt-1 space-y-0.5">
                {data.struggle.indicators.map((ind: string, i: number) => (
                  <li key={i}>&bull; {ind}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Skill Map by Category */}
        <div className="space-y-6">
          {Object.entries(data.skillsByCategory).map(([category, skills]: [string, any]) => (
            <motion.div key={category} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Brain size={16} className="text-primary-500" />
                {category}
              </h3>
              <div className="space-y-3">
                {skills.map((skill: any) => (
                  <div key={skill.skillName} className="flex items-center gap-3">
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0', getMasteryColor(skill.masteryLevel))}>
                      {Math.round(skill.masteryLevel)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-gray-900">{skill.skillName}</span>
                        <span className="text-xs text-gray-400">
                          {skill.masteryLevel >= 80 ? 'Mastered' : skill.masteryLevel >= 60 ? 'Progressing' : 'Needs work'}
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${skill.masteryLevel}%` }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                          className={cn('h-full rounded-full', getMasteryBar(skill.masteryLevel))}
                        />
                      </div>
                    </div>
                    {skill.streak > 0 && (
                      <div className="flex items-center gap-0.5 text-orange-500 text-xs font-bold">
                        <Flame size={14} /> {skill.streak}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
