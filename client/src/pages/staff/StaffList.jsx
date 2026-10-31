// Admin directory and staff forms (PS-5).
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.js';
import { Alert, EmptyState, PageHeader, Pagination, Spinner } from '../../components/ui.jsx';
import StaffForm from './StaffForm.jsx';
export default function StaffList() {
  const [params, setParams] = useSearchParams();
  const query = Object.fromEntries(params);
  const { data, loading, error, reload } = useApi('/staff', query);
  const [editing, setEditing] = useState(null);
  const [message, setMessage] = useState('');
  function handleSaved() {
    setEditing(null);
    setMessage('Staff account saved');
    reload();
  }
  return (
    <>
      <PageHeader
        title="Staff"
        action={
          <button
            className="btn-primary"
            onClick={() => {
              setMessage('');
              setEditing({});
            }}
          >
            New staff member
          </button>
        }
      />
      <Alert tone="success">{message}</Alert>
      {editing && (
        <section className="mb-5">
          <h2 className="mb-3 text-lg font-semibold">
            {editing.id ? 'Edit staff member' : 'New staff member'}
          </h2>
          <StaffForm key={editing.id ?? 'new'} staff={editing.id ? editing : null} onSaved={handleSaved} />
          <button className="btn-secondary mt-3" onClick={() => setEditing(null)}>
            Cancel
          </button>
        </section>
      )}
      <form
        className="my-4 flex gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          setParams({ q: new FormData(event.currentTarget).get('q'), page: '1' });
        }}
      >
        <label htmlFor="staff-search" className="sr-only">
          Search staff
        </label>
        <input
          id="staff-search"
          name="q"
          maxLength={100}
          defaultValue={params.get('q') ?? ''}
          className="input"
        />
        <button className="btn-secondary">Search</button>
      </form>
      {loading ? (
        <Spinner />
      ) : error ? (
        <Alert>{error}</Alert>
      ) : !data?.items.length ? (
        <EmptyState title="No staff found" />
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
                    Email
                  </th>
                  <th scope="col" className="p-3">
                    Status
                  </th>
                  <th scope="col" className="p-3">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((staff) => (
                  <tr key={staff.id}>
                    <td className="p-3">{staff.name}</td>
                    <td className="p-3">{staff.email}</td>
                    <td className="p-3">{staff.isActive ? 'Active' : 'Inactive'}</td>
                    <td className="p-3">
                      <button
                        className="btn-secondary"
                        onClick={() => setEditing(staff)}
                        aria-label={'Edit ' + staff.name}
                      >
                        Edit
                      </button>
                    </td>
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
