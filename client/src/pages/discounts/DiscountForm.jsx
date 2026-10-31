// Admin rule editing converts rupees once and preserves read-only usage (PS-19).
import { useState } from 'react';
import { Alert } from '../../components/ui.jsx';
import { api } from '../../lib/api.js';
import { useToast } from '../../lib/toast.js';
import { toInputDate, toPaise, toRupees } from '../../lib/format.js';
import { validateDiscount } from '../../lib/validators.js';
import DiscountFields from './DiscountFields.jsx';
import DiscountProducts from './DiscountProducts.jsx';

export default function DiscountForm({ discount, onSaved, onCancel }) {
  const [form, setForm] = useState({
    name: discount?.name ?? '',
    type: discount?.type ?? 'FIXED',
    scope: discount?.scope ?? 'SUBSCRIPTION',
    fixedAmount: discount?.fixedAmount === null || !discount ? '' : String(toRupees(discount.fixedAmount)),
    percent: discount?.percent === null || !discount ? '' : String(discount.percent),
    minPurchaseAmount: discount ? String(toRupees(discount.minPurchaseAmount)) : '0',
    minQuantity: String(discount?.minQuantity ?? 0),
    startDate: toInputDate(discount?.startDate),
    endDate: toInputDate(discount?.endDate),
    usageLimit: String(discount?.usageLimit ?? ''),
    isActive: discount?.isActive ?? true,
    products: discount?.products ?? [],
  });
  const [fields, setFields] = useState({});
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();
  const handleSubmit = async (event) => {
    event.preventDefault();
    const validation = validateDiscount(form, discount?.usageCount ?? 0);
    setFields(validation);
    setError('');
    if (Object.keys(validation).length) {
      toast.error('Please fix the highlighted fields.');
      return;
    }
    if (isSaving) return;
    if (
      discount?.isActive &&
      !form.isActive &&
      !window.confirm('Deactivate this discount? Existing usage will be retained.')
    )
      return;
    setIsSaving(true);
    try {
      const { products, ...values } = form;
      await api('/discounts' + (discount ? '/' + discount.id : ''), {
        method: discount ? 'PUT' : 'POST',
        body: {
          ...values,
          fixedAmount: form.type === 'FIXED' ? toPaise(form.fixedAmount) : null,
          percent: form.type === 'PERCENT' ? Number(form.percent) : null,
          minPurchaseAmount: toPaise(form.minPurchaseAmount),
          minQuantity: Number(form.minQuantity),
          usageLimit: form.usageLimit.trim() ? Number(form.usageLimit) : null,
          productIds: form.scope === 'PRODUCT' ? products.map((product) => product.id) : [],
        },
      });
      toast.success(discount ? 'Discount saved' : 'Discount created');
      await onSaved();
    } catch (failure) {
      setFields(failure.fields ?? {});
      setError(failure.message);
      toast.error(failure.message);
    } finally {
      setIsSaving(false);
    }
  };
  return (
    <form noValidate onSubmit={handleSubmit} className="card min-w-0">
      <fieldset disabled={isSaving} className="min-w-0 space-y-4">
        <legend className="mb-4 text-lg font-semibold">{discount ? 'Edit discount' : 'New discount'}</legend>
        <Alert>{error}</Alert>
        {discount && <p className="text-sm text-slate-600">Uses recorded: {discount.usageCount}</p>}
        <DiscountFields
          form={form}
          fields={fields}
          onChange={(key, value) =>
            setForm({
              ...form,
              [key]: value,
              ...(key === 'scope' && value === 'SUBSCRIPTION' ? { products: [] } : {}),
            })
          }
        />
        {form.scope === 'PRODUCT' && (
          <DiscountProducts
            products={form.products}
            disabled={isSaving}
            error={fields.productIds}
            onChange={(products) => setForm({ ...form, products })}
          />
        )}
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(event) => setForm({ ...form, isActive: event.target.checked })}
          />
          Active
        </label>
        <div className="flex flex-wrap gap-2">
          <button className="btn-primary">{isSaving ? 'Saving...' : 'Save discount'}</button>
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </fieldset>
    </form>
  );
}
