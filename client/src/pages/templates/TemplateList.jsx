// Paginated staff browsing and Admin template editing use real catalog data (PS-11).
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Alert, EmptyState, Field, PageHeader, Pagination, Spinner } from '../../components/ui.jsx';
import { api } from '../../lib/api.js';
import { useAuth } from '../../lib/auth.jsx';
import { useApi } from '../../lib/useApi.js';
import TemplateForm from './TemplateForm.jsx';
import TemplateDetail from './TemplateDetail.jsx';

export default function TemplateList() {
  const [params, setParams] = useSearchParams();
  const query = { page: params.get('page') || 1, q: params.get('q') || '' };
  const { data, loading: isLoading, error: loadError, reload } = useApi('/templates', query);
  const { isAdmin } = useAuth();
  const [editing, setEditing] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [preview, setPreview] = useState(null);
  const [isOpening, setIsOpening] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const handleOpen = async (id, edit) => {
    setIsOpening(true);
    setError('');
    setSuccess('');
    try {
      const template = await api('/templates/' + id);
      setPreview(null);
      setEditing(edit ? template : null);
      setIsFormOpen(edit);
      if (!edit) setPreview(template);
    } catch (failure) {
      setError(failure.message);
    } finally {
      setIsOpening(false);
    }
  };
  const changeQuery = (key, value) => {
    const next = new URLSearchParams(params);
    value ? next.set(key, value) : next.delete(key);
    if (key !== 'page') next.delete('page');
    setParams(next, { replace: true });
  };
  return (
    <div className="space-y-4">
      <PageHeader
        title="Quotation templates"
        subtitle="Reusable plan and product choices at current prices"
        action={
          isAdmin && (
            <button
              className="btn-primary"
              disabled={isFormOpen || isOpening}
              onClick={() => {
                setEditing(null);
                setPreview(null);
                setIsFormOpen(true);
                setSuccess('');
              }}
            >
              New template
            </button>
          )
        }
      />
      <Alert>{loadError || error}</Alert>
      <Alert tone="success">{success}</Alert>
      {isOpening && <Spinner />}
      {preview && <TemplateDetail template={preview} onClose={() => setPreview(null)} />}
      {isFormOpen && (
        <TemplateForm
          key={editing?.id ?? 'new'}
          template={editing}
          onCancel={() => setIsFormOpen(false)}
          onSaved={async () => {
            setIsFormOpen(false);
            setEditing(null);
            setSuccess('Template saved');
            await reload();
          }}
        />
      )}
      <div className="card min-w-0">
        <Field label="Search templates">
          <input
            aria-label="Search templates"
            className="input"
            maxLength={100}
            value={query.q}
            onChange={(event) => changeQuery('q', event.target.value)}
          />
        </Field>
        {isLoading ? (
          <Spinner />
        ) : (
          data && (
            <>
              {data.items.length ? (
                <div className="relative mt-4 overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr>
                        {['Name', 'Plan', 'Validity days', 'Lines', 'Status', 'Action'].map((label) => (
                          <th key={label} className="p-2">
                            {label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.items.map((template) => (
                        <tr key={template.id} className="border-t border-slate-100">
                          <td className="p-2">{template.name}</td>
                          <td className="p-2">{template.plan.name}</td>
                          <td className="p-2">{template.validityDays}</td>
                          <td className="p-2">{template._count.lines}</td>
                          <td className="p-2">{template.isActive ? 'Active' : 'Inactive'}</td>
                          <td className="p-2">
                            <div className="flex gap-2">
                              <button
                                type="button"
                                className="btn-secondary"
                                disabled={isFormOpen || isOpening}
                                aria-label={'View ' + template.name}
                                onClick={() => handleOpen(template.id, false)}
                              >
                                View
                              </button>
                              {isAdmin && (
                                <button
                                  type="button"
                                  className="btn-secondary"
                                  disabled={isFormOpen || isOpening}
                                  aria-label={'Edit ' + template.name}
                                  onClick={() => handleOpen(template.id, true)}
                                >
                                  Edit
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState title="No templates match these filters" />
              )}
              <Pagination
                page={data.page}
                pages={data.pages}
                onChange={(page) => changeQuery('page', page)}
              />
            </>
          )
        )}
      </div>
    </div>
  );
}
