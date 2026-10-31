// One list/form interaction for the two small catalog rules (PS-10, PS-12).
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Alert, EmptyState, Field, Pagination, Spinner } from '../../components/ui.jsx';
import { api } from '../../lib/api.js';
import { useAuth } from '../../lib/auth.jsx';
import { useApi } from '../../lib/useApi.js';
import { useToast } from '../../lib/toast.js';
import {
  MAX_CATALOG_RULE_NAME,
  MAX_TAX_RATE,
  MAX_PAYMENT_DUE_DAYS,
  validateCatalogRule,
} from '../../lib/validators.js';

export default function TaxTermSection({ kind }) {
  const isTax = kind === 'taxes';
  const title = isTax ? 'Tax rules' : 'Payment terms';
  const entity = isTax ? 'Tax' : 'Payment term';
  const valueKey = isTax ? 'ratePercent' : 'dueDays';
  const valueLabel = isTax ? 'Rate (%)' : 'Due days';
  const pageKey = isTax ? 'taxPage' : 'termPage';
  const [params, setParams] = useSearchParams();
  const page = params.get(pageKey) || 1;
  const { data, loading: isLoading, error, reload } = useApi('/' + kind, { page });
  const { isAdmin } = useAuth();
  const emptyForm = { name: '', [valueKey]: '', isActive: true };
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [fields, setFields] = useState({});
  const [saveError, setSaveError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();
  const resetForm = () => {
    setEditing(null);
    setForm(emptyForm);
    setFields({});
    setSaveError('');
  };
  const handleEdit = (record) => {
    setEditing(record);
    setForm({ name: record.name, [valueKey]: String(record[valueKey]), isActive: record.isActive });
    setFields({});
    setSaveError('');
    setSuccess('');
  };
  const handleSubmit = async (event) => {
    event.preventDefault();
    const validation = validateCatalogRule(form, isTax);
    setFields(validation);
    setSaveError('');
    setSuccess('');
    if (Object.keys(validation).length) {
      toast.error('Please fix the highlighted fields.');
      return;
    }
    if (
      editing?.isActive &&
      !form.isActive &&
      !window.confirm('Deactivate this ' + entity.toLowerCase() + '? Existing records will be retained.')
    )
      return;
    setIsSaving(true);
    try {
      await api('/' + kind + (editing ? '/' + editing.id : ''), {
        method: editing ? 'PUT' : 'POST',
        body: { ...form, [valueKey]: Number(form[valueKey]) },
      });
      resetForm();
      setSuccess(entity + ' saved');
      toast.success(entity + ' saved');
      await reload();
    } catch (failure) {
      setFields(failure.fields ?? {});
      setSaveError(failure.message);
      toast.error(failure.message);
    } finally {
      setIsSaving(false);
    }
  };
  return (
    <section aria-labelledby={kind + '-title'} className="card min-w-0">
      <h2 id={kind + '-title'} className="mb-4 text-lg font-semibold">
        {title}
      </h2>
      <Alert>{error}</Alert>
      {isLoading ? (
        <Spinner />
      ) : (
        data && (
          <>
            {data.items.length ? (
              <div className="relative overflow-x-auto">
                <table className="min-w-max w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="p-2">Name</th>
                      <th className="p-2">{valueLabel}</th>
                      <th className="p-2">Status</th>
                      {isAdmin && <th className="p-2">Action</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((record) => (
                      <tr key={record.id} className="border-b border-slate-100">
                        <td className="p-2">{record.name}</td>
                        <td className="p-2">
                          {record[valueKey]}
                          {isTax ? '%' : ''}
                        </td>
                        <td className="p-2">{record.isActive ? 'Active' : 'Inactive'}</td>
                        {isAdmin && (
                          <td className="p-2">
                            <button
                              className="btn-secondary"
                              disabled={isSaving}
                              onClick={() => handleEdit(record)}
                            >
                              Edit<span className="sr-only"> {record.name}</span>
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState title={'No ' + title.toLowerCase() + ' yet'} />
            )}
            <Pagination
              page={data.page}
              pages={data.pages}
              onChange={(next) => {
                const updated = new URLSearchParams(params);
                updated.set(pageKey, next);
                setParams(updated);
              }}
            />
          </>
        )
      )}
      {isAdmin && (
        <form noValidate onSubmit={handleSubmit} className="mt-5 space-y-4 border-t border-slate-200 pt-5">
          <h3 className="font-medium">
            {editing ? 'Edit ' : 'New '}
            {entity.toLowerCase()}
          </h3>
          <Alert>{saveError}</Alert>
          <Alert tone="success">{success}</Alert>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={entity + ' name'} error={fields.name}>
              <input
                aria-label={entity + ' name'}
                className={'input' + (fields.name ? ' input-error' : '')}
                maxLength={MAX_CATALOG_RULE_NAME}
                disabled={isSaving}
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
              />
            </Field>
            <Field label={valueLabel} error={fields[valueKey]}>
              <input
                aria-label={valueLabel}
                className={'input' + (fields[valueKey] ? ' input-error' : '')}
                type="number"
                min="0"
                max={isTax ? MAX_TAX_RATE : MAX_PAYMENT_DUE_DAYS}
                step={isTax ? '0.01' : '1'}
                disabled={isSaving}
                value={form[valueKey]}
                onChange={(event) => setForm({ ...form, [valueKey]: event.target.value })}
              />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isActive}
              disabled={isSaving}
              onChange={(event) => setForm({ ...form, isActive: event.target.checked })}
            />
            Active
          </label>
          <div className="flex flex-wrap gap-2">
            <button className="btn-primary" disabled={isSaving}>
              {isSaving ? 'Saving…' : 'Save ' + entity.toLowerCase()}
            </button>
            {editing && (
              <button type="button" className="btn-secondary" disabled={isSaving} onClick={resetForm}>
                Cancel edit
              </button>
            )}
          </div>
        </form>
      )}
    </section>
  );
}
