import { useState } from 'react';
import { api } from '../utils/api';

export default function Settings() {
  const [msg, setMsg] = useState('');
  const [deleting, setDeleting] = useState(false);

  async function deleteEnrollment() {
    setDeleting(true);
    setMsg('');
    try {
      const response = await api('/api/enrollment/me', { method: 'DELETE' });
      setMsg(response.ok ? 'Enrollment deleted.' : 'Delete request completed.');
    } catch (err) {
      console.error(err);
      setMsg(err.message || 'Unable to delete enrollment.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <main className="p-8">
      <div className="card max-w-xl">
        <h1 className="text-3xl font-black">Privacy settings</h1>
        <p className="my-4 text-slate-300">Delete your enrollment embedding at any time. This removes the encrypted vector used for verification.</p>
        <button className="btn bg-red-500 text-white hover:bg-red-400" disabled={deleting} onClick={deleteEnrollment} type="button">
          {deleting ? 'Deleting…' : 'Delete enrollment'}
        </button>
        {msg && <p className="mt-4">{msg}</p>}
      </div>
    </main>
  );
}
