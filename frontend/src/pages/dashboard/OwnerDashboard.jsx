import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import {
  HiOutlineBriefcase,
  HiOutlineClipboardList,
  HiOutlineCalendar,
  HiOutlinePlusCircle,
  HiOutlineClock,
  HiOutlineUser,
  HiOutlineCurrencyRupee,
  HiOutlineChartBar,
} from 'react-icons/hi';

const OwnerDashboard = () => {
  const { user } = useAuth();
  const [businesses, setBusinesses] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bizRes, apptRes] = await Promise.all([
          api.get('/businesses/user/mine'),
          api.get('/appointments?status=confirmed'),
        ]);
        setBusinesses(bizRes.data.data);
        setAppointments(apptRes.data.data);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalServices = businesses.reduce(
    (acc, biz) => acc + (biz.services?.length || 0), 0
  );

  const now = new Date();
  const upcoming = appointments.filter((a) => new Date(a.start) >= now);
  const estimatedRevenue = appointments.reduce(
    (sum, a) => sum + (a.serviceId?.price || 0), 0
  );

  // Today's appointments
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);
  const todayAppts = upcoming.filter((a) => {
    const d = new Date(a.start);
    return d >= todayStart && d <= todayEnd;
  });

  const formatTime = (isoStr) => {
    return new Date(isoStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="space-y-6">
          <div className="skeleton h-10 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-32 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Welcome back, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-surface-400">
          Here's an overview of your business activity.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <p className="text-sm text-surface-400">Businesses</p>
            <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center">
              <HiOutlineBriefcase className="w-5 h-5 text-primary-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white">{businesses.length}</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <p className="text-sm text-surface-400">Services</p>
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center">
              <HiOutlineClipboardList className="w-5 h-5 text-teal-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white">{totalServices}</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <p className="text-sm text-surface-400">Upcoming</p>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <HiOutlineCalendar className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white">{upcoming.length}</p>
          <p className="text-xs text-surface-500">Appointments</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <p className="text-sm text-surface-400">Today</p>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <HiOutlineClock className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white">{todayAppts.length}</p>
          <p className="text-xs text-surface-500">Appointments today</p>
        </div>

        <Link to="/dashboard/analytics" className="stat-card hover:border-primary-500/30 transition-all group">
          <div className="flex items-center justify-between">
            <p className="text-sm text-surface-400">Revenue</p>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <HiOutlineChartBar className="w-5 h-5 text-purple-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white">₹{estimatedRevenue.toLocaleString()}</p>
          <p className="text-xs text-primary-400 group-hover:text-primary-300">View Analytics →</p>
        </Link>
      </div>

      {/* Today's Schedule */}
      {todayAppts.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Today's Schedule</h2>
            <Link to="/dashboard/calendar" className="btn-ghost text-sm text-primary-400">
              View Calendar →
            </Link>
          </div>
          <div className="space-y-3">
            {todayAppts.map((appt) => (
              <div key={appt._id} className="glass-card p-4 flex items-center gap-4 hover:border-primary-500/20 transition-all">
                <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center flex-shrink-0">
                  <HiOutlineClock className="w-6 h-6 text-primary-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">
                    {appt.serviceId?.name || 'Service'}
                  </p>
                  <div className="flex items-center gap-3 text-sm text-surface-400">
                    <span className="flex items-center gap-1">
                      <HiOutlineUser className="w-3.5 h-3.5" />
                      {appt.customerId?.name || 'Customer'}
                    </span>
                    <span>{formatTime(appt.start)} – {formatTime(appt.end)}</span>
                  </div>
                </div>
                <span className="flex items-center gap-1 text-sm text-surface-400 flex-shrink-0">
                  <HiOutlineCurrencyRupee className="w-4 h-4" />
                  ₹{appt.serviceId?.price || 0}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Businesses List or Empty State */}
      {businesses.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary-500/10 flex items-center justify-center mx-auto mb-4">
            <HiOutlineBriefcase className="w-8 h-8 text-primary-400" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">No business yet</h2>
          <p className="text-surface-400 mb-6 max-w-sm mx-auto">
            Set up your business profile to start accepting bookings from customers.
          </p>
          <Link to="/dashboard/business" className="btn-primary">
            <HiOutlinePlusCircle className="w-5 h-5" />
            Create Business
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Your Businesses</h2>
            <Link to="/dashboard/business" className="btn-ghost text-sm text-primary-400">
              <HiOutlinePlusCircle className="w-4 h-4" />
              Add New
            </Link>
          </div>
          <div className="grid gap-4">
            {businesses.map((biz) => (
              <div key={biz._id} className="glass-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-primary-500/30 transition-all duration-200">
                <div>
                  <h3 className="text-lg font-semibold text-white">{biz.name}</h3>
                  <p className="text-sm text-surface-400 mt-1">
                    {biz.category} · {biz.services?.length || 0} services · {biz.timezone}
                  </p>
                  {biz.address?.city && (
                    <p className="text-xs text-surface-500 mt-1">📍 {biz.address.city}{biz.address.state ? `, ${biz.address.state}` : ''}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Link to={`/dashboard/services?business=${biz._id}`} className="btn-secondary text-sm !py-2 !px-4">
                    Services
                  </Link>
                  <Link to={`/business/${biz._id}`} className="btn-ghost text-sm">
                    View Page
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerDashboard;
