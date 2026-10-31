// Staff billing queue and outcome; estimates are clearly separated from issued totals.
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Alert, EmptyState, PageHeader, Pagination, Spinner } from '../../components/ui.jsx';
import { api } from '../../lib/api.js';
import { useApi } from '../../lib/useApi.js';
import { useToast } from '../../lib/toast.js';
import { formatDate, formatMoney } from '../../lib/format.js';

export default function BillingRun() {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get('q') ?? '');
  const [isRunning, setIsRunning] = useState(false);
  const toast = useToast();
  const [runError, setRunError] = useState('');
  const [result, setResult] = useState(null);
  const { data, loading, error, reload } = useApi('/billing/due', {
    page: params.get('page') ?? 1,
    q: params.get('q') ?? '',
  });
  const handleRun = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setRunError('');
    setResult(null);
    try {
      const outcome = await api('/billing/run', { method: 'POST', body: {} });
      setResult(outcome);
      if (outcome.failed) toast.error(`Billing run: ${outcome.failed} failed. Review the server log.`);
      else
        toast.success(
          `Billing run complete: ${outcome.created} invoice${outcome.created === 1 ? '' : 's'} created.`,
        );
      await reload();
    } catch (failure) {
      setRunError(failure.message);
      toast.error(failure.message);
    } finally {
      setIsRunning(false);
    }
  };
  return (
    <div className="space-y-5">
      <PageHeader
        title="Billing"
        subtitle="Review the queue and generate draft invoices for all due subscriptions"
        action={
          <button className="btn-primary" disabled={isRunning || loading || !data?.total} onClick={handleRun}>
            {isRunning ? 'Running billing…' : 'Run billing'}
          </button>
        }
      />
      <Alert>{runError || error}</Alert>
      <div aria-live="polite">
        {result && (
          <Alert tone={result.failed ? 'error' : 'success'}>
            Created: {result.created} · Skipped: {result.skipped} · Failed: {result.failed}.
            {result.failed > 0 &&
              ' Failed periods remain due. Review the server log, fix the subscription and retry.'}{' '}
            <Link className="underline" to="/invoices?status=DRAFT">
              Review draft invoices
            </Link>
          </Alert>
        )}
      </div>
      <form
        className="flex flex-wrap gap-2"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          setParams(search.trim() ? { q: search.trim() } : {});
        }}
      >
        <label className="sr-only" htmlFor="billing-search">
          Search subscriptions
        </label>
        <input
          id="billing-search"
          className="input sm:max-w-sm"
          value={search}
          maxLength={100}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Subscription number or customer"
        />
        <button className="btn-secondary" disabled={isRunning}>
          Search
        </button>
      </form>
      {data && (
        <div className="card text-sm space-y-2">
          <p>
            <strong>{data.total}</strong> matching subscriptions due
          </p>
          <p>
            Next-period subtotal: <strong>{formatMoney(data.expectedSubtotalAmount)}</strong>
          </p>
          <p className="text-slate-500">
            Before tax and discounts. Catch-up runs may create several invoices per subscription. Run billing
            processes the entire queue, including other search results.
          </p>
        </div>
      )}
      {loading ? (
        <Spinner />
      ) : data?.items.length ? (
        <>
          <div className="card overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr>
                  {['Subscription', 'Customer', 'Plan', 'Next billing date', 'Subtotal'].map((label) => (
                    <th key={label} className="px-2 py-3">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.items.map((subscription) => (
                  <tr key={subscription.id} className="border-t border-slate-100">
                    <td className="px-2 py-3">
                      <Link className="text-brand-600 underline" to={`/subscriptions/${subscription.id}`}>
                        {subscription.number}
                      </Link>
                    </td>
                    <td className="px-2 py-3">{subscription.customer.name}</td>
                    <td className="px-2 py-3">{subscription.plan.name}</td>
                    <td className="px-2 py-3 whitespace-nowrap">
                      {formatDate(subscription.nextInvoiceDate)}
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap">
                      {formatMoney(subscription.recurringAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={data.page}
            pages={data.pages}
            onChange={(page) => setParams({ q: params.get('q') ?? '', page: String(page) })}
          />
        </>
      ) : (
        data && (
          <EmptyState
            title="No subscriptions due"
            children="The matching queue is clear. New periods appear here when their billing day arrives."
          />
        )
      )}
    </div>
  );
}
