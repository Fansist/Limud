'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { Mail, MessageCircle, BookOpen, Clock, Send } from 'lucide-react';

export default function ContactPage() {
  const [form, setForm] = useState({
    name: '', email: '', subject: '', role: '', message: '',
  });
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    if (!form.name.trim() || !form.email.trim() || form.message.trim().length < 10) {
      toast.error('Please fill in your name, email, and a message of at least 10 characters.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          message: form.message.trim(),
          organization: form.role || undefined,
          topic: form.subject || undefined,
        }),
      });
      const data = await res.json().catch(() => null);

      if (res.ok && data?.success) {
        toast.success('Thanks! We’ll get back to you shortly.');
        setForm({ name: '', email: '', subject: '', role: '', message: '' });
      } else {
        toast.error(data?.error || 'Something went wrong. Please try again or email contact@limud.co.');
      }
    } catch {
      toast.error('Network error. Please try again or email contact@limud.co.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <article className="max-w-none">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Contact Us</h1>
      <p className="text-lg text-gray-500 mb-10">We&apos;d love to hear from you. Reach out with questions, feedback, or partnership inquiries.</p>

      <div className="grid lg:grid-cols-1 gap-8 mb-12 max-w-md mx-auto">
        {[
          { icon: <Mail size={22} />, title: 'Email', desc: 'contact@limud.co', sub: 'General inquiries and support', color: 'bg-blue-50 text-blue-600' },
        ].map(item => (
          <div key={item.title} className="text-center p-6 rounded-2xl border border-gray-100">
            <div className={`w-12 h-12 ${item.color} rounded-xl flex items-center justify-center mx-auto mb-3`}>
              {item.icon}
            </div>
            <h3 className="font-bold text-gray-900">{item.title}</h3>
            <p className="text-sm text-gray-700 mt-1">{item.desc}</p>
            <p className="text-xs text-gray-400">{item.sub}</p>
          </div>
        ))}
      </div>

      <div className="bg-gray-50 rounded-2xl p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <MessageCircle size={20} className="text-primary-500" />
            Send us a message
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="contact-name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  id="contact-name"
                  type="text"
                  required
                  className="input-field"
                  placeholder="Your name"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="contact-email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  id="contact-email"
                  type="email"
                  required
                  className="input-field"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="contact-role" className="block text-sm font-medium text-gray-700 mb-1">I am a...</label>
                <select
                  id="contact-role"
                  className="input-field"
                  value={form.role}
                  onChange={e => setForm({ ...form, role: e.target.value })}
                >
                  <option value="">Select your role</option>
                  <option value="teacher">Teacher</option>
                  <option value="admin">School Administrator</option>
                  <option value="parent">Parent</option>
                  <option value="student">Student</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label htmlFor="contact-subject" className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                  id="contact-subject"
                  type="text"
                  className="input-field"
                  placeholder="How can we help?"
                  value={form.subject}
                  onChange={e => setForm({ ...form, subject: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label htmlFor="contact-message" className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea
                id="contact-message"
                required
                rows={5}
                minLength={10}
                maxLength={5000}
                className="input-field resize-none"
                placeholder="Tell us more..."
                value={form.message}
                onChange={e => setForm({ ...form, message: e.target.value })}
              />
              <p className="text-xs text-gray-400 mt-1">{form.message.length}/5000 characters</p>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  Sending...
                </>
              ) : (
                <>
                  <Send size={16} /> Send Message
                </>
              )}
            </button>
          </form>
        </div>

      <div className="mt-12 grid sm:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen size={18} className="text-primary-500" />
            <h3 className="font-bold text-gray-900">Sales Inquiries</h3>
          </div>
          <p className="text-sm text-gray-500">For district pricing, enterprise plans, and demos contact <strong>sales@limud.co</strong></p>
        </div>
        <div className="p-5 rounded-2xl border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={18} className="text-amber-500" />
            <h3 className="font-bold text-gray-900">Support Hours</h3>
          </div>
          <p className="text-sm text-gray-500">Enterprise: 24/7 priority support. All others: Mon-Fri, 8am-6pm PST. Avg response: &lt; 4 hours.</p>
        </div>
      </div>
    </article>
  );
}
