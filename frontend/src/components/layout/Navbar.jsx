import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { HiOutlineCalendar, HiOutlineBell, HiOutlineLogout, HiOutlineUser, HiOutlineMenu, HiOutlineX } from 'react-icons/hi';
import { useState } from 'react';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 bg-surface-900/80 backdrop-blur-xl border-b border-surface-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-glow group-hover:shadow-glow-lg transition-shadow duration-300">
              <HiOutlineCalendar className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">BookEase</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <Link to="/browse" className="btn-ghost text-sm">
                  Browse
                </Link>
                <Link to="/dashboard" className="btn-ghost text-sm">
                  Dashboard
                </Link>
                <div className="w-px h-6 bg-surface-700 mx-2" />
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-800 border border-surface-700">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                      <span className="text-xs font-bold text-white">
                        {user?.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-surface-200 leading-none">{user?.name}</p>
                      <p className="text-xs text-surface-500 capitalize">{user?.role}</p>
                    </div>
                  </div>
                  <button onClick={handleLogout} className="btn-ghost text-sm text-surface-500 hover:text-red-400" title="Logout">
                    <HiOutlineLogout className="w-5 h-5" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link to="/browse" className="btn-ghost text-sm">
                  Browse
                </Link>
                <Link to="/login" className="btn-ghost text-sm">
                  Log In
                </Link>
                <Link to="/signup" className="btn-primary text-sm !py-2 !px-5">
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-surface-800 text-surface-400 transition-colors"
          >
            {mobileMenuOpen ? <HiOutlineX className="w-6 h-6" /> : <HiOutlineMenu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-surface-700/50 bg-surface-900/95 backdrop-blur-xl animate-slide-down">
          <div className="px-4 py-4 space-y-2">
            <Link to="/browse" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 rounded-xl text-surface-300 hover:bg-surface-800 hover:text-white transition-colors">
              Browse Businesses
            </Link>
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 rounded-xl text-surface-300 hover:bg-surface-800 hover:text-white transition-colors">
                  Dashboard
                </Link>
                <div className="border-t border-surface-700 my-2" />
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                    <span className="text-sm font-bold text-white">{user?.name?.charAt(0).toUpperCase()}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-surface-200">{user?.name}</p>
                    <p className="text-xs text-surface-500 capitalize">{user?.role}</p>
                  </div>
                </div>
                <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="w-full text-left px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors">
                  Log Out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 rounded-xl text-surface-300 hover:bg-surface-800 hover:text-white transition-colors">
                  Log In
                </Link>
                <Link to="/signup" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 rounded-xl bg-primary-600 text-white text-center font-medium hover:bg-primary-500 transition-colors">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
