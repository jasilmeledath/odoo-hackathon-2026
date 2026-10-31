// Create/edit internal staff without exposing role changes (PS-5).
import RecordForm from '../../components/RecordForm.jsx';
import { api } from '../../lib/api.js';
import { validateEmail, validateRequired } from '../../lib/validators.js';
import { validatePassword } from '../../lib/password.js';
export default function StaffForm({ staff, onSaved }) {
  const fields = [
    {
      name: 'name',
      label: 'Name',
      maxLength: 120,
      validate: (value) =>
        validateRequired(value, 'Name') ||
        (value.trim().length > 120 ? 'Name must be at most 120 characters' : ''),
    },
    { name: 'email', label: 'Email', type: 'email', maxLength: 254, validate: validateEmail },
    {
      name: 'password',
      label: staff ? 'New password (leave blank to keep current)' : 'Password',
      type: 'password',
      maxLength: 72,
      autoComplete: 'new-password',
      validate: (value) => (staff && !value ? '' : validatePassword(value)),
    },
    { name: 'isActive', label: 'Active', type: 'checkbox' },
  ];
  return (
    <RecordForm
      fields={fields}
      initialValues={staff ?? { isActive: true }}
      onSubmit={(values) => {
        if (
          staff &&
          staff.isActive &&
          !values.isActive &&
          !window.confirm('Deactivate this staff member and end their access?')
        )
          return Promise.reject(new Error('Deactivation canceled'));
        const body = { ...values };
        if (!body.password) delete body.password;
        return api(staff ? '/staff/' + staff.id : '/staff', { method: staff ? 'PATCH' : 'POST', body });
      }}
      onSaved={onSaved}
    />
  );
}
