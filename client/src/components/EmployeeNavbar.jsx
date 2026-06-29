import { Link, useNavigate } from 'react-router-dom';

export default function EmployeeNavbar({ user, onLogout, cameraActive }) {
  const navigate = useNavigate();

  function handleLogout() {
    onLogout();
    navigate('/employee/login');
  }

  return (
    <nav className="app-nav">
      <Link className="nav-brand" to="/employee/status">
        <span className="text-emerald-400">WFH</span>
        <span className="text-zinc-300">WatchFace</span>
      </Link>

      <div className="nav-links">
        <Link className="nav-link" to="/employee/enroll">Enroll</Link>
        <Link className="nav-link" to="/employee/status">My Status</Link>
        <Link className="nav-link" to="/employee/settings">Settings</Link>
      </div>

      <div className="nav-actions">
        {/* Auto-verification status dot */}
        <span className="flex items-center gap-1.5 text-xs text-zinc-500">
          <span
            className={`h-2 w-2 rounded-full ${cameraActive ? 'animate-pulse bg-red-400' : 'bg-emerald-500'}`}
          />
          {cameraActive ? 'Verifying...' : 'Auto-verify on'}
        </span>

        {user && (
          <span className="text-sm font-semibold text-zinc-300">{user.name}</span>
        )}

        <button
          className="link-button"
          id="employee-logout-btn"
          onClick={handleLogout}
          type="button"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
