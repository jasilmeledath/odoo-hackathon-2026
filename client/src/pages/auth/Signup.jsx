// Customer sign-up with each password-rule failure shown (PS-1, PS-5).
import { Link, useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/ui.jsx';
import RecordForm from '../../components/RecordForm.jsx';
import { useAuth, homePathFor } from '../../lib/auth.jsx';
import { validateEmail, validateRequired } from '../../lib/validators.js';
import { validatePassword } from '../../lib/password.js';
const fields = [
  {
    name: 'name',
    label: 'Name',
    maxLength: 120,
    autoComplete: 'name',
    validate: (value) =>
      validateRequired(value, 'Name') ||
      (value.trim().length > 120 ? 'Name must be at most 120 characters' : ''),
  },
  {
    name: 'email',
    label: 'Email',
    type: 'email',
    maxLength: 254,
    autoComplete: 'email',
    validate: validateEmail,
  },
  {
    name: 'password',
    label: 'Password',
    type: 'password',
    maxLength: 72,
    autoComplete: 'new-password',
    validate: validatePassword,
  },
];
export default function Signup() {
  const { register } = useAuth();
  const navigate = useNavigate();
  return (
    <main className="mx-auto max-w-md p-5">
      <PageHeader title="Create account" subtitle="Create your customer account" />
      <RecordForm
        fields={fields}
        onSubmit={register}
        onSaved={(user) => navigate(homePathFor(user), { replace: true })}
        submitLabel="Create account"
      />
      <Link className="mt-4 inline-block text-brand-600" to="/login">
        Back to login
      </Link>
    </main>
  );
}
