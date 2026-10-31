// Subscription overview and navigation to its related data (PS-12, PS-13).
import { Link, useParams } from 'react-router-dom';
import { Alert, PageHeader, Spinner, StatusBadge } from '../../components/ui.jsx';
import { useApi } from '../../lib/useApi.js';
import {
  ActivityTimeline,
  InvoiceList,
  StatusBar,
  SubscriptionLines,
  SubscriptionSummary,
} from './SubscriptionDetailSections.jsx';

export default function SubscriptionDetail() {
  const { id } = useParams();
  const { data: subscription, loading, error } = useApi(`/subscriptions/${id}`);

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

  return (
    <div className="space-y-6">
      <Link to="/subscriptions" className="text-sm text-brand-600 hover:underline">
        Back to subscriptions
      </Link>
      <PageHeader
        title={subscription.number}
        subtitle={`${subscription.customer.companyName || subscription.customer.name} · ${subscription.plan.name}`}
        action={<StatusBadge status={subscription.status} />}
      />
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
