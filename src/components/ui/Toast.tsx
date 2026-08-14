import React from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  const bgStyles: Record<ToastType, string> = {
    success: 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200',
    error: 'bg-rose-950/90 border-rose-500/40 text-rose-200',
    info: 'bg-cyan-950/90 border-cyan-500/40 text-cyan-200',
    warning: 'bg-amber-950/90 border-amber-500/40 text-amber-200',
  };

  const iconStyles: Record<ToastType, string> = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
    warning: '⚠',
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto p-3.5 rounded-xl border shadow-xl text-xs flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200 ${
            bgStyles[toast.type]
          }`}
        >
          <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center font-bold shrink-0">
            {iconStyles[toast.type]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold">{toast.title}</p>
            {toast.message && <p className="text-[11px] opacity-80 mt-0.5">{toast.message}</p>}
          </div>
          <button
            onClick={() => onDismiss(toast.id)}
            className="opacity-60 hover:opacity-100 p-0.5 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
