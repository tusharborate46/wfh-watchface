import { useEffect, useState } from 'react';
import StatusBadge from '../../components/StatusBadge.jsx';
import { mgrApi } from '../../utils/api.js';

function AddEmployeeModal({ onClose, onAdded, managerUser }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    employee_code: '',
    password: '',
    department: managerUser?.department || ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await mgrApi('/api/auth/employee/register', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          employee_code: form.employee_code.trim().toUpperCase(),
          password: form.password,
          department: form.department.trim() || undefined,
          // manager_code not needed when using manager token — handled server-side
          manager_code: managerUser?.manager_code
        })
      });
      onAdded();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to add employee.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div className="card w-full max-w-md">
        <div className="section-heading">
          <h2>Add Employee</h2>
          <button onClick={onClose} type="button" className="link-button text-lg leading-none">×</button>
        </div>

        {error && <p className="error-box">{error}</p>}

        <form onSubmit={handleSubmit} className="form-stack">
          <label className="field">
            <span>Full Name</span>
            <input id="add-emp-name" className="input" type="text" required value={form.name} onChange={(e) => setField('name', e.target.value)} />
          </label>
          <label className="field">
            <span>Email</span>
            <input id="add-emp-email" className="input" type="email" required value={form.email} onChange={(e) => setField('email', e.target.value)} />
          </label>
          <label className="field">
            <span>Employee Code (e.g. EMP002)</span>
            <input id="add-emp-code" className="input" type="text" required value={form.employee_code} onChange={(e) => setField('employee_code', e.target.value)} placeholder="EMP002" />
          </label>
          <label className="field">
            <span>Initial Password</span>
            <input id="add-emp-password" className="input" type="password" required minLength={8} value={form.password} onChange={(e) => setField('password', e.target.value)} />
          </label>
          <label className="field">
            <span>Department</span>
            <input id="add-emp-dept" className="input" type="text" value={form.department} onChange={(e) => setField('department', e.target.value)} />
          </label>
          <div className="flex gap-3">
            <button className="btn flex-1" type="submit" disabled={loading} id="add-emp-submit">
              {loading ? 'Adding...' : 'Add Employee'}
            </button>
            <button className="link-button" type="button" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Employees({ managerUser }) {
  const [employees, setEmployees] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  async function load() {
    try {
      const data = await mgrApi('/api/manager/employees');
      setEmployees(data);
      setError('');
    } catch (err) {
      console.error('[employees]', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <main className="page-shell">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Team management</p>
          <h1>Employees</h1>
        </div>
        <button
          className="btn"
          onClick={() => setShowModal(true)}
          type="button"
          id="add-employee-btn"
        >
          + Add Employee
        </button>
      </div>

      {error && <p className="error-box">{error}</p>}

      {loading ? (
        <p className="muted loading">Loading employees...</p>
      ) : (
        <section className="card">
          {employees.length === 0 ? (
            <p className="muted">No employees yet. Click "Add Employee" to get started.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Employee Code</th>
                    <th>Department</th>
                    <th>Enrolled</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp) => (
                    <tr key={emp.id}>
                      <td className="font-semibold text-zinc-200">{emp.name}</td>
                      <td>
                        <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-emerald-400">
                          {emp.employee_code}
                        </code>
                      </td>
                      <td>{emp.department || '—'}</td>
                      <td>
                        {emp.enrolled ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-300">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Yes
                          </span>
                        ) : (
                          <span className="text-xs text-zinc-500">Not enrolled</span>
                        )}
                      </td>
                      <td className="text-zinc-500">
                        {new Date(emp.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {showModal && (
        <AddEmployeeModal
          managerUser={managerUser}
          onClose={() => setShowModal(false)}
          onAdded={load}
        />
      )}
    </main>
  );
}
