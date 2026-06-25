import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  HiOutlineViewGrid,
  HiOutlineCalendar,
  HiOutlineBriefcase,
  HiOutlineClipboardList,
  HiOutlineCog,
  HiOutlineSearch,
  HiOutlineUser,
} from 'react-icons/hi';

const Sidebar = () => {
  const { isOwner, isCustomer } = useAuth();

  const ownerLinks = [
    { to: '/dashboard', icon: HiOutlineViewGrid, label: 'Dashboard' },
    { to: '/dashboard/calendar', icon: HiOutlineCalendar, label: 'Calendar' },
    { to: '/dashboard/services', icon: HiOutlineClipboardList, label: 'Services' },
    { to: '/dashboard/business', icon: HiOutlineBriefcase, label: 'Business' },
    { to: '/dashboard/settings', icon: HiOutlineCog, label: 'Settings' },
  ];

  const customerLinks = [
    { to: '/dashboard', icon: HiOutlineViewGrid, label: 'My Bookings' },
    { to: '/browse', icon: HiOutlineSearch, label: 'Browse' },
    { to: '/dashboard/profile', icon: HiOutlineUser, label: 'Profile' },
  ];

  const links = isOwner ? ownerLinks : customerLinks;

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-surface-900 border-r border-surface-700/50 min-h-[calc(100vh-64px)]">
      <div className="flex-1 p-4 space-y-1">
        <p className="px-3 py-2 text-xs font-semibold text-surface-500 uppercase tracking-wider">
          {isOwner ? 'Business' : 'Navigation'}
        </p>
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/dashboard'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-primary-500/10 text-primary-400 shadow-sm'
                  : 'text-surface-400 hover:bg-surface-800 hover:text-surface-200'
              }`
            }
          >
            <link.icon className="w-5 h-5 flex-shrink-0" />
            {link.label}
          </NavLink>
        ))}
      </div>

      {/* Bottom section */}
      <div className="p-4 border-t border-surface-700/50">
        <div className="glass-card p-3">
          <p className="text-xs text-surface-500 mb-1">Need help?</p>
          <p className="text-xs text-surface-400">Contact support or read our docs.</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
