'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { useIsDemo } from '@/lib/hooks';
import toast from 'react-hot-toast';
import {
  Compass, X, Send, Sparkles, MapPin, BookOpen, BarChart3,
  Trophy, MessageCircle, Gamepad2, ChevronRight, Minimize2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

const QUICK_ACTIONS = [
  { label: 'My assignments', icon: <BookOpen size={14} />, prompt: 'What assignments do I have coming up?' },
  { label: 'My grades', icon: <BarChart3 size={14} />, prompt: 'How are my grades looking?' },
  { label: 'My rewards', icon: <Trophy size={14} />, prompt: 'What are my XP, level and streak?' },
  { label: 'Get help', icon: <MessageCircle size={14} />, prompt: 'I need help with my schoolwork' },
  { label: 'Play games', icon: <Gamepad2 size={14} />, prompt: 'I want to play some games' },
  { label: 'Message teacher', icon: <Send size={14} />, prompt: 'How do I send a message to my teacher?' },
];

// Custom renderer for markdown links to use Next.js router
function NavigatorMessage({ content, onNavigate }: { content: string; onNavigate: (href: string) => void }) {
  return (
    <div className="prose prose-sm max-w-none text-sm dark:prose-invert
      prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5
      prose-headings:my-1 prose-strong:text-inherit">
      <ReactMarkdown
        components={{
          a: ({ href, children }) => {
            // Internal links use router navigation
            if (href && href.startsWith('/')) {
              return (
                <button
                  onClick={() => onNavigate(href)}
                  className="inline-flex items-center gap-1 text-primary-600 dark:text-primary-400 font-semibold hover:underline cursor-pointer bg-primary-50 dark:bg-primary-900/30 px-1.5 py-0.5 rounded-md text-xs"
                >
                  <MapPin size={10} />
                  {children}
                  <ChevronRight size={10} />
                </button>
              );
            }
            return <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export default function AINavigator() {
  const router = useRouter();
  const isDemo = useIsDemo();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  function handleNavigate(href: string) {
    const suffix = isDemo ? '?demo=true' : '';
    router.push(href + suffix);
    setIsMinimized(true);
  }

  async function sendMessage(messageText?: string) {
    const text = messageText || input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const endpoint = isDemo ? '/api/demo' : '/api/ai-navigator';
      const body = isDemo
        ? { type: 'navigator', message: text }
        : {
            message: text,
            history: messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
          };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
      } else {
        // Fallback demo response
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'I\'m having a bit of trouble right now. Try asking about your **[Assignments](/student/assignments)**, **[Grades](/student/growth)**, or **[Rewards](/student/rewards)**!',
        }]);
      }
    } catch {
      toast.error('Connection error');
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function openNavigator() {
    setIsOpen(true);
    setIsMinimized(false);
    if (messages.length === 0) {
      // Show welcome message
      setMessages([{
        role: 'assistant',
        content: 'Hey there! 🧭 I\'m your **Limud Navigator**. I can help you find your assignments, check your grades, track your rewards, or guide you anywhere on the platform.\n\nWhat would you like to know?',
      }]);
    }
  }

  // Floating button
  if (!isOpen) {
    return (
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={openNavigator}
        className="fixed bottom-24 right-4 lg:bottom-6 lg:right-6 z-50 w-14 h-14 bg-gradient-to-br from-teal-500 to-emerald-600 text-white rounded-2xl shadow-lg shadow-teal-500/30 flex items-center justify-center hover:shadow-xl transition-shadow"
        aria-label="Open AI Navigator"
      >
        <Compass size={26} className="animate-pulse" />
      </motion.button>
    );
  }

  // Minimized state
  if (isMinimized) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="fixed bottom-24 right-4 lg:bottom-6 lg:right-6 z-50 flex items-center gap-2"
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-emerald-600 text-white px-4 py-3 rounded-2xl shadow-lg shadow-teal-500/30 hover:shadow-xl transition-shadow"
        >
          <Compass size={20} />
          <span className="text-sm font-semibold">Navigator</span>
          {messages.length > 0 && (
            <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
          )}
        </motion.button>
        <button
          onClick={() => { setIsOpen(false); setIsMinimized(false); }}
          className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
        >
          <X size={14} />
        </button>
      </motion.div>
    );
  }

  // Full panel
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[calc(100vh-8rem)] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-teal-500 to-emerald-600 text-white">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
              <Compass size={18} />
            </div>
            <div>
              <p className="text-sm font-bold">AI Navigator</p>
              <p className="text-[10px] text-white/70">Your platform guide</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setIsMinimized(true)} className="p-1.5 rounded-lg hover:bg-white/20 transition" aria-label="Minimize">
              <Minimize2 size={16} />
            </button>
            <button onClick={() => { setIsOpen(false); setIsMinimized(false); }} className="p-1.5 rounded-lg hover:bg-white/20 transition" aria-label="Close">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}
            >
              {msg.role === 'assistant' && (
                <div className="w-6 h-6 bg-gradient-to-br from-teal-100 to-emerald-100 dark:from-teal-900 dark:to-emerald-900 rounded-lg flex items-center justify-center flex-shrink-0 mr-2 mt-1">
                  <Sparkles size={12} className="text-teal-600 dark:text-teal-400" />
                </div>
              )}
              <div
                className={cn(
                  'max-w-[85%] rounded-2xl px-3 py-2',
                  msg.role === 'user'
                    ? 'bg-primary-600 text-white rounded-br-md'
                    : 'bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-md'
                )}
              >
                {msg.role === 'assistant' ? (
                  <NavigatorMessage content={msg.content} onNavigate={handleNavigate} />
                ) : (
                  <p className="text-sm">{msg.content}</p>
                )}
              </div>
            </motion.div>
          ))}

          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start gap-2">
              <div className="w-6 h-6 bg-gradient-to-br from-teal-100 to-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Sparkles size={12} className="text-teal-600" />
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl rounded-bl-md px-3 py-2">
                <div className="flex gap-1">
                  <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0 }} className="w-1.5 h-1.5 bg-teal-400 rounded-full" />
                  <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0.2 }} className="w-1.5 h-1.5 bg-teal-400 rounded-full" />
                  <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0.4 }} className="w-1.5 h-1.5 bg-teal-400 rounded-full" />
                </div>
              </div>
            </motion.div>
          )}

          {/* Quick actions (only show if no messages from user yet) */}
          {messages.length <= 1 && !loading && (
            <div className="pt-1">
              <p className="text-[10px] text-gray-400 font-medium mb-2 px-1">QUICK ACTIONS</p>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_ACTIONS.map(action => (
                  <button
                    key={action.label}
                    onClick={() => sendMessage(action.prompt)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 dark:bg-gray-800 hover:bg-teal-50 dark:hover:bg-teal-900/30 hover:text-teal-700 dark:hover:text-teal-300 rounded-lg text-xs text-gray-600 dark:text-gray-400 transition border border-gray-100 dark:border-gray-700 hover:border-teal-200 dark:hover:border-teal-800"
                  >
                    {action.icon}
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-gray-100 dark:border-gray-800 p-3">
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about assignments, grades, etc..."
              className="flex-1 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent min-h-[36px] max-h-20"
              rows={1}
              disabled={loading}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className="px-3 py-2 bg-gradient-to-r from-teal-500 to-emerald-600 text-white rounded-xl hover:shadow-md disabled:opacity-50 transition-all"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
