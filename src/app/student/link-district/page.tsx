'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Building2, Search, Send, Clock, CheckCircle2, XCircle,
  ArrowRight, Link2, MapPin, Users, Loader2, Info, Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type District = {
  id: string; name: string; city: string | null; state: string | null; memberCount: number;
};

type LinkRequest = {
  id: string; districtId: string; districtName: string; districtCity: string | null;
  districtState: string | null; message: string | null; gradeLevel: string | null;
  status: string; reviewNote: string | null; createdAt: string; reviewedAt: string | null;
};

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  pending: { label: 'Pending', icon: <Clock size={14} />, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
  approved: { label: 'Approved', icon: <CheckCircle2 size={14} />, color: 'text-green-600', bg: 'bg-green-50 border-green-200' },
  denied: { label: 'Denied', icon: <XCircle size={14} />, color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
};

const GRADE_LEVELS = [
  'Kindergarten', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th',
  '9th', '10th', '11th', '12th',
];

export default function LinkDistrictPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const user = session?.user as any;

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<District[]>([]);
  const [searching, setSearching] = useState(false);
  const [myRequests, setMyRequests] = useState<LinkRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  // Request form
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
  const [message, setMessage] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch existing requests
  useEffect(() => {
    if (authStatus === 'authenticated') {
      fetchMyRequests();
    }
  }, [authStatus]);

  async function fetchMyRequests() {
    try {
      const res = await fetch('/api/district-link/route');
      if (res.ok) {
        const data = await res.json();
        setMyRequests(data.requests || []);
      }
    } catch {
      console.error('Failed to fetch requests');
    } finally {
      setLoadingRequests(false);
    }
  }

  // Search districts
  async function searchDistricts(query: string, browse = false) {
    setSearching(true);
    try {
      const params = new URLSearchParams();
      if (query.length >= 2) params.set('q', query);
      if (browse) params.set('browse', '1');
      const res = await fetch(`/api/district-link/search?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.districts || []);
      }
    } catch {
      // ignore
    } finally {
      setSearching(false);
    }
  }

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(() => searchDistricts(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  async function handleSubmitRequest() {
    if (!selectedDistrict) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/district-link/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          districtId: selectedDistrict.id,
          message: message.trim() || null,
          gradeLevel: gradeLevel || null,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(`Request sent to ${selectedDistrict.name}!`);
        setSelectedDistrict(null);
        setMessage('');
        setGradeLevel('');
        setSearchQuery('');
        setSearchResults([]);
        fetchMyRequests();
      } else {
        toast.error(data.error || 'Failed to send request');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  if (authStatus === 'loading') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin text-primary-500" size={32} />
        </div>
      </DashboardLayout>
    );
  }

  const isLinked = !!user?.districtId && user?.accountType === 'DISTRICT';
  const hasPending = myRequests.some(r => r.status === 'pending');

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white">
              <Link2 size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Join a District</h1>
              <p className="text-sm text-gray-500">
                {isLinked
                  ? `You are currently linked to ${user.districtName || 'a district'}`
                  : 'Search for your school district and request to join'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Current status banner */}
        {isLinked && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
            <CheckCircle2 className="text-green-600 flex-shrink-0" size={20} />
            <div>
              <p className="font-medium text-green-800">You are linked to {user.districtName}</p>
              <p className="text-sm text-green-600">You have full district access and features.</p>
            </div>
          </div>
        )}

        {/* Info banner for unlinked students */}
        {!isLinked && !hasPending && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-5"
          >
            <div className="flex items-start gap-3">
              <Sparkles className="text-blue-500 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-medium text-blue-900">Unlock full features by joining a district</p>
                <p className="text-sm text-blue-600 mt-1">
                  While you can use Limud independently with demo-like capabilities, joining a district gives you
                  access to teacher-assigned coursework, official grades, and district-wide resources.
                  Search for your school below and send a request.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Search Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card"
        >
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Search size={18} className="text-gray-400" />
            Search Districts
          </h2>

          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="input-field pl-10"
              placeholder="Type your school or district name..."
            />
            {searching && (
              <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-500 animate-spin" />
            )}
          </div>
          {searchQuery.length < 2 && searchResults.length === 0 && (
            <button
              onClick={() => searchDistricts('', true)}
              className="mt-3 text-sm text-primary-600 hover:text-primary-800 font-medium flex items-center gap-1.5 transition"
            >
              <Building2 size={14} /> Browse all available districts
            </button>
          )}

          {/* Search Results */}
          <AnimatePresence>
            {searchResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 space-y-2"
              >
                {searchResults.map(district => {
                  const alreadyRequested = myRequests.some(
                    r => r.districtId === district.id && r.status === 'pending'
                  );
                  return (
                    <button
                      key={district.id}
                      onClick={() => !alreadyRequested && setSelectedDistrict(district)}
                      disabled={alreadyRequested}
                      className={cn(
                        'w-full flex items-center gap-3 p-3.5 rounded-xl border-2 transition text-left',
                        selectedDistrict?.id === district.id
                          ? 'border-primary-500 bg-primary-50'
                          : alreadyRequested
                          ? 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
                          : 'border-gray-100 hover:border-gray-300 hover:bg-gray-50'
                      )}
                    >
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Building2 size={18} className="text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{district.name}</p>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          {(district.city || district.state) && (
                            <span className="flex items-center gap-1">
                              <MapPin size={10} />
                              {[district.city, district.state].filter(Boolean).join(', ')}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Users size={10} /> {district.memberCount} members
                          </span>
                        </div>
                      </div>
                      {alreadyRequested ? (
                        <span className="text-xs text-amber-600 font-medium bg-amber-50 px-2 py-1 rounded-lg">Pending</span>
                      ) : (
                        <ArrowRight size={16} className="text-gray-300" />
                      )}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>

          {searchQuery.length >= 2 && !searching && searchResults.length === 0 && (
            <p className="text-sm text-gray-400 mt-3 text-center py-4">
              No districts found for &quot;{searchQuery}&quot;. Ask your school administrator to register on Limud.
            </p>
          )}
        </motion.div>

        {/* Request Form — shown when a district is selected */}
        <AnimatePresence>
          {selectedDistrict && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="card border-2 border-primary-200"
            >
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Send size={18} className="text-primary-500" />
                Request to Join {selectedDistrict.name}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Grade Level</label>
                  <select
                    value={gradeLevel}
                    onChange={e => setGradeLevel(e.target.value)}
                    className="input-field"
                  >
                    <option value="">Select your grade</option>
                    {GRADE_LEVELS.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Message to the Administrator <span className="text-gray-400">(optional)</span>
                  </label>
                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    className="input-field resize-none"
                    rows={3}
                    placeholder="Introduce yourself — e.g., your name, your teacher's name, why you want to join..."
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-400 mt-1">{message.length}/500 characters</p>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => setSelectedDistrict(null)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitRequest}
                    disabled={submitting}
                    className="btn-primary flex items-center gap-2"
                  >
                    {submitting ? (
                      <><Loader2 size={16} className="animate-spin" /> Sending...</>
                    ) : (
                      <><Send size={16} /> Send Request</>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* My Requests */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Clock size={18} className="text-gray-400" />
            My Link Requests
          </h2>

          {loadingRequests ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="animate-spin text-primary-500" size={24} />
            </div>
          ) : myRequests.length === 0 ? (
            <div className="text-center py-8">
              <Info size={32} className="mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-400">No link requests yet. Search for a district above to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myRequests.map(request => {
                const config = STATUS_CONFIG[request.status] || STATUS_CONFIG.pending;
                return (
                  <div
                    key={request.id}
                    className={cn('p-4 rounded-xl border', config.bg)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Building2 size={18} className="text-gray-500" />
                        <div>
                          <p className="font-semibold text-gray-900">{request.districtName}</p>
                          {(request.districtCity || request.districtState) && (
                            <p className="text-xs text-gray-500">
                              {[request.districtCity, request.districtState].filter(Boolean).join(', ')}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className={cn('flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full', config.color, config.bg)}>
                        {config.icon}
                        {config.label}
                      </span>
                    </div>
                    {request.gradeLevel && (
                      <p className="text-xs text-gray-500 mt-2">Grade: {request.gradeLevel}</p>
                    )}
                    {request.message && (
                      <p className="text-xs text-gray-500 mt-1 italic">&quot;{request.message}&quot;</p>
                    )}
                    {request.reviewNote && (
                      <p className="text-xs text-gray-600 mt-2 bg-white/50 rounded-lg p-2">
                        <strong>Admin note:</strong> {request.reviewNote}
                      </p>
                    )}
                    <p className="text-[10px] text-gray-400 mt-2">
                      Submitted {new Date(request.createdAt).toLocaleDateString()}
                      {request.reviewedAt && ` — Reviewed ${new Date(request.reviewedAt).toLocaleDateString()}`}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
