import React, { useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import EmployeeNavbar from './components/EmployeeNavbar.jsx';
import ManagerNavbar from './components/ManagerNavbar.jsx';
import VerificationIndicator from './components/VerificationIndicator.jsx';

import { useAuth } from './hooks/useAuth.js';
import { useAutoVerification } from './hooks/useAutoVerification.js';

import Landing from './pages/Landing.jsx';
import EmployeeLogin from './pages/auth/EmployeeLogin.jsx';
import ManagerLogin from './pages/auth/ManagerLogin.jsx';
import Enroll from './pages/employee/Enroll.jsx';
import MyStatus from './pages/employee/MyStatus.jsx';
import EmployeeSettings from './pages/employee/Settings.jsx';
import ManagerDashboard from './pages/manager/Dashboard.jsx';
import Alerts from './pages/manager/Alerts.jsx';
import Employees from './pages/manager/Employees.jsx';

import './index.css';

// ─── Protected Route ──────────────────────────────────────────────────────────

function ProtectedEmployeeRoute({ isAuthenticated, children }) {
  return isAuthenticated ? children : <Navigate to="/employee/login" replace />;
}

function ProtectedManagerRoute({ isAuthenticated, children }) {
  return isAuthenticated ? children : <Navigate to="/manager/login" replace />;
}

// ─── Employee Section ─────────────────────────────────────────────────────────

function EmployeeSection() {
  const { token, user, isAuthenticated, login, logout } = useAuth('employee');

  // DOM-attached hidden video element for auto-verification
  const verifyVideoRef = useRef(null);

  const { cameraActive, isChecking, lastStatus, runCheck } = useAutoVerification(
    user?.id,
    isAuthenticated,
    verifyVideoRef
  );

  return (
    <>
      {/* Hidden video for auto-verification — must always be in DOM */}
      {isAuthenticated && (
        <video
          ref={verifyVideoRef}
          style={{ display: 'none' }}
          autoPlay
          muted
          playsInline
          aria-hidden="true"
        />
      )}

      {isAuthenticated && (
        <EmployeeNavbar user={user} onLogout={logout} cameraActive={cameraActive || isChecking} />
      )}

      <Routes>
        <Route
          path="login"
          element={
            isAuthenticated
              ? <Navigate to="/employee/status" replace />
              : <EmployeeLogin onLogin={login} />
          }
        />
        <Route
          path="enroll"
          element={
            <ProtectedEmployeeRoute isAuthenticated={isAuthenticated}>
              <Enroll runCheck={runCheck} />
            </ProtectedEmployeeRoute>
          }
        />
        <Route
          path="status"
          element={
            <ProtectedEmployeeRoute isAuthenticated={isAuthenticated}>
              <MyStatus employeeId={user?.id} lastStatus={lastStatus} />
            </ProtectedEmployeeRoute>
          }
        />
        <Route
          path="settings"
          element={
            <ProtectedEmployeeRoute isAuthenticated={isAuthenticated}>
              <EmployeeSettings onLogout={logout} />
            </ProtectedEmployeeRoute>
          }
        />
        <Route path="*" element={<Navigate to={isAuthenticated ? '/employee/status' : '/employee/login'} replace />} />
      </Routes>

      <VerificationIndicator active={cameraActive || isChecking} />
    </>
  );
}

// ─── Manager Section ──────────────────────────────────────────────────────────

function ManagerSection() {
  const { token, user, isAuthenticated, login, logout } = useAuth('manager');

  return (
    <>
      {isAuthenticated && (
        <ManagerNavbar user={user} onLogout={logout} />
      )}

      <Routes>
        <Route
          path="login"
          element={
            isAuthenticated
              ? <Navigate to="/manager/dashboard" replace />
              : <ManagerLogin onLogin={login} />
          }
        />
        <Route
          path="dashboard"
          element={
            <ProtectedManagerRoute isAuthenticated={isAuthenticated}>
              <ManagerDashboard />
            </ProtectedManagerRoute>
          }
        />
        <Route
          path="alerts"
          element={
            <ProtectedManagerRoute isAuthenticated={isAuthenticated}>
              <Alerts />
            </ProtectedManagerRoute>
          }
        />
        <Route
          path="employees"
          element={
            <ProtectedManagerRoute isAuthenticated={isAuthenticated}>
              <Employees managerUser={user} />
            </ProtectedManagerRoute>
          }
        />
        <Route path="*" element={<Navigate to={isAuthenticated ? '/manager/dashboard' : '/manager/login'} replace />} />
      </Routes>
    </>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing */}
        <Route path="/" element={<Landing />} />

        {/* Employee section */}
        <Route path="/employee/*" element={<EmployeeSection />} />

        {/* Manager section */}
        <Route path="/manager/*" element={<ManagerSection />} />

        {/* Catch-all → landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
