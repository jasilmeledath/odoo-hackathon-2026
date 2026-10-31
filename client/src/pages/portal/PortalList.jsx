// Shared customer lists with persistent search and explicit request states (PS-26).
import { Link, useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import { useApi } from '../../lib/useApi.js';
import { Alert, EmptyState, PageHeader, Pagination, Spinner, StatusBadge } from '../../components/ui.jsx';
import { formatDate, formatMoney } from '../../lib/format.js';
const MAX_SEARCH_LENGTH = 100;
export default function PortalList({ resource, title }) {
  const [params, setParams] = useSearchParams();
  const query = Object.fromEntries(params);
  const { data, loading, error, reload } = useApi('/portal/' + resource, query);
  const [searchError, setSearchError] = useState('');
  const isInvoice = resource === 'invoices';
  function handleSearch(event) {
    event.preventDefault();
    const q = new FormData(event.currentTarget).get('q').trim();
    if (q.length > MAX_SEARCH_LENGTH) {
      setSearchError('Search must be at most 100 characters');
      return;
    }
    setSearchError('');
    setParams({ q, page: '1' });
  }
  return (
    <>
      <PageHeader title={title} />
      <form noValidate className="mb-5 flex items-start gap-3" onSubmit={handleSearch}>
        <div className="min-w-0 flex-1">
          <label className="label" htmlFor="portal-search">
            Search {resource}
          </label>
          <input
            key={params.get('q') ?? ''}
            id="portal-search"
            name="q"
            defaultValue={params.get('q') ?? ''}
            maxLength={MAX_SEARCH_LENGTH}
            className={'input ' + (searchError ? 'input-error' : '')}
            aria-describedby="portal-search-error"
          />
          <p id="portal-search-error" className="text-sm text-red-600">
            {searchError}
          </p>
        </div>
        <button className="btn-secondary mt-6">Search</button>
      </form>
      {loading ? (
        <Spinner />
      ) : error ? (
        <div className="space-y-3">
          <Alert>{error}</Alert>
          <button className="btn-secondary" onClick={reload}>
            Retry
          </button>
        </div>
      ) : !data?.items.length ? (
        <EmptyState title={'No ' + resource + ' found'}>
          Your records will appear here. Try changing the search.
        </EmptyState>
      ) : (
        <>
          <div className="card overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr>
                  {[
                    'Number',
                    isInvoice ? 'Issued' : 'Plan',
                    'Status',
                    isInvoice ? 'Total' : 'Recurring amount',
                    isInvoice ? 'Balance' : 'Expires',
                  ].map((label) => (
                    <th scope="col" key={label} className="p-3">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.items.map((item) => (
                  <tr key={item.id}>
                    <td className="p-3">
                      <Link className="text-brand-600 underline" to={'/portal/' + resource + '/' + item.id}>
                        {item.number}
                      </Link>
                    </td>
                    <td className="p-3">{isInvoice ? formatDate(item.issueDate) : item.plan.name}</td>
                    <td className="p-3">
                      <StatusBadge status={item.isOverdue ? 'OVERDUE' : item.status} />
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {formatMoney(isInvoice ? item.totalAmount : item.recurringAmount)}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {isInvoice ? formatMoney(item.balanceAmount) : formatDate(item.expiryDate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={data.page}
            pages={data.pages}
            onChange={(page) => setParams({ ...query, page: String(page) })}
          />
        </>
      )}
    </>
  );
}
