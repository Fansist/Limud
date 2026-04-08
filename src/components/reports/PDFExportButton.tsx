'use client';

import { useState, useCallback } from 'react';
import { FileText, Download, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

// v12.0.0 — PDF Report Export Component (Phase 2.4)
// Reusable export button for teacher, parent, and admin dashboards

interface PDFExportButtonProps {
  /** Student ID to export report for */
  studentId?: string;
  /** Label to display */
  label?: string;
  /** Size variant */
  size?: 'sm' | 'md';
  /** Additional CSS classes */
  className?: string;
  /** Export type — controls what data to include */
  exportType?: 'student-progress' | 'class-summary' | 'district-overview';
  /** Optional date range */
  dateRange?: { start: string; end: string };
}

export default function PDFExportButton({
  studentId,
  label = 'Export PDF',
  size = 'sm',
  className = '',
  exportType = 'student-progress',
  dateRange,
}: PDFExportButtonProps) {
  const [exporting, setExporting] = useState(false);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (studentId) params.set('studentId', studentId);
      if (exportType) params.set('type', exportType);
      if (dateRange?.start) params.set('startDate', dateRange.start);
      if (dateRange?.end) params.set('endDate', dateRange.end);

      const res = await fetch(`/api/reports/export?${params.toString()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, type: exportType, dateRange }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Export failed');
      }

      const contentType = res.headers.get('content-type');
      
      if (contentType?.includes('application/pdf')) {
        // Real PDF binary
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `limud-report-${exportType}-${new Date().toISOString().slice(0, 10)}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('PDF exported successfully');
      } else {
        // JSON response with base64 or demo data
        const data = await res.json();
        if (data.pdf) {
          // Base64 encoded PDF
          const binary = atob(data.pdf);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
          const blob = new Blob([bytes], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `limud-report-${exportType}-${new Date().toISOString().slice(0, 10)}.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          toast.success('PDF exported successfully');
        } else {
          // Demo mode — show summary
          toast.success('Report generated (Demo mode — PDF download simulated)');
        }
      }
    } catch (error: any) {
      console.error('[PDF Export]', error);
      toast.error(error.message || 'Failed to export PDF');
    } finally {
      setExporting(false);
    }
  }, [studentId, exportType, dateRange]);

  const sizeClasses = size === 'sm'
    ? 'text-xs px-3 py-1.5 gap-1.5'
    : 'text-sm px-4 py-2 gap-2';

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className={`inline-flex items-center ${sizeClasses} rounded-lg font-medium transition
        ${exporting
          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 shadow-sm'
        } ${className}`}
    >
      {exporting ? (
        <Loader2 size={size === 'sm' ? 12 : 14} className="animate-spin" />
      ) : (
        <Download size={size === 'sm' ? 12 : 14} />
      )}
      {exporting ? 'Exporting...' : label}
    </button>
  );
}
