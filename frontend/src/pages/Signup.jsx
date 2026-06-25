import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { HiOutlineCalendar, HiOutlineMail, HiOutlineLockClosed, HiOutlineUser, HiOutlineEye, HiOutlineEyeOff } from 'react-icons/hi';

const Signup = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState('customer');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const user = await signup(data.name, data.email, data.password, selectedRole);
      toast.success(`Welcome to BookEase, ${user.name}!`);
      navigate(selectedRole === 'owner' ? '/dashboard/business' : '/dashboard', { replace: true });
    } catch (error) {
      const message = error.response?.data?.error || 'Signup failed. Please try again.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md animate-scale-in">
      {/* Logo */}
      <div className="text-center mb-8">
        <Link to="/" className="inline-flex items-center gap-2.5 group">
          <div className="w-11 h-11 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-glow group-hover:shadow-glow-lg transition-shadow">
            <HiOutlineCalendar className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold gradient-text">BookEase</span>
        </Link>
      </div>

      {/* Card */}
      <div className="glass-card p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-1">Create your account</h1>
          <p className="text-surface-400 text-sm">Start booking or managing appointments in minutes</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Role Selector */}
          <div>
            <label className="input-label">I want to</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelectedRole('customer')}
                className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all duration-200 ${
                  selectedRole === 'customer'
                    ? 'bg-primary-500/10 border-primary-500/50 text-primary-400 shadow-sm'
                    : 'bg-surface-800 border-surface-600 text-surface-400 hover:border-surface-500'
                }`}
              >
                📅 Book appointments
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole('owner')}
                className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all duration-200 ${
                  selectedRole === 'owner'
                    ? 'bg-primary-500/10 border-primary-500/50 text-primary-400 shadow-sm'
                    : 'bg-surface-800 border-surface-600 text-surface-400 hover:border-surface-500'
                }`}
              >
                🏪 Manage a business
              </button>
            </div>
          </div>

          {/* Name */}
          <div>
            <label htmlFor="signup-name" className="input-label">Full Name</label>
            <div className="relative">
              <HiOutlineUser className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500" />
              <input
                id="signup-name"
                type="text"
                placeholder="John Doe"
                className={`input-field pl-11 ${errors.name ? 'border-red-500 focus:ring-red-500/50' : ''}`}
                {...register('name', {
                  required: 'Name is required',
                  maxLength: { value: 100, message: 'Name is too long' },
                })}
              />
            </div>
            {errors.name && <p className="input-error">{errors.name.message}</p>}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="signup-email" className="input-label">Email Address</label>
            <div className="relative">
              <HiOutlineMail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500" />
              <input
                id="signup-email"
                type="email"
                placeholder="you@example.com"
                className={`input-field pl-11 ${errors.email ? 'border-red-500 focus:ring-red-500/50' : ''}`}
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^\S+@\S+\.\S+$/,
                    message: 'Enter a valid email',
                  },
                })}
              />
            </div>
            {errors.email && <p className="input-error">{errors.email.message}</p>}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="signup-password" className="input-label">Password</label>
            <div className="relative">
              <HiOutlineLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500" />
              <input
                id="signup-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Min. 6 characters"
                className={`input-field pl-11 pr-11 ${errors.password ? 'border-red-500 focus:ring-red-500/50' : ''}`}
                {...register('password', {
                  required: 'Password is required',
                  minLength: { value: 6, message: 'Password must be at least 6 characters' },
                })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-300 transition-colors"
              >
                {showPassword ? <HiOutlineEyeOff className="w-5 h-5" /> : <HiOutlineEye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && <p className="input-error">{errors.password.message}</p>}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full !py-3.5 text-base"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Creating account...
              </span>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-surface-500">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
