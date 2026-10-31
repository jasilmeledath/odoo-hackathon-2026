// The app shell: sidebar on desktop, top bar with a menu on mobile. Menus follow
// the way the business works, and each role only sees what it can use (PS-4).
import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';
import { formatLabel } from '../lib/format.js';
import { useDashboardEvents } from '../lib/useDashboardEvents.js';

const APP_NAME = 'Brightloop';

const STAFF_MENU = [
  { heading: 'Overview', links: [{ to: '/', label: 'Dashboard', end: true }] },
  {
    heading: 'Sales',
    links: [
      { to: '/subscriptions', label: 'Subscriptions' },
      { to: '/customers', label: 'Customers' },
      { to: '/templates', label: 'Quotation templates' },
    ],
  },
  {
    heading: 'Billing',
    links: [
      { to: '/billing', label: 'Billing run' },
      { to: '/invoices', label: 'Invoices' },
      { to: '/payments', label: 'Payments' },
    ],
  },
  {
    heading: 'Catalog',
    links: [
      { to: '/products', label: 'Products' },
      { to: '/plans', label: 'Plans' },
      { to: '/taxes', label: 'Taxes' },
      { to: '/discounts', label: 'Discounts' },
    ],
  },
  { heading: 'Insights', links: [{ to: '/reports', label: 'Reports' }] },
];
const ADMIN_MENU = [{ heading: 'Administration', links: [{ to: '/staff', label: 'Staff' }] }];
const CUSTOMER_MENU = [
  {
    heading: 'My account',
    links: [
      { to: '/portal', label: 'My subscriptions', end: true },
      { to: '/portal/invoices', label: 'My invoices' },
    ],
  },
];

const menuFor = (role) => {
  if (role === 'CUSTOMER') return CUSTOMER_MENU;
  return role === 'ADMIN' ? [...STAFF_MENU, ...ADMIN_MENU] : STAFF_MENU;
};

export default function Layout() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  useDashboardEvents(pathname === '/');

  const nav = (
    <nav className="flex flex-col gap-5">
      {menuFor(user.role).map((group) => (
        <div key={group.heading}>
          <p className="mb-1 px-3 text-xs font-semibold tracking-wide text-slate-400 uppercase">
            {group.heading}
          </p>
          <div className="flex flex-col gap-1">
            {group.links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                onClick={() => setIsMenuOpen(false)}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm font-medium ${
                    isActive ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-brand-50'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );

  const account = (
    <div className="border-t border-slate-200 px-3 pt-4">
      <p className="text-sm font-medium text-slate-900">{user.name}</p>
      <p className="text-xs text-slate-500">{formatLabel(user.role)}</p>
      <button onClick={logout} className="mt-3 text-sm text-brand-600 hover:underline">
        Log out
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 md:flex">
      <header className="no-print flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:hidden">
        <span className="font-semibold text-brand-700">{APP_NAME}</span>
        <button className="btn-secondary px-3 py-1.5" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? 'Close' : 'Menu'}
        </button>
      </header>
      {isMenuOpen && (
        <div className="no-print space-y-4 border-b border-slate-200 bg-white p-3 md:hidden">
          {nav}
          {account}
        </div>
      )}

      <aside className="no-print sticky top-0 hidden h-screen w-64 shrink-0 flex-col justify-between overflow-y-auto border-r border-slate-200 bg-white p-4 md:flex">
        <div>
          <div className="mb-6 px-3 text-lg font-semibold text-brand-700">{APP_NAME}</div>
          {nav}
        </div>
        {account}
      </aside>

      <main className="mx-auto w-full max-w-6xl flex-1 p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  );
}
