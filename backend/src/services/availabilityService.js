const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

const Business = require('../models/Business');
const Service = require('../models/Service');
const Staff = require('../models/Staff');
const Appointment = require('../models/Appointment');
const AppError = require('../utils/AppError');

// Map JS getDay() (0=Sun) to our hours keys
const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

/**
 * Generate available time slots for a given business, service, and date.
 * Optionally filters by staff member's personal schedule.
 *
 * @param {string} businessId
 * @param {string} serviceId
 * @param {string} dateStr  – YYYY-MM-DD in the business's timezone
 * @param {string} [staffId] – optional staff member ID to filter by
 * @returns {Array<{ start: string, end: string, spotsLeft: number }>}
 */
const getAvailableSlots = async (businessId, serviceId, dateStr, staffId = null) => {
  // ── 1. Load business & service ───────────────────────────────────
  const business = await Business.findById(businessId);
  if (!business) throw new AppError('Business not found', 404);

  const service = await Service.findById(serviceId);
  if (!service) throw new AppError('Service not found', 404);
  if (service.businessId.toString() !== businessId) {
    throw new AppError('Service does not belong to this business', 400);
  }

  // ── 1b. Optionally load staff member ─────────────────────────────
  let staffMember = null;
  if (staffId) {
    staffMember = await Staff.findById(staffId);
    if (!staffMember) throw new AppError('Staff member not found', 404);
    if (staffMember.businessId.toString() !== businessId) {
      throw new AppError('Staff member does not belong to this business', 400);
    }
    if (!staffMember.isActive) {
      throw new AppError('Staff member is not active', 400);
    }
  }

  const tz = business.timezone || 'Asia/Kolkata';
  const duration = service.duration;           // minutes
  const buffer = service.bufferMinutes || 0;   // minutes
  const capacity = service.capacity || 1;
  const step = duration + buffer;

  // ── 2. Validate date ─────────────────────────────────────────────
  const targetDate = dayjs.tz(dateStr, tz);
  if (!targetDate.isValid()) {
    throw new AppError('Invalid date format. Use YYYY-MM-DD.', 400);
  }

  // Don't allow past dates
  const todayInBizTz = dayjs().tz(tz).startOf('day');
  if (targetDate.isBefore(todayInBizTz)) {
    return []; // past date → no slots
  }

  // Don't allow dates beyond maxAdvanceDays
  const maxDate = todayInBizTz.add(business.maxAdvanceDays || 30, 'day');
  if (targetDate.isAfter(maxDate)) {
    return []; // too far in the future
  }

  // ── 3. Get business hours for this weekday ───────────────────────
  const dayOfWeek = targetDate.day(); // 0 = Sunday
  const dayKey = DAY_KEYS[dayOfWeek];
  const dayHours = business.hours?.[dayKey];

  if (!dayHours || !dayHours.isOpen) {
    return []; // business is closed this day
  }

  // ── 4. Build open/close as timezone-aware Date objects ───────────
  const [openH, openM] = dayHours.open.split(':').map(Number);
  const [closeH, closeM] = dayHours.close.split(':').map(Number);

  let openTime = targetDate.hour(openH).minute(openM).second(0).millisecond(0);
  let closeTime = targetDate.hour(closeH).minute(closeM).second(0).millisecond(0);

  if (closeTime.isBefore(openTime) || closeTime.isSame(openTime)) {
    return []; // invalid hours config
  }

  // ── 4b. Intersect with staff schedule if provided ────────────────
  if (staffMember && staffMember.weeklyAvailability?.length > 0) {
    const staffDay = staffMember.weeklyAvailability.find((d) => d.day === dayOfWeek);
    if (!staffDay) {
      return []; // staff doesn't work this day
    }

    const [staffOpenH, staffOpenM] = staffDay.start.split(':').map(Number);
    const [staffCloseH, staffCloseM] = staffDay.end.split(':').map(Number);

    const staffStart = targetDate.hour(staffOpenH).minute(staffOpenM).second(0).millisecond(0);
    const staffEnd = targetDate.hour(staffCloseH).minute(staffCloseM).second(0).millisecond(0);

    // Intersect: take the later start and earlier end
    if (staffStart.isAfter(openTime)) openTime = staffStart;
    if (staffEnd.isBefore(closeTime)) closeTime = staffEnd;

    // If intersection is invalid, no slots
    if (closeTime.isBefore(openTime) || closeTime.isSame(openTime)) {
      return [];
    }
  }

  // ── 5. Generate all possible slots ───────────────────────────────
  const allSlots = [];
  let cursor = openTime;

  while (cursor.add(duration, 'minute').isBefore(closeTime) ||
         cursor.add(duration, 'minute').isSame(closeTime)) {
    const slotStart = cursor;
    const slotEnd = cursor.add(duration, 'minute');

    allSlots.push({
      start: slotStart.utc().toISOString(),
      end: slotEnd.utc().toISOString(),
      startLocal: slotStart.format('HH:mm'),
      endLocal: slotEnd.format('HH:mm'),
    });

    cursor = cursor.add(step, 'minute');
  }

  if (allSlots.length === 0) return [];

  // ── 6. Query existing confirmed appointments for this range ─────
  const rangeStart = openTime.utc().toDate();
  const rangeEnd = closeTime.utc().toDate();

  const apptFilter = {
    businessId,
    serviceId,
    status: 'confirmed',
    start: { $gte: rangeStart },
    end: { $lte: rangeEnd },
  };

  // If staff-specific, only count appointments for this staff
  if (staffId) {
    apptFilter.staffId = staffId;
  }

  const existingAppointments = await Appointment.find(apptFilter);

  // ── 7. Count bookings per slot & compute spots left ──────────────
  const now = dayjs().utc();

  const availableSlots = allSlots
    .filter((slot) => {
      // Filter out past slots (for today)
      if (dayjs(slot.start).isBefore(now)) return false;
      return true;
    })
    .map((slot) => {
      const bookedCount = existingAppointments.filter(
        (appt) =>
          appt.start.toISOString() === slot.start &&
          appt.end.toISOString() === slot.end
      ).length;

      return {
        start: slot.start,
        end: slot.end,
        startLocal: slot.startLocal,
        endLocal: slot.endLocal,
        spotsLeft: capacity - bookedCount,
        totalCapacity: capacity,
      };
    })
    .filter((slot) => slot.spotsLeft > 0);

  return availableSlots;
};

module.exports = { getAvailableSlots };
