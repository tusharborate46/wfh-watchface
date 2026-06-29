import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../utils/api.js';

export default function ManagerLogin({ onLogin }) {
  const [managerCode, setManagerCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const session = await api('/api/auth/manager/login', {
        method: 'POST',
        body: JSON.stringify({ manager_code: managerCode.trim(), password })
      }, null);

      onLogin(session.token, session.manager);
      navigate('/manager/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-shell">
      <section className="card login-card">
        <p className="eyebrow" style={{ color: 'rgb(167 139 250)' }}>Manager Portal</p>
        <h1>Manager Sign in</h1>
        <p className="muted mt-1">
          Enter your Manager Code (e.g. <code className="text-violet-400">MGR001</code>) and password.
        </p>

        {error && <p className="error-box">{error}</p>}

        <form onSubmit={handleLogin} className="form-stack">
          <label className="field">
            <span>Manager Code</span>
            <input
              id="login-manager-code"
              className="input"
              type="text"
              placeholder="MGR001"
              value={managerCode}
              onChange={(e) => setManagerCode(e.target.value)}
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

          <button
            id="manager-login-submit"
            className="btn"
            style={{ backgroundColor: 'rgb(139 92 246)', color: 'white' }}
            type="submit"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-zinc-500">
          Employee?{' '}
          <Link className="font-semibold text-emerald-400 hover:text-emerald-300 transition-colors" to="/employee/login">
            Login here →
          </Link>
        </p>
      </section>
    </main>
  );
}
