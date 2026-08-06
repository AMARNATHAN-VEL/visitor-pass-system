import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getNavItemsForRole } from '../config/navigation';

/**
 * Top navigation bar with mobile sidebar toggle and user menu.
 *
 * @param {Object} props
 * @param {() => void} props.onMenuClick - Opens the sidebar (mobile).
 */
export default function Navbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = getNavItemsForRole(user?.role);
  const currentPage = navItems.find((item) => item.to === location.pathname)?.label || 'Dashboard';

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-semibold text-slate-900">{currentPage}</h1>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium leading-tight text-slate-900">{user?.name}</p>
          <p className="text-xs leading-tight text-slate-500">{user?.email}</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
          {user?.name?.charAt(0)?.toUpperCase() || 'U'}
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}