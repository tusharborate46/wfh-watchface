import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../utils/api.js';

export default function EmployeeLogin({ onLogin }) {
  const [employeeCode, setEmployeeCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const session = await api('/api/auth/employee/login', {
        method: 'POST',
        body: JSON.stringify({ employee_code: employeeCode.trim(), password })
      }, null);

      onLogin(session.token, session.employee);

      // Redirect: not enrolled → enroll page, else → status page
      navigate(session.enrolled ? '/employee/status' : '/employee/enroll', { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-shell">
      <section className="card login-card">
        <p className="eyebrow">Employee Portal</p>
        <h1>Sign in</h1>
        <p className="muted mt-1">
          Enter your Employee Code (e.g. <code className="text-emerald-400">EMP001</code>) and password.
        </p>

        {error && <p className="error-box">{error}</p>}

        <form onSubmit={handleLogin} className="form-stack">
          <label className="field">
            <span>Employee Code</span>
            <input
              id="login-employee-code"
              className="input"
              type="text"
              placeholder="EMP001"
              value={employeeCode}
              onChange={(e) => setEmployeeCode(e.target.value)}
              required
              autoFocus
              autoComplete="username"
            />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              id="login-password"
              className="input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </label>

          <button id="login-submit" className="btn" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-zinc-500">
          Manager?{' '}
          <Link className="font-semibold text-emerald-400 hover:text-emerald-300 transition-colors" to="/manager/login">
            Login here →
          </Link>
        </p>
      </section>
    </main>
  );
}
