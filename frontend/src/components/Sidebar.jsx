import { NavLink } from 'react-router-dom';
import { X, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getNavItemsForRole } from '../config/navigation';

/**
 * Responsive sidebar showing navigation links based on the logged-in user's role.
 *
 * @param {Object} props
 * @param {boolean} props.open - Whether the sidebar is visible on mobile.
 * @param {() => void} props.onClose - Callback to close the sidebar (mobile).
 */
export default function Sidebar({ open, onClose }) {
  const { user } = useAuth();
  const navItems = getNavItemsForRole(user?.role);

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
      isActive
        ? 'bg-indigo-600 text-white'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`;

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/50 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-white shadow-sm transition-transform duration-300 lg:static lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Sidebar navigation"
      >
        {/* Brand */}
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <span className="text-sm font-bold text-slate-900">Visitor Pass</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {navItems.length > 0 ? (
            navItems.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} className={linkClass} onClick={onClose}>
                <Icon className="h-5 w-5 shrink-0" />
                {label}
              </NavLink>
            ))
          ) : (
            <p className="px-3 py-2 text-sm text-slate-400">No navigation available.</p>
          )}
        </nav>

        {/* Footer with role badge */}
        <div className="border-t border-slate-200 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Signed in as
          </p>
          <p className="mt-1 truncate text-sm font-medium text-slate-900">{user?.name}</p>
          <span className="mt-1 inline-block rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700">
            {user?.role}
          </span>
        </div>
      </aside>
    </>
  );
}