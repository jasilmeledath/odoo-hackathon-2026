// Discount inputs mirror server value, date and integer limits (PS-19).
import { Field } from '../../components/ui.jsx';
import { formatLabel } from '../../lib/format.js';
import {
  DISCOUNT_TYPES,
  DISCOUNT_SCOPES,
  MAX_DISCOUNT_NAME,
  MAX_DISCOUNT_INTEGER,
  MAX_DISCOUNT_PERCENTAGE,
  MAX_PRICE_RUPEES,
} from '../../lib/validators.js';

const INPUTS = [
  {
    key: 'minPurchaseAmount',
    label: 'Minimum purchase (rupees)',
    type: 'number',
    min: 0,
    max: MAX_PRICE_RUPEES,
    step: '0.01',
  },
  {
    key: 'minQuantity',
    label: 'Minimum quantity',
    type: 'number',
    min: 0,
    max: MAX_DISCOUNT_INTEGER,
    step: '1',
  },
  { key: 'startDate', label: 'Start date', type: 'date' },
  { key: 'endDate', label: 'End date', type: 'date' },
  {
    key: 'usageLimit',
    label: 'Usage limit',
    type: 'number',
    min: 1,
    max: MAX_DISCOUNT_INTEGER,
    step: '1',
    placeholder: 'Unlimited',
  },
];
export default function DiscountFields({ form, fields, onChange }) {
  const isFixed = form.type === 'FIXED';
  const valueKey = isFixed ? 'fixedAmount' : 'percent';
  const label = isFixed ? 'Fixed amount (rupees)' : 'Percentage';
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Name" error={fields.name}>
        <input
          aria-label="Name"
          className={'input' + (fields.name ? ' input-error' : '')}
          maxLength={MAX_DISCOUNT_NAME}
          value={form.name}
          onChange={(event) => onChange('name', event.target.value)}
        />
      </Field>
      {[
        ['type', 'Type', DISCOUNT_TYPES],
        ['scope', 'Scope', DISCOUNT_SCOPES],
      ].map(([key, title, options]) => (
        <Field key={key} label={title} error={fields[key]}>
          <select
            aria-label={title}
            className={'input' + (fields[key] ? ' input-error' : '')}
            value={form[key]}
            onChange={(event) => onChange(key, event.target.value)}
          >
            {options.map((option) => (
              <option key={option} value={option}>
                {formatLabel(option)}
              </option>
            ))}
          </select>
        </Field>
      ))}
      <Field label={label} error={fields[valueKey]}>
        <input
          aria-label={label}
          className={'input' + (fields[valueKey] ? ' input-error' : '')}
          type="number"
          min="0.01"
          max={isFixed ? MAX_PRICE_RUPEES : MAX_DISCOUNT_PERCENTAGE}
          step="0.01"
          value={form[valueKey]}
          onChange={(event) => onChange(valueKey, event.target.value)}
        />
      </Field>
      {INPUTS.map(({ key, label: title, ...inputProps }) => (
        <Field
          key={key}
          label={title}
          error={fields[key]}
          hint={key === 'usageLimit' ? 'Leave blank for unlimited uses.' : undefined}
        >
          <input
            {...inputProps}
            aria-label={title}
            className={'input' + (fields[key] ? ' input-error' : '')}
            value={form[key]}
            onChange={(event) => onChange(key, event.target.value)}
          />
        </Field>
      ))}
    </div>
  );
}
