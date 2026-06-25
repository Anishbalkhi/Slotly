import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { HiOutlineArrowLeft, HiOutlineArrowRight, HiOutlineCheck } from 'react-icons/hi';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const defaultHours = DAYS.reduce((acc, day, i) => {
  acc[day] = {
    isOpen: i < 5, // Mon-Fri open by default
    open: '09:00',
    close: '17:00',
  };
  return acc;
}, {});

const TIMEZONES = [
  'Asia/Kolkata',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney',
  'Pacific/Auckland',
];

const BusinessSetup = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [hours, setHours] = useState(defaultHours);

  const { register, handleSubmit, formState: { errors }, getValues } = useForm({
    defaultValues: {
      name: '',
      description: '',
      category: 'General',
      timezone: 'Asia/Kolkata',
      phone: '',
      email: '',
      'address.street': '',
      'address.city': '',
      'address.state': '',
      'address.zipCode': '',
      'address.country': '',
    },
  });

  const totalSteps = 3;

  const nextStep = () => {
    if (step < totalSteps) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const updateHour = (day, field, value) => {
    setHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const payload = {
        name: data.name,
        description: data.description,
        category: data.category,
        timezone: data.timezone,
        phone: data.phone,
        email: data.email,
        address: {
          street: data['address.street'],
          city: data['address.city'],
          state: data['address.state'],
          zipCode: data['address.zipCode'],
          country: data['address.country'],
        },
        hours,
      };

      const res = await api.post('/businesses', payload);
      toast.success('Business created successfully! 🎉');
      navigate(`/dashboard/services?business=${res.data.data._id}`);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create business');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-container max-w-2xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Set up your business</h1>
        <p className="text-surface-400">Tell us about your business so customers can find you.</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-4 mb-8">
        {['Basic Info', 'Location', 'Hours'].map((label, i) => (
          <div key={label} className="flex items-center gap-2 flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
              i + 1 <= step
                ? 'bg-primary-500 text-white shadow-glow'
                : 'bg-surface-800 text-surface-500 border border-surface-600'
            }`}>
              {i + 1 < step ? <HiOutlineCheck className="w-4 h-4" /> : i + 1}
            </div>
            <span className={`text-sm hidden sm:block ${i + 1 <= step ? 'text-primary-400' : 'text-surface-500'}`}>
              {label}
            </span>
            {i < 2 && <div className={`flex-1 h-px ${i + 1 < step ? 'bg-primary-500' : 'bg-surface-700'}`} />}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="glass-card p-8">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <label htmlFor="biz-name" className="input-label">Business Name *</label>
                <input
                  id="biz-name"
                  className={`input-field ${errors.name ? 'border-red-500' : ''}`}
                  placeholder="e.g. Serenity Spa & Wellness"
                  {...register('name', { required: 'Business name is required' })}
                />
                {errors.name && <p className="input-error">{errors.name.message}</p>}
              </div>

              <div>
                <label htmlFor="biz-desc" className="input-label">Description</label>
                <textarea
                  id="biz-desc"
                  rows={3}
                  className="input-field resize-none"
                  placeholder="What does your business offer?"
                  {...register('description')}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="biz-category" className="input-label">Category</label>
                  <select id="biz-category" className="input-field" {...register('category')}>
                    <option value="General">General</option>
                    <option value="Health & Wellness">Health & Wellness</option>
                    <option value="Beauty & Salon">Beauty & Salon</option>
                    <option value="Fitness">Fitness</option>
                    <option value="Medical">Medical</option>
                    <option value="Education">Education</option>
                    <option value="Consulting">Consulting</option>
                    <option value="Home Services">Home Services</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="biz-tz" className="input-label">Timezone *</label>
                  <select id="biz-tz" className="input-field" {...register('timezone')}>
                    {TIMEZONES.map((tz) => (
                      <option key={tz} value={tz}>{tz}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="biz-phone" className="input-label">Phone</label>
                  <input id="biz-phone" className="input-field" placeholder="+91 98765 43210" {...register('phone')} />
                </div>
                <div>
                  <label htmlFor="biz-email" className="input-label">Business Email</label>
                  <input id="biz-email" type="email" className="input-field" placeholder="hello@business.com" {...register('email')} />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Location */}
          {step === 2 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <label className="input-label">Street Address</label>
                <input className="input-field" placeholder="123 Main Street" {...register('address.street')} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">City</label>
                  <input className="input-field" placeholder="Mumbai" {...register('address.city')} />
                </div>
                <div>
                  <label className="input-label">State / Province</label>
                  <input className="input-field" placeholder="Maharashtra" {...register('address.state')} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">ZIP / Postal Code</label>
                  <input className="input-field" placeholder="400001" {...register('address.zipCode')} />
                </div>
                <div>
                  <label className="input-label">Country</label>
                  <input className="input-field" placeholder="India" {...register('address.country')} />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Business Hours */}
          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              <p className="text-sm text-surface-400 mb-2">Set your weekly business hours. Toggle days on/off.</p>
              {DAYS.map((day, i) => (
                <div key={day} className={`flex items-center gap-4 p-3 rounded-xl transition-colors ${hours[day].isOpen ? 'bg-surface-800/50' : 'bg-surface-800/20'}`}>
                  <label className="flex items-center gap-3 min-w-[140px] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hours[day].isOpen}
                      onChange={(e) => updateHour(day, 'isOpen', e.target.checked)}
                      className="w-4 h-4 rounded bg-surface-700 border-surface-600 text-primary-500 focus:ring-primary-500/30"
                    />
                    <span className={`text-sm font-medium ${hours[day].isOpen ? 'text-white' : 'text-surface-500'}`}>
                      {DAY_LABELS[i]}
                    </span>
                  </label>

                  {hours[day].isOpen ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={hours[day].open}
                        onChange={(e) => updateHour(day, 'open', e.target.value)}
                        className="input-field !w-32 !py-1.5 text-sm"
                      />
                      <span className="text-surface-500 text-sm">to</span>
                      <input
                        type="time"
                        value={hours[day].close}
                        onChange={(e) => updateHour(day, 'close', e.target.value)}
                        className="input-field !w-32 !py-1.5 text-sm"
                      />
                    </div>
                  ) : (
                    <span className="text-sm text-surface-600">Closed</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          {step > 1 ? (
            <button type="button" onClick={prevStep} className="btn-secondary">
              <HiOutlineArrowLeft className="w-4 h-4" />
              Back
            </button>
          ) : (
            <div />
          )}

          {step < totalSteps ? (
            <button type="button" onClick={nextStep} className="btn-primary">
              Next
              <HiOutlineArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button type="submit" disabled={isLoading} className="btn-primary">
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating...
                </span>
              ) : (
                <>
                  <HiOutlineCheck className="w-5 h-5" />
                  Create Business
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default BusinessSetup;
