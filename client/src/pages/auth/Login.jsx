// Login page (PS-2).
import { PageHeader } from '../../components/ui.jsx';
import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Alert } from '../../components/ui.jsx';
import { homePathFor, useAuth } from '../../lib/auth.jsx';
import { validateEmail } from '../../lib/validators.js';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [fields, setFields] = useState({});
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  if (user) return <Navigate to={homePathFor(user)} replace />;
  async function handleSubmit(event) {
    event.preventDefault();
    if (isSaving) return;
    const body = Object.fromEntries(new FormData(event.currentTarget));
    const errors = {
      email: validateEmail(body.email),
      password: !body.password
        ? 'Password is required'
        : body.password.length > 72
          ? 'Password must be at most 72 characters'
          : '',
    };
    setFields(errors);
    setError('');
    if (Object.values(errors).some(Boolean)) return;
    setIsSaving(true);
    try {
      navigate(homePathFor(await login(body)), { replace: true });
    } catch (failure) {
      setFields(failure.fields ?? {});
      setError(failure.message);
    } finally {
      setIsSaving(false);
    }
  }
  return (
    <main className="mx-auto max-w-md p-5">
      <PageHeader title="Log in" subtitle="Log in to your account" />
      <form noValidate onSubmit={handleSubmit} className="card space-y-4">
        <Alert>{error}</Alert>
        <div>
          <label className="label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            maxLength={254}
            className={`input ${fields.email ? 'border-red-600' : ''}`}
            aria-invalid={Boolean(fields.email)}
            aria-describedby="email-error"
          />
          <p id="email-error" className="text-sm text-red-600">
            {fields.email}
          </p>
        </div>
        <div>
          <label className="label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            maxLength={72}
            className={`input ${fields.password ? 'border-red-600' : ''}`}
            aria-invalid={Boolean(fields.password)}
            aria-describedby="password-error"
          />
          <p id="password-error" className="text-sm text-red-600">
            {fields.password}
          </p>
        </div>
        <button className="btn-primary w-full" disabled={isSaving}>
          {isSaving ? 'Logging in…' : 'Log in'}
        </button>
        <div className="flex flex-wrap justify-between gap-3 text-sm text-brand-600">
          <Link to="/forgot-password">Forgot password?</Link>
          <Link to="/signup">Create account</Link>
        </div>
      </form>
    </main>
  );
}
