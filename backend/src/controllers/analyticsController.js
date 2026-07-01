const Appointment = require('../models/Appointment');
const Business = require('../models/Business');
const Review = require('../models/Review');
const AppError = require('../utils/AppError');

/**
 * GET /api/analytics
 * Returns analytics data for the authenticated business owner.
 * Includes: bookings over time, revenue, top services, ratings summary,
 * daily/weekly trends, and cancellation rate.
 */
const getAnalytics = async (req, res, next) => {
  try {
    // Get owner's businesses
    const businesses = await Business.find({ ownerId: req.user._id });
    if (businesses.length === 0) {
      return res.json({
        success: true,
        data: {
          overview: { totalBookings: 0, revenue: 0, avgRating: 0, reviewCount: 0, cancellationRate: 0 },
          bookingsByMonth: [],
          revenueByMonth: [],
          topServices: [],
          bookingsByDay: [],
          recentBookings: [],
        },
      });
    }

    const businessIds = businesses.map((b) => b._id);
    const period = req.query.period || '6months'; // 6months, 1year, all

    // Calculate date range
    let startDate;
    const now = new Date();
    if (period === '1year') {
      startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
    } else if (period === 'all') {
      startDate = new Date(2020, 0, 1);
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1); // 6 months
    }

    // ── All appointments in range ────────────────────────────────────
    const allAppointments = await Appointment.find({
      businessId: { $in: businessIds },
      createdAt: { $gte: startDate },
    }).populate('serviceId', 'name price duration');

    const confirmed = allAppointments.filter((a) => a.status === 'confirmed');
    const cancelled = allAppointments.filter((a) => a.status === 'cancelled');

    // ── Overview ─────────────────────────────────────────────────────
    const totalRevenue = confirmed.reduce((sum, a) => sum + (a.serviceId?.price || 0), 0);

    const overview = {
      totalBookings: confirmed.length,
      revenue: totalRevenue,
      avgRating: businesses.reduce((sum, b) => sum + (b.avgRating || 0), 0) / businesses.length || 0,
      reviewCount: businesses.reduce((sum, b) => sum + (b.reviewCount || 0), 0),
      cancellationRate: allAppointments.length > 0
        ? Math.round((cancelled.length / allAppointments.length) * 100)
        : 0,
      totalCancelled: cancelled.length,
    };

    // ── Bookings & Revenue by Month ──────────────────────────────────
    const monthMap = {};
    const revenueMap = {};

    confirmed.forEach((a) => {
      const d = new Date(a.start);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthMap[key] = (monthMap[key] || 0) + 1;
      revenueMap[key] = (revenueMap[key] || 0) + (a.serviceId?.price || 0);
    });

    // Generate all months in range
    const bookingsByMonth = [];
    const revenueByMonth = [];
    const cursor = new Date(startDate);
    while (cursor <= now) {
      const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`;
      const label = cursor.toLocaleString('default', { month: 'short', year: '2-digit' });
      bookingsByMonth.push({ month: key, label, count: monthMap[key] || 0 });
      revenueByMonth.push({ month: key, label, revenue: revenueMap[key] || 0 });
      cursor.setMonth(cursor.getMonth() + 1);
    }

    // ── Top Services ─────────────────────────────────────────────────
    const serviceMap = {};
    confirmed.forEach((a) => {
      const name = a.serviceId?.name || 'Unknown';
      if (!serviceMap[name]) {
        serviceMap[name] = { name, count: 0, revenue: 0 };
      }
      serviceMap[name].count += 1;
      serviceMap[name].revenue += a.serviceId?.price || 0;
    });
    const topServices = Object.values(serviceMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // ── Bookings by Day of Week ──────────────────────────────────────
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayCount = [0, 0, 0, 0, 0, 0, 0];
    confirmed.forEach((a) => {
      const day = new Date(a.start).getDay();
      dayCount[day]++;
    });
    const bookingsByDay = dayNames.map((name, i) => ({ day: name, count: dayCount[i] }));

    // ── Recent Bookings (last 10) ────────────────────────────────────
    const recentBookings = await Appointment.find({
      businessId: { $in: businessIds },
      status: 'confirmed',
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('serviceId', 'name price')
      .populate('customerId', 'name email');

    res.json({
      success: true,
      data: {
        overview,
        bookingsByMonth,
        revenueByMonth,
        topServices,
        bookingsByDay,
        recentBookings,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAnalytics };
