'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Search, Users, Building2, ArrowRight, Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

type StudentLink = {
  id: string;
  status: string;
  student: {
    id: string;
    name: string | null;
    email: string;
    gradeLevel: string | null;
  };
};

type DistrictResult = {
  id: string;
  name: string;
  subdomain: string;
};

type DistrictRequest = {
  id: string;
  status: string;
  district: {
    id: string;
    name: string;
    subdomain: string;
  };
  createdAt: string;
};

export default function TeacherSetupPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // ── Panel A — Direct student links ──
  const [studentId, setStudentId] = useState('');
  const [studentMessage, setStudentMessage] = useState('');
  const [pendingLinks, setPendingLinks] = useState<StudentLink[]>([]);
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [linkSuccess, setLinkSuccess] = useState<string | null>(null);

  // ── Panel B — Join a district ──
  const [districtQuery, setDistrictQuery] = useState('');
  const [districtResults, setDistrictResults] = useState<DistrictResult[]>([]);
  const [districtSearching, setDistrictSearching] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictResult | null>(null);
  const [requestMessage, setRequestMessage] = useState('');
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [requestSuccess, setRequestSuccess] = useState<string | null>(null);
  const [districtRequests, setDistrictRequests] = useState<DistrictRequest[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated') {
      const user = session?.user as { role?: string } | undefined;
      if (user?.role !== 'TEACHER') {
        router.push('/');
        return;
      }
      fetchPendingLinks();
      fetchDistrictRequests();
    }
  }, [status]);

  async function fetchPendingLinks() {
    try {
      const res = await fetch('/api/teacher/students?status=PENDING');
      if (res.ok) {
        const data = await res.json() as { links: StudentLink[] };
        setPendingLinks(data.links || []);
      }
    } catch {}
  }

  async function fetchDistrictRequests() {
    try {
      const res = await fetch('/api/teacher/district-requests');
      if (res.ok) {
        const data = await res.json() as { requests: DistrictRequest[] };
        setDistrictRequests(data.requests || []);
      }
    } catch {}
  }

  async function handleSendStudentLink(e: React.FormEvent) {
    e.preventDefault();
    if (!studentId.trim()) return;
    setLinkLoading(true);
    setLinkError(null);
    setLinkSuccess(null);
    try {
      const res = await fetch('/api/teacher/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: studentId.trim(), message: studentMessage.trim() || undefined }),
      });
      const data = await res.json() as { error?: string };
      if (res.ok) {
        setLinkSuccess('Link request sent! The student will be notified.');
        setStudentId('');
        setStudentMessage('');
        fetchPendingLinks();
      } else {
        setLinkError(data.error || 'Failed to send link request.');
      }
    } catch {
      setLinkError('Something went wrong. Please try again.');
    } finally {
      setLinkLoading(false);
    }
  }

  async function handleDistrictSearch(query: string) {
    setDistrictQuery(query);
    setSelectedDistrict(null);
    if (query.trim().length < 2) {
      setDistrictResults([]);
      return;
    }
    setDistrictSearching(true);
    try {
      const res = await fetch(`/api/district-link/search?q=${encodeURIComponent(query.trim())}`);
      if (res.ok) {
        const data = await res.json() as { districts: DistrictResult[] };
        setDistrictResults(data.districts || []);
      }
    } catch {
      setDistrictResults([]);
    } finally {
      setDistrictSearching(false);
    }
  }

  async function handleSendDistrictRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedDistrict) return;
    setRequestLoading(true);
    setRequestError(null);
    setRequestSuccess(null);
    try {
      const res = await fetch('/api/teacher/district-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          districtId: selectedDistrict.id,
          message: requestMessage.trim() || undefined,
        }),
      });
      const data = await res.json() as { error?: string };
      if (res.ok) {
        setRequestSuccess(`Request sent to ${selectedDistrict.name}!`);
        setSelectedDistrict(null);
        setDistrictQuery('');
        setDistrictResults([]);
        setRequestMessage('');
        fetchDistrictRequests();
      } else {
        setRequestError(data.error || 'Failed to send request.');
      }
    } catch {
      setRequestError('Something went wrong. Please try again.');
    } finally {
      setRequestLoading(false);
    }
  }

  const statusBadge = (s: string) => {
    if (s === 'PENDING') return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700"><Clock size={10} /> Pending</span>;
    if (s === 'ACTIVE' || s === 'APPROVED') return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700"><CheckCircle2 size={10} /> Approved</span>;
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700"><XCircle size={10} /> Rejected</span>;
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50 to-orange-100 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50 to-orange-100 p-4 lg:p-8">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Set Up Your Teacher Account</h1>
          <p className="text-gray-500 mt-2">
            Link directly to students or join your school district to unlock your full dashboard.
          </p>
        </div>

        {/* Two-column layout */}
        <div className="grid lg:grid-cols-2 gap-6">

          {/* ── Panel A — Direct student links ── */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Users size={20} className="text-blue-600" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">Link Directly to Students</h2>
                <p className="text-xs text-gray-500">Send a link request using the student&apos;s Limud user ID</p>
              </div>
            </div>

            <form onSubmit={handleSendStudentLink} className="space-y-3">
              <div>
                <label htmlFor="setup-student-id" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Student User ID
                </label>
                <input
                  id="setup-student-id"
                  type="text"
                  value={studentId}
                  onChange={e => setStudentId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400"
                  placeholder="Paste the student's Limud user ID"
                />
                <p className="text-xs text-gray-400 mt-1">Ask your student to share their Limud user ID from their profile settings.</p>
              </div>
              <div>
                <label htmlFor="setup-student-message" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Message <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  id="setup-student-message"
                  type="text"
                  value={studentMessage}
                  onChange={e => setStudentMessage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400"
                  placeholder="Hi, I'm your teacher…"
                />
              </div>
              {linkError && <p className="text-xs text-red-600" role="alert">{linkError}</p>}
              {linkSuccess && <p className="text-xs text-green-600" role="status">{linkSuccess}</p>}
              <button
                type="submit"
                disabled={linkLoading || !studentId.trim()}
                className={cn(
                  'w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium transition-all',
                  'bg-blue-600 text-white hover:bg-blue-700',
                  (linkLoading || !studentId.trim()) && 'opacity-50 cursor-not-allowed'
                )}
              >
                {linkLoading ? <Loader2 size={14} className="animate-spin" /> : null}
                Send Link Request
              </button>
            </form>

            {/* Pending links list */}
            {pendingLinks.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Pending Requests</p>
                <div className="space-y-2">
                  {pendingLinks.map(link => (
                    <div key={link.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{link.student.name || link.student.email}</p>
                        <p className="text-xs text-gray-400 truncate">{link.student.email}</p>
                      </div>
                      {statusBadge(link.status)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Panel B — Join a district ── */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Building2 size={20} className="text-amber-600" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">Join a District</h2>
                <p className="text-xs text-gray-500">Search for your school or district and send a join request</p>
              </div>
            </div>

            {/* District search */}
            {!selectedDistrict ? (
              <div className="space-y-3">
                <div className="relative">
                  <label htmlFor="setup-district-search" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Search Districts
                  </label>
                  <div className="relative">
                    <input
                      id="setup-district-search"
                      type="text"
                      value={districtQuery}
                      onChange={e => handleDistrictSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400"
                      placeholder="e.g. Springfield School District"
                    />
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                </div>

                {districtSearching && (
                  <div className="flex items-center gap-2 text-xs text-gray-400 py-1">
                    <Loader2 size={12} className="animate-spin" /> Searching…
                  </div>
                )}

                {districtResults.length > 0 && (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {districtResults.map(d => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => setSelectedDistrict(d)}
                        className="w-full text-left p-3 rounded-xl border border-gray-200 hover:border-amber-400 hover:bg-amber-50 transition-all"
                      >
                        <p className="text-sm font-semibold text-gray-900">{d.name}</p>
                        <p className="text-xs text-gray-400">{d.subdomain}</p>
                      </button>
                    ))}
                  </div>
                )}

                {districtQuery.length >= 2 && !districtSearching && districtResults.length === 0 && (
                  <p className="text-xs text-gray-400">No districts found. Try a different search term.</p>
                )}
              </div>
            ) : (
              <form onSubmit={handleSendDistrictRequest} className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-200">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{selectedDistrict.name}</p>
                    <p className="text-xs text-gray-400">{selectedDistrict.subdomain}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setSelectedDistrict(null); setRequestError(null); setRequestSuccess(null); }}
                    className="text-xs text-gray-400 hover:text-gray-600 underline"
                  >
                    Change
                  </button>
                </div>
                <div>
                  <label htmlFor="setup-request-message" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Message <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <textarea
                    id="setup-request-message"
                    value={requestMessage}
                    onChange={e => setRequestMessage(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400 resize-none"
                    placeholder="Hi, I'm a teacher at…"
                  />
                </div>
                {requestError && <p className="text-xs text-red-600" role="alert">{requestError}</p>}
                {requestSuccess && <p className="text-xs text-green-600" role="status">{requestSuccess}</p>}
                <button
                  type="submit"
                  disabled={requestLoading}
                  className={cn(
                    'w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium transition-all',
                    'bg-amber-500 text-white hover:bg-amber-600',
                    requestLoading && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  {requestLoading ? <Loader2 size={14} className="animate-spin" /> : null}
                  Send Request
                </button>
              </form>
            )}

            {/* Existing district requests */}
            {districtRequests.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Your Requests</p>
                <div className="space-y-2">
                  {districtRequests.map(req => (
                    <div key={req.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{req.district.name}</p>
                        <p className="text-xs text-gray-400 truncate">{req.district.subdomain}</p>
                      </div>
                      {statusBadge(req.status)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Skip link */}
        <div className="mt-8 text-center">
          <Link
            href="/teacher/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            I&apos;ll do this later <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
