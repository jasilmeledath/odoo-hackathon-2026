// Plans share paginated catalog selection with templates and discounts (PS-8).
import CatalogPicker from '../../components/CatalogPicker.jsx';

export default function ProductPicker({ initialProduct, onChange, ...props }) {
  return (
    <CatalogPicker
      {...props}
      resource="products"
      label="Product"
      initialOption={initialProduct}
      onChange={(product) => onChange(product?.id ?? '')}
    />
  );
}
