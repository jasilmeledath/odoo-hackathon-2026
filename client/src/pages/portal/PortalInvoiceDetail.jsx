// Customer invoice snapshots, payments and remaining balance (PS-26).
import { Link, useParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.js';
import { Alert, EmptyState, PageHeader, Spinner, StatusBadge } from '../../components/ui.jsx';
import { formatDate, formatMoney, formatLabel } from '../../lib/format.js';
export default function PortalInvoiceDetail() {
  const { id } = useParams();
  const { data, loading, error, reload } = useApi('/portal/invoices/' + id);
  return (
    <div className="space-y-5 break-words">
      <Link className="text-brand-600 underline" to="/portal/invoices">
        Back to my invoices
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
            action={<StatusBadge status={data.isOverdue ? 'OVERDUE' : data.status} />}
          />
          <dl className="card grid gap-4 sm:grid-cols-2">
            {[
              ['Billed to', data.billingName],
              ['Address', data.billingAddress || '—'],
              ['Issued', formatDate(data.issueDate)],
              ['Due', formatDate(data.dueDate)],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-sm text-slate-500">{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
            <div>
              <dt className="text-sm text-slate-500">Subscription</dt>
              <dd>
                <Link
                  className="text-brand-600 underline"
                  to={'/portal/subscriptions/' + data.subscription.id}
                >
                  {data.subscription.number}
                </Link>
              </dd>
            </div>
          </dl>
          <h2 className="text-lg font-semibold">Invoice lines</h2>
          {!data.lines.length ? (
            <EmptyState title="No invoice lines" />
          ) : (
            <div className="card overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr>
                    {['Item', 'Quantity', 'Unit price', 'Amount', 'Discount', 'Tax'].map((label) => (
                      <th key={label} scope="col" className="p-3">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.lines.map((line) => (
                    <tr key={line.id}>
                      <td className="p-3">{line.description}</td>
                      <td className="p-3">{line.quantity}</td>
                      <td className="p-3 whitespace-nowrap">{formatMoney(line.unitPrice)}</td>
                      <td className="p-3 whitespace-nowrap">{formatMoney(line.amount)}</td>
                      <td className="p-3 whitespace-nowrap">{formatMoney(line.discountAmount)}</td>
                      <td className="p-3 whitespace-nowrap">{formatMoney(line.taxAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <dl className="card space-y-2">
            {[
              ['Subtotal', data.subtotalAmount],
              ['Discount', data.discountAmount],
              ['Tax', data.taxAmount],
              ['Total', data.totalAmount],
              ['Paid', data.paidAmount],
              ['Balance due', data.balanceAmount],
            ].map(([label, amount]) => (
              <div className="flex justify-between gap-4" key={label}>
                <dt>{label}</dt>
                <dd className="font-medium">{formatMoney(amount)}</dd>
              </div>
            ))}
          </dl>
          <h2 className="text-lg font-semibold">Payments</h2>
          {!data.payments.length ? (
            <EmptyState title="No payments yet" />
          ) : (
            <div className="card overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr>
                    {['Date', 'Method', 'Amount', 'Note'].map((label) => (
                      <th key={label} scope="col" className="p-3">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.payments.map((payment) => (
                    <tr key={payment.id}>
                      <td className="p-3 whitespace-nowrap">{formatDate(payment.paymentDate)}</td>
                      <td className="p-3">{formatLabel(payment.method)}</td>
                      <td className="p-3 whitespace-nowrap">{formatMoney(payment.amount)}</td>
                      <td className="p-3">{payment.note || '—'}</td>
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
