// Staff preview uses the current unit prices calculated by the API (PS-11).
import { formatMoney } from '../../lib/format.js';

export default function TemplateDetail({ template, onClose }) {
  return (
    <section className="card min-w-0 space-y-3" aria-label="Template details">
      <h2 className="text-lg font-semibold">{template.name}</h2>
      <p>
        {template.plan.name} · Valid for {template.validityDays} days ·{' '}
        {template.isActive ? 'Active' : 'Inactive'}
      </p>
      {template.notes && <p className="break-words text-sm text-slate-600">{template.notes}</p>}
      <div className="relative overflow-x-auto">
        <table className="min-w-max w-full text-left text-sm">
          <thead>
            <tr>
              {['Product', 'Variant', 'Quantity', 'Current unit price'].map((label) => (
                <th key={label} className="p-2">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {template.lines.map((line) => (
              <tr key={line.id} className="border-t border-slate-100">
                <td className="p-2">{line.product.name}</td>
                <td className="p-2">
                  {line.variant ? line.variant.attribute + ': ' + line.variant.value : 'None'}
                </td>
                <td className="p-2">{line.quantity}</td>
                <td className="p-2">{formatMoney(line.unitPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button type="button" className="btn-secondary" onClick={onClose}>
        Close preview
      </button>
    </section>
  );
}
