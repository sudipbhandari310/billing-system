import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const titleMap = {
  '/': 'Dashboard',
  '/products': 'Products',
  '/categories': 'Categories',
  '/stock': 'Stock Movements',
  '/customers': 'Customers',
  '/invoices': 'Invoices',
  '/users': 'Users',
};

const Layout = () => {
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  const matched = Object.keys(titleMap).find((k) => loc.pathname.startsWith(k));
  const title = titleMap[matched] || 'Billing';

  return (
    <div className="flex min-h-screen">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar onMenuClick={() => setOpen(true)} title={title} />
        <main className="p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;