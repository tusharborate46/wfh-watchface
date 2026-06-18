import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api.js';

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('employee@example.com');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const session = await api('/api/auth/dev-login', {
        method: 'POST',
        body: JSON.stringify({ email })
      });

      onLogin(session);
      navigate(session.employee.role === 'employee' ? '/me' : '/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Check the email and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-shell">
      <section className="card login-card">
        <p className="eyebrow">Privacy-first employee monitoring</p>
        <h1>WFH WatchFace</h1>
        <p className="muted">
          Use employee@example.com for the employee view, manager@example.com for the manager dashboard,
          or admin@example.com for admin access.
        </p>

        {error && <p className="error-box">{error}</p>}

        <form onSubmit={handleLogin} className="form-stack">
          <label className="field">
            <span>Email</span>
            <input
              id="login-email"
              className="input"
              type="email"
              placeholder="employee@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </label>
          <button id="login-submit" className="btn" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </section>
    </main>
  );
}
