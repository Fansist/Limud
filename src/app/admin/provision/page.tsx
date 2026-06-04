'use client';
import { useIsDemo } from '@/lib/hooks';
import { useSession } from 'next-auth/react';
import { useState, useRef } from 'react';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import Papa from 'papaparse';
import {
  Upload, FileSpreadsheet, CheckCircle2, XCircle, Users,
  Download, AlertTriangle, Copy,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type ParsedUser = {
  email: string;
  name: string;
  role: string;
  gradeLevel?: string;
};

type ProvisionResult = {
  email: string;
  success: boolean;
  tempPassword?: string;
  error?: string;
};

export default function ProvisionPage() {
  const { data: session } = useSession();
  const isDemo = useIsDemo();
  const [parsedUsers, setParsedUsers] = useState<ParsedUser[]>([]);
  const [results, setResults] = useState<ProvisionResult[] | null>(null);
  const [uploading, setUploading] = useState(false);
  const [manualForm, setManualForm] = useState({ email: '', name: '', role: 'STUDENT', gradeLevel: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const users: ParsedUser[] = result.data.map((row: any) => ({
          email: row.email || row.Email || '',
          name: row.name || row.Name || row['Full Name'] || '',
          role: (row.role || row.Role || 'STUDENT').toUpperCase(),
          gradeLevel: row.gradeLevel || row['Grade Level'] || row.grade || '',
        })).filter((u: ParsedUser) => u.email && u.name);

        setParsedUsers(users);
        setResults(null);
        toast.success(`Parsed ${users.length} users from CSV`);
      },
      error: () => {
        toast.error('Failed to parse CSV file');
      },
    });
  }

  async function handleProvision() {
    if (parsedUsers.length === 0) {
      toast.error('No users to provision');
      return;
    }

    setUploading(true);
    try {
      if (isDemo) {
        // Simulate provisioning in demo mode — synthesize fake temp passwords
        // so demo admins see the same UX (copy / CSV export / warning banner)
        // they will see in production.
        await new Promise(r => setTimeout(r, 1500));
        const demoResults: ProvisionResult[] = parsedUsers.map((u, idx) => ({
          email: u.email,
          success: true,
          tempPassword: `demo-temp-${(idx + 1).toString().padStart(3, '0')}-${Math.random().toString(36).slice(2, 8)}`,
        }));
        setResults(demoResults);
        toast.success(`${parsedUsers.length} users provisioned (Demo)`);
        setUploading(false);
        return;
      }
      const res = await fetch('/api/admin/provision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ users: parsedUsers }),
      });

      if (res.ok) {
        const data = await res.json();
        setResults(data.results as ProvisionResult[]);
        toast.success(data.message);
      } else {
        const data = await res.json();
        toast.error(data.error || 'Provisioning failed');
      }
    } catch {
      toast.error('Provisioning failed');
    } finally {
      setUploading(false);
    }
  }

  async function handleAddManual() {
    if (!manualForm.email || !manualForm.name) {
      toast.error('Email and name are required');
      return;
    }
    setParsedUsers(prev => [...prev, { ...manualForm }]);
    setManualForm({ email: '', name: '', role: 'STUDENT', gradeLevel: '' });
    toast.success('User added to batch');
  }

  function downloadTemplate() {
    const csv = 'email,name,role,gradeLevel\nstudent@school.edu,John Smith,STUDENT,7th\nteacher@school.edu,Jane Doe,TEACHER,\nparent@email.com,Bob Parent,PARENT,';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'limud-provision-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  function csvEscape(value: string): string {
    // RFC 4180: wrap in quotes and double any embedded quotes if the field
    // contains a comma, quote, CR, or LF.
    if (/[",\r\n]/.test(value)) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  function downloadResultsCsv() {
    if (!results || results.length === 0) return;
    const header = 'email,role,success,tempPassword,error';
    const rows = results.map((r, i) => {
      const role = parsedUsers[i]?.role ?? '';
      return [
        csvEscape(r.email ?? ''),
        csvEscape(role),
        r.success ? 'true' : 'false',
        csvEscape(r.tempPassword ?? ''),
        csvEscape(r.error ?? ''),
      ].join(',');
    });
    const csv = [header, ...rows].join('\n') + '\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    a.download = `limud-provision-results-${stamp}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Results downloaded');
  }

  function copyTempPassword(password: string) {
    if (!navigator?.clipboard?.writeText) {
      toast.error('Clipboard not available');
      return;
    }
    navigator.clipboard
      .writeText(password)
      .then(() => toast.success('Password copied'))
      .catch(() => toast.error('Copy failed'));
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Upload className="text-primary-500" />
          Bulk Account Provisioning
        </h1>

        {/* CSV Upload */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">Upload CSV</h2>
            <button onClick={downloadTemplate} className="btn-secondary text-xs flex items-center gap-1">
              <Download size={14} />
              Download Template
            </button>
          </div>

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center cursor-pointer hover:border-primary-300 hover:bg-primary-50/30 transition"
          >
            <FileSpreadsheet size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm font-medium text-gray-600">Click to upload CSV file</p>
            <p className="text-xs text-gray-400 mt-1">
              Columns: email, name, role (STUDENT/TEACHER/PARENT), gradeLevel (optional)
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        {/* Manual Add */}
        <div className="card">
          <h2 className="font-bold text-gray-900 mb-4">Manual Entry</h2>
          <div className="grid sm:grid-cols-5 gap-3">
            <input
              value={manualForm.email}
              onChange={e => setManualForm(f => ({ ...f, email: e.target.value }))}
              placeholder="Email"
              className="input-field"
            />
            <input
              value={manualForm.name}
              onChange={e => setManualForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Full Name"
              className="input-field"
            />
            <select
              value={manualForm.role}
              onChange={e => setManualForm(f => ({ ...f, role: e.target.value }))}
              className="input-field"
            >
              <option value="STUDENT">Student</option>
              <option value="TEACHER">Teacher</option>
              <option value="PARENT">Parent</option>
            </select>
            <input
              value={manualForm.gradeLevel}
              onChange={e => setManualForm(f => ({ ...f, gradeLevel: e.target.value }))}
              placeholder="Grade (optional)"
              className="input-field"
            />
            <button onClick={handleAddManual} className="btn-secondary">
              Add
            </button>
          </div>
        </div>

        {/* Preview */}
        {parsedUsers.length > 0 && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <Users size={18} />
                Users to Provision ({parsedUsers.length})
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => { setParsedUsers([]); setResults(null); }}
                  className="btn-secondary text-xs"
                >
                  Clear All
                </button>
                <button
                  onClick={handleProvision}
                  disabled={uploading}
                  className="btn-primary text-sm flex items-center gap-2"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      Provisioning...
                    </>
                  ) : (
                    <>
                      <Upload size={14} />
                      Provision All
                    </>
                  )}
                </button>
              </div>
            </div>

            {results && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start gap-2">
                <AlertTriangle size={18} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-800">
                    These passwords are shown only once.
                  </p>
                  <p className="text-xs text-yellow-700 mt-0.5">
                    Copy or download before leaving this page — they cannot be recovered.
                  </p>
                </div>
                <button
                  onClick={downloadResultsCsv}
                  className="btn-secondary text-xs flex items-center gap-1 flex-shrink-0"
                >
                  <Download size={14} />
                  Download as CSV
                </button>
              </div>
            )}

            <div className="overflow-x-auto max-h-64 overflow-y-auto custom-scrollbar">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 px-2 text-gray-500 font-medium">Email</th>
                    <th className="text-left py-2 px-2 text-gray-500 font-medium">Name</th>
                    <th className="text-left py-2 px-2 text-gray-500 font-medium">Role</th>
                    <th className="text-left py-2 px-2 text-gray-500 font-medium">Grade</th>
                    {results && (
                      <>
                        <th className="text-center py-2 px-2 text-gray-500 font-medium">Status</th>
                        <th className="text-left py-2 px-2 text-gray-500 font-medium">
                          Temp password
                          <span className="block text-[10px] font-normal text-gray-400 normal-case">
                            Hidden after this session — copy it now.
                          </span>
                        </th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {parsedUsers.map((user, i) => {
                    const result = results?.[i];
                    return (
                      <tr key={i} className="border-b border-gray-50">
                        <td className="py-2 px-2 text-gray-700">{user.email}</td>
                        <td className="py-2 px-2 text-gray-700">{user.name}</td>
                        <td className="py-2 px-2">
                          <span className={cn(
                            'badge',
                            user.role === 'STUDENT' ? 'badge-info' :
                            user.role === 'TEACHER' ? 'badge-success' :
                            'badge-warning'
                          )}>
                            {user.role}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-gray-500">{user.gradeLevel || '—'}</td>
                        {results && (
                          <>
                            <td className="py-2 px-2 text-center">
                              {result?.success ? (
                                <CheckCircle2 size={16} className="text-green-500 mx-auto" />
                              ) : (
                                <div className="flex items-center justify-center gap-1">
                                  <XCircle size={16} className="text-red-500" />
                                  <span className="text-xs text-red-500">{result?.error}</span>
                                </div>
                              )}
                            </td>
                            <td className="py-2 px-2">
                              {(() => {
                                const pw = result?.success ? result.tempPassword : undefined;
                                if (!pw) {
                                  return <span className="text-xs text-gray-300">—</span>;
                                }
                                return (
                                  <div className="flex items-center gap-2">
                                    <code className="font-mono text-xs bg-gray-50 border border-gray-200 px-2 py-1 rounded select-all">
                                      {pw}
                                    </code>
                                    <button
                                      type="button"
                                      onClick={() => copyTempPassword(pw)}
                                      className="text-gray-400 hover:text-primary-600 transition"
                                      title="Copy password"
                                      aria-label={`Copy temp password for ${result?.email ?? ''}`}
                                    >
                                      <Copy size={14} />
                                    </button>
                                  </div>
                                );
                              })()}
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {results && (
              <div className="mt-4 p-3 bg-green-50 rounded-xl text-sm text-green-700">
                {results.filter(r => r.success).length} created successfully,{' '}
                {results.filter(r => !r.success).length} failed. A unique secure
                password is auto-generated for each account and shown above —
                copy or export before you leave this page.
              </div>
            )}
          </div>
        )}

        {/* Info */}
        <div className="card bg-blue-50 border-blue-100">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-800">Provisioning Notes</p>
              <ul className="text-xs text-blue-600 mt-1 space-y-1">
                <li>• A unique secure password is auto-generated for each account and shown below after submission. Copy or download the list before leaving this page — passwords cannot be recovered later.</li>
                <li>• Users will be assigned to your district automatically</li>
                <li>• Students get learning profiles initialized automatically</li>
                <li>• Duplicate emails are skipped (existing accounts preserved)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
