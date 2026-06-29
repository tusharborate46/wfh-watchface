import { useEffect, useState } from 'react';
import EmployeeCard from '../../components/EmployeeCard.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import { mgrApi } from '../../utils/api.js';

function Metric({ label, value, tone }) {
  return (
    <div className={`metric metric-${tone}`}>
      <p>{label}</p>
      <strong>{value ?? 0}</strong>
    </div>
  );
}

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
    let intervalId;

    async function load() {
      try {
        const next = await mgrApi('/api/dashboard');
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
    }

    load();
    intervalId = setInterval(load, 60_000); // refresh every 60 seconds

    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, []);

  return (
    <main className="page-shell">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Manager dashboard</p>
          <h1>Team Verification Status</h1>
        </div>
        <p className="muted small">Refreshes every 60 seconds</p>
      </div>

      {error && <p className="error-box">{error}</p>}

      {loading ? (
        <p className="muted loading">Loading...</p>
      ) : (
        <>
          {/* Summary metrics */}
          <section className="metrics-grid">
            <Metric label="Verified" value={data.metrics.verified} tone="green" />
            <Metric label="Away / on break" value={data.metrics.away} tone="yellow" />
            <Metric label="Unknown face" value={data.metrics.unknown} tone="red" />
            <Metric label="Inactive" value={data.metrics.inactive} tone="gray" />
            <Metric label="Alerts today" value={data.metrics.alertsToday} tone="red" />
          </section>

          {/* Employee grid */}
          <section className="employee-grid">
            {data.employees.length === 0 && (
              <p className="muted">No employees found. Add employees in the Employees tab.</p>
            )}
            {data.employees.map((employee) => (
              <EmployeeCard key={employee.id} employee={employee} />
            ))}
          </section>

          {/* Activity log */}
          <section className="table-section">
            <h2>Activity Log</h2>
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
                  {data.activity.map((item) => (
                    <tr key={item.id}>
                      <td>{new Date(item.checked_at).toLocaleString()}</td>
                      <td>{item.name}</td>
                      <td><StatusBadge status={item.status} /></td>
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
