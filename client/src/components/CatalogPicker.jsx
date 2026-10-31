// Searchable catalog choices retain the real selection across paginated results.
import { useState } from 'react';
import { Alert, Field, Pagination } from './ui.jsx';
import { useApi } from '../lib/useApi.js';

export default function CatalogPicker({ resource, label, value, initialOption, onChange, error, disabled }) {
  const [q, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(initialOption ?? null);
  const { data, loading: isLoading, error: loadError } = useApi('/' + resource, { q, page });
  return (
    <div className="space-y-2 min-w-0">
      <Field label={'Find a ' + label.toLowerCase()}>
        <input
          aria-label={'Find a ' + label.toLowerCase()}
          className="input"
          maxLength={100}
          disabled={disabled}
          value={q}
          onKeyDown={(event) => {
            if (event.key === 'Enter') event.preventDefault();
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            setPage(1);
          }}
        />
      </Field>
      <Field label={label} error={error}>
        <select
          aria-label={label}
          className={'input' + (error ? ' input-error' : '')}
          disabled={disabled || isLoading}
          value={value}
          onChange={(event) => {
            const option =
              data?.items.find((item) => item.id === Number(event.target.value)) ??
              (selected?.id === Number(event.target.value) ? selected : null);
            setSelected(option);
            onChange(option);
          }}
        >
          <option value="">Choose a {label.toLowerCase()}</option>
          {selected && !data?.items.some((item) => item.id === selected.id) && (
            <option value={selected.id}>{selected.name}</option>
          )}
          {data?.items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
              {item.isActive ? '' : ' (Inactive)'}
            </option>
          ))}
        </select>
      </Field>
      <Alert>{loadError}</Alert>
      {isLoading && <p className="text-sm text-slate-500">Loading choices...</p>}
      {data && !data.items.length && <p className="text-sm text-slate-500">No matching choices</p>}
      {data && <Pagination page={data.page} pages={data.pages} onChange={setPage} disabled={disabled} />}
    </div>
  );
}
