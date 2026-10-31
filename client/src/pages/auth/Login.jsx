// Login page (PS-2). Field errors sit under each input; every outcome also gets a toast.
import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Alert } from '../../components/ui.jsx';
import { homePathFor, useAuth } from '../../lib/auth.jsx';
import { useToast } from '../../lib/toast.js';
import { validateEmail } from '../../lib/validators.js';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [fields, setFields] = useState({});
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
    if (Object.values(errors).some(Boolean)) {
      toast.error('Please fix the highlighted fields.');
      return;
    }
    setIsSaving(true);
    try {
      const signedIn = await login(body);
      toast.success(`Welcome back, ${signedIn.name}.`);
      navigate(homePathFor(signedIn), { replace: true });
    } catch (failure) {
      setFields(failure.fields ?? {});
      setError(failure.message);
      toast.error(failure.message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 via-white to-slate-100 p-5">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-lg font-bold text-white shadow-sm">
            B
          </span>
          <h1 className="mt-4 text-2xl font-semibold text-slate-900">Welcome back</h1>
          <p className="mt-1 text-sm text-slate-500">Log in to manage subscriptions and billing.</p>
        </div>
        <form noValidate onSubmit={handleSubmit} className="card space-y-5 p-6 sm:p-7">
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
              autoFocus
              maxLength={254}
              disabled={isSaving}
              className={`input ${fields.email ? 'input-error' : ''}`}
              aria-invalid={Boolean(fields.email)}
              aria-describedby="email-error"
            />
            <p id="email-error" className="mt-1 min-h-5 text-sm text-red-600">
              {fields.email}
            </p>
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="label mb-0" htmlFor="password">
                Password
              </label>
              <Link className="text-sm font-medium text-brand-600 hover:underline" to="/forgot-password">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                maxLength={72}
                disabled={isSaving}
                className={`input pr-11 ${fields.password ? 'input-error' : ''}`}
                aria-invalid={Boolean(fields.password)}
                aria-describedby="password-error"
              />
              <button
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                title={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword((current) => !current)}
                className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-slate-500 hover:text-brand-600 focus-visible:ring-4 focus-visible:ring-brand-100 focus-visible:outline-none"
              >
                <svg
                  viewBox="0 0 20 20"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  aria-hidden="true"
                >
                  <path d="M2.5 10s2.7-5 7.5-5 7.5 5 7.5 5-2.7 5-7.5 5-7.5-5-7.5-5Z" strokeLinejoin="round" />
                  <circle cx="10" cy="10" r="2.3" />
                  {showPassword && <path d="m3.5 3.5 13 13" strokeLinecap="round" />}
                </svg>
              </button>
            </div>
            <p id="password-error" className="mt-1 min-h-5 text-sm text-red-600">
              {fields.password}
            </p>
          </div>
          <button className="btn-primary w-full py-2.5" disabled={isSaving}>
            {isSaving && (
              <span
                className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                aria-hidden="true"
              />
            )}
            {isSaving ? 'Logging in…' : 'Log in'}
          </button>
          <p className="text-center text-sm text-slate-600">
            New customer?{' '}
            <Link className="font-medium text-brand-600 hover:underline" to="/signup">
              Create an account
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
