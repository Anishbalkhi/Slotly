import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import {
  HiOutlineUserGroup,
  HiOutlinePlusCircle,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineX,
  HiOutlineClock,
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineCheck,
} from 'react-icons/hi';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_NAMES_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const DEFAULT_AVAILABILITY = [
  { day: 1, start: '09:00', end: '17:00' },
  { day: 2, start: '09:00', end: '17:00' },
  { day: 3, start: '09:00', end: '17:00' },
  { day: 4, start: '09:00', end: '17:00' },
  { day: 5, start: '09:00', end: '17:00' },
];

const StaffManagement = () => {
  const [businesses, setBusinesses] = useState([]);
  const [selectedBiz, setSelectedBiz] = useState(null);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Staff',
    weeklyAvailability: [...DEFAULT_AVAILABILITY],
  });

  // Load businesses
  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        const res = await api.get('/businesses/user/mine');
        setBusinesses(res.data.data);
        if (res.data.data.length > 0) {
          setSelectedBiz(res.data.data[0]._id);
        }
      } catch (error) {
        console.error('Failed to fetch businesses:', error);
      }
    };
    fetchBusinesses();
  }, []);

  // Load staff when business changes
  const fetchStaff = useCallback(async () => {
    if (!selectedBiz) return;
    setLoading(true);
    try {
      const res = await api.get(`/businesses/${selectedBiz}/staff`);
      setStaff(res.data.data);
    } catch (error) {
      console.error('Failed to fetch staff:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedBiz]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  // ── Modal Handlers ──────────────────────────────────────────────────

  const openAddModal = () => {
    setEditingStaff(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: 'Staff',
      weeklyAvailability: [...DEFAULT_AVAILABILITY],
    });
    setShowModal(true);
  };

  const openEditModal = (member) => {
    setEditingStaff(member);
    setFormData({
      name: member.name,
      email: member.email || '',
      phone: member.phone || '',
      role: member.role || 'Staff',
      weeklyAvailability: member.weeklyAvailability?.length > 0
        ? member.weeklyAvailability.map((d) => ({ ...d }))
        : [...DEFAULT_AVAILABILITY],
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingStaff(null);
  };

  // ── Availability Toggles ────────────────────────────────────────────

  const toggleDay = (dayNum) => {
    setFormData((prev) => {
      const exists = prev.weeklyAvailability.find((d) => d.day === dayNum);
      if (exists) {
        return {
          ...prev,
          weeklyAvailability: prev.weeklyAvailability.filter((d) => d.day !== dayNum),
        };
      } else {
        return {
          ...prev,
          weeklyAvailability: [
            ...prev.weeklyAvailability,
            { day: dayNum, start: '09:00', end: '17:00' },
          ].sort((a, b) => a.day - b.day),
        };
      }
    });
  };

  const updateDayTime = (dayNum, field, value) => {
    setFormData((prev) => ({
      ...prev,
      weeklyAvailability: prev.weeklyAvailability.map((d) =>
        d.day === dayNum ? { ...d, [field]: value } : d
      ),
    }));
  };

  // ── CRUD Operations ─────────────────────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingStaff) {
        await api.put(`/staff/${editingStaff._id}`, formData);
        toast.success('Staff member updated');
      } else {
        await api.post(`/businesses/${selectedBiz}/staff`, formData);
        toast.success('Staff member added');
      }
      closeModal();
      fetchStaff();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save staff member');
    }
  };

  const handleDelete = async (memberId) => {
    if (!window.confirm('Are you sure you want to deactivate this staff member?')) return;
    try {
      await api.delete(`/staff/${memberId}`);
      toast.success('Staff member deactivated');
      fetchStaff();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to remove staff member');
    }
  };

  // ── No businesses state ─────────────────────────────────────────────

  if (businesses.length === 0 && !loading) {
    return (
      <div className="page-container animate-fade-in">
        <div className="glass-card p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary-500/10 flex items-center justify-center mx-auto mb-4">
            <HiOutlineUserGroup className="w-8 h-8 text-primary-400" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">No business set up</h2>
          <p className="text-surface-400 max-w-sm mx-auto">
            Create a business first, then you can add staff members.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Staff Management</h1>
          <p className="text-surface-400">Manage your team members and their schedules.</p>
        </div>
        <button onClick={openAddModal} className="btn-primary whitespace-nowrap">
          <HiOutlinePlusCircle className="w-5 h-5" />
          Add Staff
        </button>
      </div>

      {/* Business Selector */}
      {businesses.length > 1 && (
        <div className="mb-6">
          <select
            value={selectedBiz || ''}
            onChange={(e) => setSelectedBiz(e.target.value)}
            className="input-field !w-auto min-w-[240px]"
          >
            {businesses.map((biz) => (
              <option key={biz._id} value={biz._id}>{biz.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Staff List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-24 rounded-2xl" />
          ))}
        </div>
      ) : staff.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-surface-800 flex items-center justify-center mx-auto mb-4">
            <HiOutlineUserGroup className="w-8 h-8 text-surface-600" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">No staff members yet</h2>
          <p className="text-surface-400 mb-6 max-w-sm mx-auto">
            Add your first team member to manage their schedule and assignments.
          </p>
          <button onClick={openAddModal} className="btn-primary">
            <HiOutlinePlusCircle className="w-5 h-5" />
            Add Staff Member
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {staff.map((member) => (
            <div
              key={member._id}
              className="glass-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-primary-500/20 transition-all duration-200"
            >
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {member.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-white">{member.name}</h3>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary-500/15 text-primary-400">
                      {member.role}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-surface-400">
                    {member.email && (
                      <span className="flex items-center gap-1">
                        <HiOutlineMail className="w-3.5 h-3.5" />
                        {member.email}
                      </span>
                    )}
                    {member.phone && (
                      <span className="flex items-center gap-1">
                        <HiOutlinePhone className="w-3.5 h-3.5" />
                        {member.phone}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <HiOutlineClock className="w-3.5 h-3.5" />
                      {member.weeklyAvailability?.length || 0} days/week
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => openEditModal(member)}
                  className="btn-secondary text-sm !py-2 !px-3"
                  title="Edit staff"
                >
                  <HiOutlinePencil className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(member._id)}
                  className="btn-danger text-sm !py-2 !px-3"
                  title="Deactivate staff"
                >
                  <HiOutlineTrash className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Add/Edit Modal ─────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />

          {/* Modal */}
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-surface-900 border border-surface-700 rounded-2xl shadow-2xl">
            {/* Header */}
            <div className="sticky top-0 bg-surface-900 border-b border-surface-700 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold text-white">
                {editingStaff ? 'Edit Staff Member' : 'Add Staff Member'}
              </h2>
              <button onClick={closeModal} className="text-surface-400 hover:text-white transition-colors">
                <HiOutlineX className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Name */}
              <div>
                <label className="input-label">Name *</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Dr. Smith"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              {/* Role */}
              <div>
                <label className="input-label">Role</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Therapist, Stylist, Trainer"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                />
              </div>

              {/* Contact */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Email</label>
                  <input
                    type="email"
                    className="input-field"
                    placeholder="email@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="input-label">Phone</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              {/* Weekly Availability */}
              <div>
                <label className="input-label mb-3">Weekly Schedule</label>
                <div className="space-y-2">
                  {[0, 1, 2, 3, 4, 5, 6].map((dayNum) => {
                    const dayEntry = formData.weeklyAvailability.find((d) => d.day === dayNum);
                    const isActive = !!dayEntry;

                    return (
                      <div
                        key={dayNum}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                          isActive
                            ? 'bg-surface-800 border-primary-500/30'
                            : 'bg-surface-800/30 border-surface-700/30'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => toggleDay(dayNum)}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                            isActive
                              ? 'bg-primary-500 text-white'
                              : 'bg-surface-700 text-surface-500'
                          }`}
                        >
                          {isActive && <HiOutlineCheck className="w-4 h-4" />}
                        </button>

                        <span className={`text-sm font-medium w-12 ${isActive ? 'text-white' : 'text-surface-500'}`}>
                          {DAY_NAMES_SHORT[dayNum]}
                        </span>

                        {isActive ? (
                          <div className="flex items-center gap-2 flex-1">
                            <input
                              type="time"
                              className="input-field !py-1.5 !px-2 text-sm !w-auto"
                              value={dayEntry.start}
                              onChange={(e) => updateDayTime(dayNum, 'start', e.target.value)}
                            />
                            <span className="text-surface-500 text-sm">to</span>
                            <input
                              type="time"
                              className="input-field !py-1.5 !px-2 text-sm !w-auto"
                              value={dayEntry.end}
                              onChange={(e) => updateDayTime(dayNum, 'end', e.target.value)}
                            />
                          </div>
                        ) : (
                          <span className="text-sm text-surface-600">Off</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1">
                  {editingStaff ? 'Save Changes' : 'Add Staff Member'}
                </button>
                <button type="button" onClick={closeModal} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManagement;
