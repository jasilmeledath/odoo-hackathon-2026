// Invoice list with paid, outstanding and overdue filters (PS-17, PS-22). The
// filters live in the URL, so they survive a refresh and other pages can link here.
import { useState } from 'react';
import InvoiceTable from './InvoiceTable.jsx';
import { api } from '../../lib/api.js';
import { useSearchParams } from 'react-router-dom';
import { Alert, EmptyState, Field, PageHeader, Pagination, Spinner } from '../../components/ui.jsx';
import { useApi } from '../../lib/useApi.js';
import { validateDateRange } from '../../lib/validators.js';

const VIEWS = [
  { key: 'all', label: 'All', params: {} },
  { key: 'draft', label: 'Draft', params: { status: 'DRAFT' } },
  { key: 'outstanding', label: 'Outstanding', params: { status: 'CONFIRMED' } },
  { key: 'overdue', label: 'Overdue', params: { isOverdue: 'true' } },
  { key: 'paid', label: 'Paid', params: { status: 'PAID' } },
  { key: 'canceled', label: 'Canceled', params: { status: 'CANCELED' } },
];
const VIEW_PARAM_NAMES = ['status', 'isOverdue'];
const TEXT_FILTER_NAMES = ['q', 'from', 'to'];

// The tab that matches the URL, so a link from the dashboard highlights the right one.
const findActiveView = (searchParams) =>
  VIEWS.find((view) =>
    VIEW_PARAM_NAMES.every((name) => (view.params[name] ?? null) === searchParams.get(name)),
  );

function ViewTabs({ activeKey, onSelect }) {
  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {VIEWS.map((view) => (
        <button
          key={view.key}
          type="button"
          className={view.key === activeKey ? 'btn-primary' : 'btn-secondary'}
          onClick={() => onSelect(view)}
        >
          {view.label}
        </button>
      ))}
    </div>
  );
}

function InvoiceFilters({ values, onApply }) {
  const [form, setForm] = useState(values);
  const [errors, setErrors] = useState({});

  const handleChange = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  const handleSubmit = (event) => {
    event.preventDefault();
    const rangeError = validateDateRange(form.from, form.to);
    setErrors(rangeError ? { to: rangeError } : {});
    if (!rangeError) onApply(form);
  };

  const handleClear = () => {
    setErrors({});
    onApply({ q: '', from: '', to: '' });
  };

  return (
    <form noValidate onSubmit={handleSubmit} className="card mb-4 grid gap-4 sm:grid-cols-4">
      <Field label="Search">
        <input
          className="input"
          name="q"
          value={form.q}
          maxLength={100}
          placeholder="Invoice number or customer"
          onChange={handleChange}
        />
      </Field>
      <Field label="Issued from">
        <input className="input" type="date" name="from" value={form.from} onChange={handleChange} />
      </Field>
      <Field label="Issued to" error={errors.to}>
        <input
          className={`input ${errors.to ? 'input-error' : ''}`}
          type="date"
          name="to"
          value={form.to}
          onChange={handleChange}
        />
      </Field>
      <div className="flex items-end gap-2">
        <button className="btn-primary" type="submit">
          Apply
        </button>
        <button className="btn-secondary" type="button" onClick={handleClear}>
          Clear
        </button>
      </div>
    </form>
  );
}

export default function InvoiceList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data, loading, error, reload } = useApi('/invoices', Object.fromEntries(searchParams));
  const [selectedIds, setSelectedIds] = useState([]);
  const [isConfirming, setIsConfirming] = useState(false);
  const [bulkError, setBulkError] = useState('');
  const [bulkResult, setBulkResult] = useState(null);
  const draftIds =
    data?.items.filter((invoice) => invoice.status === 'DRAFT').map((invoice) => invoice.id) ?? [];
  const selected = selectedIds.filter((id) => draftIds.includes(id));
  const handleBulkConfirm = async () => {
    if (isConfirming || !selected.length) return;
    setIsConfirming(true);
    setBulkError('');
    setBulkResult(null);
    try {
      setBulkResult(await api('/invoices/confirm-all', { method: 'POST', body: { invoiceIds: selected } }));
      setSelectedIds([]);
      await reload();
    } catch (failure) {
      setBulkError(failure.message);
    } finally {
      setIsConfirming(false);
    }
  };
  const activeView = findActiveView(searchParams);

  // Any filter change goes back to page 1, because the old page may no longer exist.
  const updateParams = (changes) => {
    const next = new URLSearchParams(searchParams);
    next.delete('page');
    Object.entries(changes).forEach(([name, value]) => (value ? next.set(name, value) : next.delete(name)));
    setSearchParams(next);
  };

  const handleSelectView = (view) =>
    updateParams(Object.fromEntries(VIEW_PARAM_NAMES.map((name) => [name, view.params[name] ?? ''])));

  const filterValues = Object.fromEntries(
    TEXT_FILTER_NAMES.map((name) => [name, searchParams.get(name) ?? '']),
  );

  return (
    <>
      <PageHeader
        title="Invoices"
        subtitle={
          data ? `${data.total} ${data.total === 1 ? 'invoice' : 'invoices'}` : 'Everything billed so far'
        }
      />
      <ViewTabs activeKey={activeView?.key} onSelect={handleSelectView} />
      <InvoiceFilters key={JSON.stringify(filterValues)} values={filterValues} onApply={updateParams} />
      <Alert>{error || bulkError}</Alert>
      <div aria-live="polite">
        {bulkResult && (
          <Alert tone={bulkResult.failed ? 'error' : 'success'}>
            Confirmed: {bulkResult.confirmed} · Skipped: {bulkResult.skipped} · Failed: {bulkResult.failed}
          </Alert>
        )}
      </div>
      {draftIds.length > 0 && (
        <button
          className="btn-primary mb-4"
          disabled={isConfirming || loading || !selected.length}
          onClick={handleBulkConfirm}
        >
          {isConfirming ? 'Confirming…' : `Confirm selected (${selected.length})`}
        </button>
      )}
      {loading && <Spinner />}
      {data && data.items.length === 0 && (
        <EmptyState title="No invoices match">Try another view, or clear the filters.</EmptyState>
      )}
      {data && data.items.length > 0 && (
        <>
          <InvoiceTable
            items={data.items}
            selected={selected}
            onSelect={setSelectedIds}
            disabled={isConfirming}
          />
          <Pagination
            page={data.page}
            pages={data.pages}
            onChange={(page) => setSearchParams({ ...Object.fromEntries(searchParams), page })}
          />
        </>
      )}
    </>
  );
}
