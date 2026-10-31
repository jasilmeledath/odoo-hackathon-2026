// Staff browse current rule states; Admins manage discounts (PS-19).
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Alert,
  EmptyState,
  Field,
  PageHeader,
  Pagination,
  Spinner,
  StatusBadge,
} from '../../components/ui.jsx';
import { api } from '../../lib/api.js';
import { useAuth } from '../../lib/auth.jsx';
import { formatDate, formatLabel, formatMoney } from '../../lib/format.js';
import { useApi } from '../../lib/useApi.js';
import { DISCOUNT_STATES } from '../../lib/validators.js';
import DiscountForm from './DiscountForm.jsx';

const COLUMNS = ['Name', 'Value', 'Scope / products', 'Minimums', 'Dates', 'Uses', 'State'];
export default function DiscountList() {
  const [params, setParams] = useSearchParams();
  const query = { q: params.get('q') || '', state: params.get('state') || '', page: params.get('page') || 1 };
  const { data, loading: isLoading, error: loadError, reload } = useApi('/discounts', query);
  const { isAdmin } = useAuth();
  const [editing, setEditing] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const handleEdit = async (id) => {
    setIsOpening(true);
    setError('');
    setSuccess('');
    try {
      setEditing(await api('/discounts/' + id));
      setIsFormOpen(true);
    } catch (failure) {
      setError(failure.message);
    } finally {
      setIsOpening(false);
    }
  };
  const changeQuery = (key, value) => {
    const next = new URLSearchParams(params);
    value ? next.set(key, value) : next.delete(key);
    if (key !== 'page') next.delete('page');
    setParams(next, { replace: true });
  };
  return (
    <div className="space-y-4">
      <PageHeader
        title="Discounts"
        subtitle="Current rules applied automatically at billing"
        action={
          isAdmin && (
            <button
              className="btn-primary"
              disabled={isFormOpen || isOpening}
              onClick={() => {
                setEditing(null);
                setIsFormOpen(true);
                setSuccess('');
              }}
            >
              New discount
            </button>
          )
        }
      />
      <Alert>{loadError || error}</Alert>
      <Alert tone="success">{success}</Alert>
      {isOpening && <Spinner />}
      {isFormOpen && (
        <DiscountForm
          key={editing?.id ?? 'new'}
          discount={editing}
          onCancel={() => setIsFormOpen(false)}
          onSaved={async () => {
            setIsFormOpen(false);
            setEditing(null);
            setSuccess('Discount saved');
            await reload();
          }}
        />
      )}
      <div className="card min-w-0">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Search discounts">
            <input
              aria-label="Search discounts"
              className="input"
              maxLength={100}
              value={query.q}
              onChange={(event) => changeQuery('q', event.target.value)}
            />
          </Field>
          <Field label="State">
            <select
              aria-label="State"
              className="input"
              value={query.state}
              onChange={(event) => changeQuery('state', event.target.value)}
            >
              <option value="">All states</option>
              {DISCOUNT_STATES.map((state) => (
                <option key={state} value={state}>
                  {formatLabel(state)}
                </option>
              ))}
            </select>
          </Field>
        </div>
        {isLoading ? (
          <Spinner />
        ) : (
          data && (
            <>
              {data.items.length ? (
                <div className="relative mt-4 overflow-x-auto">
                  <table className="min-w-max w-full text-left text-sm">
                    <thead>
                      <tr>
                        {COLUMNS.map((label) => (
                          <th key={label} className="p-2">
                            {label}
                          </th>
                        ))}
                        {isAdmin && <th className="p-2">Action</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {data.items.map((discount) => (
                        <tr key={discount.id} className="border-t border-slate-100">
                          <td className="p-2">{discount.name}</td>
                          <td className="p-2">
                            {discount.type === 'FIXED'
                              ? formatMoney(discount.fixedAmount)
                              : discount.percent + '%'}
                          </td>
                          <td className="max-w-64 break-words p-2">
                            {discount.scope === 'PRODUCT'
                              ? discount.products.map((product) => product.name).join(', ')
                              : 'Whole subscription'}
                          </td>
                          <td className="p-2">
                            {formatMoney(discount.minPurchaseAmount)} / {discount.minQuantity} units
                          </td>
                          <td className="p-2">
                            {formatDate(discount.startDate)} to {formatDate(discount.endDate)}
                          </td>
                          <td className="p-2">
                            {discount.usageCount} / {discount.usageLimit ?? 'Unlimited'}
                          </td>
                          <td className="p-2">
                            <StatusBadge status={discount.state} />
                          </td>
                          {isAdmin && (
                            <td className="p-2">
                              <button
                                type="button"
                                className="btn-secondary"
                                disabled={isFormOpen || isOpening}
                                aria-label={'Edit ' + discount.name}
                                onClick={() => handleEdit(discount.id)}
                              >
                                Edit
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState title="No discounts match these filters" />
              )}
              <Pagination
                page={data.page}
                pages={data.pages}
                onChange={(page) => changeQuery('page', page)}
              />
            </>
          )
        )}
      </div>
    </div>
  );
}
