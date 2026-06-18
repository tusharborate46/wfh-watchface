import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom';
import Dashboard from './components/Dashboard.jsx';
import EnrollPage from './components/EnrollPage.jsx';
import LoginPage from './components/LoginPage.jsx';
import SelfView from './components/SelfView.jsx';
import Settings from './components/Settings.jsx';
import { useFaceVerification } from './hooks/useFaceVerification.js';
import './index.css';

function readSession() {
  return {
    token: localStorage.getItem('token') || '',
    employeeId: localStorage.getItem('employeeId') || '',
    role: localStorage.getItem('role') || ''
  };
}

function PrivateRoute({ children, token }) {
  return token ? children : <Navigate to="/login" replace />;
}

function App() {
  const [session, setSession] = useState(readSession);
  const monitoringEnabled = session.role === 'employee' && Boolean(session.token);
  const { cameraActive, isChecking, runCheck, lastStatus, message } = useFaceVerification(
    session.employeeId,
    monitoringEnabled
  );

  function handleLogin({ token, employee }) {
    localStorage.setItem('token', token);
    localStorage.setItem('employeeId', employee.id);
    localStorage.setItem('role', employee.role);
    setSession({ token, employeeId: employee.id, role: employee.role });
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('employeeId');
    localStorage.removeItem('role');
    setSession({ token: '', employeeId: '', role: '' });
  }

  const home = session.role === 'employee' ? '/me' : '/dashboard';

  return (
    <BrowserRouter>
      {session.token && (
        <nav className="app-nav">
          {session.role !== 'employee' && (
            <Link className="nav-link" to="/dashboard">Dashboard</Link>
          )}
          <Link className="nav-link" to="/enroll">Enroll</Link>
          <Link className="nav-link" to="/me">My Status</Link>
          <Link className="nav-link" to="/settings">Settings</Link>

          <div className="nav-actions">
            {session.role === 'employee' && (
              <button className="btn" id="run-check-btn" onClick={runCheck} disabled={isChecking} type="button">
                {isChecking ? 'Checking...' : 'Run privacy check'}
              </button>
            )}

            {cameraActive && (
              <span className="camera-indicator">
                <span />
                Camera active
              </span>
            )}

            {session.role === 'employee' && lastStatus && (
              <span className="last-status">Last: {lastStatus.replaceAll('_', ' ')}</span>
            )}

            <button className="link-button" id="logout-btn" onClick={logout} type="button">
              Logout
            </button>
          </div>
        </nav>
      )}

      {message && session.role === 'employee' && (
        <div className="mx-auto mt-4 max-w-4xl px-6">
          <p className="notice">{message}</p>
        </div>
      )}

      <Routes>
        <Route
          path="/login"
          element={session.token ? <Navigate to={home} replace /> : <LoginPage onLogin={handleLogin} />}
        />
        <Route path="/dashboard" element={<PrivateRoute token={session.token}><Dashboard /></PrivateRoute>} />
        <Route path="/enroll" element={<PrivateRoute token={session.token}><EnrollPage runCheck={runCheck} /></PrivateRoute>} />
        <Route path="/me" element={<PrivateRoute token={session.token}><SelfView employeeId={session.employeeId} lastStatus={lastStatus} /></PrivateRoute>} />
        <Route path="/settings" element={<PrivateRoute token={session.token}><Settings /></PrivateRoute>} />
        <Route path="*" element={<Navigate to={session.token ? home : '/login'} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
