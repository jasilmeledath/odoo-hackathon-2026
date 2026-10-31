// Reusable line, invoice and timeline sections for subscription detail (PS-12, PS-13).
import { Alert, EmptyState, Spinner, StatusBadge } from '../../components/ui.jsx';
import { formatDate, formatDateTime, formatLabel, formatMoney } from '../../lib/format.js';
import { useApi } from '../../lib/useApi.js';

export function SubscriptionLines({ lines }) {
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
                  <td className="py-3 pr-4">
                    {line.tax ? `${line.tax.name} (${line.tax.ratePercent}%)` : 'No tax'}
                  </td>
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

export function InvoiceList({ invoices }) {
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
                  <td className="py-3 pr-4 text-right whitespace-nowrap">
                    {formatMoney(invoice.totalAmount)}
                  </td>
                  <td className="py-3 pr-4 text-right whitespace-nowrap">
                    {formatMoney(invoice.paidAmount)}
                  </td>
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

export function ActivityTimeline({ subscriptionId }) {
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
