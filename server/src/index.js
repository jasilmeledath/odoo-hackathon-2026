// App setup and route mounting only. Every module's router is already mounted,
// so owners work inside src/modules/<module>/ and rarely touch this file.
import express from 'express';
import cors from 'cors';
import authRoutes from './modules/auth/auth.routes.js';
import staffRoutes from './modules/staff/staff.routes.js';
import customerRoutes from './modules/customers/customers.routes.js';
import taxRoutes from './modules/taxes/taxes.routes.js';
import termRoutes from './modules/terms/terms.routes.js';
import productRoutes from './modules/products/products.routes.js';
import planRoutes from './modules/plans/plans.routes.js';
import templateRoutes from './modules/templates/templates.routes.js';
import subscriptionRoutes from './modules/subscriptions/subscriptions.routes.js';
import discountRoutes from './modules/discounts/discounts.routes.js';
import billingRoutes from './modules/billing/billing.routes.js';
import invoiceRoutes from './modules/invoices/invoices.routes.js';
import paymentRoutes from './modules/payments/payments.routes.js';
import reportRoutes from './modules/reports/reports.routes.js';
import portalRoutes from './modules/portal/portal.routes.js';
import { startDashboardListener, stopDashboardListener } from './lib/dashboardEvents.js';
import { prisma } from './lib/prisma.js';
import { errorHandler, notFound } from './middleware/error.js';
import { requestLogger } from './middleware/requestLogger.js';

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is not set. Copy .env.example to .env first.');
  process.exit(1);
}

const app = express();
app.use(requestLogger);
app.use(cors({ origin: process.env.CLIENT_ORIGIN }));
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ ok: true });
});

app.use('/api/auth', authRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/taxes', taxRoutes);
app.use('/api/payment-terms', termRoutes);
app.use('/api/products', productRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/discounts', discountRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/portal', portalRoutes);

app.use(notFound);
app.use(errorHandler);

const port = Number(process.env.PORT) || 4000;
startDashboardListener();
const server = app.listen(port, () => console.info(`API on http://localhost:${port}`));

let isShuttingDown = false;
const shutdown = async () => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  await new Promise((resolve) => server.close(resolve));
  await Promise.all([stopDashboardListener(), prisma.$disconnect()]);
};

process.once('SIGINT', () => {
  void shutdown().catch(() => {
    process.exitCode = 1;
  });
});
process.once('SIGTERM', () => {
  void shutdown().catch(() => {
    process.exitCode = 1;
  });
});
