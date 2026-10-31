// Demo data for Brightloop Software: every role, every status, and enough volume
// to exercise lists and reports. Set SEED_SUBSCRIPTIONS=5000 to test PS-25.
// This is the only place sample data may live, and it replaces all existing data.
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { addDays, addPeriod, today } from '../src/lib/dates.js';
import { applyPercent, toMonthlyAmount } from '../src/lib/money.js';

const prisma = new PrismaClient();

const DEMO_PASSWORD = 'Demo@12345';
const BCRYPT_COST = 10;
const INSERT_BATCH_SIZE = 500;
const CUSTOMER_COUNT = 24;
const DEFAULT_SUBSCRIPTION_COUNT = 60;
const INVOICES_PER_SUBSCRIPTION = 6;
const DUE_TODAY_EVERY_NTH = 4;
const PAYMENT_METHODS = ['CASH', 'BANK_TRANSFER', 'UPI', 'CARD', 'CHEQUE'];
const TABLES_WITH_EXPLICIT_IDS = ['subscriptions', 'invoices', 'invoice_lines'];
const ALL_TABLES = [
  'activity_logs',
  'payments',
  'invoice_lines',
  'invoices',
  'subscription_lines',
  'subscriptions',
  'discount_products',
  'discounts',
  'quotation_template_lines',
  'quotation_templates',
  'plans',
  'product_variants',
  'products',
  'taxes',
  'payment_terms',
  'password_reset_tokens',
  'customers',
  'users',
  'document_counters',
];
const COMPANY_NAMES = [
  'Harbour Traders',
  'Lotus Clinics',
  'Metro Logistics',
  'Northwind Foods',
  'Pine Studio',
  'Quill Publishing',
  'Riverbank Hotels',
  'Saffron Retail',
  'Tusker Motors',
  'Umbra Labs',
  'Vista Realty',
];

const rupees = (value) => value * 100;

const insertAll = async (model, rows) => {
  for (let start = 0; start < rows.length; start += INSERT_BATCH_SIZE) {
    await model.createMany({ data: rows.slice(start, start + INSERT_BATCH_SIZE) });
  }
};

const clearAll = () =>
  prisma.$executeRawUnsafe(`TRUNCATE TABLE ${ALL_TABLES.join(', ')} RESTART IDENTITY CASCADE`);

// Rows inserted with explicit ids do not move the id sequence, so it is moved here.
const syncIdSequences = async () => {
  for (const table of TABLES_WITH_EXPLICIT_IDS) {
    await prisma.$executeRawUnsafe(
      `SELECT setval(pg_get_serial_sequence('${table}', 'id'), GREATEST((SELECT MAX(id) FROM ${table}), 1))`,
    );
  }
};

const seedPeople = async () => {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, BCRYPT_COST);
  const account = (name, email, role) => ({ name, email, role, passwordHash });

  const admin = await prisma.user.create({ data: account('Asha Admin', 'admin@demo.test', 'ADMIN') });
  await prisma.user.create({ data: account('Ravi Sales', 'staff@demo.test', 'INTERNAL') });
  await prisma.user.create({ data: account('Nila Accounts', 'finance@demo.test', 'INTERNAL') });

  // Two customers can log in, which is how portal data isolation gets tested.
  const withLogin = async (name, email, companyName, phone, address) => {
    await prisma.user.create({
      data: {
        ...account(name, email, 'CUSTOMER'),
        customer: { create: { name, email, companyName, phone, address } },
      },
    });
  };
  await withLogin('Mira Baker', 'customer@demo.test', 'Corner Bakery', '9876543210', '12 MG Road, Kochi');
  await withLogin('Omar Khan', 'customer2@demo.test', 'Bright Dental', '9876543211', '8 Beach Road, Kochi');

  const others = Array.from({ length: CUSTOMER_COUNT }, (_, index) => ({
    name: `Accounts team ${index + 1}`,
    email: `billing${index + 1}@demo.test`,
    companyName: COMPANY_NAMES[index % COMPANY_NAMES.length],
    phone: `98${String(10000000 + index)}`,
    address: `${index + 1} Marine Drive, Kochi`,
  }));
  await prisma.customer.createMany({ data: others });

  return { admin, customers: await prisma.customer.findMany({ orderBy: { id: 'asc' } }) };
};

