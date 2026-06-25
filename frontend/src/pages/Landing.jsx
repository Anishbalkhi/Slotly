import { Link } from 'react-router-dom';
import { HiOutlineCalendar, HiOutlineClock, HiOutlineShieldCheck, HiOutlineLightningBolt, HiOutlineStar, HiOutlineUserGroup } from 'react-icons/hi';

const features = [
  {
    icon: HiOutlineCalendar,
    title: 'Smart Scheduling',
    description: 'Automated availability management with conflict prevention and real-time slot updates.',
    gradient: 'from-primary-500 to-indigo-600',
  },
  {
    icon: HiOutlineClock,
    title: 'Instant Booking',
    description: 'Customers book in seconds. No phone calls, no waiting. Just pick a time and confirm.',
    gradient: 'from-teal-500 to-emerald-600',
  },
  {
    icon: HiOutlineShieldCheck,
    title: 'Zero Double-Bookings',
    description: 'Atomic operations ensure no two customers ever book the same slot. Peace of mind guaranteed.',
    gradient: 'from-amber-500 to-orange-600',
  },
  {
    icon: HiOutlineLightningBolt,
    title: 'Email Notifications',
    description: 'Automatic confirmations, reminders, and cancellation notices keep everyone in the loop.',
    gradient: 'from-rose-500 to-pink-600',
  },
  {
    icon: HiOutlineStar,
    title: 'Reviews & Ratings',
    description: 'Build trust with verified customer reviews. Showcase your reputation front and center.',
    gradient: 'from-purple-500 to-violet-600',
  },
  {
    icon: HiOutlineUserGroup,
    title: 'Multi-Staff Support',
    description: 'Manage multiple staff schedules, assign bookings, and track availability per provider.',
    gradient: 'from-cyan-500 to-blue-600',
  },
];

const Landing = () => {
  return (
    <div className="relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-600/5 rounded-full blur-3xl" />
      </div>

      {/* Hero Section */}
      <section className="relative page-container pt-20 pb-32">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-sm font-medium mb-8 animate-fade-in">
            <span className="w-2 h-2 bg-primary-400 rounded-full animate-pulse-soft" />
            Now in beta — Start booking for free
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 animate-slide-up">
            <span className="text-white">Appointment booking</span>
            <br />
            <span className="gradient-text">made effortless</span>
          </h1>

          <p className="text-lg sm:text-xl text-surface-400 max-w-2xl mx-auto mb-10 leading-relaxed animate-slide-up animate-delay-100">
            The all-in-one scheduling platform for small businesses. Set up your services, 
            share your booking page, and let customers book 24/7 — no phone tag required.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up animate-delay-200">
            <Link to="/signup" className="btn-primary text-base !px-8 !py-4 w-full sm:w-auto">
              Get Started Free
              <span className="text-primary-200">→</span>
            </Link>
            <Link to="/browse" className="btn-secondary text-base !px-8 !py-4 w-full sm:w-auto">
              Browse Businesses
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-3 gap-8 max-w-lg mx-auto animate-fade-in animate-delay-300">
            {[
              { value: '24/7', label: 'Online Booking' },
              { value: '0', label: 'Double Bookings' },
              { value: '∞', label: 'Peace of Mind' },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-3xl font-bold text-white">{stat.value}</p>
                <p className="text-sm text-surface-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative page-container pb-32">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Everything you need to <span className="gradient-text">manage bookings</span>
          </h2>
          <p className="text-surface-400 max-w-xl mx-auto">
            From scheduling to notifications, BookEase handles the heavy lifting so you can focus on your business.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <div
              key={feature.title}
              className="glass-card p-6 group hover:border-primary-500/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-glow"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-surface-400 text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative page-container pb-32">
        <div className="glass-card p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary-600/10 to-purple-600/10" />
          <div className="relative">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Ready to simplify your scheduling?
            </h2>
            <p className="text-surface-400 max-w-xl mx-auto mb-8">
              Join thousands of businesses that trust BookEase for effortless appointment management.
            </p>
            <Link to="/signup" className="btn-primary text-base !px-8 !py-4">
              Start For Free — No Credit Card Required
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-surface-800 py-8">
        <div className="page-container flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
              <HiOutlineCalendar className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold gradient-text">BookEase</span>
          </div>
          <p className="text-xs text-surface-600">
            © {new Date().getFullYear()} BookEase. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
