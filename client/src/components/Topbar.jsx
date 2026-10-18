import { Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Topbar = ({ onMenuClick, title }) => {
  const { user } = useAuth();
  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-800/80 backdrop-blur border-b border-slate-200 dark:border-slate-700">
      <div className="flex items-center gap-3 px-4 py-3">
        <button className="lg:hidden p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-700" onClick={onMenuClick}>
          <Menu size={20} />
        </button>
        <h2 className="text-base font-semibold flex-1">{title}</h2>
        <div className="text-sm text-slate-600 dark:text-slate-300 hidden sm:block">
          {user?.name} <span className="text-xs text-slate-400">({user?.role})</span>
        </div>
      </div>
    </header>
  );
};

export default Topbar;