const seedProducts = async () => {
  const gst18 = await prisma.tax.create({ data: { name: 'GST 18%', ratePercent: 18 } });
  const gst5 = await prisma.tax.create({ data: { name: 'GST 5%', ratePercent: 5 } });
  await prisma.tax.create({ data: { name: 'Exempt', ratePercent: 0 } });

  const product = (name, type, salesPrice, costPrice, taxId, notes, variants = []) =>
    prisma.product.create({
      data: {
        name,
        type,
        taxId,
        notes,
        salesPrice: rupees(salesPrice),
        costPrice: rupees(costPrice),
        variants: { create: variants },
      },
      include: { variants: true, tax: true },
    });

  const crm = await product('Brightloop CRM', 'SOFTWARE', 1000, 300, gst18.id, 'Per-seat sales software', [
    { attribute: 'Brand', value: 'Standard', extraPrice: 0 },
    { attribute: 'Brand', value: 'Odoo', extraPrice: rupees(560) },
  ]);
  const books = await product(
    'Brightloop Books',
    'SOFTWARE',
    1500,
    450,
    gst18.id,
    'Per-seat accounting software',
  );
  const storage = await product('Extra Storage', 'ADD_ON', 200, 50, gst18.id, '100 GB of extra storage');
  const support = await product('Priority Support', 'ADD_ON', 500, 150, gst5.id, 'Four-hour response time');
  await product('Onboarding Workshop', 'SERVICE', 5000, 2000, gst18.id, 'One-off half-day workshop');

  return { crm, books, storage, support };
};

const seedPlans = async ({ crm, books, support }) => {
  const startDate = addDays(today(), -730);
  const plan = (name, product, price, billingPeriod, minQuantity, options = {}) =>
    prisma.plan.create({
      data: {
        name,
        billingPeriod,
        minQuantity,
        startDate,
        productId: product.id,
        price: rupees(price),
        ...options,
      },
      include: { product: { include: { tax: true } } },
    });

  const plans = [
    await plan('CRM Monthly', crm, 1200, 'MONTHLY', 1, { canPause: true }),
    await plan('CRM Yearly', crm, 12000, 'YEARLY', 5, { canCloseEarly: false }),
    await plan('Books Monthly', books, 1800, 'MONTHLY', 1, { canPause: true }),
    await plan('Books Weekly', books, 450, 'WEEKLY', 1),
    await plan('CRM Daily Trial', crm, 60, 'DAILY', 1, { closesAtExpiry: true, canRenew: false }),
  ];

  await prisma.quotationTemplate.create({
    data: {
      name: 'Enterprise CRM',
      planId: plans[1].id,
      validityDays: 30,
      notes: 'Yearly contract for ten seats with priority support',
      lines: {
        create: [
          { productId: crm.id, variantId: crm.variants[1].id, quantity: 10 },
          { productId: support.id, quantity: 1 },
        ],
      },
    },
  });
  return plans;
};

const seedDiscounts = async ({ crm }) => {
  const rules = [
    {
      name: 'Bulk seats 10%',
      type: 'PERCENT',
      percent: 10,
      scope: 'SUBSCRIPTION',
      minQuantity: 10,
      startDate: addDays(today(), -60),
      endDate: addDays(today(), 300),
      usageLimit: 500,
    },
    {
      name: 'CRM launch 500 off',
      type: 'FIXED',
      fixedAmount: rupees(500),
      scope: 'PRODUCT',
      minPurchaseAmount: rupees(1000),
      startDate: addDays(today(), -30),
      endDate: addDays(today(), 60),
      products: { create: [{ productId: crm.id }] },
    },
    {
      name: 'Festival offer (expired)',
      type: 'PERCENT',
      percent: 15,
      scope: 'SUBSCRIPTION',
      startDate: addDays(today(), -380),
      endDate: addDays(today(), -350),
    },
    {
      name: 'First 50 customers (used up)',
      type: 'FIXED',
      fixedAmount: rupees(250),
      scope: 'SUBSCRIPTION',
      startDate: addDays(today(), -120),
      endDate: addDays(today(), 120),
      usageLimit: 50,
      usageCount: 50,
    },
  ];
  for (const data of rules) await prisma.discount.create({ data });
};

