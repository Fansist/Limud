'use client';
import { useSession } from 'next-auth/react';
import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';
import { Send, Bot, User, Sparkles, BookOpen, FlaskConical, Calculator, Pen } from 'lucide-react';
import { cn } from '@/lib/utils';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

const SUBJECT_PRESETS = [
  { id: 'math', label: 'Math', icon: <Calculator size={16} />, color: 'bg-blue-100 text-blue-700' },
  { id: 'science', label: 'Science', icon: <FlaskConical size={16} />, color: 'bg-green-100 text-green-700' },
  { id: 'ela', label: 'English', icon: <BookOpen size={16} />, color: 'bg-purple-100 text-purple-700' },
  { id: 'writing', label: 'Writing', icon: <Pen size={16} />, color: 'bg-pink-100 text-pink-700' },
];

const QUICK_PROMPTS = [
  "Can you help me understand fractions?",
  "What is photosynthesis?",
  "How do I write a thesis statement?",
  "Explain the water cycle",
  "Help me solve: 3x + 7 = 22",
];

export default function TutorPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const isDemo = searchParams.get('demo') === 'true' || (typeof window !== 'undefined' && localStorage.getItem('limud-demo-mode') === 'true');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [subject, setSubject] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(messageText?: string) {
    const text = messageText || input.trim();
    if (!text || loading) return;

    const newMessage: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, newMessage]);
    setInput('');
    setLoading(true);

    try {
      if (isDemo) {
        // Use demo endpoint
        const res = await fetch('/api/demo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'tutor-chat', message: text }),
        });
        if (res.ok) {
          const data = await res.json();
          setSessionId(data.sessionId);
          setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
        } else {
          toast.error('Tutor is having trouble. Try again!');
        }
        return;
      }
      const res = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          sessionId,
          subject,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSessionId(data.sessionId);
        setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
      } else {
        toast.error('Tutor is having trouble. Try again!');
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

  function startNewChat() {
    setMessages([]);
    setSessionId(null);
    setSubject('');
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto h-[calc(100vh-140px)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 4 }}
              className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center"
            >
              <Bot size={22} className="text-white" />
            </motion.div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">AI Tutor</h1>
              <p className="text-xs text-gray-400">I help you learn — not just give answers!</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Subject selector */}
            <div className="flex gap-1.5">
              {SUBJECT_PRESETS.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSubject(subject === s.id ? '' : s.id)}
                  className={cn(
                    'flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition',
                    subject === s.id ? s.color : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  )}
                >
                  {s.icon}
                  <span className="hidden sm:inline">{s.label}</span>
                </button>
              ))}
            </div>
            <button onClick={startNewChat} className="btn-secondary text-xs">
              New Chat
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 3 }}
                  className="text-6xl mb-4"
                >
                  🤖
                </motion.div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  Hi {session?.user?.name?.split(' ')[0]}! What would you like to learn?
                </h2>
                <p className="text-gray-400 text-sm mb-6 max-w-md">
                  I'm your AI tutor. I'll guide you through problems step by step.
                  Ask me anything about your schoolwork!
                </p>
                <div className="flex flex-wrap justify-center gap-2 max-w-lg">
                  {QUICK_PROMPTS.map(prompt => (
                    <button
                      key={prompt}
                      onClick={() => sendMessage(prompt)}
                      className="px-4 py-2 bg-gray-50 hover:bg-primary-50 hover:text-primary-700 rounded-xl text-sm text-gray-600 transition border border-gray-100 hover:border-primary-200"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      'flex gap-3',
                      msg.role === 'user' ? 'flex-row-reverse' : ''
                    )}
                  >
                    <div
                      className={cn(
                        'w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0',
                        msg.role === 'user'
                          ? 'bg-primary-100'
                          : 'bg-gradient-to-br from-violet-100 to-purple-100'
                      )}
                    >
                      {msg.role === 'user' ? (
                        <User size={16} className="text-primary-600" />
                      ) : (
                        <Sparkles size={16} className="text-purple-600" />
                      )}
                    </div>
                    <div
                      className={cn(
                        'max-w-[80%] rounded-2xl px-4 py-3',
                        msg.role === 'user'
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-50 text-gray-800'
                      )}
                    >
                      <div className={cn(
                        'text-sm prose prose-sm max-w-none',
                        msg.role === 'user' && 'prose-invert'
                      )}>
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    </div>
                  </motion.div>
                ))}
                {loading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex gap-3"
                  >
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center">
                      <Sparkles size={16} className="text-purple-600" />
                    </div>
                    <div className="bg-gray-50 rounded-2xl px-4 py-3">
                      <div className="flex gap-1.5">
                        <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0 }} className="w-2 h-2 bg-gray-400 rounded-full" />
                        <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }} className="w-2 h-2 bg-gray-400 rounded-full" />
                        <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }} className="w-2 h-2 bg-gray-400 rounded-full" />
                      </div>
                    </div>
                  </motion.div>
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-100 p-4">
            <div className="flex gap-2">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything about your schoolwork..."
                className="input-field min-h-[44px] max-h-32 resize-none flex-1"
                rows={1}
                disabled={loading}
                aria-label="Type your message"
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                className="btn-primary px-4"
                aria-label="Send message"
              >
                <Send size={18} />
              </button>
            </div>
            <p className="text-xs text-gray-300 mt-2 text-center">
              I guide you to the answer — I won't just give it away! 💡
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
