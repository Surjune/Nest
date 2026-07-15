import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { clearSession, getAdminName } from './api.js';

const NAV = [
  { to: '/', label: 'Overview', icon: '🏠', end: true },
  { to: '/cases', label: 'Case Queue', icon: '🗂️' },
  { to: '/interns', label: 'Interns', icon: '🎓' },
  { to: '/professionals', label: 'Professionals', icon: '🩺' },
  { to: '/audit', label: 'Audit Log', icon: '📜' },
];

export default function Layout() {
  const navigate = useNavigate();

  function logout() {
    clearSession();
    navigate('/login');
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="wordmark">nest</div>
        <div className="tagline">admin — a safe place to land</div>
        <nav className="nav">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => (isActive ? 'active' : '')}>
              <span className="icon" aria-hidden="true">{n.icon}</span>
              <span className="label">{n.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="foot">
          <span className="whoami">Signed in as {getAdminName()}</span>
          <button onClick={logout}>Sign out</button>
        </div>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
