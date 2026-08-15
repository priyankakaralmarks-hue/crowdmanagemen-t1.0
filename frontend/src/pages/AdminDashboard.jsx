import React, { useState, useEffect } from 'react';
import { resourceApi, requestApi, allocationApi, statsApi, rankingApi } from '../services/api';
import {
  Shield,
  Boxes,
  PlusCircle,
  Trophy,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  HelpCircle,
  Trash2,
  Edit,
  History,
  Search,
  Filter,
  Layers,
  Sparkles,
  Users,
  Clock,
  ArrowUpRight
} from 'lucide-react';
import { UrgencyBadge, RequestStatusBadge, InventoryBadge, RankPositionBadge } from '../components/StatusBadge';
import { StatCard } from '../components/StatCard';
import { ResourceModal } from '../components/ResourceModal';
import { ExplanationModal } from '../components/ExplanationModal';

export function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [resources, setResources] = useState([]);
  const [rankedRequests, setRankedRequests] = useState([]);
  const [allRequests, setAllRequests] = useState([]);

  // Filters for requests table
  const [filterResource, setFilterResource] = useState('');
  const [filterUrgency, setFilterUrgency] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Modals state
  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [isExplanationOpen, setIsExplanationOpen] = useState(false);
  const [explanationData, setExplanationData] = useState(null);

  useEffect(() => {
    loadAllAdminData();
  }, [filterResource, filterUrgency, filterStatus, searchQuery]);

  const loadAllAdminData = async () => {
    setLoading(true);
    try {
      const [statsRes, resRes, rankRes, reqRes] = await Promise.all([
        statsApi.getOverview(),
        resourceApi.getAll(),
        rankingApi.getLeaderboard(),
        requestApi.getAll({
          resource_id: filterResource || undefined,
          urgency: filterUrgency || undefined,
          status: filterStatus || undefined,
          search: searchQuery || undefined
        })
      ]);

      setStats(statsRes.data);
      setResources(resRes.data.resources || []);
      setRankedRequests(rankRes.data.ranking || []);
      setAllRequests(reqRes.data.requests || []);
    } catch (err) {
      console.error('Error loading admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddResource = () => {
    setEditingResource(null);
    setIsResourceModalOpen(true);
  };

  const handleEditResource = (resource) => {
    setEditingResource(resource);
    setIsResourceModalOpen(true);
  };

  const handleDeleteResource = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete resource '${name}'?`)) return;
    setActionLoading(true);
    setFeedback({ type: '', message: '' });
    try {
      await resourceApi.delete(id);
      setFeedback({ type: 'success', message: `Resource '${name}' deleted successfully.` });
      await loadAllAdminData();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.error || 'Failed to delete resource.'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAllocate = async (req) => {
    if (!window.confirm(`Confirm allocation of ${req.requested_quantity} unit(s) of '${req.resource_name}' to ${req.user_name || 'Requester'}?`)) {
      return;
    }

    setActionLoading(true);
    setFeedback({ type: '', message: '' });
    try {
      const res = await allocationApi.allocate(req.id, {
        notes: `Allocated via Admin Action Center to priority #${req.ranking_position || 'Rank'}`
      });
      setFeedback({
        type: 'success',
        message: `Successfully allocated ${req.requested_quantity} unit(s) of ${req.resource_name}!`
      });
      await loadAllAdminData();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.error || 'Allocation failed.'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewExplanation = async (reqId) => {
    try {
      const res = await rankingApi.getExplanation(reqId);
      setExplanationData(res.data.explanation);
      setIsExplanationOpen(true);
    } catch (err) {
      console.error('Failed to get explanation:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-purple-950/70 via-slate-850 to-indigo-950/60 border border-purple-500/25 backdrop-blur-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-semibold uppercase tracking-wider mb-2">
            <Shield className="w-3.5 h-3.5" />
            Executive Administration Hub
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Resource Allocation Command Center
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-xl">
            Maintain critical inventory, monitor crowd demand, and execute fair allocations powered by transparent multi-factor scoring.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleAddResource}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-xl shadow-purple-600/30 hover:scale-105 transition-all"
          >
            <PlusCircle className="w-5 h-5" />
            Add New Resource
          </button>
        </div>
      </div>

      {/* Notifications */}
      {feedback.message && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between text-sm animate-in fade-in ${
            feedback.type === 'error'
              ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
              : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === 'error' ? (
              <AlertCircle className="w-5 h-5 shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback({ type: '', message: '' })}
            className="text-xs underline opacity-80 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* SECTION 1: Key Metrics Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Resource Types"
          value={stats?.total_resources || 0}
          subtitle={`${stats?.total_items || 0} total units in system`}
          icon={Boxes}
          color="purple"
        />
        <StatCard
          title="Available In Stock"
          value={stats?.total_available || 0}
          subtitle={`${stats?.total_allocated || 0} units currently deployed`}
          icon={Layers}
          color="emerald"
        />
        <StatCard
          title="Pending Demands"
          value={stats?.pending_requests || 0}
          subtitle="Actively ranked in queue"
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Fulfilled Allocations"
          value={stats?.allocated_requests || 0}
          subtitle={`${stats?.total_votes || 0} community votes cast`}
          icon={CheckCircle2}
          color="cyan"
        />
      </div>

      {/* SECTION 2: Ranked Allocation Execution Center */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              Ranked Allocation Action Center
            </h2>
            <p className="text-xs text-slate-400">
              Pending requests ranked by explainable urgency, community voting, and inventory capacity.
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
            {rankedRequests.length} Pending in Allocation Queue
          </span>
        </div>

        {rankedRequests.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-slate-850 border border-slate-800 text-slate-400 text-sm">
            All submitted requests have been allocated or no pending requests are queued.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-850/70 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">Requester</th>
                  <th className="py-3.5 px-4">Resource & Quantity</th>
                  <th className="py-3.5 px-4">Urgency</th>
                  <th className="py-3.5 px-4">Community Votes</th>
                  <th className="py-3.5 px-4">Priority Score</th>
                  <th className="py-3.5 px-4">Stock Check</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {rankedRequests.map((req) => {
                  const isStockSufficient = req.available_quantity >= req.requested_quantity;

                  return (
                    <tr key={req.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <RankPositionBadge position={req.ranking_position} />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white">{req.user_name || 'User'}</div>
                        <div className="text-[11px] text-slate-400">{req.user_email}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-indigo-300">
                          {req.resource_name}{' '}
                          <span className="font-mono font-bold text-white">({req.requested_quantity} requested)</span>
                        </div>
                        <div className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                          {req.reason}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <UrgencyBadge urgency={req.urgency} />
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-200">
                        {req.votes_count || 0}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-extrabold text-amber-400 text-base">
                          {req.priority_score ? Number(req.priority_score).toFixed(1) : '0.0'}
                        </span>
                        <span className="text-[11px] text-slate-500"> /100</span>
                      </td>
                      <td className="py-3.5 px-4">
                        {isStockSufficient ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {req.available_quantity} available
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-400">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Deficit ({req.available_quantity} avail)
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => handleViewExplanation(req.id)}
                            className="p-2 rounded-xl text-slate-400 hover:text-indigo-300 hover:bg-slate-800 transition-colors"
                            title="Why this rank? (Explanation Audit)"
                          >
                            <HelpCircle className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleAllocate(req)}
                            disabled={!isStockSufficient || actionLoading}
                            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md ${
                              isStockSufficient
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {isStockSufficient ? 'Allocate Resource' : 'Insufficient Stock'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* SECTION 3: Resource Management Catalog */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Boxes className="w-5 h-5 text-purple-400" />
              Resource Inventory Management
            </h2>
            <p className="text-xs text-slate-400">
              Manage physical/digital assets, configure quantities, and monitor allocations
            </p>
          </div>
          <button
            onClick={handleAddResource}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/30 text-xs font-bold transition-all"
          >
            <PlusCircle className="w-4 h-4" /> Add Item
          </button>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-850/70 text-xs font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-4">Resource</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Total Qty</th>
                <th className="py-3.5 px-4">Available</th>
                <th className="py-3.5 px-4">Allocated</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {resources.map((res) => (
                <tr key={res.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-white">{res.name}</div>
                    <div className="text-xs text-slate-400 line-clamp-1">{res.description}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-0.5 rounded-md bg-slate-800 text-xs font-medium text-slate-300 border border-slate-700">
                      {res.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-200">
                    {res.total_quantity}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                    {res.available_quantity}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-indigo-400">
                    {res.allocated_quantity}
                  </td>
                  <td className="py-3.5 px-4">
                    <InventoryBadge available={res.available_quantity} total={res.total_quantity} />
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() => handleEditResource(res)}
                        className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        title="Edit Resource"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteResource(res.id, res.name)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Delete Resource"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* SECTION 4: Comprehensive Demands Audit Hub */}
      <section className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Filter className="w-5 h-5 text-indigo-400" />
              All Demands & Filterable Request Registry
            </h2>
            <p className="text-xs text-slate-400">
              Permanent record of every resource request submitted across the collective
            </p>
          </div>

          {/* Filter controls */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search requests/users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <select
              value={filterUrgency}
              onChange={(e) => setFilterUrgency(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Urgencies</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="allocated">Allocated</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-850/70 text-xs font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-4">Req #</th>
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Resource</th>
                <th className="py-3.5 px-4">Qty</th>
                <th className="py-3.5 px-4">Urgency</th>
                <th className="py-3.5 px-4">Votes</th>
                <th className="py-3.5 px-4">Score</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {allRequests.map((req) => (
                <tr key={req.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-semibold text-slate-400">
                    #{req.id}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-white">{req.user_name}</div>
                    <div className="text-[11px] text-slate-400">{req.user_email}</div>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-200">
                    {req.resource_name}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-indigo-300">
                    {req.requested_quantity}
                  </td>
                  <td className="py-3.5 px-4">
                    <UrgencyBadge urgency={req.urgency} />
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-300">
                    {req.votes_count || 0}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-amber-400">
                    {req.priority_score ? Number(req.priority_score).toFixed(1) : '-'}
                  </td>
                  <td className="py-3.5 px-4">
                    <RequestStatusBadge status={req.status} />
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleViewExplanation(req.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-indigo-300 hover:bg-slate-800 transition-colors"
                      title="View Explanation Breakdown"
                    >
                      <HelpCircle className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Resource Modal */}
      <ResourceModal
        isOpen={isResourceModalOpen}
        onClose={() => setIsResourceModalOpen(false)}
        resource={editingResource}
        onSaved={loadAllAdminData}
      />

      {/* Explanation Modal */}
      <ExplanationModal
        isOpen={isExplanationOpen}
        onClose={() => setIsExplanationOpen(false)}
        explanationData={explanationData}
      />

    </div>
  );
}
