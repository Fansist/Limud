'use client';
import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { HelpCircle, ChevronDown, Search, BookOpen, MessageCircle, Shield, Gamepad2, Brain, Trophy, Mail, ExternalLink } from 'lucide-react';

type FAQItem = { question: string; answer: string; };
type FAQCategory = { name: string; icon: React.ReactNode; items: FAQItem[]; };

const FAQ_DATA: FAQCategory[] = [
  {
    name: 'Getting Started',
    icon: <BookOpen size={20} />,
    items: [
      { question: 'How do I create an account?', answer: 'Visit the /onboard page to create a new district or homeschool account. Choose your plan, enter your details, and set up your admin credentials. Once created, you can add teachers and students through the admin dashboard.' },
      { question: 'What are the different user roles?', answer: 'Limud has 4 roles: Students (learners), Teachers (educators who create assignments and grade work), Admins (district administrators who manage schools, users, and billing), and Parents (who monitor their children\'s progress). Homeschool parents get combined parent + teacher access.' },
      { question: 'How does Demo Mode work?', answer: 'Add ?demo=true to any URL to explore the platform with simulated data. No account needed! Demo mode shows all features with realistic mock data. Visit /demo to switch between Student, Teacher, Admin, and Parent views.' },
      { question: 'Can I use Limud on my phone?', answer: 'Yes! Limud is fully responsive and works on any device. On mobile, you\'ll see a bottom navigation bar for quick access. You can even install it as a PWA (Progressive Web App) from your browser for an app-like experience.' },
    ],
  },
  {
    name: 'AI Features',
    icon: <Brain size={20} />,
    items: [
      { question: 'How does the AI Tutor work?', answer: 'The AI Tutor uses Google\'s Gemini 2.0 Flash to provide personalized, Socratic-style tutoring. It never gives direct answers - instead, it guides students with hints and questions. If no API key is configured, a demo mode provides helpful preset responses.' },
      { question: 'How does AI Auto-Grading work?', answer: 'Teachers can grade individual submissions or batch-grade entire classes with one click. The AI analyzes student work against the assignment rubric, provides a score (0-100), detailed feedback, strengths, areas for improvement, and encouragement.' },
      { question: 'What about the Quiz Generator?', answer: 'Teachers enter a subject, grade level, and topic. The AI generates multiple-choice questions with correct answers, explanations, and skill tags. Teachers can review and edit before sharing with students.' },
      { question: 'Is my data used to train AI models?', answer: 'No. Limud uses the Google Gemini API which does not use API data for training. Student conversations and submissions are stored securely in your district\'s database and are never shared externally.' },
    ],
  },
  {
    name: 'Gamification',
    icon: <Trophy size={20} />,
    items: [
      { question: 'How do students earn XP?', answer: 'Students earn XP by: completing assignments (25-100 XP based on score), using the AI tutor (15 XP per session), maintaining streaks (75-300 XP bonus), completing daily challenges (up to 50 XP), and achieving milestones.' },
      { question: 'What are the rank tiers?', answer: 'There are 5 tiers: Bronze (0-499 XP), Silver (500-1,999 XP), Gold (2,000-4,999 XP), Platinum (5,000-9,999 XP), and Diamond (10,000+ XP). Each tier unlocks new avatar options and themes.' },
      { question: 'What is the Game Store?', answer: 'Students can spend earned XP to unlock educational games. Games cover math, word puzzles, science trivia, and more. Teachers can disable game access per classroom during class time.' },
      { question: 'How do badges work?', answer: 'Badges are earned automatically when milestones are reached (streaks, XP totals, perfect scores, etc.). Each badge has a rarity level: Common, Rare, Epic, or Legendary. Visit the Badges page to see your collection and progress.' },
    ],
  },
  {
    name: 'Game Store',
    icon: <Gamepad2 size={20} />,
    items: [
      { question: 'Can teachers control game access?', answer: 'Yes! Teachers can disable games per classroom during class time from the Game Control page. Admins can also control game access district-wide.' },
      { question: 'Are the games educational?', answer: 'All games in the Limud Game Store are educational. They cover math skills, vocabulary building, science concepts, typing practice, and more. Games are designed to reinforce classroom learning in a fun way.' },
      { question: 'How much XP do games cost?', answer: 'Games typically cost 50-200 XP. Once purchased, a game is unlocked forever. Students can play as many times as they want.' },
    ],
  },
  {
    name: 'Admin & Billing',
    icon: <Shield size={20} />,
    items: [
      { question: 'What subscription plans are available?', answer: 'We offer 6 tiers: Free (up to 5 students, limited AI), Starter ($2/student/mo billed annually, up to 50 students), Growth ($4/student/mo, up to 200 students), Standard ($6/student/mo, up to 500 students, unlimited AI), Premium ($9/student/mo, up to 2,000 students, SSO & predictive AI), and Enterprise (custom pricing, unlimited). Every paid plan includes a 14-day free trial.' },
      { question: 'How do I add students?', answer: 'Admins can add students individually from the Students page (which auto-creates parent accounts) or use Bulk Import with CSV files. Teachers with proper permissions can also add students to their classes.' },
      { question: 'What are district access levels?', answer: 'Limud supports 7 access levels: Superintendent (full access), Assistant Superintendent, Curriculum Director, Principal, Vice Principal, District Employee (view-only), and IT Admin. Each level has configurable permissions.' },
      { question: 'How does billing work?', answer: 'Plans are billed monthly or annually (save 25% with annual billing). Upgrades are prorated. Payment methods include credit card, ACH bank transfer, and purchase orders (Enterprise). Invoices are available in the Billing section.' },
    ],
  },
  {
    name: 'Parent Features',
    icon: <Mail size={20} />,
    items: [
      { question: 'What can parents see?', answer: 'Parents can view their children\'s progress, grades, XP/streak data, study time, and skill mastery levels. Weekly AI-generated reports summarize performance and highlight areas needing attention.' },
      { question: 'Can parents message teachers?', answer: 'Yes! The Messages feature allows secure parent-teacher communication. Parents can send messages about specific children, and teachers can share progress updates.' },
      { question: 'What is Homeschool Mode?', answer: 'Homeschool parents get combined Parent + Teacher access. They can create assignments, use AI grading, and monitor their children\'s progress — all from one account.' },
    ],
  },
];

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [openCategory, setOpenCategory] = useState<string | null>('Getting Started');
  const [openItem, setOpenItem] = useState<string | null>(null);

  const filteredCategories = FAQ_DATA.map(cat => ({
    ...cat,
    items: cat.items.filter(item =>
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter(cat => cat.items.length > 0);

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <HelpCircle className="text-primary-500" size={28} /> Help & FAQ
          </h1>
          <p className="text-gray-500 mt-1">Find answers to common questions about Limud</p>
        </motion.div>

        {/* Search */}
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="input-field pl-11 text-lg" placeholder="Search for help..." />
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'AI Tutor', href: '/student/tutor', icon: <MessageCircle size={20} />, color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20' },
            { label: 'Pricing', href: '/pricing', icon: <Shield size={20} />, color: 'bg-green-50 text-green-600 dark:bg-green-900/20' },
            { label: 'Demo Mode', href: '/demo', icon: <BookOpen size={20} />, color: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20' },
            { label: 'Contact Us', href: '/contact', icon: <Mail size={20} />, color: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20' },
          ].map(link => (
            <a key={link.label} href={link.href}
              className={cn('card flex items-center gap-3 hover:shadow-md transition-all', link.color)}>
              {link.icon}
              <span className="font-medium text-sm">{link.label}</span>
              <ExternalLink size={12} className="ml-auto opacity-50" />
            </a>
          ))}
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-4">
          {filteredCategories.map((category, ci) => (
            <motion.div key={category.name} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: ci * 0.05 }}
              className="card !p-0 overflow-hidden">
              <button onClick={() => setOpenCategory(openCategory === category.name ? null : category.name)}
                className="w-full flex items-center gap-3 px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                <span className="text-primary-500">{category.icon}</span>
                <span className="font-bold text-gray-900 dark:text-white">{category.name}</span>
                <span className="text-xs text-gray-400 ml-1">({category.items.length})</span>
                <ChevronDown size={18} className={cn('ml-auto text-gray-400 transition-transform', openCategory === category.name && 'rotate-180')} />
              </button>

              <AnimatePresence>
                {openCategory === category.name && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                    <div className="border-t border-gray-100 dark:border-gray-700">
                      {category.items.map((item, ii) => {
                        const itemKey = `${category.name}-${ii}`;
                        return (
                          <div key={ii} className="border-b border-gray-50 dark:border-gray-800 last:border-0">
                            <button onClick={() => setOpenItem(openItem === itemKey ? null : itemKey)}
                              className="w-full text-left px-6 py-3 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition flex items-start gap-3">
                              <ChevronDown size={16} className={cn('mt-0.5 text-gray-400 transition-transform flex-shrink-0', openItem === itemKey && 'rotate-180')} />
                              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{item.question}</span>
                            </button>
                            <AnimatePresence>
                              {openItem === itemKey && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden">
                                  <p className="px-6 pb-4 pl-12 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{item.answer}</p>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {filteredCategories.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <HelpCircle size={48} className="mx-auto mb-3 opacity-50" />
            <p>No results found for &quot;{searchQuery}&quot;</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
