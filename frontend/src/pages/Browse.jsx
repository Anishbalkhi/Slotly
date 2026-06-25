import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import {
  HiOutlineSearch,
  HiOutlineStar,
  HiOutlineLocationMarker,
  HiOutlineClock,
} from 'react-icons/hi';

const Browse = () => {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  const categories = [
    '', 'General', 'Health & Wellness', 'Beauty & Salon', 'Fitness',
    'Medical', 'Education', 'Consulting', 'Home Services', 'Other',
  ];

  useEffect(() => {
    const fetchBusinesses = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (category) params.append('category', category);
        const res = await api.get(`/businesses?${params.toString()}`);
        setBusinesses(res.data.data);
      } catch (error) {
        console.error('Failed to fetch businesses:', error);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(fetchBusinesses, 300);
    return () => clearTimeout(debounce);
  }, [search, category]);

  return (
    <div className="page-container animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Browse Businesses</h1>
        <p className="text-surface-400">Find and book appointments with local businesses.</p>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative flex-1">
          <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500" />
          <input
            type="text"
            placeholder="Search businesses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-11"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="input-field !w-auto min-w-[180px]"
        >
          <option value="">All Categories</option>
          {categories.filter(Boolean).map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton h-52 rounded-2xl" />
          ))}
        </div>
      ) : businesses.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <p className="text-surface-400 text-lg mb-2">No businesses found</p>
          <p className="text-surface-600 text-sm">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {businesses.map((biz) => (
            <Link
              key={biz._id}
              to={`/business/${biz._id}`}
              className="glass-card overflow-hidden group hover:border-primary-500/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-glow"
            >
              {/* Banner */}
              <div className="h-24 bg-gradient-to-r from-primary-600/20 via-purple-600/15 to-primary-600/20 relative">
                <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-surface-800/50 to-transparent" />
                <div className="absolute bottom-3 left-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold shadow-lg">
                    {biz.name.charAt(0)}
                  </div>
                </div>
              </div>

              <div className="p-5 pt-3">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-white group-hover:text-primary-300 transition-colors">
                    {biz.name}
                  </h3>
                  {biz.avgRating > 0 && (
                    <span className="flex items-center gap-1 text-sm text-amber-400">
                      <HiOutlineStar className="w-4 h-4" />
                      {biz.avgRating.toFixed(1)}
                    </span>
                  )}
                </div>

                <span className="inline-block px-2 py-0.5 bg-surface-700 rounded-lg text-xs text-surface-400 mb-3">
                  {biz.category}
                </span>

                {biz.description && (
                  <p className="text-sm text-surface-400 line-clamp-2 mb-3">{biz.description}</p>
                )}

                <div className="flex items-center gap-3 text-xs text-surface-500">
                  {biz.address?.city && (
                    <span className="flex items-center gap-1">
                      <HiOutlineLocationMarker className="w-3.5 h-3.5" />
                      {biz.address.city}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <HiOutlineClock className="w-3.5 h-3.5" />
                    {biz.timezone}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Browse;
