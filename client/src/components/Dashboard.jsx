import { useEffect, useState } from 'react';
import { api } from '../utils/api';
import EmployeeCard from './EmployeeCard.jsx';
import StatusBadge from './StatusBadge.jsx';

export default function Dashboard() {
  const [data, setData] = useState({ employees: [], activity: [], metrics: {} });
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setData(await api('/api/dashboard'));
        setError('');
      } catch (err) {
        console.error(err);
        setError(err.message);
      }
    };

    load();
    const id = setInterval(load, 60000);
    return () => clearInterval(id);
  }, []);

  return (
    <main className="p-8">
      <h1 className="text-3xl font-black">Manager Dashboard</h1>
      {error && <p className="mt-4 rounded-lg bg-red-500/20 p-3 text-red-200">{error}</p>}
      <section className="my-6 grid gap-4 md:grid-cols-3">
        {[
          ['Verified', data.metrics.verified],
          ['On break', data.metrics.away],
          ['Alerts today', data.metrics.alertsToday]
        ].map(([label, value]) => (
          <div className="card" key={label}>
            <p className="text-slate-400">{label}</p>
            <p className="text-4xl font-black">{value || 0}</p>
          </div>
        ))}
      </section>
      <section className="grid gap-4 md:grid-cols-3">
        {data.employees.map((employee) => (
          <EmployeeCard key={employee.id} employee={employee} />
        ))}
      </section>
      <h2 className="mt-8 text-xl font-bold">Activity log</h2>
      <table className="mt-3 w-full overflow-hidden rounded-xl bg-slate-900">
        <tbody>
          {data.activity.map((activity) => (
            <tr className="border-t border-slate-800" key={activity.id}>
              <td className="p-3">{new Date(activity.checked_at).toLocaleString()}</td>
              <td>{activity.name}</td>
              <td><StatusBadge status={activity.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
