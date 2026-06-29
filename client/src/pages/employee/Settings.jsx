import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { empApi } from '../../utils/api.js';

export default function Settings({ onLogout }) {
  const [deleting, setDeleting] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPw, setChangingPw] = useState(false);
  const [pwMsg, setPwMsg] = useState('');
  const [pwError, setPwError] = useState('');

  const navigate = useNavigate();

  async function handleDeleteEnrollment() {
    if (!window.confirm('Delete your face enrollment? You will need to re-enroll to use verification.')) return;
    setDeleting(true);
    setDeleteMsg('');
    try {
      await empApi('/api/enrollment/me', { method: 'DELETE' });
      setDeleteMsg('Enrollment deleted. Future checks will remain inactive until you enroll again.');
    } catch (err) {
      console.error('[settings]', err);
      setDeleteMsg(err.message || 'Unable to delete enrollment.');
    } finally {
      setDeleting(false);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setPwError('');
    setPwMsg('');

    if (newPassword !== confirmPassword) {
      setPwError('New passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setPwError('New password must be at least 8 characters.');
      return;
    }

    setChangingPw(true);
    try {
      await empApi('/api/auth/employee/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword })
      });
      setPwMsg('Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPwError(err.message || 'Failed to change password.');
    } finally {
      setChangingPw(false);
    }
  }

  function handleLogout() {
    onLogout();
    navigate('/employee/login', { replace: true });
  }

  return (
    <main className="page-shell narrow">
      {/* Enrollment section */}
      <section className="card">
        <p className="eyebrow">Privacy settings</p>
        <h1>Enrollment Data</h1>
        <p className="muted mt-2">
          Delete your face enrollment at any time. This removes the encrypted numeric embedding
          used for verification — no photos or videos are ever stored.
        </p>
        <button
          className="danger-btn"
          disabled={deleting}
          onClick={handleDeleteEnrollment}
          type="button"
          id="delete-enrollment-btn"
        >
          {deleting ? 'Deleting...' : 'Delete enrollment'}
        </button>
        {deleteMsg && <p className="notice mt-3">{deleteMsg}</p>}
      </section>

      {/* Change password section */}
      <section className="card mt-6">
        <h2>Change Password</h2>
        <p className="muted mt-1">Update your account password.</p>

        {pwError && <p className="error-box">{pwError}</p>}
        {pwMsg && <p className="notice">{pwMsg}</p>}

        <form onSubmit={handleChangePassword} className="form-stack">
          <label className="field">
            <span>Current Password</span>
            <input
              id="current-password"
              className="input"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </label>
          <label className="field">
            <span>New Password</span>
            <input
              id="new-password"
              className="input"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              autoComplete="new-password"
              minLength={8}
            />
          </label>
          <label className="field">
            <span>Confirm New Password</span>
            <input
              id="confirm-password"
              className="input"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </label>
          <button className="btn" type="submit" disabled={changingPw} id="change-password-btn">
            {changingPw ? 'Updating...' : 'Update password'}
          </button>
        </form>
      </section>

      {/* Logout section */}
      <section className="card mt-6">
        <h2>Session</h2>
        <p className="muted mt-1">Sign out of your employee account on this device.</p>
        <button
          className="danger-btn"
          onClick={handleLogout}
          type="button"
          id="settings-logout-btn"
        >
          Logout
        </button>
      </section>
    </main>
  );
}
