import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import {
  HiOutlineCalendar,
  HiOutlineSearch,
  HiOutlineClock,
  HiOutlineLocationMarker,
  HiOutlineCurrencyRupee,
  HiOutlineX,
  HiOutlineRefresh,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
} from 'react-icons/hi';

const CustomerDashboard = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(null);

  // Reschedule state
  const [rescheduleAppt, setRescheduleAppt] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState(null);
  const [rescheduleSlots, setRescheduleSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);
  const [calMonth, setCalMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const res = await api.get('/appointments');
        setAppointments(res.data.data);
      } catch (error) {
        console.error('Failed to fetch appointments:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, []);

  const handleCancel = async (appointmentId) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    setCancelling(appointmentId);
    try {
      await api.put(`/appointments/${appointmentId}/cancel`);
      setAppointments((prev) =>
        prev.map((a) => (a._id === appointmentId ? { ...a, status: 'cancelled' } : a))
      );
      toast.success('Appointment cancelled successfully');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to cancel appointment');
    } finally {
      setCancelling(null);
    }
  };

  // ── Reschedule Logic ────────────────────────────────────────────────

  const openReschedule = (appt) => {
    setRescheduleAppt(appt);
    setRescheduleDate(null);
    setRescheduleSlots([]);
    setSelectedSlot(null);
    const now = new Date();
    setCalMonth({ year: now.getFullYear(), month: now.getMonth() });
  };

  const closeReschedule = () => {
    setRescheduleAppt(null);
    setRescheduleDate(null);
    setRescheduleSlots([]);
    setSelectedSlot(null);
  };

  const fetchSlots = useCallback(async (dateStr) => {
    if (!rescheduleAppt) return;
    setSlotsLoading(true);
    setSelectedSlot(null);
    try {
      const res = await api.get(
        `/availability?businessId=${rescheduleAppt.businessId?._id}&serviceId=${rescheduleAppt.serviceId?._id}&date=${dateStr}`
      );
      setRescheduleSlots(res.data.data);
    } catch (error) {
      console.error('Failed to fetch slots:', error);
      setRescheduleSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  }, [rescheduleAppt]);

  const handleDateSelect = (dateStr) => {
    setRescheduleDate(dateStr);
    fetchSlots(dateStr);
  };

  const handleReschedule = async () => {
    if (!selectedSlot || !rescheduleAppt) return;
    setRescheduling(true);
    try {
      const res = await api.put(`/appointments/${rescheduleAppt._id}/reschedule`, {
        start: selectedSlot.start,
        end: selectedSlot.end,
      });
      setAppointments((prev) =>
        prev.map((a) => (a._id === rescheduleAppt._id ? { ...a, ...res.data.data } : a))
      );
      toast.success('Appointment rescheduled successfully');
      closeReschedule();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to reschedule');
    } finally {
      setRescheduling(false);
    }
  };

  // ── Calendar helpers ────────────────────────────────────────────────

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const prevMonth = () => {
    setCalMonth((prev) =>
      prev.month === 0
        ? { year: prev.year - 1, month: 11 }
        : { year: prev.year, month: prev.month - 1 }
    );
  };

  const nextMonth = () => {
    setCalMonth((prev) =>
      prev.month === 11
        ? { year: prev.year + 1, month: 0 }
        : { year: prev.year, month: prev.month + 1 }
    );
  };

  const now = new Date();
  const upcoming = appointments.filter(
    (a) => a.status === 'confirmed' && new Date(a.start) >= now
  );
  const past = appointments.filter(
    (a) => a.status === 'cancelled' || new Date(a.start) < now
  );

  const formatDate = (isoStr) => {
    return new Date(isoStr).toLocaleDateString('en-IN', {
      weekday: 'short', month: 'short', day: 'numeric',
    });
  };

  const formatTime = (isoStr) => {
    return new Date(isoStr).toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit',
    });
  };

  const AppointmentCard = ({ appt, showActions = false }) => {
    const isCancelled = appt.status === 'cancelled';
    const isPast = new Date(appt.start) < now && !isCancelled;

    return (
      <div className={`glass-card p-5 transition-all duration-200 ${
        isCancelled ? 'opacity-60' : 'hover:border-primary-500/20'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold text-white">
                {appt.serviceId?.name || 'Service'}
              </h3>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                isCancelled
                  ? 'bg-red-500/15 text-red-400'
                  : isPast
                    ? 'bg-surface-700 text-surface-400'
                    : 'bg-emerald-500/15 text-emerald-400'
              }`}>
                {isCancelled ? 'Cancelled' : isPast ? 'Completed' : 'Confirmed'}
              </span>
            </div>

            <p className="text-sm text-surface-300 mb-2">
              {appt.businessId?.name || 'Business'}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-sm text-surface-400">
              <span className="flex items-center gap-1.5">
                <HiOutlineCalendar className="w-4 h-4" />
                {formatDate(appt.start)}
              </span>
              <span className="flex items-center gap-1.5">
                <HiOutlineClock className="w-4 h-4" />
                {formatTime(appt.start)} – {formatTime(appt.end)}
              </span>
              {appt.serviceId?.price > 0 && (
                <span className="flex items-center gap-1.5">
                  <HiOutlineCurrencyRupee className="w-4 h-4" />
                  ₹{appt.serviceId.price}
                </span>
              )}
              {appt.businessId?.address?.city && (
                <span className="flex items-center gap-1.5">
                  <HiOutlineLocationMarker className="w-4 h-4" />
                  {appt.businessId.address.city}
                </span>
              )}
            </div>
          </div>

          {showActions && !isCancelled && !isPast && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => openReschedule(appt)}
                className="btn-secondary text-sm !py-2 !px-4"
              >
                <HiOutlineRefresh className="w-4 h-4" />
                Reschedule
              </button>
              <button
                onClick={() => handleCancel(appt._id)}
                disabled={cancelling === appt._id}
                className="btn-danger text-sm !py-2 !px-4"
              >
                {cancelling === appt._id ? (
                  <span className="flex items-center gap-1.5">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Cancelling...
                  </span>
                ) : (
                  <>
                    <HiOutlineX className="w-4 h-4" />
                    Cancel
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── Mini Calendar for Reschedule ────────────────────────────────────

  const MiniCalendar = () => {
    const daysInMonth = getDaysInMonth(calMonth.year, calMonth.month);
    const firstDay = getFirstDayOfMonth(calMonth.year, calMonth.month);
    const monthName = new Date(calMonth.year, calMonth.month).toLocaleString('default', { month: 'long', year: 'numeric' });
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return (
      <div>
        <div className="flex items-center justify-between mb-3">
          <button onClick={prevMonth} className="text-surface-400 hover:text-white p-1 rounded-lg hover:bg-surface-700 transition-colors">
            <HiOutlineChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium text-white">{monthName}</span>
          <button onClick={nextMonth} className="text-surface-400 hover:text-white p-1 rounded-lg hover:bg-surface-700 transition-colors">
            <HiOutlineChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
            <div key={d} className="text-xs text-surface-500 py-1">{d}</div>
          ))}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const date = new Date(calMonth.year, calMonth.month, day);
            const dateStr = `${calMonth.year}-${String(calMonth.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isPast = date < today;
            const isSelected = dateStr === rescheduleDate;

            return (
              <button
                key={day}
                disabled={isPast}
                onClick={() => handleDateSelect(dateStr)}
                className={`text-sm py-1.5 rounded-lg transition-all ${
                  isPast
                    ? 'text-surface-700 cursor-not-allowed'
                    : isSelected
                      ? 'bg-primary-500 text-white font-semibold'
                      : 'text-surface-300 hover:bg-surface-700'
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

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
          <p className="text-sm text-surface-400">
            {loading
              ? 'Loading...'
              : upcoming.length === 0
                ? 'No upcoming bookings. Browse businesses to make your first one!'
                : `${upcoming.length} upcoming appointment${upcoming.length !== 1 ? 's' : ''}`
            }
          </p>
        </div>
      </div>

      {/* Upcoming Appointments */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">Upcoming Appointments</h2>
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="skeleton h-28 rounded-2xl" />
            ))}
          </div>
        ) : upcoming.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-surface-800 flex items-center justify-center mx-auto mb-4">
              <HiOutlineCalendar className="w-8 h-8 text-surface-600" />
            </div>
            <p className="text-surface-500 mb-4">No upcoming appointments</p>
            <Link to="/browse" className="btn-primary text-sm">
              Find a Business
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {upcoming.map((appt) => (
              <AppointmentCard key={appt._id} appt={appt} showActions />
            ))}
          </div>
        )}
      </div>

      {/* Past & Cancelled */}
      {past.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Past & Cancelled</h2>
          <div className="space-y-3">
            {past.slice(0, 10).map((appt) => (
              <AppointmentCard key={appt._id} appt={appt} />
            ))}
          </div>
        </div>
      )}

      {/* ── Reschedule Modal ─────────────────────────────────────────── */}
      {rescheduleAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeReschedule} />
          <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto bg-surface-900 border border-surface-700 rounded-2xl shadow-2xl">
            {/* Header */}
            <div className="sticky top-0 bg-surface-900 border-b border-surface-700 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h2 className="text-lg font-bold text-white">Reschedule Appointment</h2>
                <p className="text-sm text-surface-400">{rescheduleAppt.serviceId?.name}</p>
              </div>
              <button onClick={closeReschedule} className="text-surface-400 hover:text-white transition-colors">
                <HiOutlineX className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Mini Calendar */}
              <div className="glass-card p-4">
                <MiniCalendar />
              </div>

              {/* Time Slots */}
              {rescheduleDate && (
                <div>
                  <p className="text-sm font-medium text-surface-300 mb-3">
                    Available slots for {new Date(rescheduleDate + 'T00:00:00').toLocaleDateString('en-IN', {
                      weekday: 'long', month: 'short', day: 'numeric',
                    })}
                  </p>

                  {slotsLoading ? (
                    <div className="grid grid-cols-3 gap-2">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="skeleton h-10 rounded-xl" />
                      ))}
                    </div>
                  ) : rescheduleSlots.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-surface-500 text-sm">No available slots on this date.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                      {rescheduleSlots.map((slot) => (
                        <button
                          key={slot.start}
                          onClick={() => setSelectedSlot(slot)}
                          className={`text-sm py-2.5 px-3 rounded-xl border transition-all ${
                            selectedSlot?.start === slot.start
                              ? 'bg-primary-500 border-primary-400 text-white font-semibold'
                              : 'bg-surface-800 border-surface-700 text-surface-300 hover:border-primary-500/30'
                          }`}
                        >
                          {slot.startLocal}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Confirm Button */}
              {selectedSlot && (
                <button
                  onClick={handleReschedule}
                  disabled={rescheduling}
                  className="btn-primary w-full"
                >
                  <HiOutlineRefresh className="w-5 h-5" />
                  {rescheduling ? 'Rescheduling...' : `Reschedule to ${selectedSlot.startLocal}`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDashboard;
