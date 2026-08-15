import React, { useState, useEffect } from 'react';
import { allocationApi } from '../services/api';
import {
  History,
  CheckCircle2,
  Boxes,
  User,
  Shield,
  Calendar,
  Search,
  ArrowRight,
  FileCheck
} from 'lucide-react';
import { UrgencyBadge } from '../components/StatusBadge';

export function AllocationHistoryPage() {
  const [history, setHistory] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const res = await allocationApi.getHistory();
      setHistory(res.data.history || []);
    } catch (err) {
      console.error('Failed to load allocation history:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredHistory = history.filter((item) => {
    const q = searchQuery.toLowerCase();
    return (
      item.resource_name?.toLowerCase().includes(q) ||
      item.recipient_name?.toLowerCase().includes(q) ||
      item.reason?.toLowerCase().includes(q) ||
      item.admin_name?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-emerald-950/60 via-slate-850 to-indigo-950/50 border border-emerald-500/25 backdrop-blur-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-2">
            <FileCheck className="w-3.5 h-3.5" />
            Immutable Audit Trail
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Resource Allocation History Log
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-xl">
            Complete, permanent historical log of all resource dispatches, recipient details, and approving officers.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
          <div className="text-slate-400">Total Completed Dispatches</div>
          <div className="text-2xl font-bold text-emerald-400 mt-0.5">{history.length} Fulfillments</div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-850 border border-slate-800">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search audit trail by recipient, resource, or note..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* History Table */}
      {filteredHistory.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-slate-900 border border-slate-800 text-slate-400">
          <History className="w-12 h-12 text-slate-600 mx-auto mb-3 opacity-50" />
          <h3 className="text-lg font-bold text-slate-300">No Allocation Records Found</h3>
          <p className="text-xs text-slate-500 mt-1">
            Allocations executed by the Admin will appear here permanently.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-900/70 backdrop-blur-md shadow-2xl">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-850/80 text-xs font-bold uppercase tracking-wider text-slate-400">
                <th className="py-4 px-5">Allocation #</th>
                <th className="py-4 px-5">Timestamp</th>
                <th className="py-4 px-5">Resource Dispatched</th>
                <th className="py-4 px-5">Qty</th>
                <th className="py-4 px-5">Recipient</th>
                <th className="py-4 px-5">Original Urgency & Reason</th>
                <th className="py-4 px-5">Authorized Officer</th>
                <th className="py-4 px-5 text-right">Audit Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredHistory.map((item) => (
                <tr key={item.allocation_id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-4 px-5 font-mono font-bold text-indigo-400">
                    #{item.allocation_id}
                  </td>
                  <td className="py-4 px-5 text-xs text-slate-400 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      {new Date(item.allocated_at).toLocaleDateString()}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {new Date(item.allocated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td className="py-4 px-5">
                    <div className="font-bold text-white text-sm">{item.resource_name}</div>
                    <div className="text-[11px] text-slate-400">{item.resource_category}</div>
                  </td>
                  <td className="py-4 px-5 font-mono font-extrabold text-emerald-400 text-base">
                    {item.allocated_quantity}
                  </td>
                  <td className="py-4 px-5">
                    <div className="font-semibold text-white">{item.recipient_name}</div>
                    <div className="text-[11px] text-slate-400">{item.recipient_email}</div>
                  </td>
                  <td className="py-4 px-5 max-w-xs">
                    <div className="flex items-center gap-2 mb-1">
                      <UrgencyBadge urgency={item.urgency} size="xs" />
                    </div>
                    <div className="text-xs text-slate-300 line-clamp-1">{item.reason}</div>
                  </td>
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-300">
                      <Shield className="w-3.5 h-3.5 text-purple-400" />
                      {item.admin_name || 'Admin Officer'}
                    </div>
                    {item.notes && (
                      <div className="text-[11px] text-slate-500 italic mt-0.5 line-clamp-1">
                        "{item.notes}"
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-5 text-right">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Fulfilled
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}
