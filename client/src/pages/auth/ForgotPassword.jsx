// Recovery always reports the same result for valid email input (PS-3).
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, PageHeader } from '../../components/ui.jsx';
import RecordForm from '../../components/RecordForm.jsx';
import { api } from '../../lib/api.js';
import { validateEmail } from '../../lib/validators.js';
const fields = [
  {
    name: 'email',
    label: 'Email',
    type: 'email',
    maxLength: 254,
    autoComplete: 'email',
    validate: validateEmail,
  },
];
export default function ForgotPassword() {
  const [message, setMessage] = useState('');
  return (
    <main className="mx-auto max-w-md p-5">
      <PageHeader title="Forgot password" />
      <Alert tone="success">{message}</Alert>
      <RecordForm
        fields={fields}
        onSubmit={(values) => api('/auth/forgot-password', { method: 'POST', body: values })}
        onSaved={(result) => setMessage(result.message)}
        submitLabel="Send reset link"
      />
      <Link className="mt-4 inline-block text-brand-600" to="/login">
        Back to login
      </Link>
    </main>
  );
}
