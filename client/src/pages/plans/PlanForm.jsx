// Plan form validates sale dates and converts rupees once before saving (PS-8, PS-9).
import { useState } from 'react';
import { Alert, Field } from '../../components/ui.jsx';
import { api } from '../../lib/api.js';
import { useToast } from '../../lib/toast.js';
import { formatLabel, toInputDate, toPaise, toRupees } from '../../lib/format.js';
import {
  BILLING_PERIODS,
  MAX_PLAN_NAME,
  MAX_PLAN_QUANTITY,
  MAX_PLAN_PRICE_RUPEES,
  validatePlan,
} from '../../lib/validators.js';
import ProductPicker from './ProductPicker.jsx';

const SWITCHES = [
  ['closesAtExpiry', 'Close automatically at expiry'],
  ['canCloseEarly', 'Allow early closing'],
  ['canPause', 'Allow pausing'],
  ['canRenew', 'Allow renewal'],
  ['isActive', 'Active'],
];
const INPUTS = [
  { key: 'name', label: 'Name', type: 'text', maxLength: MAX_PLAN_NAME },
  { key: 'price', label: 'Price (rupees)', type: 'number', min: 0, max: MAX_PLAN_PRICE_RUPEES, step: '0.01' },
  {
    key: 'minQuantity',
    label: 'Minimum quantity',
    type: 'number',
    min: 1,
    max: MAX_PLAN_QUANTITY,
    step: '1',
  },
  { key: 'startDate', label: 'Start date', type: 'date' },
  { key: 'endDate', label: 'End date', type: 'date' },
];

export default function PlanForm({ plan, onSaved, onCancel }) {
  const [form, setForm] = useState({
    name: plan?.name ?? '',
    productId: plan?.productId ?? '',
    price: plan ? String(toRupees(plan.price)) : '',
    billingPeriod: plan?.billingPeriod ?? 'MONTHLY',
    minQuantity: String(plan?.minQuantity ?? 1),
    startDate: toInputDate(plan?.startDate),
    endDate: toInputDate(plan?.endDate),
    closesAtExpiry: plan?.closesAtExpiry ?? false,
    canCloseEarly: plan?.canCloseEarly ?? true,
    canPause: plan?.canPause ?? false,
    canRenew: plan?.canRenew ?? true,
    isActive: plan?.isActive ?? true,
  });
  const [fields, setFields] = useState({});
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();
  const handleSubmit = async (event) => {
    event.preventDefault();
    const validation = validatePlan(form);
    setFields(validation);
    setError('');
    if (Object.keys(validation).length) {
      toast.error('Please fix the highlighted fields.');
      return;
    }
    if (
      plan?.isActive &&
      !form.isActive &&
      !window.confirm('Deactivate this plan? Existing history will be retained.')
    )
      return;
    setIsSaving(true);
    try {
      await api('/plans' + (plan ? '/' + plan.id : ''), {
        method: plan ? 'PUT' : 'POST',
        body: {
          ...form,
          productId: Number(form.productId),
          price: toPaise(form.price),
          minQuantity: Number(form.minQuantity),
          endDate: form.endDate || null,
        },
      });
      toast.success(plan ? 'Plan saved' : 'Plan created');
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
    <form noValidate onSubmit={handleSubmit} className="card space-y-4">
      <h2 className="text-lg font-semibold">{plan ? 'Edit plan' : 'New plan'}</h2>
      <Alert>{error}</Alert>
      <ProductPicker
        value={form.productId}
        initialProduct={plan?.product}
        onChange={(productId) => setForm({ ...form, productId })}
        error={fields.productId}
        disabled={isSaving}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {INPUTS.map(({ key, label, ...inputProps }) => (
          <Field key={key} label={label} error={fields[key]}>
            <input
              {...inputProps}
              aria-label={label}
              className={'input' + (fields[key] ? ' input-error' : '')}
              disabled={isSaving}
              value={form[key]}
              onChange={(event) => setForm({ ...form, [key]: event.target.value })}
            />
          </Field>
        ))}
        <Field label="Billing period" error={fields.billingPeriod}>
          <select
            aria-label="Billing period"
            className={'input' + (fields.billingPeriod ? ' input-error' : '')}
            disabled={isSaving}
            value={form.billingPeriod}
            onChange={(event) => setForm({ ...form, billingPeriod: event.target.value })}
          >
            {BILLING_PERIODS.map((period) => (
              <option key={period} value={period}>
                {formatLabel(period)}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {SWITCHES.map(([key, label]) => (
          <label key={key} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form[key]}
              disabled={isSaving}
              onChange={(event) => setForm({ ...form, [key]: event.target.checked })}
            />
            {label}
          </label>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <button className="btn-primary" disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save plan'}
        </button>
        <button type="button" className="btn-secondary" disabled={isSaving} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
