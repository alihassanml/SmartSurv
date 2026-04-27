import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
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
import CamerasPage from './pages/dashboard/CamerasPage';
import OrganizationFeed from './pages/dashboard/OrganizationFeed';
import OrganizationControls from './pages/dashboard/OrganizationControls';

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

const AnimatedRoutes = () => {
  const location = useLocation();
  // Don't animate nested routes here, they are handled inside AppLayout
  // We only want to animate transitions between top-level pages and the dashboard root
  const isDashboard = location.pathname.startsWith('/dashboard');

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={isDashboard ? 'dashboard' : location.pathname}>
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
          <Route path="cameras" element={<CamerasPage />} />
          <Route path="system" element={<SystemHealth />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="organization" element={<OrganizationFeed />} />
          <Route path="organization-controls" element={<OrganizationControls />} />
        </Route>
      </Routes>
    </AnimatePresence>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AnimatedRoutes />
    </Router>
  );
};

export default App;
