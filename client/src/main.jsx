import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom';
import './index.css';
import Dashboard from './components/Dashboard.jsx';
import EnrollPage from './components/EnrollPage.jsx';
import SelfView from './components/SelfView.jsx';
import Settings from './components/Settings.jsx';
import { useFaceVerification } from './hooks/useFaceVerification';

function App() {
  const employeeId = localStorage.getItem('employeeId') || '00000000-0000-0000-0000-000000000001';
  const { cameraActive, runCheck, lastStatus } = useFaceVerification(employeeId, Boolean(localStorage.getItem('token')));

  return (
    <BrowserRouter>
      <nav className="flex gap-4 border-b border-slate-800 p-4">
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/enroll">Enroll</Link>
        <Link to="/me">Self view</Link>
        <Link to="/settings">Settings</Link>
        <button className="btn ml-auto" onClick={runCheck} type="button">Run privacy check</button>
        {cameraActive && (
          <span className="flex items-center gap-2 text-red-300">
            <i className="h-3 w-3 rounded-full bg-red-500" />
            Camera active
          </span>
        )}
        {lastStatus && <span>{lastStatus}</span>}
      </nav>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/enroll" element={<EnrollPage />} />
        <Route path="/me" element={<SelfView employeeId={employeeId} />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
