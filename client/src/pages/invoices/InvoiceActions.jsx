// Invoice actions share pending/error feedback; the server enforces every state rule.
import { useState } from 'react';
import { Alert, StatusBadge } from '../../components/ui.jsx';
import { api } from '../../lib/api.js';

export default function InvoiceActions({ invoice, onChanged }) {
  const [pending, setPending] = useState('');
  const [error, setError] = useState('');
  const handleAction = async (action) => {
    if (pending) return;
    if (action === 'cancel' && !window.confirm('Cancel this invoice? Its period will return to billing.'))
      return;
    setPending(action);
    setError('');
    try {
      await api(`/invoices/${invoice.id}/${action}`, { method: 'POST', body: {} });
      await onChanged();
    } catch (failure) {
      setError(failure.message);
      await onChanged();
    } finally {
      setPending('');
    }
  };
  const canCancel =
    ['DRAFT', 'CONFIRMED'].includes(invoice.status) &&
    invoice.paidAmount === 0 &&
    invoice.payments.length === 0;
  return (
    <div className="space-y-2 no-print">
      <div className="flex flex-wrap items-center gap-3">
        <StatusBadge status={invoice.isOverdue ? 'OVERDUE' : invoice.status} />
        {invoice.status === 'DRAFT' && (
          <button className="btn-primary" disabled={Boolean(pending)} onClick={() => handleAction('confirm')}>
            {pending === 'confirm' ? 'Confirming…' : 'Confirm invoice'}
          </button>
        )}
        {canCancel && (
          <button className="btn-danger" disabled={Boolean(pending)} onClick={() => handleAction('cancel')}>
            {pending === 'cancel' ? 'Canceling…' : 'Cancel invoice'}
          </button>
        )}
      </div>
      <Alert>{error}</Alert>
    </div>
  );
}
