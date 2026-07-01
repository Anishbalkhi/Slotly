import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import {
  HiOutlineLockClosed,
  HiOutlineTrash,
  HiOutlineBell,
  HiOutlineShieldCheck,
  HiOutlineExclamationCircle,
} from 'react-icons/hi';

const Settings = () => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();

  // Password form
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [changingPassword, setChangingPassword] = useState(false);

  // Notification preferences
  const [emailNotifications, setEmailNotifications] = useState(user?.emailNotifications ?? true);
  const [savingPrefs, setSavingPrefs] = useState(false);

  // Delete account
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteText, setDeleteText] = useState('');
  const [deleting, setDeleting] = useState(false);

  // ── Change Password ─────────────────────────────────────────────────
  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    setChangingPassword(true);
    try {
      await api.put('/users/me/password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      toast.success('Password updated successfully');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update password');
    } finally {
      setChangingPassword(false);
    }
  };

  // ── Notification Preferences ────────────────────────────────────────
  const handleToggleNotifications = async () => {
    setSavingPrefs(true);
    try {
      const newVal = !emailNotifications;
      await api.put('/users/me', { emailNotifications: newVal });
      setEmailNotifications(newVal);
      if (updateUser) updateUser({ ...user, emailNotifications: newVal });
      toast.success(`Email notifications ${newVal ? 'enabled' : 'disabled'}`);
    } catch (error) {
      toast.error('Failed to update preferences');
    } finally {
      setSavingPrefs(false);
    }
  };

  // ── Delete Account ──────────────────────────────────────────────────
  const handleDeleteAccount = async () => {
    if (deleteText !== 'DELETE') return;
    setDeleting(true);
    try {
      await api.delete('/users/me');
      toast.success('Account deleted');
      logout();
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete account');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-surface-400">Manage your account preferences and security.</p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* ── Notification Preferences ──────────────────────────────── */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <HiOutlineBell className="w-5 h-5 text-amber-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">Notifications</h2>
          </div>

          <div className="flex items-center justify-between p-4 bg-surface-800/50 rounded-xl">
            <div>
              <p className="text-white font-medium">Email Notifications</p>
              <p className="text-sm text-surface-400">
                Receive booking confirmations, reminders, and updates via email.
              </p>
            </div>
            <button
              onClick={handleToggleNotifications}
              disabled={savingPrefs}
              className={`relative w-12 h-7 rounded-full transition-colors duration-200 ${
                emailNotifications ? 'bg-primary-500' : 'bg-surface-600'
              }`}
            >
              <span
                className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform duration-200 ${
                  emailNotifications ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </div>

        {/* ── Change Password ───────────────────────────────────────── */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center">
              <HiOutlineLockClosed className="w-5 h-5 text-primary-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">Change Password</h2>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="input-label">Current Password</label>
              <input
                type="password"
                className="input-field"
                placeholder="Enter current password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                required
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="input-label">New Password</label>
                <input
                  type="password"
                  className="input-field"
                  placeholder="At least 6 characters"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="input-label">Confirm New Password</label>
                <input
                  type="password"
                  className="input-field"
                  placeholder="Re-enter new password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={changingPassword}
              className="btn-primary text-sm"
            >
              <HiOutlineShieldCheck className="w-4 h-4" />
              {changingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>

        {/* ── Danger Zone ───────────────────────────────────────────── */}
        <div className="glass-card p-6 border-red-500/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
              <HiOutlineTrash className="w-5 h-5 text-red-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">Danger Zone</h2>
          </div>

          <p className="text-sm text-surface-400 mb-4">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="btn-danger text-sm"
            >
              <HiOutlineTrash className="w-4 h-4" />
              Delete Account
            </button>
          ) : (
            <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl space-y-3">
              <div className="flex items-start gap-2 text-sm text-red-300">
                <HiOutlineExclamationCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p>
                  This will cancel all upcoming appointments, remove your reviews, and permanently delete your account.
                  Type <strong>DELETE</strong> to confirm.
                </p>
              </div>
              <input
                type="text"
                className="input-field !border-red-500/30 text-sm"
                placeholder='Type "DELETE" to confirm'
                value={deleteText}
                onChange={(e) => setDeleteText(e.target.value)}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteText !== 'DELETE' || deleting}
                  className="btn-danger text-sm"
                >
                  {deleting ? 'Deleting...' : 'Confirm Delete'}
                </button>
                <button
                  onClick={() => { setShowDeleteConfirm(false); setDeleteText(''); }}
                  className="btn-ghost text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
