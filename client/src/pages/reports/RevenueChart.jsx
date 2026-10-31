// Responsive monthly payment-revenue chart without a charting dependency (PS-24).
import { useSearchParams } from 'react-router-dom';
import { Alert, EmptyState, PageHeader, Spinner } from '../../components/ui.jsx';
import { formatDate, formatMoney } from '../../lib/format.js';
import { useApi } from '../../lib/useApi.js';

export default function RevenueChart() {
  const [searchParams] = useSearchParams();
  const query = { from: searchParams.get('from') ?? '', to: searchParams.get('to') ?? '' };
  const { data, loading, error } = useApi('/reports/revenue', query);

  if (loading) return <Spinner />;
  if (error) return <Alert>{error}</Alert>;
  if (!data?.items.length) {
    return <EmptyState title="No revenue data for this range">Choose a different date range.</EmptyState>;
  }

  const maximumAmount = Math.max(...data.items.map((item) => item.amount), 0);

  return (
    <section>
      <PageHeader
        title="Revenue by month"
        subtitle={`${formatDate(data.period.from)} to ${formatDate(data.period.to)}`}
      />
      <div className="card">
        <p className="mb-4 text-sm text-slate-500">Payments received, in rupees</p>
        <div
          role="img"
          aria-label="Monthly revenue chart. Hover a bar to see its month and amount."
          className="grid grid-cols-12 gap-1 sm:gap-3"
        >
          {data.items.map((item) => {
            const heightPercent = maximumAmount === 0 ? 0 : (item.amount / maximumAmount) * 100;
            return (
              <div key={item.month} className="min-w-0" title={`${item.month}: ${formatMoney(item.amount)}`}>
                <div className="flex h-40 items-end rounded bg-brand-50">
                  <div
                    className="w-full rounded-t bg-brand-500 transition-[height]"
                    style={{ height: `${heightPercent}%` }}
                  />
                </div>
                <p className="mt-2 truncate text-center text-[10px] text-slate-600 sm:text-xs">
                  {item.label}
                </p>
                <p className="sr-only">
                  {item.month}: {formatMoney(item.amount)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
