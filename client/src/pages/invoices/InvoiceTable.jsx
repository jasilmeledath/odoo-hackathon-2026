// Invoice rows and page-scoped selection; only draft records are selectable.
import { Link } from 'react-router-dom';
import { StatusBadge } from '../../components/ui.jsx';
import { formatDate, formatMoney } from '../../lib/format.js';

export default function InvoiceTable({ items, selected, onSelect, disabled }) {
  return (
    <div className="card overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="text-slate-500">
          <tr>
            <th className="py-2 pr-4">
              <input
                type="checkbox"
                aria-label="Select all draft invoices on this page"
                disabled={disabled || !items.some((invoice) => invoice.status === 'DRAFT')}
                checked={
                  items.some((invoice) => invoice.status === 'DRAFT') &&
                  items
                    .filter((invoice) => invoice.status === 'DRAFT')
                    .every((invoice) => selected.includes(invoice.id))
                }
                onChange={(event) =>
                  onSelect(
                    event.target.checked
                      ? items.filter((invoice) => invoice.status === 'DRAFT').map((invoice) => invoice.id)
                      : [],
                  )
                }
              />
            </th>
            <th className="py-2 pr-4 font-medium">Invoice</th>
            <th className="py-2 pr-4 font-medium">Customer</th>
            <th className="py-2 pr-4 font-medium">Subscription</th>
            <th className="py-2 pr-4 font-medium">Issued</th>
            <th className="py-2 pr-4 font-medium">Due</th>
            <th className="py-2 pr-4 text-right font-medium">Total</th>
            <th className="py-2 pr-4 text-right font-medium">Balance</th>
            <th className="py-2 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {items.map((invoice) => (
            <tr key={invoice.id} className="border-t border-slate-100">
              <td className="py-3 pr-4">
                {invoice.status === 'DRAFT' && (
                  <input
                    type="checkbox"
                    aria-label={`Select ${invoice.number}`}
                    disabled={disabled}
                    checked={selected.includes(invoice.id)}
                    onChange={(event) =>
                      onSelect(
                        event.target.checked
                          ? [...selected, invoice.id]
                          : selected.filter((id) => id !== invoice.id),
                      )
                    }
                  />
                )}
              </td>
              <td className="py-3 pr-4 font-medium">
                <Link to={`/invoices/${invoice.id}`} className="text-brand-600 hover:underline">
                  {invoice.number}
                </Link>
              </td>
              <td className="py-3 pr-4">{invoice.billingName}</td>
              <td className="py-3 pr-4">{invoice.subscription.number}</td>
              <td className="py-3 pr-4 whitespace-nowrap">{formatDate(invoice.issueDate)}</td>
              <td className="py-3 pr-4 whitespace-nowrap">{formatDate(invoice.dueDate)}</td>
              <td className="py-3 pr-4 text-right">{formatMoney(invoice.totalAmount)}</td>
              <td className="py-3 pr-4 text-right">{formatMoney(invoice.balanceAmount)}</td>
              <td className="py-3">
                <StatusBadge status={invoice.isOverdue ? 'OVERDUE' : invoice.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
