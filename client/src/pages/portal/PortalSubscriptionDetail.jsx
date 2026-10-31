// Customer-owned subscription terms and lines (PS-26).
import { Link, useParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.js';
import { Alert, EmptyState, PageHeader, Spinner, StatusBadge } from '../../components/ui.jsx';
import { formatDate, formatMoney, formatLabel } from '../../lib/format.js';
export default function PortalSubscriptionDetail() {
  const { id } = useParams();
  const { data, loading, error, reload } = useApi('/portal/subscriptions/' + id);
  return (
    <div className="space-y-5 break-words">
      <Link className="text-brand-600 underline" to="/portal">
        Back to my subscriptions
      </Link>
      {loading ? (
        <Spinner />
      ) : error ? (
        <>
          <Alert>{error}</Alert>
          <button className="btn-secondary" onClick={reload}>
            Retry
          </button>
        </>
      ) : (
        <>
          <PageHeader
            title={data.number}
            subtitle={data.plan.name}
            action={<StatusBadge status={data.status} />}
          />
          <dl className="card grid gap-4 sm:grid-cols-3">
            {[
              ['Starts', formatDate(data.startDate)],
              ['Expires', formatDate(data.expiryDate)],
              ['Billing period', formatLabel(data.plan.billingPeriod)],
              ['Recurring amount', formatMoney(data.recurringAmount)],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-sm text-slate-500">{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          {data.notes && <p className="card whitespace-pre-line">{data.notes}</p>}
          <h2 className="text-lg font-semibold">Subscription lines</h2>
          {!data.lines.length ? (
            <EmptyState title="No subscription lines" />
          ) : (
            <div className="card overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr>
                    {['Product', 'Quantity', 'Unit price', 'Amount', 'Tax', 'Active'].map((label) => (
                      <th key={label} scope="col" className="p-3">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.lines.map((line) => (
                    <tr key={line.id}>
                      <td className="p-3">
                        {line.product.name}
                        {line.variant && (
                          <span className="block text-slate-500">
                            {line.variant.attribute}: {line.variant.value}
                          </span>
                        )}
                      </td>
                      <td className="p-3">{line.quantity}</td>
                      <td className="p-3 whitespace-nowrap">{formatMoney(line.unitPrice)}</td>
                      <td className="p-3 whitespace-nowrap">{formatMoney(line.amount)}</td>
                      <td className="p-3">
                        {line.tax ? line.tax.name + ' (' + line.tax.ratePercent + '%)' : 'No tax'}
                      </td>
                      <td className="p-3">{line.isActive ? 'Yes' : 'No'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
