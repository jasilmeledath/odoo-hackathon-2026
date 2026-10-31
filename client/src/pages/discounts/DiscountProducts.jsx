// PRODUCT-scoped rules use paginated choices and stable selected product IDs (PS-19).
import CatalogPicker from '../../components/CatalogPicker.jsx';
import { Field } from '../../components/ui.jsx';
import { MAX_DISCOUNT_PRODUCTS } from '../../lib/validators.js';

export default function DiscountProducts({ products, onChange, error, disabled }) {
  return (
    <section aria-label="Discount products" className="space-y-3 min-w-0">
      <Field label="Selected products" error={error}>
        {products.length ? (
          <ul className="space-y-2">
            {products.map((product) => (
              <li key={product.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="break-words">{product.name}</span>
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={disabled}
                  aria-label={'Remove product ' + product.name}
                  onClick={() => onChange(products.filter((item) => item.id !== product.id))}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">No products selected</p>
        )}
      </Field>
      <CatalogPicker
        resource="products"
        label="Product"
        value=""
        disabled={disabled || products.length >= MAX_DISCOUNT_PRODUCTS}
        onChange={(product) => {
          if (product && !products.some((item) => item.id === product.id)) onChange([...products, product]);
        }}
      />
    </section>
  );
}
