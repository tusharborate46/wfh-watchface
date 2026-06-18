import { useEffect, useState } from 'react';
import { api } from '../utils/api.js';
import EmployeeCard from './EmployeeCard.jsx';
import StatusBadge from './StatusBadge.jsx';

export default function Dashboard() {
  const [data, setData] = useState({
    employees: [],
    activity: [],
    metrics: { verified: 0, away: 0, unknown: 0, inactive: 0, alertsToday: 0 }
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const next = await api('/api/dashboard');
        if (!mounted) return;
        setData(next);
        setError('');
      } catch (err) {
        if (!mounted) return;
        console.error('[dashboard]', err);
        setError(err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    const id = setInterval(load, 5000);

    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  return (
    <main className="page-shell">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Manager dashboard</p>
          <h1>Team verification status</h1>
        </div>
        <p className="muted small">Refreshes every 5 seconds</p>
      </div>

      {error && <p className="error-box">{error}</p>}

      {loading ? (
        <p className="muted loading">Loading...</p>
      ) : (
        <>
          <section className="metrics-grid">
            <Metric label="Verified" value={data.metrics.verified} tone="green" />
            <Metric label="Away / on break" value={data.metrics.away} tone="yellow" />
            <Metric label="Unknown face" value={data.metrics.unknown} tone="red" />
            <Metric label="Inactive" value={data.metrics.inactive} tone="gray" />
            <Metric label="Alerts today" value={data.metrics.alertsToday} tone="red" />
          </section>

          <section className="employee-grid">
            {data.employees.length === 0 && <p className="muted">No employees found.</p>}
            {data.employees.map((employee) => (
              <EmployeeCard key={employee.id} employee={employee} />
            ))}
          </section>

          <section className="table-section">
            <h2>Activity log</h2>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Employee</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.activity.length === 0 && (
                    <tr>
                      <td colSpan={3}>No activity recorded today.</td>
                    </tr>
                  )}
                  {data.activity.map((activity) => (
                    <tr key={activity.id}>
                      <td>{new Date(activity.checked_at).toLocaleString()}</td>
                      <td>{activity.name}</td>
                      <td><StatusBadge status={activity.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </main>
  );
}

function Metric({ label, value, tone }) {
  return (
    <div className={`metric metric-${tone}`}>
      <p>{label}</p>
      <strong>{value ?? 0}</strong>
    </div>
  );
}
