'use client';
import { useIsDemo } from '@/lib/hooks';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import {
  Settings, Building2, Shield, Calendar, Palette, Bell, Globe,
  Lock, Users, BookOpen, Save, RotateCcw, Eye, CheckCircle2,
  Clock, Gamepad2, Brain, Mail, AlertTriangle, Zap, Target,
  ToggleLeft, ToggleRight,
} from 'lucide-react';

const DEMO_SETTINGS = {
  district: {
    name: 'Meadowbrook School District',
    subdomain: 'meadowbrook',
    contactEmail: 'admin@meadowbrook.edu',
    contactPhone: '(555) 100-0000',
    address: '1000 Education Way',
    city: 'Springfield',
    state: 'IL',
    zipCode: '62701',
    website: 'https://meadowbrook.edu',
    timezone: 'America/Chicago',
  },
  academic: {
    schoolYearStart: '2025-08-18',
    schoolYearEnd: '2026-05-29',
    gradingPeriods: 4,
    gradingScale: 'A-F',
    minimumPassingGrade: 60,
    maxAbsences: 10,
    lateWorkPolicy: 'penalty',
    lateWorkPenaltyPercent: 10,
  },
  security: {
    passwordMinLength: 8,
    requirePasswordChange: false,
    passwordChangeDays: 90,
    maxLoginAttempts: 5,
    sessionTimeout: 60,
    twoFactorEnabled: false,
    ipRestriction: false,
    allowedIPs: '',
    ferpaCompliant: true,
    coppaCompliant: true,
  },
  features: {
    adaptiveLearningEnabled: true,
    aiTutorEnabled: true,
    studyPlannerEnabled: true,
    studyGroupsEnabled: true,
    messagingEnabled: true,
    parentPortalEnabled: true,
    gameStoreEnabled: true,
    focusModeEnabled: true,
    maxGameMinutesPerDay: 30,
    xpMultiplier: 1.0,
    requireSurvey: true,
  },
  notifications: {
    emailNotifications: true,
    gradeAlerts: true,
    attendanceAlerts: true,
    parentWeeklyDigest: true,
    teacherWeeklySummary: true,
    adminMonthlyReport: true,
    lowScoreThreshold: 60,
    streakBreakAlert: true,
  },
  branding: {
    primaryColor: '#6366F1',
    accentColor: '#F59E0B',
    logoUrl: '',
    districtMotto: 'Empowering Every Student to Succeed',
    showDistrictLogo: true,
  },
};

type SettingsTab = 'general' | 'academic' | 'security' | 'features' | 'notifications' | 'branding';

