// Period-filtered finance summary, revenue chart and subscription renewals (PS-24).
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Field, PageHeader, Spinner } from '../../components/ui.jsx';
import { formatDate, formatMoney } from '../../lib/format.js';
import { useApi } from '../../lib/useApi.js';
import { validateDateRange } from '../../lib/validators.js';
import ReportRenewals from './ReportRenewals.jsx';
import ReportLoadError from './ReportLoadError.jsx';
import RevenueChart from './RevenueChart.jsx';

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
    <form noValidate onSubmit={handleSubmit} className="card mb-6 grid gap-4 sm:grid-cols-[1fr_1fr_auto]">
      <Field label="From" inputId="report-from">
        <input
          id="report-from"
          className="input"
          type="date"
          name="from"
          value={form.from}
          onChange={handleChange}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? 'report-date-range-error' : undefined}
        />
      </Field>
      <Field label="To" inputId="report-to" error={error} errorId="report-date-range-error">
        <input
          id="report-to"
          className={`input ${error ? 'input-error' : ''}`}
          type="date"
          name="to"
          value={form.to}
          onChange={handleChange}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? 'report-date-range-error' : undefined}
        />
      </Field>
      <div className="flex items-end gap-2">
        <button
          className="btn-primary min-h-11 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          type="submit"
        >
          Apply
        </button>
        <button
          className="btn-secondary min-h-11 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          type="button"
          onClick={handleClear}
        >
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

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => (
        <Link
          key={card.label}
          to={card.path}
          className="card block transition hover:border-brand-300 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        >
          <p className="text-sm text-slate-500">{card.label}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{card.value}</p>
          <span className="mt-3 inline-block text-sm font-medium text-brand-600">View details →</span>
        </Link>
      ))}
    </div>
  );
}

export default function Reports() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filterValues = { from: searchParams.get('from') ?? '', to: searchParams.get('to') ?? '' };
  const summaryQuery = Object.fromEntries(Object.entries(filterValues).filter(([, value]) => value));
  const { data: summary, loading, error, reload: reloadSummary } = useApi('/reports/summary', summaryQuery);
  const renewalPage = Number(searchParams.get('page') ?? 1);
  const {
    data: renewals,
    loading: renewalsLoading,
    error: renewalsError,
    reload: reloadRenewals,
  } = useApi('/reports/renewals', { page: renewalPage, pageSize: 10 });

  const applyFilters = (filters) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('page');
    for (const [name, value] of Object.entries(filters)) {
      if (value) nextParams.set(name, value);
      else nextParams.delete(name);
    }
    setSearchParams(nextParams);
  };

  const handleRenewalsPageChange = (page) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('page', String(page));
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
      <ReportLoadError message={error} onRetry={reloadSummary} retryLabel="Retry summary" />
      <ReportLoadError message={renewalsError} onRetry={reloadRenewals} retryLabel="Retry renewals" />
      {loading ? <Spinner /> : summary ? <SummaryCards summary={summary} /> : null}
      <div className="mt-8">
        <RevenueChart />
      </div>
      <div className="mt-8">
        {renewalsLoading ? (
          <Spinner />
        ) : renewals ? (
          <ReportRenewals
            items={renewals.items}
            page={renewals.page}
            pages={renewals.pages}
            onPageChange={handleRenewalsPageChange}
          />
        ) : null}
      </div>
    </>
  );
}
