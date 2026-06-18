import { useState } from 'react';
import { api } from '../utils/api.js';

export default function Settings() {
  const [msg, setMsg] = useState('');
  const [deleting, setDeleting] = useState(false);

  async function deleteEnrollment() {
    setDeleting(true);
    setMsg('');

    try {
      await api('/api/enrollment/me', { method: 'DELETE' });
      setMsg('Enrollment deleted. Future checks will remain inactive until you enroll again.');
    } catch (err) {
      console.error('[settings]', err);
      setMsg(err.message || 'Unable to delete enrollment.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <main className="page-shell narrow">
      <section className="card">
        <p className="eyebrow">Privacy settings</p>
        <h1>Enrollment data</h1>
        <p className="muted">
          Delete your face enrollment at any time. This removes the encrypted numeric embedding used
          for verification; the system never stores photos or videos.
        </p>
        <button className="danger-btn" disabled={deleting} onClick={deleteEnrollment} type="button">
          {deleting ? 'Deleting...' : 'Delete enrollment'}
        </button>
        {msg && <p className="notice">{msg}</p>}
      </section>
    </main>
  );
}
