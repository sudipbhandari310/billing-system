import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Tags,
  Users,
  FileText,
  Truck,
  UsersRound,
  LogOut,
  Moon,
  Sun,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/products', label: 'Products', icon: Package },
  { to: '/categories', label: 'Categories', icon: Tags },
  { to: '/stock', label: 'Stock Movements', icon: Truck },
  { to: '/customers', label: 'Customers', icon: UsersRound },
  { to: '/invoices', label: 'Invoices', icon: FileText },
  { to: '/users', label: 'Users', icon: Users, adminOnly: true },
];

const Sidebar = ({ open, onClose }) => {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/login');
  };

  return (
    <aside
      className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transform ${
        open ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 transition-transform duration-200 ease-in-out flex flex-col`}
    >
      <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-md bg-indigo-600 text-white grid place-items-center font-bold">B</div>
          <div>
            <p className="font-semibold leading-tight">Billing</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Inventory Suite</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
        {links
          .filter((l) => !l.adminOnly || user?.role === 'admin')
          .map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                }`
              }
            >
              <l.icon size={18} />
              {l.label}
            </NavLink>
          ))}
      </nav>

      <div className="border-t border-slate-200 dark:border-slate-700 p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm">
            <div className="font-medium">{user?.name}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 capitalize">{user?.role}</div>
          </div>
          <button onClick={toggle} className="p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-700" title="Toggle theme">
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
        <button onClick={handleLogout} className="btn-secondary w-full">
          <LogOut size={16} /> Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;