export default function AdminSettingsPage() {
  const { data: session } = useSession();
  const isDemo = useIsDemo();
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => { fetchSettings(); }, [isDemo]);

  async function fetchSettings() {
    if (isDemo) { setSettings(JSON.parse(JSON.stringify(DEMO_SETTINGS))); setLoading(false); return; }
    try {
      const res = await fetch('/api/district/settings');
      if (res.ok) { const data = await res.json(); setSettings(data.settings || DEMO_SETTINGS); }
      else { setSettings(JSON.parse(JSON.stringify(DEMO_SETTINGS))); }
    } catch { setSettings(JSON.parse(JSON.stringify(DEMO_SETTINGS))); }
    finally { setLoading(false); }
  }

  function updateSetting(section: string, key: string, value: any) {
    setSettings((prev: any) => ({
      ...prev, [section]: { ...prev[section], [key]: value },
    }));
    setHasChanges(true);
  }

  async function handleSave() {
    setSaving(true);
    if (isDemo) {
      await new Promise(r => setTimeout(r, 800));
      toast.success('Settings saved (Demo)');
      setSaving(false); setHasChanges(false); return;
    }
    try {
      const res = await fetch('/api/district/settings', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) { toast.success('Settings saved successfully!'); setHasChanges(false); }
      else toast.error('Failed to save settings');
    } catch { toast.error('Failed to save settings'); }
    finally { setSaving(false); }
  }

  function handleReset() {
    setSettings(JSON.parse(JSON.stringify(DEMO_SETTINGS)));
    setHasChanges(false);
    toast.success('Settings reset to defaults');
  }

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: 'general', label: 'General', icon: <Building2 size={16} /> },
    { id: 'academic', label: 'Academic', icon: <BookOpen size={16} /> },
    { id: 'security', label: 'Security', icon: <Shield size={16} /> },
    { id: 'features', label: 'Features', icon: <Zap size={16} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={16} /> },
    { id: 'branding', label: 'Branding', icon: <Palette size={16} /> },
  ];

  if (loading || !settings) return (
    <DashboardLayout>
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Settings size={28} /> District Settings
            </h1>
            <p className="text-gray-500 mt-1">Configure district-wide policies, features, and preferences</p>
          </div>
          <div className="flex gap-2">
            {hasChanges && (
              <button onClick={handleReset} className="btn-secondary flex items-center gap-2 text-sm">
                <RotateCcw size={14} /> Reset
              </button>
            )}
            <button onClick={handleSave} disabled={!hasChanges || saving}
              className={cn('btn-primary flex items-center gap-2', (!hasChanges || saving) && 'opacity-50 cursor-not-allowed')}>
              {saving ? <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> : <Save size={16} />}
              Save Changes
            </button>
          </div>
        </motion.div>

        {hasChanges && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-sm flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-600 flex-shrink-0" />
            <span className="text-amber-700">You have unsaved changes. Click "Save Changes" to apply them.</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl overflow-x-auto">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={cn('flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
                activeTab === tab.id ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700')}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card">
          {/* General Tab */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <h3 className="font-bold text-gray-900 dark:text-white text-lg flex items-center gap-2"><Building2 size={18} /> District Information</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">District Name</label>
                  <input value={settings.district.name} onChange={e => updateSetting('district', 'name', e.target.value)} className="input-field" /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subdomain</label>
                  <div className="flex"><input value={settings.district.subdomain} onChange={e => updateSetting('district', 'subdomain', e.target.value)} className="input-field rounded-r-none" />
                    <span className="flex items-center px-3 bg-gray-100 dark:bg-gray-700 border border-l-0 border-gray-200 dark:border-gray-600 rounded-r-xl text-sm text-gray-500">.limud.app</span></div></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contact Email</label>
                  <input type="email" value={settings.district.contactEmail} onChange={e => updateSetting('district', 'contactEmail', e.target.value)} className="input-field" /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contact Phone</label>
                  <input value={settings.district.contactPhone} onChange={e => updateSetting('district', 'contactPhone', e.target.value)} className="input-field" /></div>
                <div className="sm:col-span-2"><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
                  <input value={settings.district.address} onChange={e => updateSetting('district', 'address', e.target.value)} className="input-field" /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City</label>
                  <input value={settings.district.city} onChange={e => updateSetting('district', 'city', e.target.value)} className="input-field" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">State</label>
                    <input value={settings.district.state} onChange={e => updateSetting('district', 'state', e.target.value)} className="input-field" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ZIP</label>
                    <input value={settings.district.zipCode} onChange={e => updateSetting('district', 'zipCode', e.target.value)} className="input-field" /></div>
                </div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Website</label>
                  <input value={settings.district.website} onChange={e => updateSetting('district', 'website', e.target.value)} className="input-field" /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Timezone</label>
                  <select value={settings.district.timezone} onChange={e => updateSetting('district', 'timezone', e.target.value)} className="input-field">
                    <option value="America/New_York">Eastern (ET)</option>
                    <option value="America/Chicago">Central (CT)</option>
                    <option value="America/Denver">Mountain (MT)</option>
                    <option value="America/Los_Angeles">Pacific (PT)</option>
                    <option value="America/Anchorage">Alaska (AKT)</option>
                    <option value="Pacific/Honolulu">Hawaii (HT)</option>
                  </select></div>
              </div>
            </div>
          )}

          {/* Academic Tab */}
          {activeTab === 'academic' && (
            <div className="space-y-6">
              <h3 className="font-bold text-gray-900 dark:text-white text-lg flex items-center gap-2"><BookOpen size={18} /> Academic Calendar & Policies</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">School Year Start</label>
                  <input type="date" value={settings.academic.schoolYearStart} onChange={e => updateSetting('academic', 'schoolYearStart', e.target.value)} className="input-field" /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">School Year End</label>
                  <input type="date" value={settings.academic.schoolYearEnd} onChange={e => updateSetting('academic', 'schoolYearEnd', e.target.value)} className="input-field" /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Grading Periods per Year</label>
                  <select value={settings.academic.gradingPeriods} onChange={e => updateSetting('academic', 'gradingPeriods', parseInt(e.target.value))} className="input-field">
                    <option value={2}>2 (Semesters)</option>
                    <option value={3}>3 (Trimesters)</option>
                    <option value={4}>4 (Quarters)</option>
                    <option value={6}>6 (Hexamesters)</option>
                  </select></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Grading Scale</label>
                  <select value={settings.academic.gradingScale} onChange={e => updateSetting('academic', 'gradingScale', e.target.value)} className="input-field">
                    <option value="A-F">A-F (Traditional)</option>
                    <option value="percentage">Percentage (0-100)</option>
                    <option value="pass-fail">Pass/Fail</option>
                    <option value="standards">Standards-Based (1-4)</option>
                  </select></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Minimum Passing Grade (%)</label>
                  <input type="number" value={settings.academic.minimumPassingGrade} onChange={e => updateSetting('academic', 'minimumPassingGrade', parseInt(e.target.value))} className="input-field" min={0} max={100} /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Absences Before Alert</label>
                  <input type="number" value={settings.academic.maxAbsences} onChange={e => updateSetting('academic', 'maxAbsences', parseInt(e.target.value))} className="input-field" min={0} /></div>
              </div>
              <hr />
              <h4 className="font-medium text-gray-700 dark:text-gray-300">Late Work Policy</h4>
              <div className="grid sm:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Policy</label>
                  <select value={settings.academic.lateWorkPolicy} onChange={e => updateSetting('academic', 'lateWorkPolicy', e.target.value)} className="input-field">
                    <option value="accept">Accept (No Penalty)</option>
                    <option value="penalty">Accept with Penalty</option>
                    <option value="reject">Reject Late Submissions</option>
                    <option value="teacher-discretion">Teacher Discretion</option>
                  </select></div>
                {settings.academic.lateWorkPolicy === 'penalty' && (
                  <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Penalty (% per day late)</label>
                    <input type="number" value={settings.academic.lateWorkPenaltyPercent} onChange={e => updateSetting('academic', 'lateWorkPenaltyPercent', parseInt(e.target.value))} className="input-field" min={0} max={100} /></div>
                )}
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <h3 className="font-bold text-gray-900 dark:text-white text-lg flex items-center gap-2"><Shield size={18} /> Security & Compliance</h3>

              <div className="grid sm:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Minimum Password Length</label>
                  <input type="number" value={settings.security.passwordMinLength} onChange={e => updateSetting('security', 'passwordMinLength', parseInt(e.target.value))} className="input-field" min={6} max={32} /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Login Attempts</label>
                  <input type="number" value={settings.security.maxLoginAttempts} onChange={e => updateSetting('security', 'maxLoginAttempts', parseInt(e.target.value))} className="input-field" min={1} max={20} /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Session Timeout (minutes)</label>
                  <input type="number" value={settings.security.sessionTimeout} onChange={e => updateSetting('security', 'sessionTimeout', parseInt(e.target.value))} className="input-field" min={15} max={480} /></div>
              </div>

              <div className="space-y-3">
                {[
                  { key: 'requirePasswordChange', label: 'Require periodic password changes', desc: `Every ${settings.security.passwordChangeDays} days` },
                  { key: 'twoFactorEnabled', label: 'Two-Factor Authentication (2FA)', desc: 'Require 2FA for admin accounts' },
                  { key: 'ipRestriction', label: 'IP Address Restriction', desc: 'Limit access to specific IP addresses' },
                ].map(toggle => (
                  <div key={toggle.key} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{toggle.label}</p>
                      <p className="text-xs text-gray-400">{toggle.desc}</p>
                    </div>
                    <button onClick={() => updateSetting('security', toggle.key, !settings.security[toggle.key])}
                      className="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition">
                      {settings.security[toggle.key]
                        ? <ToggleRight size={28} className="text-green-500" />
                        : <ToggleLeft size={28} className="text-gray-400" />}
                    </button>
                  </div>
                ))}
              </div>

              <hr />
              <h4 className="font-medium text-gray-700 dark:text-gray-300">Compliance Status</h4>
              <div className="grid sm:grid-cols-3 gap-3">
                {[
                  { label: 'FERPA', status: settings.security.ferpaCompliant, desc: 'Family Educational Rights' },
                  { label: 'COPPA', status: settings.security.coppaCompliant, desc: "Children's Online Privacy" },
                  { label: 'WCAG AA', status: true, desc: 'Web Accessibility' },
                ].map(comp => (
                  <div key={comp.label} className={cn('p-3 rounded-xl border',
                    comp.status ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200')}>
                    <div className="flex items-center gap-2">
                      {comp.status ? <CheckCircle2 size={16} className="text-green-600" /> : <AlertTriangle size={16} className="text-red-600" />}
                      <span className={cn('font-bold text-sm', comp.status ? 'text-green-700' : 'text-red-700')}>{comp.label}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{comp.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Features Tab */}
          {activeTab === 'features' && (
            <div className="space-y-6">
              <h3 className="font-bold text-gray-900 dark:text-white text-lg flex items-center gap-2"><Zap size={18} /> Platform Features</h3>
              <p className="text-sm text-gray-500">Enable or disable features across the entire district</p>

              <div className="space-y-3">
                {[
                  { key: 'adaptiveLearningEnabled', label: 'Adaptive Learning', icon: <Target size={16} />, desc: 'AI adapts assignments to each student\'s learning style' },
                  { key: 'aiTutorEnabled', label: 'AI Tutor', icon: <Brain size={16} />, desc: 'Allow students to use the AI-powered tutoring system' },
                  { key: 'studyPlannerEnabled', label: 'Study Planner', icon: <Zap size={16} />, desc: 'AI-powered study scheduling and planning' },
                  { key: 'studyGroupsEnabled', label: 'Study Groups', icon: <Users size={16} />, desc: 'Allow students to form and join study groups' },
                  { key: 'messagingEnabled', label: 'Internal Messaging', icon: <Mail size={16} />, desc: 'Enable messaging between users' },
                  { key: 'parentPortalEnabled', label: 'Parent Portal', icon: <Eye size={16} />, desc: 'Allow parents to view student progress' },
                  { key: 'examSimEnabled', label: 'Exam Simulator', icon: <BookOpen size={16} />, desc: 'AI-powered exam practice with timed tests' },
                  { key: 'focusModeEnabled', label: 'Focus Mode', icon: <Clock size={16} />, desc: 'Pomodoro-style focus timer for students' },
                  { key: 'requireSurvey', label: 'Require Student Survey', icon: <BookOpen size={16} />, desc: 'New students must complete learning style survey' },
                ].map(feature => (
                  <div key={feature.key} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center',
                        settings.features[feature.key] ? 'bg-primary-100 text-primary-600' : 'bg-gray-200 text-gray-400')}>
                        {feature.icon}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{feature.label}</p>
                        <p className="text-xs text-gray-400">{feature.desc}</p>
                      </div>
                    </div>
                    <button onClick={() => updateSetting('features', feature.key, !settings.features[feature.key])}
                      className="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition">
                      {settings.features[feature.key]
                        ? <ToggleRight size={28} className="text-green-500" />
                        : <ToggleLeft size={28} className="text-gray-400" />}
                    </button>
                  </div>
                ))}
              </div>

              <hr />
              <div className="grid sm:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Game Minutes per Day</label>
                  <input type="number" value={settings.features.maxGameMinutesPerDay} onChange={e => updateSetting('features', 'maxGameMinutesPerDay', parseInt(e.target.value))} className="input-field" min={0} max={120} /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">XP Multiplier</label>
                  <select value={settings.features.xpMultiplier} onChange={e => updateSetting('features', 'xpMultiplier', parseFloat(e.target.value))} className="input-field">
                    <option value={0.5}>0.5x (Reduced)</option>
                    <option value={1.0}>1.0x (Normal)</option>
                    <option value={1.5}>1.5x (Boosted)</option>
                    <option value={2.0}>2.0x (Double)</option>
                  </select></div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h3 className="font-bold text-gray-900 dark:text-white text-lg flex items-center gap-2"><Bell size={18} /> Notification Settings</h3>
              <div className="space-y-3">
                {[
                  { key: 'emailNotifications', label: 'Email Notifications', desc: 'Send email notifications to users' },
                  { key: 'gradeAlerts', label: 'Grade Alerts', desc: 'Notify parents when grades are posted' },
                  { key: 'attendanceAlerts', label: 'Attendance Alerts', desc: 'Alert parents about absences' },
                  { key: 'parentWeeklyDigest', label: 'Parent Weekly Digest', desc: 'Send weekly progress summaries to parents' },
                  { key: 'teacherWeeklySummary', label: 'Teacher Weekly Summary', desc: 'Send weekly class summaries to teachers' },
                  { key: 'adminMonthlyReport', label: 'Admin Monthly Report', desc: 'Send monthly analytics to admins' },
                  { key: 'streakBreakAlert', label: 'Streak Break Alert', desc: 'Notify students when streak is at risk' },
                ].map(notif => (
                  <div key={notif.key} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{notif.label}</p>
                      <p className="text-xs text-gray-400">{notif.desc}</p>
                    </div>
                    <button onClick={() => updateSetting('notifications', notif.key, !settings.notifications[notif.key])}
                      className="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition">
                      {settings.notifications[notif.key]
                        ? <ToggleRight size={28} className="text-green-500" />
                        : <ToggleLeft size={28} className="text-gray-400" />}
                    </button>
                  </div>
                ))}
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Low Score Alert Threshold (%)</label>
                  <input type="number" value={settings.notifications.lowScoreThreshold} onChange={e => updateSetting('notifications', 'lowScoreThreshold', parseInt(e.target.value))} className="input-field" min={0} max={100} /></div>
              </div>
            </div>
          )}

          {/* Branding Tab */}
          {activeTab === 'branding' && (
            <div className="space-y-6">
              <h3 className="font-bold text-gray-900 dark:text-white text-lg flex items-center gap-2"><Palette size={18} /> Branding & Customization</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Primary Color</label>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={settings.branding.primaryColor} onChange={e => updateSetting('branding', 'primaryColor', e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer" />
                    <input value={settings.branding.primaryColor} onChange={e => updateSetting('branding', 'primaryColor', e.target.value)} className="input-field flex-1" /></div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Accent Color</label>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={settings.branding.accentColor} onChange={e => updateSetting('branding', 'accentColor', e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer" />
                    <input value={settings.branding.accentColor} onChange={e => updateSetting('branding', 'accentColor', e.target.value)} className="input-field flex-1" /></div>
                </div>
                <div className="sm:col-span-2"><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">District Motto</label>
                  <input value={settings.branding.districtMotto} onChange={e => updateSetting('branding', 'districtMotto', e.target.value)} className="input-field" /></div>
                <div className="sm:col-span-2"><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Logo URL</label>
                  <input value={settings.branding.logoUrl} onChange={e => updateSetting('branding', 'logoUrl', e.target.value)} className="input-field" placeholder="https://example.com/logo.png" /></div>
              </div>

              {/* Preview */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Preview</h4>
                <div className="bg-gradient-to-r rounded-2xl p-6 text-white"
                  style={{ backgroundImage: `linear-gradient(135deg, ${settings.branding.primaryColor}, ${settings.branding.accentColor})` }}>
                  <p className="text-xl font-bold">{settings.district.name}</p>
                  <p className="text-white/70 text-sm mt-1">{settings.branding.districtMotto}</p>
                  <p className="text-white/50 text-xs mt-2">{settings.district.subdomain}.limud.app</p>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
