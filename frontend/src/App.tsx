import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import VerifyEmail from './pages/VerifyEmail';
import RemoteCamera from './pages/RemoteCamera';
import AppLayout from './layouts/AppLayout';
import Monitor from './pages/dashboard/Monitor';
import AlertsLog from './pages/dashboard/AlertsLog';
import Analytics from './pages/dashboard/Analytics';
import WatchlistPage from './pages/dashboard/WatchlistPage';
import SettingsPage from './pages/dashboard/SettingsPage';
import SystemHealth from './pages/dashboard/SystemHealth';
import UsersPage from './pages/dashboard/UsersPage';

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/verify" element={<VerifyEmail />} />
        <Route path="/remote-camera" element={<RemoteCamera />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Monitor />} />
          <Route path="alerts" element={<AlertsLog />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="watchlist" element={<WatchlistPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="system" element={<SystemHealth />} />
          <Route path="users" element={<UsersPage />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
