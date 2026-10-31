// Template forms store catalog choices, not displayed current prices (PS-11).
import { useState } from 'react';
import CatalogPicker from '../../components/CatalogPicker.jsx';
import { Alert, Field } from '../../components/ui.jsx';
import { api } from '../../lib/api.js';
import { useToast } from '../../lib/toast.js';
import {
  MAX_TEMPLATE_INTEGER,
  MAX_TEMPLATE_LINES,
  MAX_TEMPLATE_NAME,
  MAX_TEMPLATE_NOTES,
  validateTemplate,
} from '../../lib/validators.js';
import TemplateLine from './TemplateLine.jsx';

const newLine = () => ({ key: crypto.randomUUID(), productId: '', variantId: '', quantity: '1' });
export default function TemplateForm({ template, onSaved, onCancel }) {
  const [form, setForm] = useState({
    name: template?.name ?? '',
    planId: template?.planId ?? '',
    plan: template?.plan ?? null,
    validityDays: String(template?.validityDays ?? 30),
    notes: template?.notes ?? '',
    isActive: template?.isActive ?? true,
    lines: template ? template.lines.map((line) => ({ ...line, key: String(line.id) })) : [newLine()],
  });
  const [fields, setFields] = useState({});
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();
  const handleSubmit = async (event) => {
    event.preventDefault();
    const validation = validateTemplate(form);
    setFields(validation);
    setError('');
    if (Object.keys(validation).length) {
      toast.error('Please fix the highlighted fields.');
      return;
    }
    if (isSaving) return;
    if (
      template?.isActive &&
      !form.isActive &&
      !window.confirm('Deactivate this template? Existing history will be retained.')
    )
      return;
    setIsSaving(true);
    try {
      await api('/templates' + (template ? '/' + template.id : ''), {
        method: template ? 'PUT' : 'POST',
        body: {
          name: form.name,
          planId: Number(form.planId),
          validityDays: Number(form.validityDays),
          notes: form.notes,
          isActive: form.isActive,
          lines: form.lines.map((line) => ({
            productId: Number(line.productId),
            variantId: line.variantId ? Number(line.variantId) : null,
            quantity: Number(line.quantity),
          })),
        },
      });
      toast.success(template ? 'Template saved' : 'Template created');
      await onSaved();
    } catch (failure) {
      setFields(failure.fields ?? {});
      setError(failure.message);
      toast.error(failure.message);
    } finally {
      setIsSaving(false);
    }
  };
  return (
    <form noValidate onSubmit={handleSubmit} className="card min-w-0">
      <fieldset disabled={isSaving} className="min-w-0 space-y-4">
        <legend className="mb-4 text-lg font-semibold">{template ? 'Edit template' : 'New template'}</legend>
        <Alert>{error}</Alert>
        <Field label="Name" error={fields.name}>
          <input
            aria-label="Name"
            className={'input' + (fields.name ? ' input-error' : '')}
            maxLength={MAX_TEMPLATE_NAME}
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
          />
        </Field>
        <CatalogPicker
          resource="plans"
          label="Plan"
          value={form.planId}
          initialOption={form.plan}
          disabled={isSaving}
          error={fields.planId}
          onChange={(plan) => setForm({ ...form, plan, planId: plan?.id ?? '' })}
        />
        <Field label="Validity days" error={fields.validityDays}>
          <input
            aria-label="Validity days"
            className={'input' + (fields.validityDays ? ' input-error' : '')}
            type="number"
            min="1"
            max={MAX_TEMPLATE_INTEGER}
            step="1"
            value={form.validityDays}
            onChange={(event) => setForm({ ...form, validityDays: event.target.value })}
          />
        </Field>
        <Field label="Notes" error={fields.notes}>
          <textarea
            aria-label="Notes"
            className={'input' + (fields.notes ? ' input-error' : '')}
            maxLength={MAX_TEMPLATE_NOTES}
            value={form.notes}
            onChange={(event) => setForm({ ...form, notes: event.target.value })}
          />
        </Field>
        <Alert>{fields.lines}</Alert>
        {form.lines.map((line, index) => (
          <TemplateLine
            key={line.key}
            line={line}
            index={index}
            plan={form.plan}
            fields={fields}
            disabled={isSaving}
            onChange={(updated) =>
              setForm({ ...form, lines: form.lines.map((item) => (item.key === line.key ? updated : item)) })
            }
            onRemove={() => setForm({ ...form, lines: form.lines.filter((item) => item.key !== line.key) })}
          />
        ))}
        <button
          type="button"
          className="btn-secondary"
          disabled={form.lines.length >= MAX_TEMPLATE_LINES}
          onClick={() => setForm({ ...form, lines: [...form.lines, newLine()] })}
        >
          Add line
        </button>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(event) => setForm({ ...form, isActive: event.target.checked })}
          />
          Active
        </label>
        <div className="flex flex-wrap gap-2">
          <button className="btn-primary">{isSaving ? 'Saving...' : 'Save template'}</button>
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </fieldset>
    </form>
  );
}
