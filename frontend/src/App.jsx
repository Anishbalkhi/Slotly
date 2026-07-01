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
import BookingPage from './pages/booking/BookingPage';
import Calendar from './pages/dashboard/Calendar';
import StaffManagement from './pages/dashboard/StaffManagement';
import Analytics from './pages/dashboard/Analytics';
import Settings from './pages/dashboard/Settings';
import Profile from './pages/dashboard/Profile';

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
        <Route path="/book/:businessId/:serviceId" element={<BookingPage />} />
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
        <Route
          path="/dashboard/calendar"
          element={
            <ProtectedRoute roles={['owner']}>
              <Calendar />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/staff"
          element={
            <ProtectedRoute roles={['owner']}>
              <StaffManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/analytics"
          element={
            <ProtectedRoute roles={['owner']}>
              <Analytics />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/profile"
          element={
            <ProtectedRoute>
              <Profile />
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
