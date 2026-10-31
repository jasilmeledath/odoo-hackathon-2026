// Shared controlled form with matching field validation and server feedback.
import { useState } from 'react';
import { Alert } from './ui.jsx';
export default function RecordForm({ fields, initialValues = {}, onSubmit, onSaved, submitLabel = 'Save' }) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  async function handleSubmit(event) {
    event.preventDefault();
    if (isSaving) return;
    const nextErrors = Object.fromEntries(
      fields.map((field) => [field.name, field.validate?.(values[field.name] ?? '') ?? '']),
    );
    setErrors(nextErrors);
    setError('');
    if (Object.values(nextErrors).some(Boolean)) return;
    setIsSaving(true);
    try {
      const result = await onSubmit(values);
      onSaved?.(result);
    } catch (failure) {
      setErrors(failure.fields ?? {});
      setError(failure.message);
    } finally {
      setIsSaving(false);
    }
  }
  return (
    <form noValidate onSubmit={handleSubmit} className="card space-y-4">
      <Alert>{error}</Alert>
      {fields.map((field) => {
        const id = 'field-' + field.name;
        const props = {
          id,
          name: field.name,
          disabled: isSaving,
          'aria-invalid': Boolean(errors[field.name]),
          'aria-describedby': id + '-error',
          className: 'input ' + (errors[field.name] ? 'input-error' : ''),
          value: values[field.name] ?? '',
          onChange: (event) =>
            setValues((current) => ({
              ...current,
              [field.name]: field.type === 'checkbox' ? event.target.checked : event.target.value,
            })),
        };
        return (
          <div key={field.name}>
            <label htmlFor={id} className="label">
              {field.label}
            </label>
            {field.options ? (
              <select {...props}>
                {field.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : field.type === 'textarea' ? (
              <textarea {...props} maxLength={field.maxLength} />
            ) : (
              <input
                {...props}
                type={field.type ?? 'text'}
                maxLength={field.maxLength}
                autoComplete={field.autoComplete}
                checked={field.type === 'checkbox' ? Boolean(values[field.name]) : undefined}
              />
            )}
            <p id={id + '-error'} className="whitespace-pre-line text-sm text-red-600">
              {errors[field.name]}
            </p>
          </div>
        );
      })}
      <button className="btn-primary" disabled={isSaving}>
        {isSaving ? 'Saving…' : submitLabel}
      </button>
    </form>
  );
}
