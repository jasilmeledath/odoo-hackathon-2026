// Customer-owned subscription terms, lines and quotation acceptance (PS-26, PS-27).
import { useState } from 'react';
import { api } from '../../lib/api.js';
import { Link, useParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.js';
import { Alert, EmptyState, PageHeader, Spinner, StatusBadge } from '../../components/ui.jsx';
import { formatDate, formatMoney, formatLabel } from '../../lib/format.js';
export default function PortalSubscriptionDetail() {
  const { id } = useParams();
  const { data, loading, error, reload } = useApi('/portal/subscriptions/' + id);
  const [isChanging, setIsChanging] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [actionError, setActionError] = useState('');
  const [notice, setNotice] = useState('');
  // PS-27: visibility follows the plan; the server still authorizes each action.
  const actions = [
    ...(data?.plan.canPause && data.status === 'ACTIVE' ? ['pause'] : []),
    ...(data?.plan.canPause && data.status === 'PAUSED' ? ['resume'] : []),
    ...(data?.plan.canCloseEarly && ['ACTIVE', 'PAUSED'].includes(data.status) ? ['close'] : []),
  ];
  const handleManage = async (action) => {
    if (
      action === 'close' &&
      !window.confirm(
        'Close this subscription? Future billing will stop. Existing invoices and history will remain.',
      )
    )
      return;
    setIsChanging(true);
    setActionError('');
    setNotice('');
    try {
      await api('/portal/subscriptions/' + id + '/' + action, { method: 'POST', body: {} });
      setNotice('Subscription ' + { pause: 'paused', resume: 'resumed', close: 'closed' }[action] + '.');
      await reload();
    } catch (failure) {
      setActionError(failure.message);
    } finally {
      setIsChanging(false);
    }
  };
  const handleAccept = async () => {
    setIsAccepting(true);
    setActionError('');
    setNotice('');
    try {
      await api('/portal/subscriptions/' + id + '/accept', { method: 'POST', body: {} });
      setNotice('Quotation accepted.');
      await reload();
    } catch (failure) {
      setActionError(failure.message);
    } finally {
      setIsAccepting(false);
    }
  };
  return (
    <div className="space-y-5 break-words">
      <Link className="text-brand-600 underline" to="/portal">
        Back to my subscriptions
      </Link>
      {loading ? (
        <Spinner />
      ) : error ? (
        <>
          <Alert>{error}</Alert>
          <button className="btn-secondary" onClick={reload}>
            Retry
          </button>
        </>
      ) : (
        <>
          <PageHeader
            title={data.number}
            subtitle={data.plan.name}
            action={<StatusBadge status={data.status} />}
          />
          <Alert>{actionError}</Alert>
          <Alert tone="success">{notice}</Alert>
          {data.status === 'QUOTATION' && (
            <section className="card space-y-3" aria-label="Quotation acceptance">
              {data.quotationExpiryDate && <p>Valid until {formatDate(data.quotationExpiryDate)}</p>}
              <button className="btn-primary" disabled={isAccepting} onClick={handleAccept}>
                {isAccepting ? 'Accepting...' : 'Accept quotation'}
              </button>
            </section>
          )}
          <dl className="card grid gap-4 sm:grid-cols-3">
            {[
              ['Starts', formatDate(data.startDate)],
              ['Expires', formatDate(data.expiryDate)],
              ['Billing period', formatLabel(data.plan.billingPeriod)],
              ['Recurring amount', formatMoney(data.recurringAmount)],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-sm text-slate-500">{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <Alert>{actionError}</Alert>
          <Alert tone="success">{notice}</Alert>
          {actions.length > 0 && (
            <section className="card flex flex-wrap gap-3" aria-label="Manage subscription">
              {actions.map((action) => (
                <button
                  key={action}
                  className={action === 'close' ? 'btn-danger' : 'btn-secondary'}
                  disabled={isChanging}
                  onClick={() => handleManage(action)}
                >
                  {isChanging
                    ? 'Updating...'
                    : {
                        pause: 'Pause subscription',
                        resume: 'Resume subscription',
                        close: 'Close subscription',
                      }[action]}
                </button>
              ))}
            </section>
          )}
          {data.notes && <p className="card whitespace-pre-line">{data.notes}</p>}
          <h2 className="text-lg font-semibold">Subscription lines</h2>
          {!data.lines.length ? (
            <EmptyState title="No subscription lines" />
          ) : (
            <div className="card overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr>
                    {['Product', 'Quantity', 'Unit price', 'Amount', 'Tax', 'Active'].map((label) => (
                      <th key={label} scope="col" className="p-3">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.lines.map((line) => (
                    <tr key={line.id}>
                      <td className="p-3">
                        {line.product.name}
                        {line.variant && (
                          <span className="block text-slate-500">
                            {line.variant.attribute}: {line.variant.value}
                          </span>
                        )}
                      </td>
                      <td className="p-3">{line.quantity}</td>
                      <td className="p-3 whitespace-nowrap">{formatMoney(line.unitPrice)}</td>
                      <td className="p-3 whitespace-nowrap">{formatMoney(line.amount)}</td>
                      <td className="p-3">
                        {line.tax ? line.tax.name + ' (' + line.tax.ratePercent + '%)' : 'No tax'}
                      </td>
                      <td className="p-3">{line.isActive ? 'Yes' : 'No'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
