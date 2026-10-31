// Search, method and date filters persist in the URL (PS-21).
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.js';
import { Alert, EmptyState, PageHeader, Pagination, Spinner } from '../../components/ui.jsx';
import { formatDate, formatLabel, formatMoney } from '../../lib/format.js';
const METHODS = ['CASH', 'BANK_TRANSFER', 'UPI', 'CARD', 'CHEQUE'];
export default function PaymentList() {
  const [params, setParams] = useSearchParams();
  const [fields, setFields] = useState({});
  const query = Object.fromEntries(params);
  const { data, loading, error } = useApi('/payments', query);
  function handleFilter(event) {
    event.preventDefault();
    const next = Object.fromEntries(new FormData(event.currentTarget));
    const errors = {
      to: next.from && next.to && next.to < next.from ? 'To date must be on or after from date' : '',
    };
    setFields(errors);
    if (Object.values(errors).some(Boolean)) return;
    setParams({ ...next, page: '1' });
  }
  return (
    <>
      <PageHeader title="Payments" />
      <form noValidate onSubmit={handleFilter} className="card mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <label className="label" htmlFor="payment-search">
            Search
          </label>
          <input
            id="payment-search"
            name="q"
            maxLength={100}
            defaultValue={params.get('q') ?? ''}
            className="input"
            placeholder="Invoice, customer or note"
          />
        </div>
        <div>
          <label className="label" htmlFor="method">
            Method
          </label>
          <select id="method" name="method" defaultValue={params.get('method') ?? ''} className="input">
            <option value="">All methods</option>
            {METHODS.map((method) => (
              <option key={method} value={method}>
                {formatLabel(method)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="from">
            From date
          </label>
          <input
            id="from"
            name="from"
            type="date"
            defaultValue={params.get('from') ?? ''}
            className="input"
          />
        </div>
        <div>
          <label className="label" htmlFor="to">
            To date
          </label>
          <input
            id="to"
            name="to"
            type="date"
            defaultValue={params.get('to') ?? ''}
            className={'input ' + (fields.to ? 'input-error' : '')}
            aria-describedby="to-error"
          />
          <p id="to-error" className="text-sm text-red-600">
            {fields.to}
          </p>
        </div>
        <button className="btn-secondary self-end">Apply filters</button>
      </form>
      {loading ? (
        <Spinner />
      ) : error ? (
        <Alert>{error}</Alert>
      ) : !data?.items.length ? (
        <EmptyState title="No payments found">Try a different search or date range.</EmptyState>
      ) : (
        <>
          <div className="card overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr>
                  {['Invoice', 'Customer', 'Amount', 'Method', 'Date', 'Recorded by', 'Note'].map((label) => (
                    <th key={label} scope="col" className="p-3">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.items.map((payment) => (
                  <tr key={payment.id}>
                    <td className="p-3">
                      <Link className="text-brand-600" to={'/invoices/' + payment.invoice.id}>
                        {payment.invoice.number}
                      </Link>
                    </td>
                    <td className="p-3">{payment.invoice.billingName}</td>
                    <td className="p-3 whitespace-nowrap">{formatMoney(payment.amount)}</td>
                    <td className="p-3">{formatLabel(payment.method)}</td>
                    <td className="p-3 whitespace-nowrap">{formatDate(payment.paymentDate)}</td>
                    <td className="p-3">{payment.recordedBy.name}</td>
                    <td className="p-3">{payment.note || '—'}</td>
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
