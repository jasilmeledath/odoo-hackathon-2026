// Reusable dashboard metrics and finance tables (PS-23).
import { Link } from 'react-router-dom';
import { Alert, EmptyState, StatusBadge } from '../../components/ui.jsx';
import { formatDate, formatMoney } from '../../lib/format.js';

const FOCUS_LINK = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600';

export const METRICS = [
  {
    key: 'activeSubscriptionCount',
    label: 'Active subscriptions',
    path: '/subscriptions?status=ACTIVE',
    money: false,
  },
  {
    key: 'monthlyRecurringAmount',
    label: 'Monthly recurring',
    path: '/subscriptions?status=ACTIVE',
    money: true,
  },
  {
    key: 'revenueAmount',
    label: 'Payments received',
    path: ({ from, to }) => `/reports?from=${from}&to=${to}`,
    money: true,
  },
  {
    key: 'invoicedAmount',
    label: 'Invoiced this period',
    path: ({ from, to }) => `/invoices?from=${from}&to=${to}`,
    money: true,
  },
  { key: 'outstandingAmount', label: 'Outstanding', path: '/invoices?status=CONFIRMED', money: true },
  { key: 'overdueAmount', label: 'Overdue', path: '/invoices?isOverdue=true', money: true },
];

export function MetricCard({ metric, value, period }) {
  const formattedValue = metric.money ? formatMoney(value) : (value ?? 0).toLocaleString('en-IN');
  const path = typeof metric.path === 'function' ? metric.path(period) : metric.path;
  return (
    <Link to={path} className={`card block transition-colors hover:border-brand-300 ${FOCUS_LINK}`}>
      <p className="text-sm text-slate-500">{metric.label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{formattedValue}</p>
      <span className="mt-3 inline-block text-sm font-medium text-brand-600">View details →</span>
    </Link>
  );
}

export function DashboardError({ message, onRetry }) {
  if (!message) return null;
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3" aria-live="polite">
      <div className="min-w-0 flex-1">
        <Alert>{message}</Alert>
      </div>
      <button className={`btn-secondary min-h-11 ${FOCUS_LINK}`} type="button" onClick={onRetry}>
        Try again
      </button>
    </div>
  );
}

export function OverdueInvoices({ invoices }) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900">Overdue invoices</h2>
        <Link
          to="/invoices?isOverdue=true"
          className={`text-sm font-medium text-brand-600 hover:underline ${FOCUS_LINK}`}
        >
          View all
        </Link>
      </div>
      {invoices.length === 0 ? (
        <EmptyState title="No overdue invoices">
          Confirmed invoices past their due date will appear here.
        </EmptyState>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[540px] text-left text-sm">
            <thead className="text-slate-500">
              <tr>
                <th scope="col" className="py-2 pr-4 font-medium">
                  Invoice
                </th>
                <th scope="col" className="py-2 pr-4 font-medium">
                  Customer
                </th>
                <th scope="col" className="py-2 pr-4 font-medium">
                  Due
                </th>
                <th scope="col" className="py-2 pr-4 text-right font-medium">
                  Balance
                </th>
                <th scope="col" className="py-2 font-medium">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="border-t border-slate-100">
                  <td className="py-3 pr-4 font-medium text-slate-900">{invoice.number}</td>
                  <td className="py-3 pr-4">{invoice.billingName}</td>
                  <td className="py-3 pr-4 whitespace-nowrap">{formatDate(invoice.dueDate)}</td>
                  <td className="py-3 pr-4 text-right whitespace-nowrap">
                    {formatMoney(invoice.balanceAmount)}
                  </td>
                  <td className="py-3">
                    <StatusBadge status="OVERDUE" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export function RenewalList({ renewals }) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900">Renewals</h2>
        <Link to="/reports" className={`text-sm font-medium text-brand-600 hover:underline ${FOCUS_LINK}`}>
          View reports
        </Link>
      </div>
      {renewals.length === 0 ? (
        <EmptyState title="No upcoming renewals">
          Active subscriptions expiring in the next 30 days will appear here.
        </EmptyState>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[540px] text-left text-sm">
            <thead className="text-slate-500">
              <tr>
                <th scope="col" className="py-2 pr-4 font-medium">
                  Subscription
                </th>
                <th scope="col" className="py-2 pr-4 font-medium">
                  Customer
                </th>
                <th scope="col" className="py-2 pr-4 font-medium">
                  Plan
                </th>
                <th scope="col" className="py-2 pr-4 font-medium">
                  Expires
                </th>
                <th scope="col" className="py-2 font-medium">
                  Renewal
                </th>
              </tr>
            </thead>
            <tbody>
              {renewals.map((subscription) => (
                <tr key={subscription.id} className="border-t border-slate-100">
                  <td className="py-3 pr-4 font-medium">
                    <Link
                      to={`/subscriptions/${subscription.id}`}
                      className={`text-brand-600 hover:underline ${FOCUS_LINK}`}
                    >
                      {subscription.number}
                    </Link>
                  </td>
                  <td className="py-3 pr-4">
                    {subscription.customer.companyName || subscription.customer.name}
                  </td>
                  <td className="py-3 pr-4">{subscription.plan.name}</td>
                  <td className="py-3 pr-4 whitespace-nowrap">{formatDate(subscription.expiryDate)}</td>
                  <td className="py-3">{subscription.plan.canRenew ? 'Available' : 'Not allowed by plan'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
