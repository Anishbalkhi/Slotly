import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axios';
import {
  HiOutlineClock,
  HiOutlineCurrencyRupee,
  HiOutlineLocationMarker,
  HiOutlinePhone,
  HiOutlineMail,
  HiOutlineStar,
  HiOutlineCalendar,
} from 'react-icons/hi';

const DAY_LABELS = {
  monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday',
  thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday',
};

const BusinessPublic = () => {
  const { id } = useParams();
  const [business, setBusiness] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBusiness = async () => {
      try {
        const res = await api.get(`/businesses/${id}`);
        setBusiness(res.data.data);

        const servRes = await api.get(`/businesses/${id}/services`);
        setServices(servRes.data.data);
      } catch (error) {
        console.error('Failed to fetch business:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBusiness();
  }, [id]);

  if (loading) {
    return (
      <div className="page-container">
        <div className="space-y-6">
          <div className="skeleton h-48 rounded-2xl" />
          <div className="skeleton h-8 w-64" />
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-24 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="page-container text-center py-20">
        <h2 className="text-2xl font-bold text-white mb-2">Business not found</h2>
        <p className="text-surface-400 mb-6">This business may have been removed.</p>
        <Link to="/browse" className="btn-primary">Browse Businesses</Link>
      </div>
    );
  }

  return (
    <div className="page-container animate-fade-in">
      {/* Header Banner */}
      <div className="glass-card overflow-hidden mb-8">
        <div className="h-32 bg-gradient-to-r from-primary-600/20 via-purple-600/20 to-primary-600/20 relative">
          <div className="absolute inset-0 bg-gradient-to-t from-surface-800/80 to-transparent" />
        </div>
        <div className="px-8 pb-8 -mt-10 relative">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-glow text-3xl font-bold text-white mb-4">
            {business.name.charAt(0)}
          </div>

          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">{business.name}</h1>
              <div className="flex items-center gap-3 text-sm text-surface-400 mb-3">
                <span className="px-2 py-0.5 bg-surface-700 rounded-lg text-xs">{business.category}</span>
                {business.avgRating > 0 && (
                  <span className="flex items-center gap-1">
                    <HiOutlineStar className="w-4 h-4 text-amber-400" />
                    {business.avgRating.toFixed(1)} ({business.reviewCount})
                  </span>
                )}
              </div>
              {business.description && (
                <p className="text-surface-300 max-w-xl">{business.description}</p>
              )}
            </div>
          </div>

          {/* Contact Info */}
          <div className="flex flex-wrap gap-4 mt-4 text-sm text-surface-400">
            {business.address?.city && (
              <span className="flex items-center gap-1">
                <HiOutlineLocationMarker className="w-4 h-4" />
                {[business.address.street, business.address.city, business.address.state].filter(Boolean).join(', ')}
              </span>
            )}
            {business.phone && (
              <span className="flex items-center gap-1">
                <HiOutlinePhone className="w-4 h-4" />
                {business.phone}
              </span>
            )}
            {business.email && (
              <span className="flex items-center gap-1">
                <HiOutlineMail className="w-4 h-4" />
                {business.email}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Business Hours */}
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <h2 className="text-xl font-bold text-white mb-4">Services</h2>
          {services.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <p className="text-surface-400">No services available yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {services.map((service) => (
                <div key={service._id} className="glass-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-primary-500/20 transition-all">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">{service.name}</h3>
                    {service.description && (
                      <p className="text-sm text-surface-400 mb-2">{service.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-surface-500">
                      <span className="flex items-center gap-1">
                        <HiOutlineClock className="w-4 h-4" />
                        {service.duration} min
                      </span>
                      <span className="flex items-center gap-1">
                        <HiOutlineCurrencyRupee className="w-4 h-4" />
                        ₹{service.price}
                      </span>
                    </div>
                  </div>
                  <Link
                    to={`/book/${business._id}/${service._id}`}
                    className="btn-primary text-sm !py-2.5 whitespace-nowrap"
                  >
                    <HiOutlineCalendar className="w-4 h-4" />
                    Book Now
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Hours Sidebar */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Hours</h2>
          <div className="glass-card p-5">
            <div className="space-y-3">
              {Object.entries(business.hours || {}).map(([day, info]) => (
                <div key={day} className="flex items-center justify-between text-sm">
                  <span className="text-surface-300 capitalize">{DAY_LABELS[day]}</span>
                  <span className={info.isOpen ? 'text-surface-200' : 'text-surface-600'}>
                    {info.isOpen ? `${info.open} – ${info.close}` : 'Closed'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessPublic;
