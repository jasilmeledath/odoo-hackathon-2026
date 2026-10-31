// Customer create/edit form with matching validation (PS-12).
import { Link, useNavigate, useParams } from 'react-router-dom';
import RecordForm from '../../components/RecordForm.jsx';
import { Alert, PageHeader, Spinner } from '../../components/ui.jsx';
import { api } from '../../lib/api.js';
import { useApi } from '../../lib/useApi.js';
import { validateEmail, validateRequired } from '../../lib/validators.js';
const bounded = (value, label, max, required = false) =>
  (required ? validateRequired(value, label) : '') ||
  (value.trim().length > max ? label + ' must be at most ' + max + ' characters' : '');
const fields = [
  { name: 'name', label: 'Name', maxLength: 120, validate: (value) => bounded(value, 'Name', 120, true) },
  {
    name: 'companyName',
    label: 'Company',
    maxLength: 160,
    validate: (value) => bounded(value, 'Company', 160),
  },
  { name: 'email', label: 'Email', type: 'email', maxLength: 254, validate: validateEmail },
  {
    name: 'phone',
    label: 'Phone',
    maxLength: 10,
    validate: (value) =>
      !value.trim() || /^[6-9][0-9]{9}$/.test(value.trim())
        ? ''
        : 'Enter a valid 10-digit Indian mobile number',
  },
  {
    name: 'address',
    label: 'Address',
    type: 'textarea',
    maxLength: 500,
    validate: (value) => bounded(value, 'Address', 500),
  },
  { name: 'isActive', label: 'Active', type: 'checkbox' },
];
function CustomerEditor({ customer, id }) {
  const navigate = useNavigate();
  return (
    <RecordForm
      fields={fields}
      initialValues={customer ?? { isActive: true }}
      onSubmit={(values) =>
        api(id ? '/customers/' + id : '/customers', { method: id ? 'PUT' : 'POST', body: values })
      }
      successMessage="Customer saved"
      onSaved={(saved) => navigate('/customers/' + saved.id)}
    />
  );
}
function ExistingCustomer({ id }) {
  const { data, loading, error } = useApi('/customers/' + id);
  return loading ? <Spinner /> : error ? <Alert>{error}</Alert> : <CustomerEditor customer={data} id={id} />;
}
export default function CustomerForm() {
  const { id } = useParams();
  return (
    <>
      <PageHeader title={id ? 'Edit customer' : 'New customer'} />
      <Link className="mb-4 inline-block text-brand-600" to="/customers">
        Back to customers
      </Link>
      {id ? <ExistingCustomer key={id} id={id} /> : <CustomerEditor />}
    </>
  );
}
