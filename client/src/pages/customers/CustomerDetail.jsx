// Customer profile with financial summaries (PS-12).
import { Link, useParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.js';
import { Alert, EmptyState, PageHeader, Spinner, StatusBadge } from '../../components/ui.jsx';
import { formatMoney } from '../../lib/format.js';
export default function CustomerDetail() {
  const { id } = useParams();
  const { data, loading, error } = useApi('/customers/' + id);
  if (loading) return <Spinner />;
  if (error) return <Alert>{error}</Alert>;
  return (
    <>
      <PageHeader
        title={data.name}
        subtitle={data.email}
        action={
          <Link className="btn-secondary" to={'/customers/' + id + '/edit'}>
            Edit customer
          </Link>
        }
      />
      <Link className="mb-4 inline-block text-brand-600" to="/customers">
        Back to customers
      </Link>
      <div className="card mb-4 space-y-2">
        <p>{data.companyName}</p>
        <p>{data.phone}</p>
        <p className="break-words">{data.address}</p>
        <p>{data.isActive ? 'Active' : 'Inactive'}</p>
      </div>
      <h2 className="mb-3 text-lg font-semibold">Subscriptions</h2>
      {!data.subscriptions.length ? (
        <EmptyState title="No subscriptions yet" />
      ) : (
        <div className="card mb-4 space-y-3">
          {data.subscriptions.map((summary) => (
            <div key={summary.status}>
              <StatusBadge status={summary.status} /> {summary._count._all} subscriptions ·{' '}
              {formatMoney(summary._sum.recurringAmount)} recurring
            </div>
          ))}
        </div>
      )}
      <h2 className="mb-3 mt-4 text-lg font-semibold">Invoices</h2>
      {!data.invoices.length ? (
        <EmptyState title="No invoices yet" />
      ) : (
        <div className="card space-y-3">
          {data.invoices.map((summary) => (
            <div key={summary.status}>
              <StatusBadge status={summary.status} /> {summary._count._all} invoices ·{' '}
              {formatMoney(summary._sum.totalAmount)} total · {formatMoney(summary._sum.paidAmount)} paid
            </div>
          ))}
        </div>
      )}
    </>
  );
}
