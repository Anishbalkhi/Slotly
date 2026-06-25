import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { HiOutlineBriefcase, HiOutlineClipboardList, HiOutlineCalendar, HiOutlinePlusCircle } from 'react-icons/hi';

const OwnerDashboard = () => {
  const { user } = useAuth();
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        const res = await api.get('/businesses/user/mine');
        setBusinesses(res.data.data);
      } catch (error) {
        console.error('Failed to fetch businesses:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBusinesses();
  }, []);

  const totalServices = businesses.reduce(
    (acc, biz) => acc + (biz.services?.length || 0), 0
  );

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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
          <p className="text-3xl font-bold text-white">0</p>
          <p className="text-xs text-surface-500">Appointments</p>
        </div>
      </div>

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
