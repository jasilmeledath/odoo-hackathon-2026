// Subscription status, terms, lines, invoices and history (PS-12, PS-13).
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Alert, PageHeader, Spinner, StatusBadge } from '../../components/ui.jsx';
import { api } from '../../lib/api.js';
import { useApi } from '../../lib/useApi.js';
import {
  ActivityTimeline,
  InvoiceList,
  StatusBar,
  SubscriptionLines,
  SubscriptionSummary,
} from './SubscriptionDetailSections.jsx';
import SubscriptionLifecycleActions from './SubscriptionLifecycleActions.jsx';

export default function SubscriptionDetail() {
  const { id } = useParams();
  const { data: subscription, loading, error, reload } = useApi(`/subscriptions/${id}`);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionNotice, setActionNotice] = useState('');

  const handleTransition = async (action, body) => {
    setIsTransitioning(true);
    setActionError('');
    setActionNotice('');
    try {
      await api(`/subscriptions/${id}/${action}`, { method: 'POST', body });
      setActionNotice(action === 'renew' ? 'Subscription renewed.' : 'Subscription status updated.');
      window.dispatchEvent(new Event('subscription:changed'));
      await reload();
      return true;
    } catch (requestError) {
      setActionError(requestError.message);
      await reload();
      return false;
    } finally {
      setIsTransitioning(false);
    }
  };

  if (loading) return <Spinner />;
  if (!subscription) {
    return (
      <Alert tone="error">
        {error || 'Subscription not found'} ·{' '}
        <Link to="/subscriptions" className="underline">
          back to subscriptions
        </Link>
      </Alert>
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
        ← All subscriptions
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
        <p className="text-sm text-slate-500">
          Add at least one subscription line before sending a quotation.
        </p>
      )}
      <StatusBar status={subscription.status} />
      <SubscriptionLifecycleActions
        subscription={subscription}
        disabled={isTransitioning}
        onAction={handleTransition}
      />
      <SubscriptionSummary subscription={subscription} />
      <SubscriptionLines lines={subscription.lines} />
      <InvoiceList invoices={subscription.invoices} />
      <section>
        <h2 className="mb-4 text-base font-semibold text-slate-900">Activity timeline</h2>
        <ActivityTimeline subscriptionId={id} />
      </section>
    </div>
  );
}
