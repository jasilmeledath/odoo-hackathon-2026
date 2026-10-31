// Shared UI pieces. Use these instead of restyling each screen.
import { formatLabel } from '../lib/format.js';

export function Field({ label, inputId, error, errorId, hint, children }) {
  return (
    <div>
      <label className="label" htmlFor={inputId}>
        {label}
      </label>
      {children}
      {error ? (
        <p id={errorId} className="mt-1 text-xs text-red-600" role={errorId ? 'alert' : undefined}>
          {error}
        </p>
      ) : (
        hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>
      )}
    </div>
  );
}

const NEUTRAL = 'bg-slate-100 text-slate-700';
const WAITING = 'bg-amber-100 text-amber-800';
const PROGRESS = 'bg-sky-100 text-sky-800';
const GOOD = 'bg-emerald-100 text-emerald-800';
const BAD = 'bg-red-100 text-red-800';

const STATUS_STYLES = {
  DRAFT: NEUTRAL,
  QUOTATION: WAITING,
  CONFIRMED: PROGRESS,
  ACTIVE: GOOD,
  PAUSED: WAITING,
  CLOSED: NEUTRAL,
  PAID: GOOD,
  CANCELED: BAD,
  OVERDUE: BAD,
};

export const StatusBadge = ({ status }) => (
  <span
    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status] ?? NEUTRAL}`}
  >
    {formatLabel(status)}
  </span>
);

export const Alert = ({ children, tone = 'error' }) =>
  children ? (
    <div
      className={`rounded-lg px-4 py-3 text-sm ${
        tone === 'error' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
      }`}
    >
      {children}
    </div>
  ) : null;

export const Spinner = () => (
  <div className="flex justify-center py-12">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600" />
  </div>
);

export const PageHeader = ({ title, subtitle, action }) => (
  <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
    </div>
    {action}
  </div>
);

export const EmptyState = ({ title, children }) => (
  <div className="card py-10 text-center">
    <p className="font-medium text-slate-900">{title}</p>
    {children && <p className="mt-1 text-sm text-slate-500">{children}</p>}
  </div>
);

export function Pagination({ page, pages, onChange, disabled = false }) {
  if (pages <= 1) return null;
  return (
    <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
      <button
        className="btn-secondary"
        type="button"
        disabled={disabled || page <= 1}
        onClick={() => onChange(page - 1)}
      >
        Previous
      </button>
      <span>
        Page {page} of {pages}
      </span>
      <button
        className="btn-secondary"
        type="button"
        disabled={disabled || page >= pages}
        onClick={() => onChange(page + 1)}
      >
        Next
      </button>
    </div>
  );
}
