// Subscription status, terms, lines, invoices and history (PS-12, PS-13).
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Alert, PageHeader, Spinner, StatusBadge } from '../../components/ui.jsx';
import { api } from '../../lib/api.js';
import { formatDate, formatLabel, formatMoney } from '../../lib/format.js';
import { useApi } from '../../lib/useApi.js';
import { ActivityTimeline, InvoiceList, SubscriptionLines } from './SubscriptionDetailSections.jsx';

const STATUS_STEPS = ['DRAFT', 'QUOTATION', 'CONFIRMED', 'ACTIVE', 'CLOSED'];

function StatusBar({ status }) {
  const currentStatus = status === 'PAUSED' ? 'ACTIVE' : status;
  const currentIndex = STATUS_STEPS.indexOf(currentStatus);
  return (
    <ol aria-label="Subscription status history" className="card grid grid-cols-2 gap-3 sm:grid-cols-5">
      {STATUS_STEPS.map((step, index) => {
        const isComplete = index <= currentIndex;
        const label = status === 'PAUSED' && step === 'ACTIVE' ? 'PAUSED' : step;
        return (
          <li key={step} className="flex items-center gap-2 text-sm">
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                isComplete ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500'
              }`}
            >
              {index + 1}
            </span>
            <span className={isComplete ? 'font-medium text-slate-900' : 'text-slate-500'}>
              {formatLabel(label)}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function SubscriptionSummary({ subscription }) {
  const fields = [
    ['Customer', subscription.customer.companyName || subscription.customer.name],
    ['Email', subscription.customer.email],
    ['Phone', subscription.customer.phone || '—'],
    ['Plan', subscription.plan.name],
    ['Billing period', formatLabel(subscription.plan.billingPeriod)],
    ['Payment terms', `${subscription.paymentTerm.name} (${subscription.paymentTerm.dueDays} days)`],
    ['Start date', formatDate(subscription.startDate)],
    ['Expiry date', formatDate(subscription.expiryDate)],
    ['Quotation expires', formatDate(subscription.quotationExpiryDate) || '—'],
    ['Next invoice', formatDate(subscription.nextInvoiceDate) || '—'],
    ['Recurring amount', formatMoney(subscription.recurringAmount)],
    ['Monthly recurring', formatMoney(subscription.monthlyRecurringAmount)],
  ];
  return (
    <dl className="card grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
      {fields.map(([label, value]) => (
        <div key={label}>
          <dt className="text-slate-500">{label}</dt>
          <dd className="mt-1 font-medium text-slate-900">{value}</dd>
        </div>
      ))}
      {subscription.customer.address && (
        <div className="sm:col-span-2 lg:col-span-3">
          <dt className="text-slate-500">Billing address</dt>
          <dd className="mt-1 font-medium text-slate-900">{subscription.customer.address}</dd>
        </div>
      )}
      {subscription.notes && (
        <div className="sm:col-span-2 lg:col-span-3">
          <dt className="text-slate-500">Notes</dt>
          <dd className="mt-1 whitespace-pre-wrap font-medium text-slate-900">{subscription.notes}</dd>
        </div>
      )}
    </dl>
  );
}

export default function SubscriptionDetail() {
  const { id } = useParams();
  const { data: subscription, loading, error, reload } = useApi(`/subscriptions/${id}`);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionNotice, setActionNotice] = useState('');

  const handleTransition = async (action) => {
    setIsTransitioning(true);
    setActionError('');
    setActionNotice('');
    try {
      await api(`/subscriptions/${id}/${action}`, { method: 'POST' });
      setActionNotice('Subscription status updated.');
      window.dispatchEvent(new Event('subscription:changed'));
      await reload();
    } catch (requestError) {
      setActionError(requestError.message);
      await reload();
    } finally {
      setIsTransitioning(false);
    }
  };

  if (loading) return <Spinner />;
  if (!subscription) {
    return (
      <>
        <Alert>{error || 'Subscription not found'}</Alert>
        <Link to="/subscriptions" className="mt-4 inline-block text-sm text-brand-600 hover:underline">
          Back to subscriptions
        </Link>
      </>
    );
  }

  const nextAction = {
    DRAFT: subscription.lines.length > 0 ? { path: 'quote', label: 'Send quotation' } : null,
    QUOTATION: { path: 'confirm', label: 'Confirm quotation' },
    CONFIRMED: { path: 'activate', label: 'Activate subscription' },
  }[subscription.status];

  return (
    <div className="space-y-6">
      <Link to="/subscriptions" className="text-sm text-brand-600 hover:underline">
        Back to subscriptions
      </Link>
      <PageHeader
        title={subscription.number}
        subtitle={`${subscription.customer.companyName || subscription.customer.name} · ${subscription.plan.name}`}
        action={
          <div className="flex items-center gap-3">
            <StatusBadge status={subscription.status} />
            {nextAction && (
              <button
                className="btn-primary"
                disabled={isTransitioning}
                onClick={() => handleTransition(nextAction.path)}
              >
                {isTransitioning ? 'Updating...' : nextAction.label}
              </button>
            )}
          </div>
        }
      />
      <Alert>{actionError}</Alert>
      <Alert tone="success">{actionNotice}</Alert>
      {subscription.status === 'DRAFT' && subscription.lines.length === 0 && (
        <p className="text-sm text-slate-500">Add at least one subscription line before sending a quotation.</p>
      )}
      <StatusBar status={subscription.status} />
      <SubscriptionSummary subscription={subscription} />
      <SubscriptionLines lines={subscription.lines} />
      <InvoiceList invoices={subscription.invoices} />
      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Activity</h2>
        <ActivityTimeline subscriptionId={subscription.id} />
      </section>
    </div>
  );
}