const seedPaymentTerms = async () => {
  const terms = [
    ['Immediate', 0],
    ['Net 15', 15],
    ['Net 30', 30],
    ['Net 45', 45],
  ];
  await prisma.paymentTerm.createMany({ data: terms.map(([name, dueDays]) => ({ name, dueDays })) });
  return prisma.paymentTerm.findMany({ orderBy: { id: 'asc' } });
};

// The mix of statuses: most subscriptions are running, as in a real company.
const STATUS_BY_REMAINDER = ['DRAFT', 'QUOTATION', 'CONFIRMED', 'PAUSED', 'CLOSED'];
const statusFor = (index) => STATUS_BY_REMAINDER[index % 20] ?? 'ACTIVE';

const buildSubscription = (index, context) => {
  const { customers, plans, paymentTerms, storage } = context;
  const id = index + 1;
  const plan = plans[index % plans.length];
  const paymentTerm = paymentTerms[index % paymentTerms.length];
  const status = statusFor(index);
  const isUpcoming = status === 'DRAFT' || status === 'QUOTATION';
  const startDate = addDays(today(), isUpcoming ? 7 : -(45 + (index % 300)));

  const quantity = plan.minQuantity + (index % 12);
  const lines = [{ product: plan.product, quantity, unitPrice: plan.price }];
  if (index % 3 === 0) lines.push({ product: storage, quantity: 1, unitPrice: storage.salesPrice });
  const pricedLines = lines.map((line) => ({ ...line, amount: line.quantity * line.unitPrice }));
  const recurringAmount = pricedLines.reduce((sum, line) => sum + line.amount, 0);

  return {
    plan,
    paymentTerm,
    customer: customers[index % customers.length],
    lines: pricedLines,
    row: {
      id,
      number: `SUB-${String(id).padStart(6, '0')}`,
      customerId: customers[index % customers.length].id,
      planId: plan.id,
      paymentTermId: paymentTerm.id,
      status,
      startDate,
      expiryDate: addDays(startDate, 365 + (index % 365)),
      quotationExpiryDate: status === 'QUOTATION' ? addDays(today(), 14) : null,
      recurringAmount,
      monthlyRecurringAmount: toMonthlyAmount(recurringAmount, plan.billingPeriod),
      closedAt: status === 'CLOSED' ? addDays(today(), -10) : null,
      closeReason: status === 'CLOSED' ? 'CLOSED_EARLY' : null,
    },
  };
};

// Older invoices are paid; the newest are left draft, confirmed, part-paid,
// overdue or canceled, so every state appears on screen.
const invoiceStateFor = (invoiceId, isNewest, totalAmount) => {
  const flavor = invoiceId % 10;
  if (isNewest && flavor < 2) return { status: 'DRAFT', paidAmount: 0 };
  if (isNewest && flavor === 2) return { status: 'CANCELED', paidAmount: 0 };
  if (isNewest || flavor === 3) {
    return { status: 'CONFIRMED', paidAmount: flavor === 5 ? Math.floor(totalAmount / 2) : 0 };
  }
  return { status: 'PAID', paidAmount: totalAmount };
};

