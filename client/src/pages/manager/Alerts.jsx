import { useEffect, useState } from 'react';
import { mgrApi } from '../../utils/api.js';

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [acknowledging, setAcknowledging] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const data = await mgrApi('/api/manager/alerts');
        if (mounted) {
          setAlerts(data);
          setError('');
        }
      } catch (err) {
        if (mounted) setError(err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  async function handleAcknowledge(alertId) {
    setAcknowledging(alertId);
    try {
      await mgrApi(`/api/manager/alerts/${alertId}`, { method: 'PATCH' });
      setAlerts((prev) =>
        prev.map((a) =>
          a.id === alertId
            ? { ...a, acknowledged: true, acknowledged_at: new Date().toISOString() }
            : a
        )
      );
    } catch (err) {
      console.error('[alerts]', err);
      setError(err.message);
    } finally {
      setAcknowledging(null);
    }
  }

  const unacknowledged = alerts.filter((a) => !a.acknowledged);
  const acknowledged = alerts.filter((a) => a.acknowledged);

  return (
    <main className="page-shell">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Manager alerts</p>
          <h1>Alert History</h1>
        </div>
        <div className="flex items-center gap-3">
          {unacknowledged.length > 0 && (
            <span className="rounded-full bg-red-500/15 px-3 py-1 text-xs font-bold text-red-300">
              {unacknowledged.length} unacknowledged
            </span>
          )}
        </div>
      </div>

      {error && <p className="error-box">{error}</p>}

      {loading ? (
        <p className="muted loading">Loading alerts...</p>
      ) : (
        <section className="card">
          {alerts.length === 0 ? (
            <p className="muted">No unknown-face alerts recorded. Great job!</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Employee</th>
                    <th>Department</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Unacknowledged first */}
                  {[...unacknowledged, ...acknowledged].map((alert) => (
                    <tr
                      key={alert.id}
                      className={alert.acknowledged ? 'opacity-50' : ''}
                    >
                      <td>{new Date(alert.triggered_at).toLocaleString()}</td>
                      <td className="font-semibold text-zinc-200">{alert.employee_name}</td>
                      <td>{alert.department || '—'}</td>
                      <td>
                        {alert.acknowledged ? (
                          <span className="text-xs text-zinc-500">
                            Acknowledged {new Date(alert.acknowledged_at).toLocaleTimeString()}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-300">
                            <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
                            Unknown face
                          </span>
                        )}
                      </td>
                      <td>
                        {!alert.acknowledged && (
                          <button
                            className="btn text-xs px-3 py-1.5"
                            disabled={acknowledging === alert.id}
                            onClick={() => handleAcknowledge(alert.id)}
                            type="button"
                            id={`acknowledge-${alert.id}`}
                          >
                            {acknowledging === alert.id ? 'Acknowledging...' : 'Acknowledge'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
