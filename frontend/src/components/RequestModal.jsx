import React, { useState, useEffect } from 'react';
import { X, Send, AlertCircle, Flame, ShieldAlert, Clock, Sparkles, Check } from 'lucide-react';
import { resourceApi, requestApi } from '../services/api';

export function RequestModal({ isOpen, onClose, preselectedResourceId, onSubmitted }) {
  const [resources, setResources] = useState([]);
  const [formData, setFormData] = useState({
    resource_id: '',
    requested_quantity: 1,
    urgency: 'high',
    reason: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [fetchingRes, setFetchingRes] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchResources();
    }
    setError(null);
  }, [isOpen]);

  const fetchResources = async () => {
    setFetchingRes(true);
    try {
      const res = await resourceApi.getAll();
      const list = res.data.resources || [];
      setResources(list);

      if (preselectedResourceId) {
        setFormData(prev => ({ ...prev, resource_id: preselectedResourceId }));
      } else if (list.length > 0 && !formData.resource_id) {
        setFormData(prev => ({ ...prev, resource_id: list[0].id }));
      }
    } catch (err) {
      console.error('Failed to load resources', err);
    } finally {
      setFetchingRes(false);
    }
  };

  if (!isOpen) return null;

  const selectedResource = resources.find(r => r.id === parseInt(formData.resource_id, 10));

  const urgencyOptions = [
    {
      id: 'critical',
      label: 'Critical',
      points: '+50.0 pts',
      icon: Flame,
      desc: 'Life safety, active disaster, emergency medical triage, or zero-delay operational hazard',
      border: 'border-rose-500/50 bg-rose-500/10 text-rose-300'
    },
    {
      id: 'high',
      label: 'High',
      points: '+37.5 pts',
      icon: ShieldAlert,
      desc: 'Time-critical community requirement with immediate operational timeline',
      border: 'border-amber-500/50 bg-amber-500/10 text-amber-300'
    },
    {
      id: 'medium',
      label: 'Medium',
      points: '+25.0 pts',
      icon: Clock,
      desc: 'Standard program need, planned field deployment or scheduled project rollout',
      border: 'border-blue-500/50 bg-blue-500/10 text-blue-300'
    },
    {
      id: 'low',
      label: 'Low',
      points: '+12.5 pts',
      icon: Sparkles,
      desc: 'Flexible timeline, proactive reserve, training workshop or routine upgrade',
      border: 'border-slate-500/50 bg-slate-500/10 text-slate-300'
    }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.resource_id) {
      setError('Please select a resource to request.');
      return;
    }

    const qty = parseInt(formData.requested_quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      setError('Requested quantity must be at least 1.');
      return;
    }

    if (!formData.reason.trim()) {
      setError('Please provide a clear reason for your request.');
      return;
    }

    setLoading(true);
    try {
      await requestApi.submit({
        resource_id: parseInt(formData.resource_id, 10),
        requested_quantity: qty,
        urgency: formData.urgency,
        reason: formData.reason.trim(),
        description: formData.description.trim()
      });
      if (onSubmitted) onSubmitted();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Submit Resource Request</h2>
              <p className="text-xs text-slate-400">
                Your demand enters the transparent, explainable ranking algorithm
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
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Resource Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Select Limited Resource *
            </label>
            <select
              value={formData.resource_id}
              onChange={(e) => setFormData({ ...formData, resource_id: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500 transition-all"
            >
              {resources.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.category}) — {r.available_quantity} available in stock
                </option>
              ))}
            </select>

            {selectedResource && (
              <div className="mt-2 p-2.5 rounded-lg bg-slate-850 border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
                <span>Current Stock: <strong className="text-white">{selectedResource.available_quantity}</strong> available / {selectedResource.total_quantity} total</span>
                <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${selectedResource.available_quantity > 0 ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300'}`}>
                  {selectedResource.available_quantity > 0 ? 'In Stock' : 'Stock Exhausted'}
                </span>
              </div>
            )}
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Quantity Required *
            </label>
            <input
              type="number"
              min="1"
              required
              value={formData.requested_quantity}
              onChange={(e) => setFormData({ ...formData, requested_quantity: Math.max(1, parseInt(e.target.value, 10) || 1) })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm font-mono focus:outline-none focus:border-indigo-500 transition-all"
            />
          </div>

          {/* Urgency Level Selector Cards */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Urgency Level * (50% Ranking Weight)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {urgencyOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = formData.urgency === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, urgency: opt.id })}
                    className={`p-3 rounded-xl text-left border transition-all ${
                      isSelected
                        ? `${opt.border} ring-2 ring-indigo-500/40`
                        : 'border-slate-800 bg-slate-800/40 hover:bg-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5 font-bold text-sm text-white">
                        <Icon className="w-4 h-4" />
                        {opt.label}
                      </div>
                      <span className="text-xs font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-900/60 text-indigo-300">
                        {opt.points}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                      {opt.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reason for Requesting */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Primary Purpose / Reason *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Field emergency clinic setup, Disaster mapping volunteer laptops..."
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition-all"
            />
          </div>

          {/* Detailed Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Additional Details / Justification (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="Provide background context, recipient beneficiary numbers, and timeline details to aid community voting and admin review..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition-all"
            />
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
              {loading ? 'Submitting & Computing Rank...' : (
                <>
                  <Send className="w-4 h-4" /> Submit Demand
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
