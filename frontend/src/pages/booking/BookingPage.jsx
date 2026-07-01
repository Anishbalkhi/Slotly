import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import {
  HiOutlineCalendar,
  HiOutlineClock,
  HiOutlineCurrencyRupee,
  HiOutlineLocationMarker,
  HiOutlineCheck,
  HiOutlineArrowLeft,
  HiOutlineArrowRight,
} from 'react-icons/hi';

const BookingPage = () => {
  const { businessId, serviceId } = useParams();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [business, setBusiness] = useState(null);
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [booking, setBooking] = useState(false);

  // Booking flow state
  const [selectedDate, setSelectedDate] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [step, setStep] = useState(1); // 1=date, 2=slot, 3=confirm, 4=success
  const [bookedAppointment, setBookedAppointment] = useState(null);

  // Calendar state
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  // ── Load business & service ────────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bizRes, srvRes] = await Promise.all([
          api.get(`/businesses/${businessId}`),
          api.get(`/businesses/${businessId}/services`),
        ]);
        setBusiness(bizRes.data.data);
        const found = srvRes.data.data.find((s) => s._id === serviceId);
        setService(found || null);
      } catch (error) {
        console.error('Failed to load booking data:', error);
        toast.error('Failed to load booking data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [businessId, serviceId]);

  // ── Fetch slots when date is selected ──────────────────────────────
  const fetchSlots = useCallback(async (dateStr) => {
    setSlotsLoading(true);
    setSlots([]);
    try {
      const res = await api.get(`/availability?businessId=${businessId}&serviceId=${serviceId}&date=${dateStr}`);
      setSlots(res.data.data);
    } catch (error) {
      console.error('Failed to fetch slots:', error);
      toast.error('Failed to load available times');
    } finally {
      setSlotsLoading(false);
    }
  }, [businessId, serviceId]);

  // ── Calendar helpers ───────────────────────────────────────────────
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + (business?.maxAdvanceDays || 30));

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const isBusinessOpen = (date) => {
    if (!business?.hours) return true;
    const dayKey = DAY_KEYS[date.getDay()];
    return business.hours[dayKey]?.isOpen ?? false;
  };

  const isDateDisabled = (date) => {
    if (date < today) return true;
    if (date > maxDate) return true;
    if (!isBusinessOpen(date)) return true;
    return false;
  };

  const handleDateSelect = (day) => {
    const date = new Date(calendarMonth.year, calendarMonth.month, day);
    if (isDateDisabled(date)) return;
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    setSelectedDate(dateStr);
    setSelectedSlot(null);
    setStep(2);
    fetchSlots(dateStr);
  };

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
    setStep(3);
  };

  const handleConfirmBooking = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to book an appointment');
      navigate('/login', { state: { from: { pathname: `/book/${businessId}/${serviceId}` } } });
      return;
    }

    setBooking(true);
    try {
      const res = await api.post('/appointments', {
        businessId,
        serviceId,
        start: selectedSlot.start,
        end: selectedSlot.end,
      });
      setBookedAppointment(res.data.data);
      setStep(4);
      toast.success('Appointment booked successfully! 🎉');
    } catch (error) {
      const msg = error.response?.data?.error || 'Failed to book appointment';
      toast.error(msg);
    } finally {
      setBooking(false);
    }
  };

  const prevMonth = () => {
    setCalendarMonth((prev) => {
      const m = prev.month === 0 ? 11 : prev.month - 1;
      const y = prev.month === 0 ? prev.year - 1 : prev.year;
      return { year: y, month: m };
    });
  };

  const nextMonth = () => {
    setCalendarMonth((prev) => {
      const m = prev.month === 11 ? 0 : prev.month + 1;
      const y = prev.month === 11 ? prev.year + 1 : prev.year;
      return { year: y, month: m };
    });
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatTime = (isoStr) => {
    return new Date(isoStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  // ── Loading state ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="page-container max-w-4xl mx-auto">
        <div className="space-y-6 animate-pulse">
          <div className="skeleton h-12 w-64" />
          <div className="skeleton h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!business || !service) {
    return (
      <div className="page-container text-center py-20">
        <h2 className="text-2xl font-bold text-white mb-2">Service not found</h2>
        <p className="text-surface-400 mb-6">This booking page is no longer available.</p>
        <Link to="/browse" className="btn-primary">Browse Businesses</Link>
      </div>
    );
  }

  // ── Calendar grid ──────────────────────────────────────────────────
  const renderCalendar = () => {
    const { year, month } = calendarMonth;
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = [];

    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const disabled = isDateDisabled(date);
      const isToday = date.getTime() === today.getTime();
      const isSelected = selectedDate === dateStr;

      days.push(
        <button
          key={day}
          onClick={() => handleDateSelect(day)}
          disabled={disabled}
          className={`
            relative aspect-square rounded-xl text-sm font-medium transition-all duration-200
            flex items-center justify-center
            ${disabled
              ? 'text-surface-700 cursor-not-allowed'
              : isSelected
                ? 'bg-primary-500 text-white shadow-glow scale-105'
                : 'text-surface-200 hover:bg-surface-700 hover:text-white cursor-pointer'
            }
            ${isToday && !isSelected ? 'ring-2 ring-primary-500/50' : ''}
          `}
        >
          {day}
          {isToday && (
            <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary-400 rounded-full" />
          )}
        </button>
      );
    }

    return days;
  };

  // Can navigate to previous month only if it's current month or later
  const canGoPrev = calendarMonth.year > today.getFullYear() ||
    (calendarMonth.year === today.getFullYear() && calendarMonth.month > today.getMonth());

  return (
    <div className="page-container max-w-4xl mx-auto animate-fade-in">
      {/* Back link */}
      <Link
        to={`/business/${businessId}`}
        className="inline-flex items-center gap-2 text-sm text-surface-400 hover:text-surface-200 mb-6 transition-colors"
      >
        <HiOutlineArrowLeft className="w-4 h-4" />
        Back to {business.name}
      </Link>

      {/* Service Header */}
      <div className="glass-card p-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Book: {service.name}</h1>
            <p className="text-surface-400 text-sm">{business.name}</p>
          </div>
          <div className="flex items-center gap-4 text-sm text-surface-400">
            <span className="flex items-center gap-1.5">
              <HiOutlineClock className="w-4 h-4" />
              {service.duration} min
            </span>
            <span className="flex items-center gap-1.5">
              <HiOutlineCurrencyRupee className="w-4 h-4" />
              ₹{service.price}
            </span>
            {business.address?.city && (
              <span className="flex items-center gap-1.5 hidden sm:flex">
                <HiOutlineLocationMarker className="w-4 h-4" />
                {business.address.city}
              </span>
            )}
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-3 mt-6">
          {['Select Date', 'Choose Time', 'Confirm'].map((label, i) => (
            <div key={label} className="flex items-center gap-2 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                i + 1 < step
                  ? 'bg-emerald-500 text-white'
                  : i + 1 === step
                    ? 'bg-primary-500 text-white shadow-glow'
                    : 'bg-surface-800 text-surface-500 border border-surface-600'
              }`}>
                {i + 1 < step ? <HiOutlineCheck className="w-3.5 h-3.5" /> : i + 1}
              </div>
              <span className={`text-xs hidden sm:block ${i + 1 <= step ? 'text-surface-200' : 'text-surface-600'}`}>
                {label}
              </span>
              {i < 2 && <div className={`flex-1 h-px ${i + 1 < step ? 'bg-emerald-500' : 'bg-surface-700'}`} />}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="grid lg:grid-cols-5 gap-8">
        {/* Main content area */}
        <div className="lg:col-span-3">
          {/* Step 1: Date Selection */}
          {step >= 1 && step < 4 && (
            <div className="glass-card p-6 animate-fade-in">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <HiOutlineCalendar className="w-5 h-5 text-primary-400" />
                Select a Date
              </h2>

              {/* Month navigation */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={prevMonth}
                  disabled={!canGoPrev}
                  className="btn-ghost !p-2 disabled:opacity-30"
                >
                  <HiOutlineArrowLeft className="w-5 h-5" />
                </button>
                <span className="text-white font-semibold">
                  {MONTH_NAMES[calendarMonth.month]} {calendarMonth.year}
                </span>
                <button onClick={nextMonth} className="btn-ghost !p-2">
                  <HiOutlineArrowRight className="w-5 h-5" />
                </button>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                  <div key={d} className="text-center text-xs font-medium text-surface-500 py-2">
                    {d}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {renderCalendar()}
              </div>

              <p className="text-xs text-surface-600 mt-4">
                Greyed out dates are closed or unavailable.
              </p>
            </div>
          )}

          {/* Step 2: Time Slot Selection */}
          {step >= 2 && step < 4 && (
            <div className="glass-card p-6 mt-6 animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <HiOutlineClock className="w-5 h-5 text-primary-400" />
                  Available Times
                </h2>
                <span className="text-sm text-surface-400">{formatDate(selectedDate)}</span>
              </div>

              {slotsLoading ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div key={i} className="skeleton h-14 rounded-xl" />
                  ))}
                </div>
              ) : slots.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-surface-400 mb-1">No available slots for this date.</p>
                  <p className="text-xs text-surface-600">Try selecting a different date.</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {slots.map((slot) => {
                    const isActive = selectedSlot?.start === slot.start;
                    return (
                      <button
                        key={slot.start}
                        onClick={() => handleSlotSelect(slot)}
                        className={`
                          relative px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200
                          border
                          ${isActive
                            ? 'bg-primary-500/20 border-primary-500/50 text-primary-300 shadow-sm'
                            : 'bg-surface-800/50 border-surface-700 text-surface-200 hover:bg-surface-700 hover:border-surface-600'
                          }
                        `}
                      >
                        <span className="text-base font-semibold">{slot.startLocal}</span>
                        {slot.totalCapacity > 1 && (
                          <span className={`block text-xs mt-0.5 ${
                            slot.spotsLeft <= 2 ? 'text-amber-400' : 'text-surface-500'
                          }`}>
                            {slot.spotsLeft} spot{slot.spotsLeft !== 1 ? 's' : ''} left
                          </span>
                        )}
                        {isActive && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                            <HiOutlineCheck className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar: Summary & Confirm */}
        <div className="lg:col-span-2">
          {step === 4 ? (
            /* Success State */
            <div className="glass-card p-8 text-center animate-scale-in">
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
                <HiOutlineCheck className="w-10 h-10 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Booking Confirmed!</h2>
              <p className="text-surface-400 mb-6">
                Your appointment has been booked successfully. A confirmation email has been sent.
              </p>

              <div className="bg-surface-800/50 rounded-xl p-4 mb-6 text-left space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-surface-400">Service</span>
                  <span className="text-white font-medium">{service.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-surface-400">Date</span>
                  <span className="text-white font-medium">{formatDate(selectedDate)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-surface-400">Time</span>
                  <span className="text-white font-medium">
                    {selectedSlot?.startLocal} – {selectedSlot?.endLocal}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-surface-400">Price</span>
                  <span className="text-white font-medium">₹{service.price}</span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Link to="/dashboard" className="btn-primary w-full">
                  View My Bookings
                </Link>
                <Link to={`/business/${businessId}`} className="btn-secondary w-full">
                  Book Another Service
                </Link>
              </div>
            </div>
          ) : (
            /* Booking Summary */
            <div className="glass-card p-6 sticky top-24">
              <h3 className="text-lg font-semibold text-white mb-4">Booking Summary</h3>

              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold">
                    {business.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-white font-medium">{business.name}</p>
                    <p className="text-xs text-surface-500">{business.category}</p>
                  </div>
                </div>

                <div className="h-px bg-surface-700" />

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-surface-400">Service</span>
                    <span className="text-white">{service.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-surface-400">Duration</span>
                    <span className="text-white">{service.duration} min</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-surface-400">Price</span>
                    <span className="text-white font-semibold">₹{service.price}</span>
                  </div>

                  {selectedDate && (
                    <>
                      <div className="h-px bg-surface-700 my-2" />
                      <div className="flex justify-between">
                        <span className="text-surface-400">Date</span>
                        <span className="text-primary-300">{formatDate(selectedDate)}</span>
                      </div>
                    </>
                  )}

                  {selectedSlot && (
                    <div className="flex justify-between">
                      <span className="text-surface-400">Time</span>
                      <span className="text-primary-300">
                        {selectedSlot.startLocal} – {selectedSlot.endLocal}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Confirm button */}
              {step === 3 && (
                <div className="space-y-3">
                  {!isAuthenticated && (
                    <p className="text-xs text-amber-400 bg-amber-400/10 rounded-lg p-3">
                      ⚠️ You'll need to log in to complete your booking.
                    </p>
                  )}
                  <button
                    onClick={handleConfirmBooking}
                    disabled={booking}
                    className="btn-primary w-full !py-3.5"
                  >
                    {booking ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Booking...
                      </span>
                    ) : (
                      <>
                        <HiOutlineCheck className="w-5 h-5" />
                        Confirm Booking
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => { setStep(2); setSelectedSlot(null); }}
                    className="btn-secondary w-full"
                  >
                    Change Time
                  </button>
                </div>
              )}

              {step < 3 && (
                <p className="text-xs text-surface-600 text-center">
                  {step === 1 ? 'Select a date to continue' : 'Pick a time slot to continue'}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
