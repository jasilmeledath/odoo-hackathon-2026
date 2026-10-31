// Subscription, its invoices and its activity timeline (PS-12, PS-13).
import { Link, useParams } from 'react-router-dom';
import { Alert, EmptyState, PageHeader, Spinner, StatusBadge } from '../../components/ui.jsx';
import { formatDate, formatDateTime, formatLabel, formatMoney } from '../../lib/format.js';
import { useApi } from '../../lib/useApi.js';

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
  const customerName = subscription.customer.companyName || subscription.customer.name;
  const fields = [
    ['Customer', customerName],
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

function SubscriptionLines({ lines }) {
  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold text-slate-900">Subscription lines</h2>
      {lines.length === 0 ? (
        <EmptyState title="No lines on this subscription" />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-slate-500">
              <tr>
                <th className="py-2 pr-4 font-medium">Product</th>
                <th className="py-2 pr-4 font-medium">Variant</th>
                <th className="py-2 pr-4 text-right font-medium">Quantity</th>
                <th className="py-2 pr-4 text-right font-medium">Unit price</th>
                <th className="py-2 pr-4 text-right font-medium">Amount</th>
                <th className="py-2 pr-4 font-medium">Tax</th>
                <th className="py-2 font-medium">State</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => (
                <tr key={line.id} className="border-t border-slate-100">
                  <td className="py-3 pr-4 font-medium text-slate-900">{line.product.name}</td>
                  <td className="py-3 pr-4">
                    {line.variant ? `${line.variant.attribute}: ${line.variant.value}` : '—'}
                  </td>
                  <td className="py-3 pr-4 text-right">{line.quantity}</td>
                  <td className="py-3 pr-4 text-right whitespace-nowrap">{formatMoney(line.unitPrice)}</td>
                  <td className="py-3 pr-4 text-right whitespace-nowrap">{formatMoney(line.amount)}</td>
                  <td className="py-3 pr-4">{line.tax ? `${line.tax.name} (${line.tax.ratePercent}%)` : 'No tax'}</td>
                  <td className="py-3">{line.isActive ? 'Active' : 'Off'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function InvoiceList({ invoices }) {
  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold text-slate-900">Invoices</h2>
      {invoices.length === 0 ? (
        <EmptyState title="No invoices yet">Invoices will appear after billing runs.</EmptyState>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="text-slate-500">
              <tr>
                <th className="py-2 pr-4 font-medium">Invoice</th>
                <th className="py-2 pr-4 font-medium">Issued</th>
                <th className="py-2 pr-4 font-medium">Due</th>
                <th className="py-2 pr-4 text-right font-medium">Total</th>
                <th className="py-2 pr-4 text-right font-medium">Paid</th>
                <th className="py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="border-t border-slate-100">
                  <td className="py-3 pr-4 font-medium text-slate-900">{invoice.number}</td>
                  <td className="py-3 pr-4 whitespace-nowrap">{formatDate(invoice.issueDate)}</td>
                  <td className="py-3 pr-4 whitespace-nowrap">{formatDate(invoice.dueDate)}</td>
                  <td className="py-3 pr-4 text-right whitespace-nowrap">{formatMoney(invoice.totalAmount)}</td>
                  <td className="py-3 pr-4 text-right whitespace-nowrap">{formatMoney(invoice.paidAmount)}</td>
                  <td className="py-3"><StatusBadge status={invoice.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function ActivityTimeline({ subscriptionId }) {
  const { data: entries, loading, error } = useApi(`/subscriptions/${subscriptionId}/activity`);
  if (loading) return <Spinner />;
  if (error) return <Alert>{error}</Alert>;
  if (entries.length === 0) return <EmptyState title="No activity recorded yet" />;

  return (
    <ol className="card space-y-4">
      {entries.map((entry) => (
        <li key={entry.id} className="relative border-l border-slate-200 pl-4 last:border-transparent">
          <span className="absolute top-1 -left-1 h-2 w-2 rounded-full bg-brand-500" />
          <p className="text-sm font-medium text-slate-900">{entry.detail || formatLabel(entry.action)}</p>
          <p className="mt-1 text-xs text-slate-500">
            {entry.actor?.name || 'System'} · {formatDateTime(entry.createdAt)}
          </p>
        </li>
      ))}
    </ol>
  );
}

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
