import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Layouts
import { DashboardLayout, PublicLayout, AuthLayout } from './components/layout/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Browse from './pages/Browse';
import OwnerDashboard from './pages/dashboard/OwnerDashboard';
import CustomerDashboard from './pages/customer/CustomerDashboard';
import BusinessSetup from './pages/business/BusinessSetup';
import BusinessPublic from './pages/business/BusinessPublic';
import ServiceManagement from './pages/business/ServiceManagement';

/**
 * Smart dashboard redirect based on user role.
 */
const DashboardRedirect = () => {
  const { isOwner } = useAuth();
  return isOwner ? <OwnerDashboard /> : <CustomerDashboard />;
};

const App = () => {
  return (
    <Routes>
      {/* Auth Pages (no navbar) */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Route>

      {/* Public Pages (with navbar, no sidebar) */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/browse" element={<Browse />} />
        <Route path="/business/:id" element={<BusinessPublic />} />
      </Route>

      {/* Dashboard Pages (with navbar + sidebar) */}
      <Route element={<DashboardLayout />}>
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardRedirect />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/business"
          element={
            <ProtectedRoute roles={['owner']}>
              <BusinessSetup />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/services"
          element={
            <ProtectedRoute roles={['owner']}>
              <ServiceManagement />
            </ProtectedRoute>
          }
        />
        {/* Placeholder routes for future pages */}
        <Route
          path="/dashboard/calendar"
          element={
            <ProtectedRoute roles={['owner']}>
              <div className="page-container">
                <h1 className="text-3xl font-bold text-white mb-4">Calendar</h1>
                <div className="glass-card p-12 text-center">
                  <p className="text-surface-400">Calendar view coming in Week 2!</p>
                </div>
              </div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/settings"
          element={
            <ProtectedRoute>
              <div className="page-container">
                <h1 className="text-3xl font-bold text-white mb-4">Settings</h1>
                <div className="glass-card p-12 text-center">
                  <p className="text-surface-400">Settings page coming soon!</p>
                </div>
              </div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/profile"
          element={
            <ProtectedRoute>
              <div className="page-container">
                <h1 className="text-3xl font-bold text-white mb-4">Profile</h1>
                <div className="glass-card p-12 text-center">
                  <p className="text-surface-400">Profile page coming soon!</p>
                </div>
              </div>
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
