// Staff plan browsing and Admin configuration of billing behaviour (PS-8, PS-9).
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Alert, EmptyState, Field, PageHeader, Pagination, Spinner } from '../../components/ui.jsx';
import { useAuth } from '../../lib/auth.jsx';
import { formatDate, formatLabel, formatMoney } from '../../lib/format.js';
import { useApi } from '../../lib/useApi.js';
import PlanForm from './PlanForm.jsx';

const COLUMNS = [
  'Name',
  'Product',
  'Price',
  'Billing period',
  'Minimum quantity',
  'Available dates',
  'Status',
];

export default function PlanList() {
  const [params, setParams] = useSearchParams();
  const query = {
    page: params.get('page') || 1,
    q: params.get('q') || '',
    availableOn: params.get('availableOn') || '',
    isActive: params.get('isActive') ?? '',
  };
  const { data, loading: isLoading, error, reload } = useApi('/plans', query);
  const { isAdmin } = useAuth();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [success, setSuccess] = useState('');
  const handleFilter = (key, value) => {
    const next = new URLSearchParams(params);
    value ? next.set(key, value) : next.delete(key);
    next.delete('page');
    setParams(next, { replace: true });
  };
  const handleSaved = async () => {
    setIsFormOpen(false);
    setEditing(null);
    setSuccess('Plan saved');
    await reload();
  };
  return (
    <div className="space-y-4">
      <PageHeader
        title="Plans"
        subtitle="Billing periods, prices and subscription behaviour"
        action={
          isAdmin && (
            <button
              className="btn-primary"
              disabled={isFormOpen}
              onClick={() => {
                setEditing(null);
                setIsFormOpen(true);
                setSuccess('');
              }}
            >
              New plan
            </button>
          )
        }
      />
      <Alert>{error}</Alert>
      <Alert tone="success">{success}</Alert>
      {isFormOpen && (
        <PlanForm
          key={editing?.id ?? 'new'}
          plan={editing}
          onSaved={handleSaved}
          onCancel={() => setIsFormOpen(false)}
        />
      )}
      <div className="card min-w-0">
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <Field label="Search plans">
            <input
              aria-label="Search plans"
              className="input"
              maxLength={100}
              value={query.q}
              onChange={(event) => handleFilter('q', event.target.value)}
            />
          </Field>
          <Field label="Available on">
            <input
              aria-label="Available on"
              className="input"
              type="date"
              value={query.availableOn}
              onChange={(event) => handleFilter('availableOn', event.target.value)}
            />
          </Field>
          <Field label="Availability">
            <select
              aria-label="Availability"
              className="input"
              value={query.isActive}
              onChange={(event) => handleFilter('isActive', event.target.value)}
            >
              <option value="">All</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </Field>
        </div>
        {isLoading ? (
          <Spinner />
        ) : (
          data && (
            <>
              {data.items.length ? (
                <div className="relative overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200">
                        {COLUMNS.map((label) => (
                          <th key={label} className="p-2">
                            {label}
                          </th>
                        ))}
                        {isAdmin && <th className="p-2">Action</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {data.items.map((plan) => (
                        <tr key={plan.id} className="border-b border-slate-100">
                          <td className="p-2">{plan.name}</td>
                          <td className="p-2">{plan.product.name}</td>
                          <td className="p-2">{formatMoney(plan.price)}</td>
                          <td className="p-2">{formatLabel(plan.billingPeriod)}</td>
                          <td className="p-2">{plan.minQuantity}</td>
                          <td className="p-2">
                            {formatDate(plan.startDate)}
                            {plan.endDate ? ' to ' + formatDate(plan.endDate) : ' onwards'}
                          </td>
                          <td className="p-2">{plan.isActive ? 'Active' : 'Inactive'}</td>
                          {isAdmin && (
                            <td className="p-2">
                              <button
                                className="btn-secondary"
                                disabled={isFormOpen}
                                onClick={() => {
                                  setEditing(plan);
                                  setIsFormOpen(true);
                                  setSuccess('');
                                }}
                              >
                                Edit<span className="sr-only"> {plan.name}</span>
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState title="No plans match these filters" />
              )}
              <Pagination
                page={data.page}
                pages={data.pages}
                onChange={(page) => {
                  const next = new URLSearchParams(params);
                  next.set('page', page);
                  setParams(next);
                }}
              />
            </>
          )
        )}
      </div>
    </div>
  );
}
