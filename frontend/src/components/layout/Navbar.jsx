import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const linksByRole = {
  student: [{ to: '/', label: 'Dashboard' }],
  advisor: [
    { to: '/', label: 'At-Risk Students' },
    { to: '/alerts', label: 'Alerts' },
  ],
  instructor: [
    { to: '/', label: 'My Courses' },
    { to: '/alerts', label: 'Alerts' },
  ],
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const links = user ? linksByRole[user.role] || [] : [];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div
              className="h-8 w-8 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold text-sm"
              aria-hidden="true"
            >
              SS
            </div>
            <span className="font-semibold text-slate-900">Student Success</span>
          </div>
          <nav aria-label="Primary" className="hidden sm:flex items-center gap-1">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-lg text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 ${
                    isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>

        {user && (
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-slate-800 leading-tight">{user.name}</p>
              <p className="text-xs text-slate-500 capitalize leading-tight">{user.role}</p>
            </div>
            <button onClick={logout} className="btn-secondary" aria-label={`Log out of ${user.name}'s account`}>
              Log out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
