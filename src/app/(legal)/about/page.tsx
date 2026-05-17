'use client';
import {
  Brain, BarChart3, Shield, Users, Heart, Target, Sparkles, GraduationCap,
} from 'lucide-react';
import AuthAwareCTA from '@/components/AuthAwareCTA';

export default function AboutPage() {
  return (
    <article className="max-w-none">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">About Limud</h1>
      <p className="text-lg text-gray-500 mb-10">Transforming K-12 education with AI-powered, personalized learning.</p>

      <div className="prose prose-gray max-w-none mb-12">
        <p>
          <strong>Limud</strong> (Hebrew for &quot;learning&quot;) was founded with a simple mission: make every child&apos;s education personal, engaging, and effective. We believe that Every Mind Learns Differently, and that technology should adapt to the student — not the other way around.
        </p>
        <p>
          Our platform replaces the app fatigue that plagues modern classrooms. Instead of juggling 6+ different tools, teachers, students, and parents use one unified platform that combines AI tutoring, intelligent grading, adaptive learning, and real-time analytics.
        </p>
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-6">What Makes Limud Different</h2>
      <div className="grid sm:grid-cols-2 gap-4 mb-12">
        {[
          { icon: <Brain size={22} />, title: 'Adaptive AI Tutor', desc: 'Multiple tutor personalities that adapt to each student\'s learning style, using Socratic questioning and cognitive science.', color: 'bg-purple-50 text-purple-600' },
          { icon: <Sparkles size={22} />, title: 'The Two-Upload Model', desc: 'Teachers upload one chapter; the AI rewrites it per student in the format that fits how they learn — comic, story, walkthrough, or clean prose.', color: 'bg-amber-50 text-amber-600' },
          { icon: <Target size={22} />, title: 'Cognitive Science Engine', desc: 'Spaced repetition, interleaving, active recall, and optimal difficulty targeting (70-85% success band).', color: 'bg-blue-50 text-blue-600' },
          { icon: <BarChart3 size={22} />, title: 'Predictive Analytics', desc: 'AI-powered early warning system identifies at-risk students before they fall behind.', color: 'bg-green-50 text-green-600' },
          { icon: <GraduationCap size={22} />, title: 'Smart Auto-Grading', desc: 'AI grades essays, math work, and projects against rubrics in seconds with personalized feedback.', color: 'bg-pink-50 text-pink-600' },
          { icon: <Shield size={22} />, title: 'FERPA & COPPA Compliant', desc: 'Enterprise-grade security with role-based access, encryption, and strict data protection.', color: 'bg-indigo-50 text-indigo-600' },
          { icon: <Users size={22} />, title: 'Districts and Families', desc: 'Districts run multi-school deployments with SSO and analytics. Families run a parent account with up to 5 kids. Same engine, same outcomes — just different scale.', color: 'bg-orange-50 text-orange-600' },
          { icon: <Heart size={22} />, title: 'Wellbeing First', desc: 'Burnout detection, struggle alerts, and balanced engagement systems that prioritize student wellbeing.', color: 'bg-red-50 text-red-600' },
        ].map(item => (
          <div key={item.title} className="flex gap-4 p-5 rounded-2xl border border-gray-100 hover:shadow-md transition">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${item.color}`}>
              {item.icon}
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">{item.title}</h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h2>
      <div className="bg-gradient-to-r from-primary-50 to-accent-50 rounded-2xl p-8 mb-12">
        <p className="text-lg text-gray-700 leading-relaxed">
          &quot;We envision a world where every student has access to a patient, adaptive, personal tutor — where teachers are empowered with AI tools that free them to focus on what matters most: inspiring the next generation. Limud exists to make that vision a reality.&quot;
        </p>
        <p className="text-sm text-gray-500 mt-4">— The Limud Founding Team</p>
      </div>

      <div className="text-center">
        <AuthAwareCTA variant="hero" />
      </div>
    </article>
  );
}
