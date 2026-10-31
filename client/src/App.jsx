// Route table. Every page below exists as a stub, so owners fill in their page.
// Add form and detail routes inside your own module's block, which keeps
// teammates' edits on separate lines.
import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import { Spinner } from './components/ui.jsx';
import { homePathFor, useAuth } from './lib/auth.jsx';
import Login from './pages/auth/Login.jsx';
import Signup from './pages/auth/Signup.jsx';
import ForgotPassword from './pages/auth/ForgotPassword.jsx';
import ResetPassword from './pages/auth/ResetPassword.jsx';
import Dashboard from './pages/dashboard/Dashboard.jsx';
import CustomerList from './pages/customers/CustomerList.jsx';
import CustomerForm from './pages/customers/CustomerForm.jsx';
import CustomerDetail from './pages/customers/CustomerDetail.jsx';
import StaffList from './pages/staff/StaffList.jsx';
import ProductList from './pages/products/ProductList.jsx';
import PlanList from './pages/plans/PlanList.jsx';
import TaxList from './pages/taxes/TaxList.jsx';
import DiscountList from './pages/discounts/DiscountList.jsx';
import TemplateList from './pages/templates/TemplateList.jsx';
import SubscriptionList from './pages/subscriptions/SubscriptionList.jsx';
import SubscriptionDetail from './pages/subscriptions/SubscriptionDetail.jsx';
import BillingRun from './pages/billing/BillingRun.jsx';
import InvoiceDetail from './pages/invoices/InvoiceDetail.jsx';
import InvoiceList from './pages/invoices/InvoiceList.jsx';
import PaymentList from './pages/payments/PaymentList.jsx';
import Reports from './pages/reports/Reports.jsx';
import PortalSubscriptions from './pages/portal/PortalSubscriptions.jsx';
import PortalInvoices from './pages/portal/PortalInvoices.jsx';
import PortalSubscriptionDetail from './pages/portal/PortalSubscriptionDetail.jsx';
import PortalInvoiceDetail from './pages/portal/PortalInvoiceDetail.jsx';

const STAFF = ['ADMIN', 'INTERNAL'];
const ADMIN = ['ADMIN'];
const CUSTOMER = ['CUSTOMER'];

// The client only hides pages. The server is what actually enforces roles.
function RequireRole({ roles }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to={homePathFor(user)} replace />;
  return <Outlet />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route element={<RequireRole roles={[...STAFF, ...CUSTOMER]} />}>
        <Route element={<Layout />}>
          <Route element={<RequireRole roles={STAFF} />}>
            <Route path="/" element={<Dashboard />} />

            <Route path="/customers" element={<CustomerList />} />
            <Route path="/customers/new" element={<CustomerForm />} />
            <Route path="/customers/:id" element={<CustomerDetail />} />
            <Route path="/customers/:id/edit" element={<CustomerForm />} />

            <Route path="/subscriptions" element={<SubscriptionList />} />

            <Route path="/subscriptions/:id" element={<SubscriptionDetail />} />

            <Route path="/billing" element={<BillingRun />} />

            <Route path="/invoices" element={<InvoiceList />} />
            <Route path="/invoices/:id" element={<InvoiceDetail />} />

            <Route path="/payments" element={<PaymentList />} />

            <Route path="/products" element={<ProductList />} />

            <Route path="/plans" element={<PlanList />} />

            <Route path="/taxes" element={<TaxList />} />

            <Route path="/discounts" element={<DiscountList />} />

            <Route path="/templates" element={<TemplateList />} />

            <Route path="/reports" element={<Reports />} />
          </Route>

          <Route element={<RequireRole roles={ADMIN} />}>
            <Route path="/staff" element={<StaffList />} />
          </Route>

          <Route element={<RequireRole roles={CUSTOMER} />}>
            <Route path="/portal" element={<PortalSubscriptions />} />
            <Route path="/portal/subscriptions" element={<PortalSubscriptions />} />
            <Route path="/portal/subscriptions/:id" element={<PortalSubscriptionDetail />} />

            <Route path="/portal/invoices" element={<PortalInvoices />} />
            <Route path="/portal/invoices/:id" element={<PortalInvoiceDetail />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
