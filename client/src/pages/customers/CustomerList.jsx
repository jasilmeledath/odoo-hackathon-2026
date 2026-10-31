// Customer search and pagination persist in the URL (PS-12).
import { Link, useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.js';
import { Alert, EmptyState, PageHeader, Pagination, Spinner } from '../../components/ui.jsx';
export default function CustomerList() {
  const [params, setParams] = useSearchParams();
  const query = Object.fromEntries(params);
  const { data, loading, error } = useApi('/customers', query);
  function handleSearch(event) {
    event.preventDefault();
    setParams({ q: new FormData(event.currentTarget).get('q'), page: '1' });
  }
  return (
    <>
      <PageHeader
        title="Customers"
        action={
          <Link className="btn-primary" to="/customers/new">
            New customer
          </Link>
        }
      />
      <form onSubmit={handleSearch} className="mb-4 flex gap-3">
        <label className="sr-only" htmlFor="customer-search">
          Search customers
        </label>
        <input
          id="customer-search"
          name="q"
          defaultValue={params.get('q') ?? ''}
          maxLength={100}
          className="input"
          placeholder="Name, company or email"
        />
        <button className="btn-secondary">Search</button>
      </form>
      {loading ? (
        <Spinner />
      ) : error ? (
        <Alert>{error}</Alert>
      ) : !data?.items.length ? (
        <EmptyState title="No customers found">Create a customer or change the search.</EmptyState>
      ) : (
        <>
          <div className="card overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr>
                  <th scope="col" className="p-3">
                    Name
                  </th>
                  <th scope="col" className="p-3">
                    Company
                  </th>
                  <th scope="col" className="p-3">
                    Email
                  </th>
                  <th scope="col" className="p-3">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((customer) => (
                  <tr key={customer.id}>
                    <td className="p-3">
                      <Link className="text-brand-600" to={'/customers/' + customer.id}>
                        {customer.name}
                      </Link>
                    </td>
                    <td className="p-3">{customer.companyName || '—'}</td>
                    <td className="p-3">{customer.email}</td>
                    <td className="p-3">{customer.isActive ? 'Active' : 'Inactive'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={data.page}
            pages={data.pages}
            onChange={(page) => setParams({ ...query, page: String(page) })}
          />
        </>
      )}
    </>
  );
}
