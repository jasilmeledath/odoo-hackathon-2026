// Payment entry sits outside printable invoice content and retains existing invoice actions.
import { useState } from 'react';
import { Alert } from '../../components/ui.jsx';
import RecordPayment from './RecordPayment.jsx';

export default function InvoicePaymentSection({ invoice, onRecorded }) {
  const [isRecording, setIsRecording] = useState(false);
  const [message, setMessage] = useState('');
  if (invoice.status !== 'CONFIRMED') return null;
  return (
    <section className="no-print space-y-3">
      <Alert tone="success">{message}</Alert>
      {isRecording ? (
        <>
          <h2 className="text-lg font-semibold">Record payment</h2>
          <RecordPayment
            invoice={invoice}
            onRecorded={async () => {
              setIsRecording(false);
              setMessage('Payment recorded');
              await onRecorded();
            }}
          />
          <button className="btn-secondary" onClick={() => setIsRecording(false)}>
            Cancel
          </button>
        </>
      ) : (
        <button
          className="btn-primary"
          onClick={() => {
            setMessage('');
            setIsRecording(true);
          }}
        >
          Record payment
        </button>
      )}
    </section>
  );
}
