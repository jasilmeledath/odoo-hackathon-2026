// Customer add-on action with pending, failure and saved feedback (PS-27).
import { useState } from 'react';
import { api } from '../../lib/api.js';
import { Alert } from '../../components/ui.jsx';
export default function PortalAddonSwitch({ subscriptionId, line, onChanged }) {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  async function handleChange() {
    if (isSaving) return;
    setIsSaving(true);
    setError('');
    try {
      await api('/portal/subscriptions/' + subscriptionId + '/lines/' + line.id, {
        method: 'PATCH',
        body: { isActive: !line.isActive },
      });
      await onChanged();
    } catch (failure) {
      setError(failure.message);
    } finally {
      setIsSaving(false);
    }
  }
  return (
    <div className="space-y-2">
      <button
        type="button"
        role="switch"
        aria-checked={line.isActive}
        aria-label={line.product.name + ' add-on'}
        className="btn-secondary"
        disabled={isSaving}
        onClick={handleChange}
      >
        {isSaving ? 'Saving…' : line.isActive ? 'On' : 'Off'}
      </button>
      <Alert>{error}</Alert>
    </div>
  );
}
