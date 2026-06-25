import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import {
  HiOutlinePlusCircle,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineClock,
  HiOutlineCurrencyRupee,
  HiOutlineX,
  HiOutlineUserGroup,
} from 'react-icons/hi';

const ServiceManagement = () => {
  const [searchParams] = useSearchParams();
  const businessId = searchParams.get('business');
  const [services, setServices] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [selectedBiz, setSelectedBiz] = useState(businessId || '');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  // Fetch owner's businesses
  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        const res = await api.get('/businesses/user/mine');
        setBusinesses(res.data.data);
        if (!selectedBiz && res.data.data.length > 0) {
          setSelectedBiz(res.data.data[0]._id);
        }
      } catch (error) {
        console.error('Failed to fetch businesses:', error);
      }
    };
    fetchBusinesses();
  }, []);

  // Fetch services when business changes
  useEffect(() => {
    if (!selectedBiz) {
      setLoading(false);
      return;
    }
    const fetchServices = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/businesses/${selectedBiz}/services`);
        setServices(res.data.data);
      } catch (error) {
        console.error('Failed to fetch services:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, [selectedBiz]);

  const openCreateModal = () => {
    setEditingService(null);
    reset({ name: '', description: '', duration: 30, price: 0, capacity: 1, bufferMinutes: 0 });
    setShowModal(true);
  };

  const openEditModal = (service) => {
    setEditingService(service);
    reset({
      name: service.name,
      description: service.description,
      duration: service.duration,
      price: service.price,
      capacity: service.capacity,
      bufferMinutes: service.bufferMinutes,
    });
    setShowModal(true);
  };

  const onSubmit = async (data) => {
    try {
      if (editingService) {
        const res = await api.put(`/services/${editingService._id}`, data);
        setServices((prev) => prev.map((s) => (s._id === editingService._id ? res.data.data : s)));
        toast.success('Service updated!');
      } else {
        const res = await api.post(`/businesses/${selectedBiz}/services`, data);
        setServices((prev) => [res.data.data, ...prev]);
        toast.success('Service created!');
      }
      setShowModal(false);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save service');
    }
  };

  const deleteService = async (serviceId) => {
    if (!window.confirm('Are you sure you want to delete this service?')) return;
    try {
      await api.delete(`/services/${serviceId}`);
      setServices((prev) => prev.filter((s) => s._id !== serviceId));
      toast.success('Service deleted');
    } catch (error) {
      toast.error('Failed to delete service');
    }
  };

  return (
    <div className="page-container animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Services</h1>
          <p className="text-surface-400 text-sm">Manage services that customers can book.</p>
        </div>
        <div className="flex items-center gap-3">
          {businesses.length > 1 && (
            <select
              value={selectedBiz}
              onChange={(e) => setSelectedBiz(e.target.value)}
              className="input-field !w-auto text-sm"
            >
              {businesses.map((biz) => (
                <option key={biz._id} value={biz._id}>{biz.name}</option>
              ))}
            </select>
          )}
          <button onClick={openCreateModal} className="btn-primary text-sm" disabled={!selectedBiz}>
            <HiOutlinePlusCircle className="w-5 h-5" />
            Add Service
          </button>
        </div>
      </div>

      {/* Services List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-24 rounded-2xl" />
          ))}
        </div>
      ) : services.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-teal-500/10 flex items-center justify-center mx-auto mb-4">
            <HiOutlineClock className="w-8 h-8 text-teal-400" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">No services yet</h2>
          <p className="text-surface-400 mb-6 max-w-sm mx-auto">
            Add your first service so customers know what you offer and can start booking.
          </p>
          <button onClick={openCreateModal} className="btn-primary" disabled={!selectedBiz}>
            <HiOutlinePlusCircle className="w-5 h-5" />
            Add First Service
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {services.map((service) => (
            <div key={service._id} className="glass-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:border-primary-500/20 transition-all">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-white">{service.name}</h3>
                  {service.capacity > 1 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 text-xs font-medium">
                      <HiOutlineUserGroup className="w-3 h-3" />
                      Group · {service.capacity} spots
                    </span>
                  )}
                </div>
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
                  {service.bufferMinutes > 0 && (
                    <span className="text-xs text-surface-600">+{service.bufferMinutes}min buffer</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 opacity-70 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEditModal(service)} className="btn-ghost text-sm !p-2" title="Edit">
                  <HiOutlinePencil className="w-4 h-4" />
                </button>
                <button onClick={() => deleteService(service._id)} className="btn-ghost text-sm !p-2 text-red-400 hover:text-red-300" title="Delete">
                  <HiOutlineTrash className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-card w-full max-w-lg p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">
                {editingService ? 'Edit Service' : 'Add New Service'}
              </h2>
              <button onClick={() => setShowModal(false)} className="btn-ghost !p-2">
                <HiOutlineX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="input-label">Service Name *</label>
                <input
                  className={`input-field ${errors.name ? 'border-red-500' : ''}`}
                  placeholder="e.g. Deep Tissue Massage"
                  {...register('name', { required: 'Name is required' })}
                />
                {errors.name && <p className="input-error">{errors.name.message}</p>}
              </div>

              <div>
                <label className="input-label">Description</label>
                <textarea
                  rows={2}
                  className="input-field resize-none"
                  placeholder="Brief description of the service"
                  {...register('description')}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Duration (mins) *</label>
                  <input
                    type="number"
                    className={`input-field ${errors.duration ? 'border-red-500' : ''}`}
                    {...register('duration', {
                      required: 'Required',
                      valueAsNumber: true,
                      min: { value: 5, message: 'Min 5 min' },
                      max: { value: 480, message: 'Max 8 hours' },
                    })}
                  />
                  {errors.duration && <p className="input-error">{errors.duration.message}</p>}
                </div>
                <div>
                  <label className="input-label">Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    className={`input-field ${errors.price ? 'border-red-500' : ''}`}
                    {...register('price', {
                      required: 'Required',
                      valueAsNumber: true,
                      min: { value: 0, message: 'Min 0' },
                    })}
                  />
                  {errors.price && <p className="input-error">{errors.price.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Capacity</label>
                  <input
                    type="number"
                    className="input-field"
                    {...register('capacity', { valueAsNumber: true, min: 1 })}
                  />
                  <p className="text-xs text-surface-600 mt-1">1 = individual, more = group class</p>
                </div>
                <div>
                  <label className="input-label">Buffer (mins)</label>
                  <input
                    type="number"
                    className="input-field"
                    {...register('bufferMinutes', { valueAsNumber: true, min: 0 })}
                  />
                  <p className="text-xs text-surface-600 mt-1">Break between appointments</p>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1">
                  {editingService ? 'Save Changes' : 'Create Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceManagement;
