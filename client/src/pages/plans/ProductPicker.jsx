// Paginated product choices avoid loading the entire catalog into a plan form (PS-8).
import { useState } from 'react';
import { Alert, Field, Pagination } from '../../components/ui.jsx';
import { useApi } from '../../lib/useApi.js';

export default function ProductPicker({ value, initialProduct, onChange, error, disabled }) {
  const [q, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(initialProduct ?? null);
  const { data, loading: isLoading, error: loadError } = useApi('/products', { q, page });
  return (
    <div className="space-y-2">
      <Field label="Find a product">
        <input
          aria-label="Find a product"
          className="input"
          maxLength={100}
          disabled={disabled}
          value={q}
          onChange={(event) => {
            setQuery(event.target.value);
            setPage(1);
          }}
        />
      </Field>
      <Field label="Product" error={error}>
        <select
          aria-label="Product"
          className={'input' + (error ? ' input-error' : '')}
          disabled={disabled || isLoading}
          value={value}
          onChange={(event) => {
            const id = Number(event.target.value);
            setSelected(data?.items.find((product) => product.id === id) ?? selected);
            onChange(event.target.value);
          }}
        >
          <option value="">Choose a product</option>
          {selected && !data?.items.some((product) => product.id === selected.id) && (
            <option value={selected.id}>{selected.name}</option>
          )}
          {data?.items.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name}
              {product.isActive ? '' : ' (Inactive)'}
            </option>
          ))}
        </select>
      </Field>
      <Alert>{loadError}</Alert>
      {isLoading && <p className="text-sm text-slate-500">Loading products...</p>}
      {data && <Pagination page={data.page} pages={data.pages} onChange={setPage} />}
    </div>
  );
}
