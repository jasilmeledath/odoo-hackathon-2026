// Holds the toast queue and renders it in a fixed corner. Success and info fade after
// four seconds, errors stay for six so people have time to read them.
import { useCallback, useMemo, useRef, useState } from 'react';
import { ToastContext } from '../lib/toast.js';

const MAX_VISIBLE = 4;
const DURATION_MS = { success: 4000, info: 4000, error: 6000 };

const TONES = {
  success: { ring: 'bg-emerald-100 text-emerald-700', bar: 'border-l-emerald-500', path: 'm5 10.5 3 3 7-7' },
  error: { ring: 'bg-red-100 text-red-700', bar: 'border-l-red-500', path: 'M10 6v4.5M10 13.5h.01' },
  info: { ring: 'bg-sky-100 text-sky-700', bar: 'border-l-sky-500', path: 'M10 9v4.5M10 6.5h.01' },
};

function ToastItem({ toast, onDismiss }) {
  const tone = TONES[toast.tone];
  return (
    <div
      role={toast.tone === 'error' ? 'alert' : 'status'}
      className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-l-4 border-slate-200 bg-white p-4 shadow-lg ${tone.bar}`}
    >
      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${tone.ring}`}>
        <svg
          viewBox="0 0 20 20"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          aria-hidden="true"
        >
          <path d={tone.path} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <p className="min-w-0 flex-1 pt-0.5 text-sm text-slate-800">{toast.message}</p>
      <button
        type="button"
        aria-label="Dismiss notification"
        className="-m-1 shrink-0 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        onClick={() => onDismiss(toast.id)}
      >
        <svg
          viewBox="0 0 20 20"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          aria-hidden="true"
        >
          <path d="m5.5 5.5 9 9m0-9-9 9" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id) => setToasts((current) => current.filter((toast) => toast.id !== id)), []);

  const show = useCallback(
    (tone, message) => {
      nextId.current += 1;
      const id = nextId.current;
      setToasts((current) => [...current.slice(-(MAX_VISIBLE - 1)), { id, tone, message }]);
      setTimeout(() => dismiss(id), DURATION_MS[tone]);
    },
    [dismiss],
  );

  const value = useMemo(
    () => ({
      success: (message) => show('success', message),
      error: (message) => show('error', message),
      info: (message) => show('info', message),
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-6 sm:items-end"
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
