import { useEffect, useState } from 'react';
import { api } from '../utils/api';
import StatusBadge from './StatusBadge.jsx';

export default function SelfView({ employeeId }) {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api(`/api/status/${employeeId}`)
      .then((history) => {
        setRows(history);
        setError('');
      })
      .catch((err) => {
        console.error(err);
        setError(err.message);
      });
  }, [employeeId]);

  return (
    <main className="p-8">
      <h1 className="text-3xl font-black">My status today</h1>
      {error && <p className="mt-4 rounded-lg bg-red-500/20 p-3 text-red-200">{error}</p>}
      <div className="mt-5 card">
        <table className="w-full">
          <tbody>
            {rows.map((row) => (
              <tr className="border-t border-slate-800" key={row.id}>
                <td className="p-3">{new Date(row.checked_at).toLocaleTimeString()}</td>
                <td><StatusBadge status={row.status} /></td>
                <td>
                  {row.status === 'UNKNOWN_FACE'
                    ? `An unrecognized face was detected at ${new Date(row.checked_at).toLocaleTimeString()}`
                    : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
