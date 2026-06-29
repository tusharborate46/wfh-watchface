import { Link, useNavigate } from 'react-router-dom';

export default function ManagerNavbar({ user, onLogout }) {
  const navigate = useNavigate();

  function handleLogout() {
    onLogout();
    navigate('/manager/login');
  }

  return (
    <nav className="app-nav">
      <Link className="nav-brand" to="/manager/dashboard">
        <span className="text-emerald-400">WFH</span>
        <span className="text-zinc-300">WatchFace</span>
        <span className="ml-1.5 rounded bg-emerald-400/10 px-1.5 py-0.5 text-xs font-bold text-emerald-400">
          Manager
        </span>
      </Link>

      <div className="nav-links">
        <Link className="nav-link" to="/manager/dashboard">Dashboard</Link>
        <Link className="nav-link" to="/manager/alerts">Alerts</Link>
        <Link className="nav-link" to="/manager/employees">Employees</Link>
      </div>

      <div className="nav-actions">
        {user && (
          <span className="text-sm font-semibold text-zinc-300">{user.name}</span>
        )}
        <button
          className="link-button"
          id="manager-logout-btn"
          onClick={handleLogout}
          type="button"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
