// Staff subscription list with URL-backed search and status filters (PS-12, PS-13).
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Alert, EmptyState, PageHeader, Pagination, Spinner, StatusBadge } from '../../components/ui.jsx';
import { formatDate, formatLabel, formatMoney } from '../../lib/format.js';
import { useApi } from '../../lib/useApi.js';

const STATUSES = ['DRAFT', 'QUOTATION', 'CONFIRMED', 'ACTIVE', 'PAUSED', 'CLOSED'];

function SubscriptionFilters({ values, onApply }) {
  const [form, setForm] = useState(values);

  const handleChange = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  const handleSubmit = (event) => {
    event.preventDefault();
    onApply(form);
  };

  const handleClear = () => {
    const clearedFilters = { status: '', q: '' };
    setForm(clearedFilters);
    onApply(clearedFilters);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="card mb-4 grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(12rem,0.6fr)_auto]"
    >
      <div>
        <label className="label" htmlFor="subscription-search">
          Search
        </label>
        <input
          className="input"
          id="subscription-search"
          name="q"
          value={form.q}
          maxLength={100}
          placeholder="Number, customer or plan"
          onChange={handleChange}
        />
      </div>
      <div>
        <label className="label" htmlFor="subscription-status">
          Status
        </label>
        <select
          className="input"
          id="subscription-status"
          name="status"
          value={form.status}
          onChange={handleChange}
        >
          <option value="">All statuses</option>
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {formatLabel(status)}
            </option>
          ))}
        </select>
      </div>
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

function SubscriptionTable({ subscriptions }) {
  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[760px] text-left text-sm">
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
              Start date
            </th>
            <th scope="col" className="py-2 pr-4 text-right font-medium">
              Recurring
            </th>
            <th scope="col" className="py-2 font-medium">
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {subscriptions.map((subscription) => (
            <tr key={subscription.id} className="border-t border-slate-100">
              <td className="py-3 pr-4 font-medium">
                <Link
                  to={`/subscriptions/${subscription.id}`}
                  className="text-brand-600 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                >
                  {subscription.number}
                </Link>
              </td>
              <td className="py-3 pr-4">{subscription.customer.companyName || subscription.customer.name}</td>
              <td className="py-3 pr-4">{subscription.plan.name}</td>
              <td className="py-3 pr-4 whitespace-nowrap">{formatDate(subscription.startDate)}</td>
              <td className="py-3 pr-4 text-right whitespace-nowrap">
                {formatMoney(subscription.recurringAmount)}
              </td>
              <td className="py-3">
                <StatusBadge status={subscription.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function SubscriptionList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = Object.fromEntries(searchParams);
  const { data, loading, error } = useApi('/subscriptions', query);
  const filterValues = {
    status: searchParams.get('status') ?? '',
    q: searchParams.get('q') ?? '',
  };

  const applyFilters = (filters) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('page');
    for (const [name, value] of Object.entries(filters)) {
      if (value) nextParams.set(name, value);
      else nextParams.delete(name);
    }
    setSearchParams(nextParams);
  };

  return (
    <>
      <PageHeader
        title="Subscriptions"
        subtitle={
          data
            ? `${data.total} ${data.total === 1 ? 'subscription' : 'subscriptions'}`
            : 'Every subscription and where it stands'
        }
        action={
          <Link to="/subscriptions/new" className="btn-primary">
            New subscription
          </Link>
        }
      />
      <SubscriptionFilters key={JSON.stringify(filterValues)} values={filterValues} onApply={applyFilters} />
      <Alert>{error}</Alert>
      {loading && <Spinner />}
      {data && data.items.length === 0 && (
        <EmptyState title="No subscriptions match">Try another status or clear your filters.</EmptyState>
      )}
      {data && data.items.length > 0 && (
        <>
          <SubscriptionTable subscriptions={data.items} />
          <Pagination
            page={data.page}
            pages={data.pages}
            onChange={(page) => {
              const nextParams = new URLSearchParams(searchParams);
              nextParams.set('page', String(page));
              setSearchParams(nextParams);
            }}
          />
        </>
      )}
    </>
  );
}
