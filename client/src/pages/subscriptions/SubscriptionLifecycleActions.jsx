// Plan-governed pause, resume, renewal and early-close controls (PS-14).
import { useState } from 'react';
import { Field } from '../../components/ui.jsx';

const firstRenewalDate = (expiryDate) => {
  const date = new Date(expiryDate);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
};

export default function SubscriptionLifecycleActions({ subscription, disabled, onAction }) {
  const [renewalOpen, setRenewalOpen] = useState(false);
  const [expiryDate, setExpiryDate] = useState('');
  const canPauseOrResume = subscription.plan.canPause;
  const canClose = subscription.plan.canCloseEarly && ['ACTIVE', 'PAUSED'].includes(subscription.status);
  const canRenew = subscription.plan.canRenew && subscription.status === 'ACTIVE';

  const handleRenew = async (event) => {
    event.preventDefault();
    if (await onAction('renew', { expiryDate })) setRenewalOpen(false);
  };

  return (
    <section className="card space-y-4">
      <h2 className="font-semibold text-slate-900">Subscription actions</h2>
      <div className="flex flex-wrap gap-2">
        {subscription.status === 'ACTIVE' && canPauseOrResume && (
          <button className="btn-secondary" disabled={disabled} onClick={() => onAction('pause')}>
            Pause billing
          </button>
        )}
        {subscription.status === 'PAUSED' && canPauseOrResume && (
          <button className="btn-primary" disabled={disabled} onClick={() => onAction('resume')}>
            Resume billing
          </button>
        )}
        {canRenew && (
          <button className="btn-secondary" disabled={disabled} onClick={() => setRenewalOpen(!renewalOpen)}>
            Renew subscription
          </button>
        )}
        {canClose && (
          <button
            className="btn-danger"
            disabled={disabled}
            onClick={() => {
              if (window.confirm('Close this subscription early? Future billing will stop.'))
                onAction('close');
            }}
          >
            Close early
          </button>
        )}
        {!canPauseOrResume && !canRenew && !canClose && (
          <p className="text-sm text-slate-500">No lifecycle actions are available under this plan.</p>
        )}
      </div>
      {subscription.status === 'PAUSED' && (
        <p className="text-sm text-slate-600">
          Billing is stopped while paused. Resuming schedules billing at the next period boundary.
        </p>
      )}
      {renewalOpen && canRenew && (
        <form
          onSubmit={handleRenew}
          className="grid gap-3 sm:grid-cols-[minmax(12rem,20rem)_auto] sm:items-end"
        >
          <Field label="New expiry date">
            <input
              aria-label="New expiry date"
              className="input"
              type="date"
              min={firstRenewalDate(subscription.expiryDate)}
              required
              value={expiryDate}
              onChange={(event) => setExpiryDate(event.target.value)}
            />
          </Field>
          <button className="btn-primary" disabled={disabled || !expiryDate}>
            {disabled ? 'Saving...' : 'Save renewal'}
          </button>
        </form>
      )}
    </section>
  );
}
