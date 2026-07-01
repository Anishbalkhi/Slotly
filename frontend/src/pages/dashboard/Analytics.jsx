import { useState, useEffect, useMemo } from 'react';
import api from '../../api/axios';
import {
  HiOutlineChartBar,
  HiOutlineCurrencyRupee,
  HiOutlineStar,
  HiOutlineTrendingUp,
  HiOutlineXCircle,
  HiOutlineCalendar,
  HiOutlineUser,
  HiOutlineClock,
} from 'react-icons/hi';

const Analytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('6months');

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/analytics?period=${period}`);
        setData(res.data.data);
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [period]);

  // ── Bar Chart Component ─────────────────────────────────────────────
  const BarChart = ({ items, valueKey, color = 'primary', formatValue }) => {
    const maxVal = Math.max(...items.map((i) => i[valueKey]), 1);

    return (
      <div className="flex items-end gap-1.5 h-40">
        {items.map((item, i) => {
          const height = (item[valueKey] / maxVal) * 100;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
              <div className="relative w-full flex items-end justify-center" style={{ height: '120px' }}>
                <div
                  className={`w-full max-w-[40px] rounded-t-lg bg-${color}-500/60 group-hover:bg-${color}-500/90 transition-all duration-300 relative`}
                  style={{ height: `${Math.max(height, 3)}%` }}
                >
                  {/* Tooltip */}
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-surface-700 text-white text-[10px] px-2 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                    {formatValue ? formatValue(item[valueKey]) : item[valueKey]}
                  </div>
                </div>
              </div>
              <span className="text-[10px] text-surface-500 truncate w-full text-center">{item.label || item.day}</span>
            </div>
          );
        })}
      </div>
    );
  };

  // ── Donut Chart Component ───────────────────────────────────────────
  const DonutChart = ({ items }) => {
    const total = items.reduce((sum, i) => sum + i.count, 0) || 1;
    const colors = [
      'rgba(99, 102, 241, 0.8)',
      'rgba(20, 184, 166, 0.8)',
      'rgba(245, 158, 11, 0.8)',
      'rgba(239, 68, 68, 0.8)',
      'rgba(168, 85, 247, 0.8)',
    ];

    let cumulativePercent = 0;
    const segments = items.map((item, i) => {
      const percent = (item.count / total) * 100;
      const start = cumulativePercent;
      cumulativePercent += percent;
      return { ...item, percent, start, color: colors[i % colors.length] };
    });

    const gradientParts = segments.map(
      (s) => `${s.color} ${s.start}% ${s.start + s.percent}%`
    ).join(', ');

    return (
      <div className="flex items-center gap-6">
        <div
          className="w-28 h-28 rounded-full flex-shrink-0 relative"
          style={{
            background: items.length > 0
              ? `conic-gradient(${gradientParts})`
              : 'rgba(51, 65, 85, 0.5)',
          }}
        >
          <div className="absolute inset-3 bg-surface-900 rounded-full flex items-center justify-center">
            <span className="text-xl font-bold text-white">{total}</span>
          </div>
        </div>
        <div className="flex-1 space-y-2">
          {segments.map((s, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: s.color }} />
              <span className="text-surface-300 truncate flex-1">{s.name}</span>
              <span className="text-surface-500 text-xs">{s.count}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="space-y-6">
          <div className="skeleton h-10 w-48" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton h-28 rounded-2xl" />
            ))}
          </div>
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="skeleton h-64 rounded-2xl" />
            <div className="skeleton h-64 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { overview, bookingsByMonth, revenueByMonth, topServices, bookingsByDay, recentBookings } = data;

  return (
    <div className="page-container animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Analytics</h1>
          <p className="text-surface-400">Track your business performance and growth.</p>
        </div>

        {/* Period Selector */}
        <div className="flex items-center bg-surface-800 rounded-xl border border-surface-700 p-1">
          {[
            { key: '6months', label: '6M' },
            { key: '1year', label: '1Y' },
            { key: 'all', label: 'All' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setPeriod(key)}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                period === key
                  ? 'bg-primary-500/15 text-primary-400'
                  : 'text-surface-400 hover:text-surface-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <p className="text-sm text-surface-400">Bookings</p>
            <div className="w-9 h-9 rounded-xl bg-primary-500/10 flex items-center justify-center">
              <HiOutlineCalendar className="w-4 h-4 text-primary-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white">{overview.totalBookings}</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <p className="text-sm text-surface-400">Revenue</p>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <HiOutlineCurrencyRupee className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white">₹{overview.revenue.toLocaleString()}</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <p className="text-sm text-surface-400">Avg Rating</p>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <HiOutlineStar className="w-4 h-4 text-amber-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white">
            {overview.avgRating > 0 ? overview.avgRating.toFixed(1) : '—'}
          </p>
          <p className="text-xs text-surface-500">{overview.reviewCount} reviews</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <p className="text-sm text-surface-400">Cancelled</p>
            <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center">
              <HiOutlineXCircle className="w-4 h-4 text-red-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white">{overview.totalCancelled}</p>
          <p className="text-xs text-surface-500">{overview.cancellationRate}% rate</p>
        </div>

        <div className="stat-card col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <p className="text-sm text-surface-400">Completion</p>
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 flex items-center justify-center">
              <HiOutlineTrendingUp className="w-4 h-4 text-teal-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white">{100 - overview.cancellationRate}%</p>
          <p className="text-xs text-surface-500">completion rate</p>
        </div>
      </div>

      {/* Charts Row 1: Bookings & Revenue */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Bookings Over Time */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-6">
            <HiOutlineChartBar className="w-5 h-5 text-primary-400" />
            <h3 className="text-lg font-semibold text-white">Bookings Over Time</h3>
          </div>
          {bookingsByMonth.length > 0 ? (
            <BarChart items={bookingsByMonth} valueKey="count" color="primary" />
          ) : (
            <div className="h-40 flex items-center justify-center text-surface-500 text-sm">
              No data yet
            </div>
          )}
        </div>

        {/* Revenue Over Time */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-6">
            <HiOutlineCurrencyRupee className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-semibold text-white">Revenue Over Time</h3>
          </div>
          {revenueByMonth.length > 0 ? (
            <BarChart
              items={revenueByMonth}
              valueKey="revenue"
              color="emerald"
              formatValue={(v) => `₹${v.toLocaleString()}`}
            />
          ) : (
            <div className="h-40 flex items-center justify-center text-surface-500 text-sm">
              No data yet
            </div>
          )}
        </div>
      </div>

      {/* Charts Row 2: Top Services & Day Distribution */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Top Services */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-6">
            <HiOutlineStar className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-semibold text-white">Top Services</h3>
          </div>
          {topServices.length > 0 ? (
            <DonutChart items={topServices} />
          ) : (
            <div className="h-36 flex items-center justify-center text-surface-500 text-sm">
              No data yet
            </div>
          )}
        </div>

        {/* Bookings by Day of Week */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-6">
            <HiOutlineCalendar className="w-5 h-5 text-teal-400" />
            <h3 className="text-lg font-semibold text-white">Busiest Days</h3>
          </div>
          {bookingsByDay.some((d) => d.count > 0) ? (
            <BarChart items={bookingsByDay} valueKey="count" color="teal" />
          ) : (
            <div className="h-40 flex items-center justify-center text-surface-500 text-sm">
              No data yet
            </div>
          )}
        </div>
      </div>

      {/* Recent Bookings Table */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-6">
          <HiOutlineClock className="w-5 h-5 text-primary-400" />
          <h3 className="text-lg font-semibold text-white">Recent Bookings</h3>
        </div>

        {recentBookings.length === 0 ? (
          <div className="py-8 text-center text-surface-500 text-sm">No bookings yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-700/50">
                  <th className="text-left text-surface-400 font-medium py-3 px-2">Customer</th>
                  <th className="text-left text-surface-400 font-medium py-3 px-2">Service</th>
                  <th className="text-left text-surface-400 font-medium py-3 px-2">Date</th>
                  <th className="text-left text-surface-400 font-medium py-3 px-2">Time</th>
                  <th className="text-right text-surface-400 font-medium py-3 px-2">Amount</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((booking) => (
                  <tr key={booking._id} className="border-b border-surface-800/50 hover:bg-surface-800/30 transition-colors">
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-primary-500/15 flex items-center justify-center text-primary-400 text-xs font-semibold">
                          {booking.customerId?.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="text-white font-medium">{booking.customerId?.name || 'N/A'}</p>
                          <p className="text-surface-500 text-xs">{booking.customerId?.email || ''}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-surface-300">{booking.serviceId?.name || 'N/A'}</td>
                    <td className="py-3 px-2 text-surface-300">
                      {new Date(booking.start).toLocaleDateString('en-IN', {
                        month: 'short', day: 'numeric',
                      })}
                    </td>
                    <td className="py-3 px-2 text-surface-300">
                      {new Date(booking.start).toLocaleTimeString('en-IN', {
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-2 text-right text-white font-medium">
                      ₹{booking.serviceId?.price || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;
