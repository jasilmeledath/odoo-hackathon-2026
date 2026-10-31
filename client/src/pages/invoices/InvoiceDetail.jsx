// One invoice: customer, lines, taxes, discount, totals, payments and balance (PS-17).
// A draft can be confirmed from here. The server decides whether the action is allowed.
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Alert, EmptyState, PageHeader, Spinner, StatusBadge } from '../../components/ui.jsx';
import { api } from '../../lib/api.js';
import { formatDate, formatLabel, formatMoney } from '../../lib/format.js';
import { useApi } from '../../lib/useApi.js';
import RecordPayment from '../payments/RecordPayment.jsx';

function Summary({ invoice }) {
  const details = [
    ['Customer', invoice.billingName],
    ['Address', invoice.billingAddress || '-'],
    ['Subscription', invoice.subscription.number],
    ['Issued', formatDate(invoice.issueDate)],
    ['Due', formatDate(invoice.dueDate)],
    ['Billing period', `${formatDate(invoice.periodStartDate)} to ${formatDate(invoice.periodEndDate)}`],
  ];
  return (
    <dl className="card grid gap-4 text-sm sm:grid-cols-3">
      {details.map(([label, value]) => (
        <div key={label}>
          <dt className="text-slate-500">{label}</dt>
          <dd className="mt-1 font-medium text-slate-900">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function LineTable({ lines }) {
  return (
    <div className="card overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="text-slate-500">
          <tr>
            <th className="py-2 pr-4 font-medium">Item</th>
            <th className="py-2 pr-4 text-right font-medium">Quantity</th>
            <th className="py-2 pr-4 text-right font-medium">Unit price</th>
            <th className="py-2 pr-4 text-right font-medium">Amount</th>
            <th className="py-2 pr-4 text-right font-medium">Discount</th>
            <th className="py-2 pr-4 font-medium">Tax</th>
            <th className="py-2 text-right font-medium">Tax amount</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => (
            <tr key={line.id} className="border-t border-slate-100">
              <td className="py-3 pr-4 font-medium text-slate-900">{line.description}</td>
              <td className="py-3 pr-4 text-right">{line.quantity}</td>
              <td className="py-3 pr-4 text-right">{formatMoney(line.unitPrice)}</td>
              <td className="py-3 pr-4 text-right">{formatMoney(line.amount)}</td>
              <td className="py-3 pr-4 text-right">{formatMoney(line.discountAmount)}</td>
              <td className="py-3 pr-4 whitespace-nowrap">{line.taxName ?? 'No tax'}</td>
              <td className="py-3 text-right">{formatMoney(line.taxAmount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Totals({ invoice }) {
  const rows = [
    ['Subtotal', invoice.subtotalAmount],
    [
      invoice.discount ? `Discount (${invoice.discount.name})` : 'Discount',
      invoice.discountAmount ? -invoice.discountAmount : 0,
    ],
    ['Tax', invoice.taxAmount],
    ['Total', invoice.totalAmount, true],
    ['Paid', invoice.paidAmount],
    ['Balance due', invoice.balanceAmount, true],
  ];
  return (
    <dl className="card ml-auto w-full max-w-sm space-y-2 text-sm">
      {rows.map(([label, amount, isStrong]) => (
        <div key={label} className={`flex justify-between ${isStrong ? 'font-semibold text-slate-900' : ''}`}>
          <dt>{label}</dt>
          <dd>{formatMoney(amount)}</dd>
        </div>
      ))}
    </dl>
  );
}

function PaymentList({ payments }) {
  if (payments.length === 0)
    return <EmptyState title="No payments yet">Payments appear here once recorded.</EmptyState>;
  return (
    <div className="card overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="text-slate-500">
          <tr>
            <th className="py-2 pr-4 font-medium">Date</th>
            <th className="py-2 pr-4 font-medium">Method</th>
            <th className="py-2 pr-4 text-right font-medium">Amount</th>
            <th className="py-2 pr-4 font-medium">Recorded by</th>
            <th className="py-2 font-medium">Note</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((payment) => (
            <tr key={payment.id} className="border-t border-slate-100">
              <td className="py-3 pr-4 whitespace-nowrap">{formatDate(payment.paymentDate)}</td>
              <td className="py-3 pr-4">{formatLabel(payment.method)}</td>
              <td className="py-3 pr-4 text-right">{formatMoney(payment.amount)}</td>
              <td className="py-3 pr-4">{payment.recordedBy.name}</td>
              <td className="py-3">{payment.note || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function InvoiceDetail() {
  const { id } = useParams();
  const { data: invoice, loading, error, reload } = useApi(`/invoices/${id}`);
  const [isConfirming, setIsConfirming] = useState(false);
  const [actionError, setActionError] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState('');

  const handleConfirm = async () => {
    setIsConfirming(true);
    setActionError('');
    try {
      await api(`/invoices/${id}/confirm`, { method: 'POST' });
      await reload();
    } catch (requestError) {
      // The invoice probably changed under us, so show its real status next to the message.
      setActionError(requestError.message);
      await reload();
    } finally {
      setIsConfirming(false);
    }
  };

  if (loading && !invoice) return <Spinner />;
  if (!invoice) {
    return (
      <>
        <Alert>{error}</Alert>
        <Link to="/invoices" className="mt-4 inline-block text-sm text-brand-600">
          Back to invoices
        </Link>
      </>
    );
  }

  return (
    <div className="space-y-6">
      <Link to="/invoices" className="text-sm text-brand-600">
        Back to invoices
      </Link>
      <PageHeader
        title={invoice.number}
        subtitle={invoice.isOverdue ? 'Overdue: the due date has passed' : undefined}
        action={
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={invoice.isOverdue ? 'OVERDUE' : invoice.status} />
            {invoice.status === 'CONFIRMED' && (
              <button
                className="btn-primary"
                onClick={() => {
                  setPaymentMessage('');
                  setIsRecording(true);
                }}
              >
                Record payment
              </button>
            )}
            {invoice.status === 'DRAFT' && (
              <button className="btn-primary" disabled={isConfirming} onClick={handleConfirm}>
                {isConfirming ? 'Confirming...' : 'Confirm invoice'}
              </button>
            )}
          </div>
        }
      />
      <Alert>{actionError}</Alert>
      <Alert tone="success">{paymentMessage}</Alert>
      {isRecording && invoice.status === 'CONFIRMED' && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Record payment</h2>
          <RecordPayment
            invoice={invoice}
            onRecorded={() => {
              setIsRecording(false);
              setPaymentMessage('Payment recorded');
              reload();
            }}
          />
          <button className="btn-secondary mt-3" onClick={() => setIsRecording(false)}>
            Cancel
          </button>
        </section>
      )}
      <Summary invoice={invoice} />
      <LineTable lines={invoice.lines} />
      <Totals invoice={invoice} />
      <h2 className="text-lg font-semibold text-slate-900">Payments</h2>
      <PaymentList payments={invoice.payments} />
    </div>
  );
}