const buildInvoices = (subscription, nextIds, recordedById, rows) => {
  const { row, plan, paymentTerm, customer, lines } = subscription;
  const anchorDay = row.startDate.getUTCDate();

  const periodStarts = [row.startDate];
  let nextStart = addPeriod(row.startDate, plan.billingPeriod, anchorDay);
  while (nextStart <= today()) {
    periodStarts.push(nextStart);
    nextStart = addPeriod(nextStart, plan.billingPeriod, anchorDay);
  }
  // Some running subscriptions keep their latest period unbilled, so billing day
  // always has work to show (PS-15).
  const isDueNow = row.status === 'ACTIVE' && row.id % DUE_TODAY_EVERY_NTH === 0;
  const dueDate = isDueNow ? periodStarts.pop() : nextStart;
  row.nextInvoiceDate = row.status === 'ACTIVE' ? dueDate : null;

  const billedPeriods = periodStarts.slice(-INVOICES_PER_SUBSCRIPTION);
  billedPeriods.forEach((periodStartDate, position) => {
    const invoiceId = nextIds.invoice++;
    const invoiceLines = lines.map((line) => {
      const taxRatePercent = Number(line.product.tax.ratePercent);
      return {
        id: nextIds.invoiceLine++,
        invoiceId,
        productId: line.product.id,
        description: line.product.name,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        amount: line.amount,
        taxName: line.product.tax.name,
        taxRatePercent,
        taxAmount: applyPercent(line.amount, taxRatePercent),
      };
    });
    const subtotalAmount = invoiceLines.reduce((sum, line) => sum + line.amount, 0);
    const taxAmount = invoiceLines.reduce((sum, line) => sum + line.taxAmount, 0);
    const totalAmount = subtotalAmount + taxAmount;
    const isNewest = position === billedPeriods.length - 1;
    const { status, paidAmount } = invoiceStateFor(invoiceId, isNewest, totalAmount);
    const paymentDate = addDays(periodStartDate, 3);

    rows.invoices.push({
      id: invoiceId,
      number: `INV-${String(invoiceId).padStart(6, '0')}`,
      subscriptionId: row.id,
      customerId: row.customerId,
      status,
      billingName: customer.companyName ?? customer.name,
      billingAddress: customer.address,
      issueDate: periodStartDate,
      dueDate: addDays(periodStartDate, paymentTerm.dueDays),
      periodStartDate,
      periodEndDate: addDays(addPeriod(periodStartDate, plan.billingPeriod, anchorDay), -1),
      subtotalAmount,
      taxAmount,
      totalAmount,
      paidAmount,
      confirmedAt: status === 'CONFIRMED' || status === 'PAID' ? periodStartDate : null,
      paidAt: status === 'PAID' ? paymentDate : null,
      canceledAt: status === 'CANCELED' ? periodStartDate : null,
    });
    rows.invoiceLines.push(...invoiceLines);

    if (paidAmount > 0) {
      rows.payments.push({
        invoiceId,
        recordedById,
        method: PAYMENT_METHODS[invoiceId % PAYMENT_METHODS.length],
        amount: paidAmount,
        paymentDate,
      });
    }
  });
};

const seedSubscriptions = async (context) => {
  const count = Number(process.env.SEED_SUBSCRIPTIONS) || DEFAULT_SUBSCRIPTION_COUNT;
  const nextIds = { invoice: 1, invoiceLine: 1 };
  const rows = { subscriptions: [], subscriptionLines: [], invoices: [], invoiceLines: [], payments: [] };

  for (let index = 0; index < count; index++) {
    const subscription = buildSubscription(index, context);
    if (['ACTIVE', 'PAUSED', 'CLOSED'].includes(subscription.row.status)) {
      buildInvoices(subscription, nextIds, context.admin.id, rows);
    }
    rows.subscriptions.push(subscription.row);
    for (const line of subscription.lines) {
      rows.subscriptionLines.push({
        subscriptionId: subscription.row.id,
        productId: line.product.id,
        taxId: line.product.taxId,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        amount: line.amount,
      });
    }
  }

  await insertAll(prisma.subscription, rows.subscriptions);
  await insertAll(prisma.subscriptionLine, rows.subscriptionLines);
  await insertAll(prisma.invoice, rows.invoices);
  await insertAll(prisma.invoiceLine, rows.invoiceLines);
  await insertAll(prisma.payment, rows.payments);
  await syncIdSequences();
  await prisma.documentCounter.createMany({
    data: [
      { key: 'SUBSCRIPTION', value: count },
      { key: 'INVOICE', value: nextIds.invoice - 1 },
    ],
  });
  return rows;
};

const main = async () => {
  await clearAll();
  const { admin, customers } = await seedPeople();
  const products = await seedProducts();
  const plans = await seedPlans(products);
  await seedDiscounts(products);
  const paymentTerms = await seedPaymentTerms();
  const rows = await seedSubscriptions({ admin, customers, plans, paymentTerms, storage: products.storage });
  console.info(
    `Seeded ${rows.subscriptions.length} subscriptions, ${rows.invoices.length} invoices and ` +
      `${rows.payments.length} payments. Every demo login uses the password ${DEMO_PASSWORD}.`,
  );
};

await main().finally(() => prisma.$disconnect());
