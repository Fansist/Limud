'use client';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion } from 'framer-motion';
import { cn, AVATAR_OPTIONS } from '@/lib/utils';
import { UserPlus } from 'lucide-react';

type TeacherInfo = {
  id: string;
  name: string | null;
  email: string;
  selectedAvatar: string | null;
  avatarUrl: string | null;
};

type LinkRequest = {
  id: string;
  status: string;
  message: string | null;
  teacher: TeacherInfo;
};

type ActionState = {
  linkId: string;
  action: 'approve' | 'reject';
};

function TeacherAvatar({ teacher }: { teacher: TeacherInfo }) {
  if (teacher.avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={teacher.avatarUrl}
        alt={teacher.name ?? 'Teacher'}
        className="w-12 h-12 rounded-full object-cover"
      />
    );
  }
  if (teacher.selectedAvatar) {
    const found = AVATAR_OPTIONS.find((a) => a.id === teacher.selectedAvatar);
    if (found) {
      return (
        <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-2xl">
          {found.emoji}
        </div>
      );
    }
  }
  // Fallback: initials
  const initials = (teacher.name ?? teacher.email)
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <div className="w-12 h-12 rounded-full bg-primary-200 flex items-center justify-center text-sm font-bold text-primary-800">
      {initials}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="card animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-1/3" />
          <div className="h-3 bg-gray-200 rounded w-1/2" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-20 bg-gray-200 rounded-lg" />
          <div className="h-9 w-20 bg-gray-200 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export default function StudentLinksPage() {
  const { data: session, status } = useSession();
  const [requests, setRequests] = useState<LinkRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [inFlight, setInFlight] = useState<ActionState | null>(null);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchRequests();
    }
  }, [status]);

  async function fetchRequests() {
    try {
      const res = await fetch('/api/student/teacher-links');
      if (res.ok) {
        const data = await res.json() as { requests: LinkRequest[] };
        setRequests(data.requests ?? []);
      }
    } catch (err) {
      console.error('Failed to fetch teacher link requests:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(linkId: string, action: 'approve' | 'reject') {
    setInFlight({ linkId, action });
    try {
      const res = await fetch('/api/student/teacher-links', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkId, action }),
      });
      if (res.ok) {
        // Optimistic remove
        setRequests((prev) => prev.filter((r) => r.id !== linkId));
      }
    } catch (err) {
      console.error('Failed to update link:', err);
    } finally {
      setInFlight(null);
    }
  }

  const isLoading = status === 'loading' || loading;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-3xl mx-auto space-y-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <UserPlus className="text-primary-500" /> Teacher Connections
          </h1>
          <div className="space-y-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <UserPlus className="text-primary-500" /> Teacher Connections
        </h1>

        {requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
              <UserPlus size={28} className="text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">No pending teacher requests</p>
            <p className="text-sm text-gray-400 mt-1">
              When a teacher sends you a connection request, it will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request, i) => {
              const isApproving = inFlight?.linkId === request.id && inFlight.action === 'approve';
              const isRejecting = inFlight?.linkId === request.id && inFlight.action === 'reject';
              const busy = inFlight?.linkId === request.id;

              return (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.06 }}
                  className="card"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Avatar + Teacher info */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <TeacherAvatar teacher={request.teacher} />
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 truncate">
                          {request.teacher.name ?? 'Unknown Teacher'}
                        </p>
                        <p className="text-sm text-gray-400 truncate">{request.teacher.email}</p>
                        {request.message && (
                          <p className="text-sm text-gray-500 italic mt-1 line-clamp-2">
                            &ldquo;{request.message}&rdquo;
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Accept */}
                      <button
                        onClick={() => handleAction(request.id, 'approve')}
                        disabled={busy}
                        className={cn(
                          'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all',
                          'bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60 disabled:cursor-not-allowed'
                        )}
                      >
                        {isApproving ? (
                          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                        ) : null}
                        Accept
                      </button>

                      {/* Decline */}
                      <button
                        onClick={() => handleAction(request.id, 'reject')}
                        disabled={busy}
                        className={cn(
                          'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all',
                          'border-2 border-gray-300 text-gray-600 hover:border-red-400 hover:text-red-600',
                          'disabled:opacity-60 disabled:cursor-not-allowed'
                        )}
                      >
                        {isRejecting ? (
                          <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                        ) : null}
                        Decline
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
