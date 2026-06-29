import { useEffect, useState } from 'react';
import StatusBadge from '../../components/StatusBadge.jsx';
import { empApi } from '../../utils/api.js';

export default function MyStatus({ employeeId, lastStatus }) {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!employeeId) return undefined;

    let mounted = true;
    let intervalId;

    async function load() {
      try {
        const history = await empApi(`/api/status/${employeeId}`);
        if (!mounted) return;
        setRows(history);
        setError('');
      } catch (err) {
        if (!mounted) return;
        console.error('[my-status]', err);
        setError(err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    intervalId = setInterval(load, 60_000); // refresh every 60 seconds

    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, [employeeId, lastStatus]);

  const currentStatus = rows[0]?.status || lastStatus || null;

  return (
    <main className="page-shell">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Employee view</p>
          <h1>My Status Today</h1>
        </div>
        <p className="muted small">Auto-refreshes every 60 seconds</p>
      </div>

      {/* Current status badge */}
      {currentStatus && (
        <div className="mb-6 flex items-center gap-3">
          <span className="text-sm font-semibold text-zinc-400">Current status:</span>
          <StatusBadge status={currentStatus} />
        </div>
      )}

      {error && <p className="error-box">{error}</p>}

      <section className="card">
        <h2 className="mb-4">Verification History</h2>
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
                    <td colSpan={3}>No checks recorded today. Auto-verification runs every 5 minutes.</td>
                  </tr>
                )}
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>{new Date(row.checked_at).toLocaleTimeString()}</td>
                    <td><StatusBadge status={row.status} /></td>
                    <td className="text-zinc-500">
                      {row.status === 'UNKNOWN_FACE'
                        ? 'Manager alert sent'
                        : row.status === 'CAMERA_ERROR'
                        ? 'Camera was unavailable'
                        : '—'}
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
