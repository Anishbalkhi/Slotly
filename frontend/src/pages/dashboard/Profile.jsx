import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import {
  HiOutlineUser,
  HiOutlineMail,
  HiOutlineCalendar,
  HiOutlineBadgeCheck,
  HiOutlinePencil,
  HiOutlineCheck,
  HiOutlineX,
} from 'react-icons/hi';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });
  const [stats, setStats] = useState({ total: 0, upcoming: 0, cancelled: 0 });

  // Fetch appointment stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/appointments');
        const appointments = res.data.data;
        const now = new Date();
        setStats({
          total: appointments.length,
          upcoming: appointments.filter(
            (a) => a.status === 'confirmed' && new Date(a.start) >= now
          ).length,
          cancelled: appointments.filter((a) => a.status === 'cancelled').length,
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };
    fetchStats();
  }, []);

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }
    setSaving(true);
    try {
      const res = await api.put('/users/me', formData);
      if (updateUser) updateUser(res.data.data);
      toast.success('Profile updated');
      setEditing(false);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({ name: user?.name || '', email: user?.email || '' });
    setEditing(false);
  };

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-IN', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : 'N/A';

  return (
    <div className="page-container animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Profile</h1>
        <p className="text-surface-400">View and manage your personal information.</p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Profile Card */}
        <div className="glass-card overflow-hidden">
          {/* Banner */}
          <div className="h-24 bg-gradient-to-r from-primary-600/30 via-purple-600/20 to-primary-600/30 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-surface-800/80 to-transparent" />
          </div>

          <div className="px-6 pb-6 -mt-8 relative">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl shadow-glow mb-4">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>

            <div className="flex items-start justify-between">
              <div>
                {editing ? (
                  <div className="space-y-3 mb-3">
                    <div>
                      <label className="input-label">Name</label>
                      <input
                        type="text"
                        className="input-field"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="input-label">Email</label>
                      <input
                        type="email"
                        className="input-field"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <h2 className="text-2xl font-bold text-white mb-1">{user?.name}</h2>
                    <div className="flex items-center gap-2 text-sm text-surface-400 mb-1">
                      <HiOutlineMail className="w-4 h-4" />
                      {user?.email}
                    </div>
                  </>
                )}
                <div className="flex items-center gap-3 mt-2">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                    user?.role === 'owner'
                      ? 'bg-primary-500/15 text-primary-400'
                      : 'bg-teal-500/15 text-teal-400'
                  }`}>
                    <HiOutlineBadgeCheck className="w-3.5 h-3.5 inline mr-1" />
                    {user?.role === 'owner' ? 'Business Owner' : 'Customer'}
                  </span>
                  <span className="text-xs text-surface-500 flex items-center gap-1">
                    <HiOutlineCalendar className="w-3.5 h-3.5" />
                    Joined {memberSince}
                  </span>
                </div>
              </div>

              {/* Edit Buttons */}
              <div className="flex gap-2">
                {editing ? (
                  <>
                    <button onClick={handleSave} disabled={saving} className="btn-primary text-sm !py-2 !px-3">
                      <HiOutlineCheck className="w-4 h-4" />
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button onClick={handleCancel} className="btn-ghost text-sm !py-2 !px-3">
                      <HiOutlineX className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <button onClick={() => setEditing(true)} className="btn-secondary text-sm !py-2 !px-3">
                    <HiOutlinePencil className="w-4 h-4" />
                    Edit
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="stat-card text-center">
            <p className="text-2xl font-bold text-white">{stats.total}</p>
            <p className="text-xs text-surface-400">Total Bookings</p>
          </div>
          <div className="stat-card text-center">
            <p className="text-2xl font-bold text-emerald-400">{stats.upcoming}</p>
            <p className="text-xs text-surface-400">Upcoming</p>
          </div>
          <div className="stat-card text-center">
            <p className="text-2xl font-bold text-red-400">{stats.cancelled}</p>
            <p className="text-xs text-surface-400">Cancelled</p>
          </div>
        </div>

        {/* Account Info */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Account Information</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-surface-800/50 rounded-xl">
              <span className="text-sm text-surface-400">User ID</span>
              <span className="text-sm text-surface-200 font-mono">{user?._id?.slice(-8)}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-surface-800/50 rounded-xl">
              <span className="text-sm text-surface-400">Email Notifications</span>
              <span className={`text-sm font-medium ${user?.emailNotifications !== false ? 'text-emerald-400' : 'text-surface-500'}`}>
                {user?.emailNotifications !== false ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-surface-800/50 rounded-xl">
              <span className="text-sm text-surface-400">Account Type</span>
              <span className="text-sm text-surface-200 capitalize">{user?.role}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
