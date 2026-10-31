// Product writes use rupee inputs and convert once at the API edge (PS-6).
import { useState } from 'react';
import ProductVariants from './ProductVariants.jsx';
import { Alert, Field } from '../../components/ui.jsx';
import { api } from '../../lib/api.js';
import { formatLabel, formatMoney, toPaise, toRupees } from '../../lib/format.js';
import {
  MAX_PRODUCT_NAME,
  MAX_PRODUCT_NOTES,
  MAX_PRICE_RUPEES,
  PRODUCT_TYPES,
  validateProduct,
} from '../../lib/validators.js';

export default function ProductForm({ product, onSaved, onCancel }) {
  const [form, setForm] = useState({
    name: product?.name ?? '',
    type: product?.type ?? 'SOFTWARE',
    salesPrice: product ? String(toRupees(product.salesPrice)) : '',
    costPrice: product ? String(toRupees(product.costPrice)) : '',
    notes: product?.notes ?? '',
    isActive: product?.isActive ?? true,
  });
  const [fields, setFields] = useState({});
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const handleSubmit = async (event) => {
    event.preventDefault();
    const validation = validateProduct(form);
    setFields(validation);
    setError('');
    if (Object.keys(validation).length) return;
    if (
      product?.isActive &&
      !form.isActive &&
      !window.confirm('Deactivate this product? Existing history will be retained.')
    )
      return;
    setIsSaving(true);
    try {
      await api('/products' + (product ? '/' + product.id : ''), {
        method: product ? 'PUT' : 'POST',
        body: { ...form, salesPrice: toPaise(form.salesPrice), costPrice: toPaise(form.costPrice) },
      });
      await onSaved();
    } catch (failure) {
      setError(failure.message);
      setFields(failure.fields ?? {});
    } finally {
      setIsSaving(false);
    }
  };
  const priceFields = [
    { key: 'salesPrice', label: 'Sales price' },
    { key: 'costPrice', label: 'Cost price' },
  ];
  return (
    <form noValidate onSubmit={handleSubmit} className="card space-y-4">
      <h2 className="text-lg font-semibold">{product ? 'Edit product' : 'New product'}</h2>
      <Alert>{error}</Alert>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" error={fields.name}>
          <input
            aria-label="Name"
            className={'input' + (fields.name ? ' input-error' : '')}
            maxLength={MAX_PRODUCT_NAME}
            disabled={isSaving}
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
          />
        </Field>
        <Field label="Type" error={fields.type}>
          <select
            aria-label="Type"
            className={'input' + (fields.type ? ' input-error' : '')}
            disabled={isSaving}
            value={form.type}
            onChange={(event) => setForm({ ...form, type: event.target.value })}
          >
            {PRODUCT_TYPES.map((type) => (
              <option key={type} value={type}>
                {formatLabel(type)}
              </option>
            ))}
          </select>
        </Field>
        {priceFields.map(({ key, label }) => (
          <Field key={key} label={label + ' (rupees)'} error={fields[key]}>
            <input
              aria-label={label + ' (rupees)'}
              className={'input' + (fields[key] ? ' input-error' : '')}
              type="number"
              min="0"
              max={MAX_PRICE_RUPEES}
              step="0.01"
              disabled={isSaving}
              value={form[key]}
              onChange={(event) => setForm({ ...form, [key]: event.target.value })}
            />
          </Field>
        ))}
      </div>
      <p className="text-sm text-slate-600">
        Margin: {formatMoney(toPaise(form.salesPrice || 0) - toPaise(form.costPrice || 0))}
      </p>
      <Field label="Notes" error={fields.notes}>
        <textarea
          aria-label="Notes"
          className={'input' + (fields.notes ? ' input-error' : '')}
          maxLength={MAX_PRODUCT_NOTES}
          disabled={isSaving}
          value={form.notes}
          onChange={(event) => setForm({ ...form, notes: event.target.value })}
        />
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.isActive}
          disabled={isSaving}
          onChange={(event) => setForm({ ...form, isActive: event.target.checked })}
        />
        Active
      </label>
      {product && <ProductVariants productId={product.id} disabled={isSaving} />}
      <div className="flex flex-wrap gap-2">
        <button className="btn-primary" disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save product'}
        </button>
        <button type="button" className="btn-secondary" disabled={isSaving} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
