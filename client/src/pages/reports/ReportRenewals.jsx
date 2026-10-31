// Paginated renewal summary for reports (PS-24).
import { Link } from 'react-router-dom';
import { EmptyState, Pagination } from '../../components/ui.jsx';
import { formatDate } from '../../lib/format.js';

export default function ReportRenewals({ items, page, pages, onPageChange }) {
  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold text-slate-900">Subscriptions to review</h2>
      {items.length === 0 ? (
        <EmptyState title="No renewals in this window">
          No active subscriptions are due for renewal soon.
        </EmptyState>
      ) : (
        <>
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="text-slate-500">
                <tr>
                  <th className="py-2 pr-4 font-medium">Subscription</th>
                  <th className="py-2 pr-4 font-medium">Customer</th>
                  <th className="py-2 pr-4 font-medium">Plan</th>
                  <th className="py-2 pr-4 font-medium">Expires</th>
                  <th className="py-2 font-medium">Renewal</th>
                </tr>
              </thead>
              <tbody>
                {items.map((subscription) => (
                  <tr key={subscription.id} className="border-t border-slate-100">
                    <td className="py-3 pr-4 font-medium">
                      <Link
                        to={`/subscriptions/${subscription.id}`}
                        className="text-brand-600 hover:underline"
                      >
                        {subscription.number}
                      </Link>
                    </td>
                    <td className="py-3 pr-4">
                      {subscription.customer.companyName || subscription.customer.name}
                    </td>
                    <td className="py-3 pr-4">{subscription.plan.name}</td>
                    <td className="py-3 pr-4 whitespace-nowrap">{formatDate(subscription.expiryDate)}</td>
                    <td className="py-3">
                      {subscription.plan.canRenew ? 'Available' : 'Not allowed by plan'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} pages={pages} onChange={onPageChange} />
        </>
      )}
    </section>
  );
}
