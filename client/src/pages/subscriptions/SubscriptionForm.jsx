// Create and edit a draft or quotation from live customer, plan and catalog data (PS-12).
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import SearchSelect from '../../components/SearchSelect.jsx';
import { Alert, Field, PageHeader, Spinner } from '../../components/ui.jsx';
import { api } from '../../lib/api.js';
import { useToast } from '../../lib/toast.js';
import { addBillingPeriod, today } from '../../lib/dates.js';
import { formatMoney, toInputDate } from '../../lib/format.js';

const blankLine = () => ({
  lineKey: crypto.randomUUID(),
  productId: '',
  variantId: '',
  taxId: '',
  quantity: '1',
  variants: [],
  variantsLoaded: true,
});
const unwrapItems = (result) => result?.items ?? [];
const MAX_LINES = 100;
const MAX_QUANTITY = 100000;
const describeCustomer = (customer) => ({
  title: customer.companyName || customer.name,
  detail: [customer.companyName && customer.name, customer.email].filter(Boolean).join(' · '),
});
export default function SubscriptionForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const editing = Boolean(id);
  const [form, setForm] = useState({
    customerId: '',
    planId: '',
    paymentTermId: '',
    startDate: today(),
    expiryDate: '',
    notes: '',
  });
  const [lines, setLines] = useState([blankLine()]);
  const [customer, setCustomer] = useState(null);
  const [plans, setPlans] = useState([]);
  const [terms, setTerms] = useState([]);
  const [taxes, setTaxes] = useState([]);
  const [products, setProducts] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [fields, setFields] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    let active = true;
    Promise.all([
      api('/plans', { query: { pageSize: 50, isActive: true } }),
      api('/payment-terms', { query: { pageSize: 50, isActive: true } }),
      api('/taxes', { query: { pageSize: 50 } }),
      api('/products', { query: { pageSize: 50, isActive: true } }),
      editing ? api(`/subscriptions/${id}`) : Promise.resolve(null),
    ])
      .then(([planResult, termResult, taxResult, productResult, current]) => {
        if (!active) return;
        setPlans(unwrapItems(planResult));
        setTerms(unwrapItems(termResult).filter((term) => term.isActive));
        setTaxes(unwrapItems(taxResult).filter((tax) => tax.isActive));
        setProducts(unwrapItems(productResult));
        if (current) {
          if (!['DRAFT', 'QUOTATION'].includes(current.status))
            throw new Error('Only draft or quotation subscriptions can be edited.');
          setSubscription(current);
          setCustomer(
            current.customer ?? { id: current.customerId, name: `Customer #${current.customerId}` },
          );
          setForm({
            customerId: String(current.customerId),
            planId: String(current.planId),
            paymentTermId: String(current.paymentTermId),
            startDate: toInputDate(current.startDate),
            expiryDate: toInputDate(current.expiryDate),
            notes: current.notes ?? '',
          });
          setLines(
            current.lines.map((line) => ({
              lineKey: crypto.randomUUID(),
              productId: String(line.productId),
              variantId: line.variantId ? String(line.variantId) : '',
              taxId: line.taxId ? String(line.taxId) : '',
              quantity: String(line.quantity),
              variants: [],
              variantsLoaded: false,
            })),
          );
        }
      })
      .catch((failure) => setError(failure.message || 'Could not load subscription form data.'))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [editing, id]);

  useEffect(() => {
    if (!form.startDate) return;
    let active = true;
    api('/plans', { query: { pageSize: 50, isActive: true, availableOn: form.startDate } })
      .then((result) => active && setPlans(unwrapItems(result)))
      .catch((failure) => active && setError(failure.message));
    return () => {
      active = false;
    };
  }, [form.startDate]);

  const pendingVariantProducts = lines
    .filter((line) => line.productId && !line.variantsLoaded)
    .map((line) => line.productId)
    .join(',');
  useEffect(() => {
    if (!pendingVariantProducts) return undefined;
    let active = true;
    Promise.all(
      pendingVariantProducts.split(',').map(async (productId) => {
        try {
          return [productId, (await api(`/products/${productId}`)).variants ?? []];
        } catch {
          return [productId, []];
        }
      }),
    ).then((results) => {
      if (!active) return;
      const variantsByProduct = new Map(results);
      setLines((current) =>
        current.map((line) =>
          variantsByProduct.has(line.productId)
            ? { ...line, variants: variantsByProduct.get(line.productId), variantsLoaded: true }
            : line,
        ),
      );
    });
    return () => {
      active = false;
    };
  }, [pendingVariantProducts]);

  // Only active customers can be billed; the server does the matching so the list never grows the page.
  const searchCustomers = useCallback(
    async (q) => unwrapItems(await api('/customers', { query: { q, pageSize: 20, isActive: true } })),
    [],
  );
  const handlePlanChange = (planId) => {
    const plan = plans.find((item) => String(item.id) === planId);
    setForm((current) => ({
      ...current,
      planId,
      expiryDate: plan ? addBillingPeriod(current.startDate, plan.billingPeriod) : current.expiryDate,
    }));
  };
  const handleStartChange = (startDate) => {
    setForm((current) => {
      const plan = plans.find((item) => String(item.id) === current.planId);
      return {
        ...current,
        startDate,
        expiryDate: plan ? addBillingPeriod(startDate, plan.billingPeriod) : current.expiryDate,
      };
    });
  };

  const selectedPlan = plans.find((plan) => String(plan.id) === form.planId) ?? subscription?.plan;
  const totals = useMemo(
    () =>
      lines.reduce(
        (total, line) => {
          const product = products.find((item) => String(item.id) === line.productId);
          const planProductId = selectedPlan?.productId ?? subscription?.plan?.productId;
          const variant = line.variants.find((item) => String(item.id) === line.variantId);
          const unitPrice =
            (Number(product?.id) === Number(planProductId) ? selectedPlan?.price : product?.salesPrice) +
            (variant?.extraPrice ?? 0);
          const amount = (Number(line.quantity) || 0) * (unitPrice || 0);
          return { recurring: total.recurring + amount, lines: [...total.lines, amount] };
        },
        { recurring: 0, lines: [] },
      ),
    [lines, products, selectedPlan, subscription],
  );

  const setLine = (lineKey, patch) =>
    setLines((current) => current.map((line) => (line.lineKey === lineKey ? { ...line, ...patch } : line)));
  const loadVariants = async (lineKey, productId) => {
    setLine(lineKey, { productId, variantId: '', variants: [], variantsLoaded: !productId });
    if (!productId) return;
    try {
      const product = await api(`/products/${productId}`);
      setLines((current) =>
        current.map((line) =>
          line.lineKey === lineKey && line.productId === productId
            ? { ...line, variants: product.variants ?? [], variantsLoaded: true }
            : line,
        ),
      );
    } catch (failure) {
      setError(failure.message);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextFields = {};
    if (!form.customerId) nextFields.customerId = 'Choose a customer';
    if (!form.planId) nextFields.planId = 'Choose a plan available on the start date';
    if (!form.paymentTermId) nextFields.paymentTermId = 'Choose payment terms';
    if (!form.startDate) nextFields.startDate = 'Start date is required';
    if (!form.expiryDate || form.expiryDate <= form.startDate)
      nextFields.expiryDate = 'Expiry date must be after the start date';
    if (
      lines.some(
        (line) =>
          !line.productId ||
          !/^\d+$/.test(line.quantity) ||
          Number(line.quantity) < 1 ||
          Number(line.quantity) > MAX_QUANTITY,
      )
    )
      nextFields.lines = `Choose a product and enter a whole quantity from 1 to ${MAX_QUANTITY} for every line`;
    setFields(nextFields);
    setError('');
    if (Object.keys(nextFields).length) {
      toast.error('Please fix the highlighted fields.');
      return;
    }
    setSaving(true);
    try {
      const saved = await api(editing ? `/subscriptions/${id}` : '/subscriptions', {
        method: editing ? 'PUT' : 'POST',
        body: {
          customerId: Number(form.customerId),
          planId: Number(form.planId),
          paymentTermId: Number(form.paymentTermId),
          startDate: form.startDate,
          expiryDate: form.expiryDate,
          notes: form.notes.trim() || null,
          lines: lines.map(({ productId, variantId, taxId, quantity }) => ({
            productId: Number(productId),
            variantId: variantId ? Number(variantId) : null,
            taxId: taxId ? Number(taxId) : null,
            quantity: Number(quantity),
          })),
        },
      });
      toast.success(editing ? 'Subscription updated.' : 'Draft subscription created.');
      navigate(`/subscriptions/${saved.id}`);
    } catch (failure) {
      setFields(failure.fields ?? {});
      setError(failure.message);
      toast.error(failure.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner />;
  return (
    <div className="space-y-6">
      <Link
        to={editing ? `/subscriptions/${id}` : '/subscriptions'}
        className="text-sm text-brand-600 hover:underline"
      >
        ← Back to subscriptions
      </Link>
      <PageHeader
        title={editing ? `Edit ${subscription?.number ?? 'subscription'}` : 'New subscription'}
        subtitle="Create a draft with current customer, plan and catalog data."
      />
      <form noValidate onSubmit={handleSubmit} className="card space-y-6">
        <Alert>{error}</Alert>
        <h2 className="form-section-title">Subscription details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <SearchSelect
            label="Customer"
            placeholder="Search by name, company or email"
            value={customer}
            error={fields.customerId}
            search={searchCustomers}
            describe={describeCustomer}
            onChange={(option) => {
              setCustomer(option);
              setForm({ ...form, customerId: String(option.id) });
            }}
          />
          <Field label="Plan" error={fields.planId}>
            <select
              className="input"
              value={form.planId}
              onChange={(event) => handlePlanChange(event.target.value)}
            >
              <option value="">Choose a plan</option>
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} · {formatMoney(plan.price)} / {plan.billingPeriod.toLowerCase()}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Payment terms" error={fields.paymentTermId}>
            <select
              className="input"
              value={form.paymentTermId}
              onChange={(event) => setForm({ ...form, paymentTermId: event.target.value })}
            >
              <option value="">Choose payment terms</option>
              {terms.map((term) => (
                <option key={term.id} value={term.id}>
                  {term.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Start date" error={fields.startDate}>
            <input
              className="input"
              type="date"
              value={form.startDate}
              onChange={(event) => handleStartChange(event.target.value)}
            />
          </Field>
          <Field
            label="Expiry date"
            error={fields.expiryDate}
            hint={
              selectedPlan
                ? `Set from the ${selectedPlan.billingPeriod.toLowerCase()} plan; you can change it.`
                : ''
            }
          >
            <input
              className="input"
              type="date"
              min={form.startDate}
              value={form.expiryDate}
              onChange={(event) => setForm({ ...form, expiryDate: event.target.value })}
            />
          </Field>
          <Field label="Notes" wrapperClassName="sm:col-span-2" hint={`${form.notes.length} / 1000`}>
            <textarea
              className="input"
              rows={3}
              maxLength={1000}
              value={form.notes}
              onChange={(event) => setForm({ ...form, notes: event.target.value })}
            />
          </Field>
        </div>
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <h2 className="form-section-title flex-1">Subscription lines</h2>
            <button
              className="btn-secondary"
              type="button"
              disabled={lines.length >= MAX_LINES}
              onClick={() => setLines([...lines, blankLine()])}
            >
              Add line
            </button>
          </div>
          <Alert tone="error">{fields.lines}</Alert>
          {lines.map((line, index) => (
            <div
              key={line.lineKey}
              className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50/60 p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_7rem_auto]"
            >
              <Field label={`Product ${index + 1}`}>
                <select
                  className="input"
                  value={line.productId}
                  onChange={(event) => loadVariants(line.lineKey, event.target.value)}
                >
                  <option value="">Choose a product</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Variant">
                <select
                  className="input"
                  value={line.variantId}
                  onChange={(event) => setLine(line.lineKey, { variantId: event.target.value })}
                  disabled={!line.variants.length}
                >
                  <option value="">No variant</option>
                  {line.variants.map((variant) => (
                    <option key={variant.id} value={variant.id}>
                      {variant.attribute}: {variant.value}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Tax">
                <select
                  className="input"
                  value={line.taxId}
                  onChange={(event) => setLine(line.lineKey, { taxId: event.target.value })}
                >
                  <option value="">Product default</option>
                  {taxes.map((tax) => (
                    <option key={tax.id} value={tax.id}>
                      {tax.name} ({tax.ratePercent}%)
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Quantity">
                <input
                  className="input"
                  type="number"
                  min="1"
                  max={MAX_QUANTITY}
                  step="1"
                  value={line.quantity}
                  onChange={(event) => setLine(line.lineKey, { quantity: event.target.value })}
                />
              </Field>
              <div className="flex items-end">
                <button
                  className="btn-secondary"
                  type="button"
                  disabled={lines.length === 1}
                  onClick={() => setLines(lines.filter((entry) => entry.lineKey !== line.lineKey))}
                >
                  Remove
                </button>
              </div>
              <p className="text-sm text-slate-600 sm:col-span-5">
                Estimated line amount: {formatMoney(totals.lines[index] ?? 0)} · Server confirms current
                prices when saved.
              </p>
            </div>
          ))}
          <p className="text-right font-semibold">
            Estimated recurring total: {formatMoney(totals.recurring)}
          </p>
        </section>
        <div className="flex flex-wrap gap-2">
          <button className="btn-primary" disabled={saving}>
            {saving ? 'Saving...' : editing ? 'Save changes' : 'Create draft'}
          </button>
          <Link className="btn-secondary" to={editing ? `/subscriptions/${id}` : '/subscriptions'}>
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
