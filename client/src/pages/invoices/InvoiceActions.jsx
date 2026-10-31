// Invoice actions share pending/error feedback; the server enforces every state rule.
import { useState } from 'react';
import { Alert, StatusBadge } from '../../components/ui.jsx';
import { formatDateTime } from '../../lib/format.js';
import { api } from '../../lib/api.js';
import { useToast } from '../../lib/toast.js';

const DONE = {
  confirm: 'Invoice confirmed.',
  cancel: 'Invoice canceled.',
  send: 'Invoice sent.',
};

export default function InvoiceActions({ invoice, onChanged }) {
  const [pending, setPending] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const toast = useToast();
  const handleAction = async (action) => {
    if (pending) return;
    if (action === 'cancel' && !window.confirm('Cancel this invoice? Its period will return to billing.'))
      return;
    setPending(action);
    setError('');
    setNotice('');
    try {
      await api(`/invoices/${invoice.id}/${action}`, { method: 'POST', body: {} });
      toast.success(DONE[action]);
      await onChanged();
      if (action === 'send')
        setNotice('Invoice sent. Without SMTP, the email appears in the server terminal.');
    } catch (failure) {
      setError(failure.message);
      toast.error(failure.message);
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
        <button className="btn-secondary" disabled={Boolean(pending)} onClick={() => window.print()}>
          Print invoice
        </button>
        <button className="btn-secondary" disabled={Boolean(pending)} onClick={() => handleAction('send')}>
          {pending === 'send' ? 'Sending…' : 'Send invoice'}
        </button>
      </div>
      {invoice.sentAt && (
        <p className="text-sm text-slate-500">Last sent: {formatDateTime(invoice.sentAt)}</p>
      )}
      <Alert tone="success">{notice}</Alert>
      <Alert>{error}</Alert>
    </div>
  );
}
