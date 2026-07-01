import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import {
  HiOutlineClock,
  HiOutlineCurrencyRupee,
  HiOutlineLocationMarker,
  HiOutlinePhone,
  HiOutlineMail,
  HiOutlineStar,
  HiOutlineCalendar,
  HiOutlineTrash,
} from 'react-icons/hi';

const DAY_LABELS = {
  monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday',
  thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday',
};

const StarRating = ({ rating, onRate, interactive = false, size = 'w-5 h-5' }) => {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type={interactive ? 'button' : undefined}
          disabled={!interactive}
          onClick={() => interactive && onRate?.(star)}
          onMouseEnter={() => interactive && setHover(star)}
          onMouseLeave={() => interactive && setHover(0)}
          className={`transition-colors ${interactive ? 'cursor-pointer' : 'cursor-default'}`}
        >
          <svg
            className={`${size} ${
              star <= (hover || rating)
                ? 'text-amber-400 fill-amber-400'
                : 'text-surface-600 fill-surface-600'
            } transition-colors`}
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
    </div>
  );
};

const BusinessPublic = () => {
  const { id } = useParams();
  const { isAuthenticated, user } = useAuth();
  const [business, setBusiness] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);

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

  // Fetch reviews
  useEffect(() => {
    const fetchReviews = async () => {
      setReviewsLoading(true);
      try {
        const res = await api.get(`/businesses/${id}/reviews`);
        setReviews(res.data.data);

        // Check if current user already reviewed
        if (user) {
          const userReview = res.data.data.find(
            (r) => r.userId?._id === user._id
          );
          setHasReviewed(!!userReview);
        }
      } catch (error) {
        console.error('Failed to fetch reviews:', error);
      } finally {
        setReviewsLoading(false);
      }
    };
    fetchReviews();
  }, [id, user]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (newRating === 0) {
      toast.error('Please select a rating');
      return;
    }
    setSubmittingReview(true);
    try {
      const res = await api.post('/reviews', {
        businessId: id,
        rating: newRating,
        comment: newComment,
      });
      setReviews((prev) => [res.data.data, ...prev]);
      setHasReviewed(true);
      setShowReviewForm(false);
      setNewRating(0);
      setNewComment('');
      toast.success('Review submitted!');

      // Refresh business data to update avgRating
      const bizRes = await api.get(`/businesses/${id}`);
      setBusiness(bizRes.data.data);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete your review?')) return;
    try {
      await api.delete(`/reviews/${reviewId}`);
      setReviews((prev) => prev.filter((r) => r._id !== reviewId));
      setHasReviewed(false);
      toast.success('Review deleted');

      // Refresh business data
      const bizRes = await api.get(`/businesses/${id}`);
      setBusiness(bizRes.data.data);
    } catch (error) {
      toast.error('Failed to delete review');
    }
  };

  const formatReviewDate = (isoStr) => {
    return new Date(isoStr).toLocaleDateString('en-IN', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  };

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
                    {business.avgRating.toFixed(1)} ({business.reviewCount} review{business.reviewCount !== 1 ? 's' : ''})
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

      {/* Main Content Grid */}
      <div className="grid md:grid-cols-3 gap-8">
        {/* Services (2/3 width) */}
        <div className="md:col-span-2 space-y-8">
          {/* Services Section */}
          <div>
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
                        {service.capacity > 1 && (
                          <span className="px-2 py-0.5 bg-teal-500/10 text-teal-400 rounded-lg text-xs">
                            Group · {service.capacity} spots
                          </span>
                        )}
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

          {/* Reviews Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">
                Reviews {reviews.length > 0 && <span className="text-surface-500 text-base font-normal">({reviews.length})</span>}
              </h2>
              {isAuthenticated && user?.role === 'customer' && !hasReviewed && (
                <button
                  onClick={() => setShowReviewForm(!showReviewForm)}
                  className="btn-secondary text-sm !py-2"
                >
                  <HiOutlineStar className="w-4 h-4" />
                  Write a Review
                </button>
              )}
            </div>

            {/* Review Form */}
            {showReviewForm && (
              <form onSubmit={handleSubmitReview} className="glass-card p-5 mb-4 space-y-4">
                <div>
                  <label className="input-label mb-2">Your Rating</label>
                  <StarRating rating={newRating} onRate={setNewRating} interactive size="w-7 h-7" />
                </div>
                <div>
                  <label className="input-label">Comment (optional)</label>
                  <textarea
                    className="input-field resize-none"
                    rows={3}
                    placeholder="Tell others about your experience..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    maxLength={1000}
                  />
                  <p className="text-xs text-surface-600 mt-1">{newComment.length}/1000</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={submittingReview || newRating === 0}
                    className="btn-primary text-sm"
                  >
                    {submittingReview ? 'Submitting...' : 'Submit Review'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowReviewForm(false); setNewRating(0); setNewComment(''); }}
                    className="btn-ghost text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Reviews List */}
            {reviewsLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="skeleton h-24 rounded-2xl" />
                ))}
              </div>
            ) : reviews.length === 0 ? (
              <div className="glass-card p-8 text-center">
                <HiOutlineStar className="w-10 h-10 text-surface-700 mx-auto mb-3" />
                <p className="text-surface-400 mb-1">No reviews yet</p>
                <p className="text-sm text-surface-600">Be the first to leave a review!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.map((review) => (
                  <div key={review._id} className="glass-card p-5 hover:border-surface-600/50 transition-all">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500/80 to-purple-600/80 flex items-center justify-center text-white font-semibold text-sm">
                          {review.userId?.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{review.userId?.name || 'Anonymous'}</p>
                          <p className="text-xs text-surface-500">{formatReviewDate(review.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StarRating rating={review.rating} size="w-4 h-4" />
                        {user && review.userId?._id === user._id && (
                          <button
                            onClick={() => handleDeleteReview(review._id)}
                            className="text-surface-600 hover:text-red-400 transition-colors ml-2"
                            title="Delete review"
                          >
                            <HiOutlineTrash className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-surface-300 leading-relaxed">{review.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar (1/3 width) */}
        <div className="space-y-6">
          {/* Hours */}
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

          {/* Rating Summary */}
          {business.reviewCount > 0 && (
            <div>
              <h2 className="text-xl font-bold text-white mb-4">Rating</h2>
              <div className="glass-card p-5 text-center">
                <p className="text-4xl font-bold text-white mb-2">{business.avgRating.toFixed(1)}</p>
                <StarRating rating={Math.round(business.avgRating)} size="w-5 h-5" />
                <p className="text-sm text-surface-400 mt-2">
                  Based on {business.reviewCount} review{business.reviewCount !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BusinessPublic;
