import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { HiOutlineCalendar, HiOutlineSearch } from 'react-icons/hi';

const CustomerDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="page-container animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Hi, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-surface-400">
          Manage your upcoming appointments and browse businesses.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-2 gap-6 mb-8">
        <Link to="/browse" className="glass-card p-6 group hover:border-primary-500/30 transition-all hover:-translate-y-1">
          <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <HiOutlineSearch className="w-6 h-6 text-primary-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-1">Browse Businesses</h3>
          <p className="text-sm text-surface-400">Find services near you and book an appointment.</p>
        </Link>

        <div className="glass-card p-6">
          <div className="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center mb-4">
            <HiOutlineCalendar className="w-6 h-6 text-teal-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-1">My Bookings</h3>
          <p className="text-sm text-surface-400">No upcoming bookings. Browse businesses to make your first one!</p>
        </div>
      </div>

      {/* Upcoming Bookings placeholder */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Upcoming Appointments</h2>
        <div className="glass-card p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-surface-800 flex items-center justify-center mx-auto mb-4">
            <HiOutlineCalendar className="w-8 h-8 text-surface-600" />
          </div>
          <p className="text-surface-500 mb-4">No upcoming appointments</p>
          <Link to="/browse" className="btn-primary text-sm">
            Find a Business
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;
