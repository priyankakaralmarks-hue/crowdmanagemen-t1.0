import React, { useState, useEffect } from 'react';
import { X, Boxes, AlertCircle, Save, Plus } from 'lucide-react';
import { resourceApi } from '../services/api';

export function ResourceModal({ isOpen, onClose, resource, onSaved }) {
  const isEditing = !!resource;

  const [formData, setFormData] = useState({
    name: '',
    category: 'IT Equipment',
    description: '',
    total_quantity: 10,
    available_quantity: 10
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (resource) {
      setFormData({
        name: resource.name || '',
        category: resource.category || 'IT Equipment',
        description: resource.description || '',
        total_quantity: resource.total_quantity || 1,
        available_quantity: resource.available_quantity !== undefined ? resource.available_quantity : resource.total_quantity
      });
    } else {
      setFormData({
        name: '',
        category: 'IT Equipment',
        description: '',
        total_quantity: 10,
        available_quantity: 10
      });
    }
    setError(null);
  }, [resource, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError('Resource name is required.');
      return;
    }

    const total = parseInt(formData.total_quantity, 10);
    const available = parseInt(formData.available_quantity, 10);

    if (isNaN(total) || total < 0) {
      setError('Total quantity must be 0 or greater.');
      return;
    }

    if (isNaN(available) || available < 0 || available > total) {
      setError('Available quantity must be between 0 and total quantity.');
      return;
    }

    setLoading(true);
    try {
      if (isEditing) {
        await resourceApi.update(resource.id, {
          name: formData.name.trim(),
          category: formData.category,
          description: formData.description.trim(),
          total_quantity: total,
          available_quantity: available
        });
      } else {
        await resourceApi.create({
          name: formData.name.trim(),
          category: formData.category,
          description: formData.description.trim(),
          total_quantity: total,
          available_quantity: available
        });
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save resource.');
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    'IT Equipment',
    'Healthcare & Medical',
    'Power & Energy',
    'Sanitation & Water',
    'Food & Provisions',
    'Shelter & Logistics',
    'General'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {isEditing ? 'Edit Resource Details' : 'Add New Limited Resource'}
              </h2>
              <p className="text-xs text-slate-400">
                {isEditing ? 'Update stock quantity or specs' : 'Define pool item for crowd allocation'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Resource Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g., ThinkPad L14 Laptop, 5kVA Diesel Generator"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500 transition-all"
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Description / Specifications
            </label>
            <textarea
              rows={3}
              placeholder="Provide technical details, intended use, maintenance requirements..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Total Quantity *
              </label>
              <input
                type="number"
                min="0"
                required
                value={formData.total_quantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10) || 0;
                  setFormData({
                    ...formData,
                    total_quantity: val,
                    available_quantity: isEditing ? Math.min(formData.available_quantity, val) : val
                  });
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500 font-mono transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Available Stock *
              </label>
              <input
                type="number"
                min="0"
                max={formData.total_quantity}
                required
                value={formData.available_quantity}
                onChange={(e) => setFormData({ ...formData, available_quantity: parseInt(e.target.value, 10) || 0 })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500 font-mono transition-all"
              />
            </div>
          </div>

          {/* Allocation preview */}
          <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 text-xs text-slate-400 flex justify-between">
            <span>Calculated Allocated / In-Use:</span>
            <span className="font-mono font-bold text-indigo-400">
              {Math.max(0, (parseInt(formData.total_quantity, 10) || 0) - (parseInt(formData.available_quantity, 10) || 0))} units
            </span>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white shadow-lg shadow-indigo-600/30 transition-all"
            >
              {loading ? 'Saving...' : isEditing ? (
                <>
                  <Save className="w-4 h-4" /> Save Changes
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" /> Create Resource
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
