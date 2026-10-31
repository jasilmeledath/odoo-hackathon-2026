// Staff catalog browsing and Admin product writes (PS-6).
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Alert, EmptyState, Field, PageHeader, Pagination, Spinner } from '../../components/ui.jsx';
import { useAuth } from '../../lib/auth.jsx';
import { formatLabel, formatMoney } from '../../lib/format.js';
import { useApi } from '../../lib/useApi.js';
import { PRODUCT_TYPES } from '../../lib/validators.js';
import ProductForm from './ProductForm.jsx';

export default function ProductList() {
  const [params, setParams] = useSearchParams();
  const query = {
    page: params.get('page') || 1,
    q: params.get('q') || '',
    type: params.get('type') || '',
    isActive: params.get('isActive') ?? '',
  };
  const { data, loading: isLoading, error, reload } = useApi('/products', query);
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
    setSuccess('Product saved');
    await reload();
  };
  return (
    <div className="space-y-4">
      <PageHeader
        title="Products"
        subtitle="Products, prices and catalog availability"
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
              New product
            </button>
          )
        }
      />
      <Alert>{error}</Alert>
      <Alert tone="success">{success}</Alert>
      {isFormOpen && (
        <ProductForm
          key={editing?.id ?? 'new'}
          product={editing}
          onSaved={handleSaved}
          onCancel={() => setIsFormOpen(false)}
        />
      )}
      <div className="card min-w-0">
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <Field label="Search products">
            <input
              aria-label="Search products"
              className="input"
              maxLength={100}
              value={query.q}
              onChange={(event) => handleFilter('q', event.target.value)}
            />
          </Field>
          <Field label="Product type">
            <select
              aria-label="Product type"
              className="input"
              value={query.type}
              onChange={(event) => handleFilter('type', event.target.value)}
            >
              <option value="">All types</option>
              {PRODUCT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {formatLabel(type)}
                </option>
              ))}
            </select>
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
                        {['Name', 'Type', 'Sales price', 'Cost price', 'Status'].map((label) => (
                          <th key={label} className="p-2">
                            {label}
                          </th>
                        ))}
                        {isAdmin && <th className="p-2">Action</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {data.items.map((product) => (
                        <tr key={product.id} className="border-b border-slate-100">
                          <td className="p-2">{product.name}</td>
                          <td className="p-2">{formatLabel(product.type)}</td>
                          <td className="p-2">{formatMoney(product.salesPrice)}</td>
                          <td className="p-2">{formatMoney(product.costPrice)}</td>
                          <td className="p-2">{product.isActive ? 'Active' : 'Inactive'}</td>
                          {isAdmin && (
                            <td className="p-2">
                              <button
                                className="btn-secondary"
                                disabled={isFormOpen}
                                onClick={() => {
                                  setEditing(product);
                                  setIsFormOpen(true);
                                  setSuccess('');
                                }}
                              >
                                Edit<span className="sr-only"> {product.name}</span>
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState title="No products match these filters" />
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
