// Period-filtered finance summary and subscription renewals (PS-24).
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Alert, EmptyState, Field, PageHeader, Spinner } from '../../components/ui.jsx';
import { formatDate, formatMoney } from '../../lib/format.js';
import { useApi } from '../../lib/useApi.js';
import { validateDateRange } from '../../lib/validators.js';

function ReportFilters({ values, onApply }) {
  const [form, setForm] = useState(values);
  const [error, setError] = useState('');

  const handleChange = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  const handleSubmit = (event) => {
    event.preventDefault();
    const rangeError = validateDateRange(form.from, form.to);
    setError(rangeError);
    if (!rangeError) onApply(form);
  };

  const handleClear = () => {
    const clearedRange = { from: '', to: '' };
    setError('');
    setForm(clearedRange);
    onApply(clearedRange);
  };

  return (
    <form onSubmit={handleSubmit} className="card mb-6 grid gap-4 sm:grid-cols-[1fr_1fr_auto]">
      <Field label="From">
        <input className="input" type="date" name="from" value={form.from} onChange={handleChange} />
      </Field>
      <Field label="To" error={error}>
        <input
          className={`input ${error ? 'input-error' : ''}`}
          type="date"
          name="to"
          value={form.to}
          onChange={handleChange}
        />
      </Field>
      <div className="flex items-end gap-2">
        <button className="btn-primary" type="submit">
          Apply
        </button>
        <button className="btn-secondary" type="button" onClick={handleClear}>
          Clear
        </button>
      </div>
    </form>
  );
}

function SummaryCards({ summary }) {
  const cards = [
    {
      label: 'Active subscriptions',
      value: summary.activeSubscriptionCount.toLocaleString('en-IN'),
      path: '/subscriptions?status=ACTIVE',
    },
    {
      label: 'Monthly recurring',
      value: formatMoney(summary.monthlyRecurringAmount),
      path: '/subscriptions?status=ACTIVE',
    },
    {
      label: 'Invoiced in period',
      value: formatMoney(summary.invoicedAmount),
      path: `/invoices?from=${summary.period.from}&to=${summary.period.to}`,
    },
    {
      label: 'Payments received',
      value: formatMoney(summary.revenueAmount),
      path: `/payments?from=${summary.period.from}&to=${summary.period.to}`,
    },
    {
      label: 'Outstanding',
      value: formatMoney(summary.outstandingAmount),
      path: '/invoices?status=CONFIRMED',
    },
    { label: 'Overdue', value: formatMoney(summary.overdueAmount), path: '/invoices?isOverdue=true' },
  ];

  const hasData = [
    summary.activeSubscriptionCount,
    summary.monthlyRecurringAmount,
    summary.invoicedAmount,
    summary.revenueAmount,
    summary.outstandingAmount,
    summary.overdueAmount,
  ].some((value) => value > 0);
  if (!hasData) {
    return <EmptyState title="No report data for this period">Try a different date range.</EmptyState>;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => (
        <Link
          key={card.label}
          to={card.path}
          className="card block transition hover:border-brand-300 hover:shadow-md"
        >
          <p className="text-sm text-slate-500">{card.label}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{card.value}</p>
          <span className="mt-3 inline-block text-sm font-medium text-brand-600">View details →</span>
        </Link>
      ))}
    </div>
  );
}

function Renewals({ items }) {
  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold text-slate-900">Subscriptions to review</h2>
      {items.length === 0 ? (
        <EmptyState title="No renewals in this window">No active subscriptions are due for renewal soon.</EmptyState>
      ) : (
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

export default function Reports() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filterValues = { from: searchParams.get('from') ?? '', to: searchParams.get('to') ?? '' };
  const summaryQuery = Object.fromEntries(Object.entries(filterValues).filter(([, value]) => value));
  const { data: summary, loading, error } = useApi('/reports/summary', summaryQuery);
  const { data: renewals, loading: renewalsLoading, error: renewalsError } = useApi('/reports/renewals', {
    pageSize: 10,
  });

  const applyFilters = (filters) => {
    const nextParams = new URLSearchParams(searchParams);
    for (const [name, value] of Object.entries(filters)) {
      if (value) nextParams.set(name, value);
      else nextParams.delete(name);
    }
    setSearchParams(nextParams);
  };

  return (
    <>
      <PageHeader
        title="Reports"
        subtitle={
          summary
            ? `Payments and invoices from ${formatDate(summary.period.from)} to ${formatDate(summary.period.to)}`
            : 'Filter revenue, invoices and subscriptions'
        }
      />
      <ReportFilters key={JSON.stringify(filterValues)} values={filterValues} onApply={applyFilters} />
      <Alert>{[error, renewalsError].filter(Boolean).join(' ')}</Alert>
      {loading ? <Spinner /> : summary ? <SummaryCards summary={summary} /> : null}
      <div className="mt-8">
        {renewalsLoading ? <Spinner /> : renewals ? <Renewals items={renewals.items} /> : null}
      </div>
    </>
  );
}
