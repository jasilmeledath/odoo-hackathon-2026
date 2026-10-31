// Finance overview from live subscription, invoice and payment data (PS-23).
import { Link } from 'react-router-dom';
import { Alert, EmptyState, PageHeader, Spinner, StatusBadge } from '../../components/ui.jsx';
import { formatDate, formatMoney } from '../../lib/format.js';
import { useApi } from '../../lib/useApi.js';

const METRICS = [
  { key: 'activeSubscriptionCount', label: 'Active subscriptions', path: '/subscriptions?status=ACTIVE', money: false },
  { key: 'monthlyRecurringAmount', label: 'Monthly recurring', path: '/subscriptions?status=ACTIVE', money: true },
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

function MetricCard({ metric, value, period }) {
  const formattedValue = metric.money ? formatMoney(value) : (value ?? 0).toLocaleString('en-IN');
  const path = typeof metric.path === 'function' ? metric.path(period) : metric.path;
  return (
    <Link to={path} className="card block transition hover:border-brand-300 hover:shadow-md">
      <p className="text-sm text-slate-500">{metric.label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{formattedValue}</p>
      <span className="mt-3 inline-block text-sm font-medium text-brand-600">View details →</span>
    </Link>
  );
}

function OverdueInvoices({ invoices }) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900">Overdue invoices</h2>
        <Link to="/invoices?isOverdue=true" className="text-sm font-medium text-brand-600 hover:underline">
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
                <th className="py-2 pr-4 font-medium">Invoice</th>
                <th className="py-2 pr-4 font-medium">Customer</th>
                <th className="py-2 pr-4 font-medium">Due</th>
                <th className="py-2 pr-4 text-right font-medium">Balance</th>
                <th className="py-2 font-medium">Status</th>
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
                  <td className="py-3"><StatusBadge status="OVERDUE" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function RenewalList({ renewals }) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900">Renewals</h2>
        <Link to="/reports" className="text-sm font-medium text-brand-600 hover:underline">
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
                <th className="py-2 pr-4 font-medium">Subscription</th>
                <th className="py-2 pr-4 font-medium">Customer</th>
                <th className="py-2 pr-4 font-medium">Plan</th>
                <th className="py-2 pr-4 font-medium">Expires</th>
                <th className="py-2 font-medium">Renewal</th>
              </tr>
            </thead>
            <tbody>
              {renewals.map((subscription) => (
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

export default function Dashboard() {
  const { data: summary, loading: summaryLoading, error: summaryError } = useApi('/reports/summary');
  const { data: renewalPage, loading: renewalsLoading, error: renewalsError } = useApi('/reports/renewals', {
    pageSize: 10,
  });
  const error = [summaryError, renewalsError].filter(Boolean).join(' ');

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={
          summary
            ? `Payments and invoices from ${formatDate(summary.period.from)} to ${formatDate(summary.period.to)}`
            : 'How the business is doing today'
        }
      />
      <Alert>{error}</Alert>
      {summaryLoading ? (
        <Spinner />
      ) : summary ? (
        <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {METRICS.map((metric) => (
            <MetricCard
              key={metric.key}
              metric={metric}
              value={summary[metric.key]}
              period={summary.period}
            />
          ))}
        </div>
      ) : null}
      <div className="space-y-8">
        <section>
          {summaryLoading ? null : summary ? (
            <OverdueInvoices invoices={summary.overdueInvoices} />
          ) : null}
        </section>
        <section>
          {renewalsLoading ? <Spinner /> : renewalPage ? <RenewalList renewals={renewalPage.items} /> : null}
        </section>
      </div>
    </>
  );
}
