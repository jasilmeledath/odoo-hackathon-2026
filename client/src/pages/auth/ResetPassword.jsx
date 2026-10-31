// Recover with a one-time link and show all password-rule failures (PS-3).
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Alert, PageHeader } from '../../components/ui.jsx';
import RecordForm from '../../components/RecordForm.jsx';
import { api, tokenStore } from '../../lib/api.js';
import { validatePassword } from '../../lib/password.js';
const fields = [
  {
    name: 'password',
    label: 'New password',
    type: 'password',
    maxLength: 72,
    autoComplete: 'new-password',
    validate: validatePassword,
  },
];
export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [message, setMessage] = useState('');
  const valid = /^[a-f0-9]{64}$/.test(token);
  return (
    <main className="mx-auto max-w-md p-5">
      <PageHeader title="Reset password" />
      {message ? (
        <Alert tone="success">{message}</Alert>
      ) : !valid ? (
        <Alert>Reset link is invalid or expired. Request a new link.</Alert>
      ) : (
        <RecordForm
          fields={fields}
          onSubmit={(values) => api('/auth/reset-password', { method: 'POST', body: { ...values, token } })}
          onSaved={(result) => {
            tokenStore.set(null);
            window.dispatchEvent(new Event('auth:expired'));
            setMessage(result.message);
          }}
          submitLabel="Reset password"
          successMessage={(result) => result.message}
        />
      )}
      <div className="mt-4 flex flex-wrap gap-4 text-brand-600">
        <Link to="/login">Back to login</Link>
        <Link to="/forgot-password">Request a new link</Link>
      </div>
    </main>
  );
}
