import { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../../api/axios';
import {
  HiOutlineCalendar,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineViewList,
  HiOutlineViewGrid,
  HiOutlineClock,
  HiOutlineUser,
  HiOutlineX,
  HiOutlineExclamationCircle,
  HiOutlineRefresh,
} from 'react-icons/hi';
import toast from 'react-hot-toast';

const VIEWS = { WEEK: 'week', DAY: 'day', LIST: 'list' };
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_NAMES_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7am to 8pm

const Calendar = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState(VIEWS.WEEK);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  // Reschedule state
  const [showReschedule, setShowReschedule] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState(null);
  const [rescheduleSlots, setRescheduleSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);
  const [resCalMonth, setResCalMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  // ── Fetch appointments ─────────────────────────────────────────────
  useEffect(() => {
    const fetchAppointments = async () => {
      setLoading(true);
      try {
        const from = getWeekStart(currentDate).toISOString();
        const to = getWeekEnd(currentDate).toISOString();
        const res = await api.get(`/appointments?from=${from}&to=${to}`);
        setAppointments(res.data.data);
      } catch (error) {
        console.error('Failed to fetch appointments:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, [currentDate]);

  // ── Date helpers ───────────────────────────────────────────────────
  const getWeekStart = (date) => {
    const d = new Date(date);
    d.setDate(d.getDate() - d.getDay());
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const getWeekEnd = (date) => {
    const d = getWeekStart(date);
    d.setDate(d.getDate() + 6);
    d.setHours(23, 59, 59, 999);
    return d;
  };

  const getWeekDates = () => {
    const start = getWeekStart(currentDate);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d;
    });
  };

  const isToday = (date) => {
    const now = new Date();
    return date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();
  };

  const isSameDay = (d1, d2) => {
    return d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear();
  };

  const navigateWeek = (dir) => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + dir * 7);
    setCurrentDate(d);
  };

  const navigateDay = (dir) => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + dir);
    setCurrentDate(d);
  };

  const goToday = () => setCurrentDate(new Date());

  const formatTime = (isoStr) => {
    return new Date(isoStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateShort = (date) => {
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  };

  const formatDateFull = (date) => {
    return date.toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };

  // ── Group appointments by date ─────────────────────────────────────
  const appointmentsByDate = useMemo(() => {
    const map = {};
    appointments.forEach((appt) => {
      if (appt.status === 'cancelled') return;
      const date = new Date(appt.start);
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      if (!map[key]) map[key] = [];
      map[key].push(appt);
    });
    return map;
  }, [appointments]);

  const getAppointmentsForDate = (date) => {
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    return appointmentsByDate[key] || [];
  };

  // ── Cancel handler ─────────────────────────────────────────────────
  const handleCancel = async (apptId) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    setCancelling(true);
    try {
      await api.put(`/appointments/${apptId}/cancel`);
      setAppointments((prev) =>
        prev.map((a) => (a._id === apptId ? { ...a, status: 'cancelled' } : a))
      );
      setSelectedAppointment(null);
      toast.success('Appointment cancelled');
    } catch (error) {
      toast.error('Failed to cancel appointment');
    } finally {
      setCancelling(false);
    }
  };

  // ── Reschedule handlers ───────────────────────────────────────────
  const openReschedulePanel = () => {
    setShowReschedule(true);
    setRescheduleDate(null);
    setRescheduleSlots([]);
    setSelectedSlot(null);
    const now = new Date();
    setResCalMonth({ year: now.getFullYear(), month: now.getMonth() });
  };

  const fetchResSlots = useCallback(async (dateStr) => {
    if (!selectedAppointment) return;
    setSlotsLoading(true);
    setSelectedSlot(null);
    try {
      const res = await api.get(
        `/availability?businessId=${selectedAppointment.businessId?._id || selectedAppointment.businessId}&serviceId=${selectedAppointment.serviceId?._id || selectedAppointment.serviceId}&date=${dateStr}`
      );
      setRescheduleSlots(res.data.data);
    } catch (error) {
      setRescheduleSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  }, [selectedAppointment]);

  const handleResDateSelect = (dateStr) => {
    setRescheduleDate(dateStr);
    fetchResSlots(dateStr);
  };

  const handleReschedule = async () => {
    if (!selectedSlot || !selectedAppointment) return;
    setRescheduling(true);
    try {
      const res = await api.put(`/appointments/${selectedAppointment._id}/reschedule`, {
        start: selectedSlot.start,
        end: selectedSlot.end,
      });
      setAppointments((prev) =>
        prev.map((a) => (a._id === selectedAppointment._id ? { ...a, ...res.data.data } : a))
      );
      toast.success('Appointment rescheduled');
      setSelectedAppointment(null);
      setShowReschedule(false);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to reschedule');
    } finally {
      setRescheduling(false);
    }
  };

  const getDaysInResMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfResMonth = (year, month) => new Date(year, month, 1).getDay();

  // ── Appointment card (reusable) ────────────────────────────────────
  const AppointmentCard = ({ appt, compact = false }) => {
    const startTime = formatTime(appt.start);
    const endTime = formatTime(appt.end);
    const isCancelled = appt.status === 'cancelled';

    return (
      <button
        onClick={() => setSelectedAppointment(appt)}
        className={`
          w-full text-left rounded-xl p-3 transition-all duration-200 border
          ${isCancelled
            ? 'bg-red-500/5 border-red-500/20 opacity-50'
            : 'bg-primary-500/10 border-primary-500/20 hover:bg-primary-500/15 hover:border-primary-500/30'
          }
          ${compact ? 'p-2' : 'p-3'}
        `}
      >
        <p className={`font-semibold text-white ${compact ? 'text-xs' : 'text-sm'} truncate`}>
          {appt.serviceId?.name || 'Service'}
        </p>
        <p className={`text-surface-400 ${compact ? 'text-[10px]' : 'text-xs'}`}>
          {startTime} – {endTime}
        </p>
        {!compact && (
          <p className="text-xs text-surface-500 mt-1 truncate flex items-center gap-1">
            <HiOutlineUser className="w-3 h-3" />
            {appt.customerId?.name || 'Customer'}
          </p>
        )}
      </button>
    );
  };

  // ── Week View ──────────────────────────────────────────────────────
  const renderWeekView = () => {
    const weekDates = getWeekDates();

    return (
      <div className="overflow-x-auto">
        {/* Day headers */}
        <div className="grid grid-cols-8 border-b border-surface-700/50 min-w-[700px]">
          <div className="p-3 text-xs font-medium text-surface-600" /> {/* time col */}
          {weekDates.map((date, i) => (
            <div
              key={i}
              className={`p-3 text-center border-l border-surface-700/30 ${
                isToday(date) ? 'bg-primary-500/5' : ''
              }`}
            >
              <p className="text-xs text-surface-500">{DAY_NAMES[i]}</p>
              <p className={`text-lg font-bold ${
                isToday(date) ? 'text-primary-400' : 'text-white'
              }`}>
                {date.getDate()}
              </p>
            </div>
          ))}
        </div>

        {/* Time grid */}
        <div className="min-w-[700px]">
          {HOURS.map((hour) => (
            <div key={hour} className="grid grid-cols-8 border-b border-surface-800/50">
              <div className="p-2 text-xs text-surface-600 text-right pr-3 py-4">
                {hour.toString().padStart(2, '0')}:00
              </div>
              {weekDates.map((date, dayIdx) => {
                const dayAppts = getAppointmentsForDate(date).filter((appt) => {
                  const apptHour = new Date(appt.start).getHours();
                  return apptHour === hour;
                });

                return (
                  <div
                    key={dayIdx}
                    className={`border-l border-surface-800/30 p-1 min-h-[56px] ${
                      isToday(date) ? 'bg-primary-500/5' : ''
                    }`}
                  >
                    {dayAppts.map((appt) => (
                      <AppointmentCard key={appt._id} appt={appt} compact />
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ── Day View ───────────────────────────────────────────────────────
  const renderDayView = () => {
    const dayAppts = getAppointmentsForDate(currentDate);

    return (
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">
          {formatDateFull(currentDate)}
          {isToday(currentDate) && (
            <span className="ml-2 text-xs bg-primary-500/20 text-primary-400 px-2 py-0.5 rounded-full">
              Today
            </span>
          )}
        </h3>

        {HOURS.map((hour) => {
          const hourAppts = dayAppts.filter((appt) => {
            const apptHour = new Date(appt.start).getHours();
            return apptHour === hour;
          });

          return (
            <div key={hour} className="flex border-b border-surface-800/50">
              <div className="w-20 py-4 text-sm text-surface-600 text-right pr-4 flex-shrink-0">
                {hour.toString().padStart(2, '0')}:00
              </div>
              <div className="flex-1 py-2 px-2 min-h-[64px] space-y-2">
                {hourAppts.map((appt) => (
                  <AppointmentCard key={appt._id} appt={appt} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // ── List View ──────────────────────────────────────────────────────
  const renderListView = () => {
    const weekDates = getWeekDates();

    return (
      <div className="space-y-6">
        {weekDates.map((date, i) => {
          const dayAppts = getAppointmentsForDate(date);

          return (
            <div key={i}>
              <h3 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${
                isToday(date) ? 'text-primary-400' : 'text-surface-300'
              }`}>
                {DAY_NAMES_FULL[date.getDay()]}, {formatDateShort(date)}
                {isToday(date) && (
                  <span className="text-xs bg-primary-500/20 text-primary-400 px-2 py-0.5 rounded-full">
                    Today
                  </span>
                )}
                <span className="text-surface-600 text-xs">({dayAppts.length} appointments)</span>
              </h3>

              {dayAppts.length === 0 ? (
                <p className="text-xs text-surface-600 pl-4 py-2">No appointments</p>
              ) : (
                <div className="space-y-2">
                  {dayAppts.map((appt) => (
                    <AppointmentCard key={appt._id} appt={appt} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // ── Appointment Detail Modal ───────────────────────────────────────
  const renderDetailModal = () => {
    if (!selectedAppointment) return null;
    const appt = selectedAppointment;
    const isCancelled = appt.status === 'cancelled';

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
        <div className="glass-card w-full max-w-md p-6 animate-scale-in">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Appointment Details</h2>
            <button onClick={() => setSelectedAppointment(null)} className="btn-ghost !p-2">
              <HiOutlineX className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Status badge */}
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                isCancelled
                  ? 'bg-red-500/15 text-red-400 border border-red-500/20'
                  : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
              }`}>
                {isCancelled ? '❌ Cancelled' : '✅ Confirmed'}
              </span>
            </div>

            {/* Details */}
            <div className="space-y-3 bg-surface-800/50 rounded-xl p-4">
              <div className="flex justify-between text-sm">
                <span className="text-surface-400">Service</span>
                <span className="text-white font-medium">{appt.serviceId?.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-surface-400">Customer</span>
                <span className="text-white font-medium">{appt.customerId?.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-surface-400">Email</span>
                <span className="text-surface-300">{appt.customerId?.email || 'N/A'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-surface-400">Date</span>
                <span className="text-white">{new Date(appt.start).toLocaleDateString('en-IN', {
                  weekday: 'short', month: 'short', day: 'numeric',
                })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-surface-400">Time</span>
                <span className="text-white">{formatTime(appt.start)} – {formatTime(appt.end)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-surface-400">Duration</span>
                <span className="text-white">{appt.serviceId?.duration || '-'} min</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-surface-400">Price</span>
                <span className="text-white font-semibold">₹{appt.serviceId?.price || 0}</span>
              </div>
              {appt.notes && (
                <div className="pt-2 border-t border-surface-700">
                  <p className="text-xs text-surface-500 mb-1">Notes</p>
                  <p className="text-sm text-surface-300">{appt.notes}</p>
                </div>
              )}
            </div>

            {/* Actions */}
            {!isCancelled && new Date(appt.start) > new Date() && (
              <div className="space-y-3">
                {/* Reschedule section */}
                {!showReschedule ? (
                  <div className="flex gap-2">
                    <button onClick={openReschedulePanel} className="btn-secondary flex-1">
                      <HiOutlineRefresh className="w-4 h-4" />
                      Reschedule
                    </button>
                    <button
                      onClick={() => handleCancel(appt._id)}
                      disabled={cancelling}
                      className="btn-danger flex-1"
                    >
                      {cancelling ? 'Cancelling...' : 'Cancel'}
                    </button>
                  </div>
                ) : (
                  <div className="bg-surface-800/50 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-white">Pick a new date & time</p>
                      <button onClick={() => setShowReschedule(false)} className="text-surface-500 hover:text-white">
                        <HiOutlineX className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Mini Calendar */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <button
                          onClick={() => setResCalMonth((p) => p.month === 0 ? { year: p.year - 1, month: 11 } : { ...p, month: p.month - 1 })}
                          className="text-surface-400 hover:text-white p-1"
                        >
                          <HiOutlineChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs font-medium text-surface-300">
                          {new Date(resCalMonth.year, resCalMonth.month).toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </span>
                        <button
                          onClick={() => setResCalMonth((p) => p.month === 11 ? { year: p.year + 1, month: 0 } : { ...p, month: p.month + 1 })}
                          className="text-surface-400 hover:text-white p-1"
                        >
                          <HiOutlineChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-7 gap-0.5 text-center">
                        {['S','M','T','W','T','F','S'].map((d,i) => (
                          <div key={i} className="text-[10px] text-surface-600 py-0.5">{d}</div>
                        ))}
                        {Array.from({ length: getFirstDayOfResMonth(resCalMonth.year, resCalMonth.month) }).map((_, i) => (
                          <div key={`e-${i}`} />
                        ))}
                        {Array.from({ length: getDaysInResMonth(resCalMonth.year, resCalMonth.month) }).map((_, i) => {
                          const day = i + 1;
                          const date = new Date(resCalMonth.year, resCalMonth.month, day);
                          const dateStr = `${resCalMonth.year}-${String(resCalMonth.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                          const today = new Date(); today.setHours(0,0,0,0);
                          const isPast = date < today;
                          const isSelected = dateStr === rescheduleDate;
                          return (
                            <button
                              key={day}
                              disabled={isPast}
                              onClick={() => handleResDateSelect(dateStr)}
                              className={`text-[11px] py-1 rounded-md transition-all ${
                                isPast ? 'text-surface-700 cursor-not-allowed'
                                : isSelected ? 'bg-primary-500 text-white font-bold'
                                : 'text-surface-300 hover:bg-surface-700'
                              }`}
                            >
                              {day}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Slots */}
                    {rescheduleDate && (
                      <div>
                        {slotsLoading ? (
                          <div className="grid grid-cols-3 gap-1">
                            {[1,2,3].map(i => <div key={i} className="skeleton h-8 rounded-lg" />)}
                          </div>
                        ) : rescheduleSlots.length === 0 ? (
                          <p className="text-xs text-surface-500 text-center py-2">No available slots</p>
                        ) : (
                          <div className="grid grid-cols-3 gap-1 max-h-32 overflow-y-auto">
                            {rescheduleSlots.map((slot) => (
                              <button
                                key={slot.start}
                                onClick={() => setSelectedSlot(slot)}
                                className={`text-xs py-1.5 rounded-lg border transition-all ${
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

                    {selectedSlot && (
                      <button
                        onClick={handleReschedule}
                        disabled={rescheduling}
                        className="btn-primary w-full text-sm !py-2"
                      >
                        <HiOutlineRefresh className="w-4 h-4" />
                        {rescheduling ? 'Rescheduling...' : `Move to ${selectedSlot.startLocal}`}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="page-container animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Calendar</h1>
          <p className="text-surface-400 text-sm">View and manage your appointments.</p>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggles */}
          <div className="flex items-center bg-surface-800 rounded-xl border border-surface-700 p-1">
            {[
              { key: VIEWS.WEEK, icon: HiOutlineViewGrid, label: 'Week' },
              { key: VIEWS.DAY, icon: HiOutlineCalendar, label: 'Day' },
              { key: VIEWS.LIST, icon: HiOutlineViewList, label: 'List' },
            ].map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => setView(key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  view === key
                    ? 'bg-primary-500/15 text-primary-400'
                    : 'text-surface-400 hover:text-surface-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mb-6 glass-card px-4 py-3">
        <button
          onClick={() => view === VIEWS.DAY ? navigateDay(-1) : navigateWeek(-1)}
          className="btn-ghost !p-2"
        >
          <HiOutlineChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <button onClick={goToday} className="btn-ghost text-xs text-primary-400">
            Today
          </button>
          <span className="text-white font-semibold">
            {view === VIEWS.DAY
              ? formatDateFull(currentDate)
              : `${formatDateShort(getWeekDates()[0])} – ${formatDateShort(getWeekDates()[6])}`
            }
          </span>
        </div>

        <button
          onClick={() => view === VIEWS.DAY ? navigateDay(1) : navigateWeek(1)}
          className="btn-ghost !p-2"
        >
          <HiOutlineChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton h-16 rounded-xl" />
            ))}
          </div>
        ) : appointments.filter((a) => a.status === 'confirmed').length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-surface-800 flex items-center justify-center mx-auto mb-4">
              <HiOutlineCalendar className="w-8 h-8 text-surface-600" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No appointments this week</h3>
            <p className="text-surface-500 text-sm">
              Your calendar is clear. Appointments will appear here once customers book.
            </p>
          </div>
        ) : (
          <div className="p-4">
            {view === VIEWS.WEEK && renderWeekView()}
            {view === VIEWS.DAY && renderDayView()}
            {view === VIEWS.LIST && renderListView()}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {renderDetailModal()}
    </div>
  );
};

export default Calendar;
