import { useEffect, useState } from 'react';
import { api } from '../utils/api.js';
import StatusBadge from './StatusBadge.jsx';

export default function SelfView({ employeeId, lastStatus }) {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!employeeId) return undefined;

    let mounted = true;
    setLoading(true);

    api(`/api/status/${employeeId}`)
      .then((history) => {
        if (!mounted) return;
        setRows(history);
        setError('');
      })
      .catch((err) => {
        if (!mounted) return;
        console.error('[self-status]', err);
        setError(err.message);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [employeeId, lastStatus]);

  return (
    <main className="page-shell">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Employee view</p>
          <h1>My status today</h1>
        </div>
      </div>

      {error && <p className="error-box">{error}</p>}

      <section className="card">
        {loading ? (
          <p className="muted loading">Loading...</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Status</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={3}>No checks recorded today.</td>
                  </tr>
                )}
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>{new Date(row.checked_at).toLocaleTimeString()}</td>
                    <td><StatusBadge status={row.status} /></td>
                    <td>
                      {row.status === 'UNKNOWN_FACE'
                        ? `Manager alert sent at ${new Date(row.checked_at).toLocaleTimeString()}`
                        : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
