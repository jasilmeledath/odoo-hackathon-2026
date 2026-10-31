// Finance overview from live subscription, invoice and payment data (PS-23).
import { PageHeader, Spinner } from '../../components/ui.jsx';
import { formatDate } from '../../lib/format.js';
import { useApi } from '../../lib/useApi.js';
import { DashboardError, MetricCard, METRICS, OverdueInvoices, RenewalList } from './DashboardSections.jsx';

export default function Dashboard() {
  const {
    data: summary,
    loading: summaryLoading,
    error: summaryError,
    reload: reloadSummary,
  } = useApi('/reports/summary');
  const {
    data: renewalPage,
    loading: renewalsLoading,
    error: renewalsError,
    reload: reloadRenewals,
  } = useApi('/reports/renewals', { pageSize: 10 });
  const error = [summaryError, renewalsError].filter(Boolean).join(' ');
  const retry = () => Promise.all([reloadSummary(), reloadRenewals()]);

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
      <DashboardError message={error} onRetry={retry} />
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
        {!summaryLoading && summary && <OverdueInvoices invoices={summary.overdueInvoices} />}
        {renewalsLoading ? <Spinner /> : renewalPage && <RenewalList renewals={renewalPage.items} />}
      </div>
    </>
  );
}
