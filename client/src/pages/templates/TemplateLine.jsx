// Editable product choices show current unit prices without storing them (PS-11, A-5).
import CatalogPicker from '../../components/CatalogPicker.jsx';
import { Alert, Field, Spinner } from '../../components/ui.jsx';
import { formatMoney } from '../../lib/format.js';
import { useApi } from '../../lib/useApi.js';
import { MAX_TEMPLATE_INTEGER } from '../../lib/validators.js';

function VariantChoice({ line, plan, onChange, error, disabled }) {
  const { data, loading: isLoading, error: loadError } = useApi('/products/' + line.productId);
  if (isLoading) return <Spinner />;
  return (
    <div className="space-y-2">
      <Alert>{loadError}</Alert>
      {data && (
        <>
          <Field label="Variant" error={error}>
            <select
              aria-label="Variant"
              className={'input' + (error ? ' input-error' : '')}
              disabled={disabled}
              value={line.variantId ?? ''}
              onChange={(event) => onChange({ ...line, variantId: event.target.value })}
            >
              <option value="">No variant</option>
              {data.variants.map((variant) => (
                <option key={variant.id} value={variant.id}>
                  {variant.attribute}: {variant.value} (+{formatMoney(variant.extraPrice)})
                </option>
              ))}
            </select>
          </Field>
          <p className="text-sm text-slate-600">
            Current unit price:{' '}
            {formatMoney(
              (plan?.productId === data.id ? plan.price : data.salesPrice) +
                (data.variants.find((variant) => variant.id === Number(line.variantId))?.extraPrice ?? 0),
            )}
          </p>
          {!plan && <p className="text-sm text-slate-500">Choose a plan for final pricing.</p>}
        </>
      )}
    </div>
  );
}

export default function TemplateLine({ line, index, plan, onChange, onRemove, fields, disabled }) {
  const field = (key) => fields['lines.' + index + '.' + key];
  return (
    <fieldset
      disabled={disabled}
      aria-label={'Line ' + (index + 1)}
      className="min-w-0 space-y-3 rounded-lg border border-slate-200 p-4"
    >
      <legend className="px-1 font-medium">Line {index + 1}</legend>
      <CatalogPicker
        resource="products"
        label="Product"
        value={line.productId}
        initialOption={line.product}
        error={field('productId')}
        disabled={disabled}
        onChange={(product) => onChange({ ...line, product, productId: product?.id ?? '', variantId: '' })}
      />
      {line.productId && (
        <VariantChoice
          key={line.productId}
          line={line}
          plan={plan}
          onChange={onChange}
          disabled={disabled}
          error={field('variantId')}
        />
      )}
      <Field label="Quantity" error={field('quantity')}>
        <input
          aria-label="Quantity"
          className={'input' + (field('quantity') ? ' input-error' : '')}
          type="number"
          min="1"
          max={MAX_TEMPLATE_INTEGER}
          step="1"
          value={line.quantity}
          onChange={(event) => onChange({ ...line, quantity: event.target.value })}
        />
      </Field>
      <button type="button" className="btn-danger" onClick={onRemove}>
        Remove line
      </button>
    </fieldset>
  );
}
