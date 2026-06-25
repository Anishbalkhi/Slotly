import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useAuth } from '../../context/AuthContext';

/**
 * DashboardLayout — includes sidebar for authenticated dashboard pages.
 */
export const DashboardLayout = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-surface-950">
      <Navbar />
      <div className="flex">
        {isAuthenticated && <Sidebar />}
        <main className="flex-1 min-h-[calc(100vh-64px)] overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

/**
 * PublicLayout — no sidebar, just navbar and content.
 */
export const PublicLayout = () => {
  return (
    <div className="min-h-screen bg-surface-950">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
};

/**
 * AuthLayout — clean layout for login/signup pages (no navbar).
 */
export const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center p-4">
      <Outlet />
    </div>
  );
};
