// Variant rows and scoped writes live inside the product editor without nested forms (PS-7).
import { useState } from 'react';
import { Alert, EmptyState, Field, Spinner } from '../../components/ui.jsx';
import { api } from '../../lib/api.js';
import { formatMoney, toPaise, toRupees } from '../../lib/format.js';
import { useApi } from '../../lib/useApi.js';
import { MAX_PRICE_RUPEES, MAX_VARIANT_TEXT, validateVariant } from '../../lib/validators.js';

const CHOICES = [
  ['attribute', 'Attribute'],
  ['value', 'Value'],
];
const EMPTY_VARIANT = { attribute: '', value: '', extraPrice: '0' };

export default function ProductVariants({ productId, disabled }) {
  const { data, loading: isLoading, error: loadError, reload } = useApi('/products/' + productId);
  const [form, setForm] = useState(EMPTY_VARIANT);
  const [editingId, setEditingId] = useState(null);
  const [fields, setFields] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const reset = () => {
    setForm(EMPTY_VARIANT);
    setEditingId(null);
    setFields({});
  };
  const handleSave = async () => {
    const validation = validateVariant(form);
    setFields(validation);
    setError('');
    setSuccess('');
    if (Object.keys(validation).length || isSaving || disabled) return;
    setIsSaving(true);
    try {
      await api('/products/' + productId + '/variants' + (editingId ? '/' + editingId : ''), {
        method: editingId ? 'PUT' : 'POST',
        body: { ...form, extraPrice: toPaise(form.extraPrice) },
      });
      reset();
      setSuccess('Variant saved');
      await reload();
    } catch (failure) {
      setFields(failure.fields ?? {});
      setError(failure.message);
    } finally {
      setIsSaving(false);
    }
  };
  const handleRemove = async (variantId) => {
    if (!window.confirm('Remove this variant? Variants used by subscriptions cannot be removed.')) return;
    setIsSaving(true);
    setError('');
    setSuccess('');
    try {
      await api('/products/' + productId + '/variants/' + variantId, { method: 'DELETE' });
      if (editingId === variantId) reset();
      setSuccess('Variant removed');
      await reload();
    } catch (failure) {
      setError(failure.message);
    } finally {
      setIsSaving(false);
    }
  };
  return (
    <fieldset
      aria-label="Product variants"
      disabled={disabled || isSaving}
      className="min-w-0 space-y-3 border-t border-slate-200 pt-4"
      onKeyDown={(event) => {
        if (event.key === 'Enter' && event.target.tagName !== 'BUTTON') {
          event.preventDefault();
          event.stopPropagation();
          void handleSave();
        }
      }}
    >
      <legend className="font-semibold">Variants</legend>
      <Alert>{loadError || error}</Alert>
      <Alert tone="success">{success}</Alert>
      {isLoading ? (
        <Spinner />
      ) : (
        data &&
        (data.variants.length ? (
          <div className="relative overflow-x-auto">
            <table className="min-w-max w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  {['Attribute', 'Value', 'Extra price', 'Action'].map((label) => (
                    <th key={label} className="p-2">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.variants.map((variant) => (
                  <tr key={variant.id} className="border-b border-slate-100">
                    <td className="p-2">{variant.attribute}</td>
                    <td className="p-2">{variant.value}</td>
                    <td className="p-2">{formatMoney(variant.extraPrice)}</td>
                    <td className="p-2">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="btn-secondary"
                          aria-label={'Edit variant ' + variant.attribute + ' ' + variant.value}
                          onClick={() => {
                            setEditingId(variant.id);
                            setForm({
                              attribute: variant.attribute,
                              value: variant.value,
                              extraPrice: String(toRupees(variant.extraPrice)),
                            });
                            setFields({});
                            setError('');
                            setSuccess('');
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn-danger"
                          aria-label={'Remove variant ' + variant.attribute + ' ' + variant.value}
                          onClick={() => handleRemove(variant.id)}
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No variants yet" />
        ))
      )}
      <p className="text-sm font-medium">{editingId ? 'Edit variant' : 'Add variant'}</p>
      <div className="grid gap-3 sm:grid-cols-3">
        {CHOICES.map(([key, label]) => (
          <Field key={key} label={label} error={fields[key]}>
            <input
              aria-label={label}
              className={'input' + (fields[key] ? ' input-error' : '')}
              maxLength={MAX_VARIANT_TEXT}
              value={form[key]}
              onChange={(event) => setForm({ ...form, [key]: event.target.value })}
            />
          </Field>
        ))}
        <Field label="Extra price (rupees)" error={fields.extraPrice}>
          <input
            aria-label="Extra price (rupees)"
            className={'input' + (fields.extraPrice ? ' input-error' : '')}
            type="number"
            min="0"
            max={MAX_PRICE_RUPEES}
            step="0.01"
            value={form.extraPrice}
            onChange={(event) => setForm({ ...form, extraPrice: event.target.value })}
          />
        </Field>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-primary" onClick={handleSave}>
          {isSaving ? 'Saving...' : 'Save variant'}
        </button>
        {editingId && (
          <button type="button" className="btn-secondary" onClick={reset}>
            Cancel variant edit
          </button>
        )}
      </div>
    </fieldset>
  );
}
