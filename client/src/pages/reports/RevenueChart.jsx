// Responsive monthly payment-revenue chart without a charting dependency (PS-24).
import { useSearchParams } from 'react-router-dom';
import { EmptyState, Spinner } from '../../components/ui.jsx';
import { formatDate, formatMoney } from '../../lib/format.js';
import { useApi } from '../../lib/useApi.js';
import ReportLoadError from './ReportLoadError.jsx';

export default function RevenueChart() {
  const [searchParams] = useSearchParams();
  const query = { from: searchParams.get('from') ?? '', to: searchParams.get('to') ?? '' };
  const { data, loading, error, reload } = useApi('/reports/revenue', query);

  if (loading) return <Spinner />;
  if (error) return <ReportLoadError message={error} onRetry={reload} retryLabel="Retry chart" />;
  if (!data?.items.length) {
    return <EmptyState title="No revenue data for this range">Choose a different date range.</EmptyState>;
  }

  const maximumAmount = Math.max(...data.items.map((item) => item.amount), 0);

  return (
    <section aria-labelledby="revenue-chart-title">
      <div className="mb-4">
        <h2 id="revenue-chart-title" className="text-lg font-semibold text-slate-900">
          Revenue by month
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {formatDate(data.period.from)} to {formatDate(data.period.to)}
        </p>
      </div>
      <div className="card">
        <figure>
          <figcaption className="mb-4 text-sm text-slate-600">Payments received, in rupees</figcaption>
          {maximumAmount === 0 && (
            <p className="mb-3 text-sm text-slate-600">No payments were received in this range.</p>
          )}
          <div aria-hidden="true" className="grid grid-cols-12 gap-1 sm:gap-3">
            {data.items.map((item) => {
              const heightPercent = maximumAmount === 0 ? 0 : (item.amount / maximumAmount) * 100;
              return (
                <div key={item.month} className="min-w-0">
                  <div className="flex h-40 items-end rounded bg-brand-50">
                    <div
                      className="w-full rounded-t bg-brand-500 transition-[height]"
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>
                  <p className="mt-2 truncate text-center text-[10px] text-slate-600 sm:text-xs">
                    {item.label}
                  </p>
                </div>
              );
            })}
          </div>
          <table className="sr-only">
            <caption>Monthly revenue data</caption>
            <thead>
              <tr>
                <th scope="col">Month</th>
                <th scope="col">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item) => (
                <tr key={item.month}>
                  <th scope="row">{item.month}</th>
                  <td>{formatMoney(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </figure>
      </div>
    </section>
  );
}
