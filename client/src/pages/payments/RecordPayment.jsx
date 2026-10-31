// Mount on invoice detail; the server remains authoritative for balance (PS-21).
import { useState } from 'react';
import RecordForm from '../../components/RecordForm.jsx';
import { Alert } from '../../components/ui.jsx';
import { api } from '../../lib/api.js';
import { formatMoney, formatLabel, toPaise } from '../../lib/format.js';
const METHODS = ['CASH', 'BANK_TRANSFER', 'UPI', 'CARD', 'CHEQUE'];
const today = () =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
export default function RecordPayment({ invoice, onRecorded }) {
  const [saved, setSaved] = useState(null);
  const fields = [
    {
      name: 'method',
      label: 'Method',
      options: [
        { value: '', label: 'Choose a method' },
        ...METHODS.map((value) => ({ value, label: formatLabel(value) })),
      ],
      validate: (value) => (METHODS.includes(value) ? '' : 'Choose a valid payment method'),
    },
    {
      name: 'amount',
      label: 'Amount (rupees)',
      maxLength: 15,
      validate: (value) =>
        !/^[0-9]+([.][0-9]{1,2})?$/.test(value) || toPaise(value) <= 0
          ? 'Enter an amount above zero with at most two decimals'
          : toPaise(value) > 1000000000
            ? 'Amount is too large'
            : invoice.totalAmount != null && toPaise(value) > invoice.totalAmount - invoice.paidAmount
              ? 'Amount cannot exceed the balance of ' + formatMoney(invoice.totalAmount - invoice.paidAmount)
              : '',
    },
    {
      name: 'paymentDate',
      label: 'Payment date',
      type: 'date',
      validate: (value) =>
        !value || !/^\d{4}-\d{2}-\d{2}$/.test(value)
          ? 'Payment date must be a valid date'
          : value > today()
            ? 'Payment date cannot be in the future'
            : '',
    },
    {
      name: 'note',
      label: 'Note',
      type: 'textarea',
      maxLength: 500,
      validate: (value) => (value.trim().length > 500 ? 'Note must be at most 500 characters' : ''),
    },
  ];
  if (saved)
    return (
      <Alert tone="success">
        Payment recorded. Balance: {formatMoney(saved.invoice.balanceAmount)}.{' '}
        {saved.invoice.status === 'PAID' ? 'Invoice paid.' : ''}
      </Alert>
    );
  return (
    <RecordForm
      fields={fields}
      initialValues={{ paymentDate: today() }}
      onSubmit={(values) =>
        api('/payments', {
          method: 'POST',
          body: { ...values, invoiceId: invoice.id, amount: toPaise(values.amount) },
        })
      }
      onSaved={(result) => {
        setSaved(result);
        onRecorded?.(result);
      }}
      submitLabel="Record payment"
    />
  );
}
