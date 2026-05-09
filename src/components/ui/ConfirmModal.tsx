'use client';
import { ReactNode, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

type ConfirmModalProps = {
  open: boolean;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmModal({
  open, title, description,
  confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  destructive = false, onConfirm, onCancel
}: ConfirmModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="confirm-title" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-md w-full p-6">
        <div className="flex gap-3 items-start">
          {destructive && <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 flex items-center justify-center flex-shrink-0"><AlertTriangle size={20} /></div>}
          <div className="flex-1">
            <h2 id="confirm-title" className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
            {description && <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</div>}
          </div>
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition">{cancelLabel}</button>
          <button onClick={onConfirm} className={`px-4 py-2 rounded-lg font-medium text-sm text-white transition ${destructive ? 'bg-red-600 hover:bg-red-700' : 'bg-primary-600 hover:bg-primary-700'}`}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
