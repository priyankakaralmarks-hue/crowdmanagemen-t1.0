import React, { useState, useEffect } from 'react';
import { rankingApi, resourceApi } from '../services/api';
import {
  Trophy,
  Sparkles,
  HelpCircle,
  Vote,
  Layers,
  Flame,
  Info,
  RefreshCw,
  Award,
  Filter,
  CheckCircle2
} from 'lucide-react';
import { UrgencyBadge, RequestStatusBadge, RankPositionBadge } from '../components/StatusBadge';
import { ExplanationModal } from '../components/ExplanationModal';

export function RankingPage() {
  const [rankings, setRankings] = useState([]);
  const [resources, setResources] = useState([]);
  const [selectedResource, setSelectedResource] = useState('');
  const [loading, setLoading] = useState(true);

  // Explanation modal
  const [explanationData, setExplanationData] = useState(null);
  const [isExplanationOpen, setIsExplanationOpen] = useState(false);

  useEffect(() => {
    loadRankings();
  }, [selectedResource]);

  const loadRankings = async () => {
    setLoading(true);
    try {
      const [rankRes, resRes] = await Promise.all([
        rankingApi.getLeaderboard({ resource_id: selectedResource || undefined }),
        resourceApi.getAll()
      ]);
      setRankings(rankRes.data.ranking || []);
      setResources(resRes.data.resources || []);
    } catch (err) {
      console.error('Failed to load rankings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenExplanation = async (reqId) => {
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
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-indigo-950/70 via-slate-850 to-amber-950/40 border border-indigo-500/25 backdrop-blur-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-2">
            <Trophy className="w-3.5 h-3.5" />
            Transparent Leaderboard
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Ranked Allocation Priority Queue
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">
            Real-time multi-factor rankings dynamically recalculated using Urgency (50%), Community Votes (30%), and Inventory Availability (20%).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadRankings}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Recalculate & Refresh
          </button>
        </div>
      </div>

      {/* Formula & Explainability Guide Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-start gap-3">
          <div className="p-2 rounded-xl bg-rose-500/20 text-rose-300">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase text-rose-300">Factor 1: Urgency (50%)</div>
            <div className="text-sm font-semibold text-white mt-0.5">Critical: +50 pts • High: +37.5 pts</div>
            <p className="text-xs text-slate-400 mt-1">Medium: +25 pts • Low: +12.5 pts based on emergency severity</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 flex items-start gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300">
            <Vote className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase text-indigo-300">Factor 2: Votes (30%)</div>
            <div className="text-sm font-semibold text-white mt-0.5">Up to +30.0 pts Normalized</div>
            <p className="text-xs text-slate-400 mt-1">Peer validation ensures community consensus without monopoly</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-start gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase text-emerald-300">Factor 3: Availability (20%)</div>
            <div className="text-sm font-semibold text-white mt-0.5">Up to +20.0 pts Capacity</div>
            <p className="text-xs text-slate-400 mt-1">Rewards requests that can be fulfilled immediately without stockout</p>
          </div>
        </div>
      </div>

      {/* Filter by Resource */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-850 border border-slate-800">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Filter className="w-4 h-4 text-indigo-400" />
          <span>Filter Ranking by Resource Pool:</span>
        </div>
        <select
          value={selectedResource}
          onChange={(e) => setSelectedResource(e.target.value)}
          className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
        >
          <option value="">All Resource Types (Global Ranking)</option>
          {resources.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name} ({r.available_quantity} available)
            </option>
          ))}
        </select>
      </div>

      {/* Main Ranking Leaderboard Table */}
      {rankings.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-slate-900 border border-slate-800 text-slate-400">
          <Trophy className="w-12 h-12 text-slate-600 mx-auto mb-3 opacity-50" />
          <h3 className="text-lg font-bold text-slate-300">No Pending Requests in Ranking Queue</h3>
          <p className="text-xs text-slate-500 mt-1">
            Submit a resource request to see it scored and positioned in the transparent queue.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-900/70 backdrop-blur-md shadow-2xl">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-850/80 text-xs font-bold uppercase tracking-wider text-slate-400">
                <th className="py-4 px-5">Rank</th>
                <th className="py-4 px-5">Demand / Requester</th>
                <th className="py-4 px-5">Resource</th>
                <th className="py-4 px-5">Qty</th>
                <th className="py-4 px-5">Urgency</th>
                <th className="py-4 px-5">Community Votes</th>
                <th className="py-4 px-5">Priority Score</th>
                <th className="py-4 px-5">Status</th>
                <th className="py-4 px-5 text-right">Why this rank?</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {rankings.map((req, index) => (
                <tr
                  key={req.id}
                  className={`hover:bg-slate-800/40 transition-colors ${
                    index === 0
                      ? 'bg-amber-500/5'
                      : index === 1
                      ? 'bg-slate-400/5'
                      : index === 2
                      ? 'bg-amber-700/5'
                      : ''
                  }`}
                >
                  <td className="py-4 px-5">
                    <RankPositionBadge position={req.ranking_position} />
                  </td>
                  <td className="py-4 px-5">
                    <div className="font-bold text-white text-sm">{req.reason}</div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Requested by <strong className="text-slate-300">{req.user_name || 'User'}</strong> • Request #{req.id}
                    </div>
                  </td>
                  <td className="py-4 px-5">
                    <div className="font-semibold text-indigo-300">{req.resource_name}</div>
                    <div className="text-[11px] text-slate-500">{req.available_quantity} units available in stock</div>
                  </td>
                  <td className="py-4 px-5 font-mono font-bold text-white text-base">
                    {req.requested_quantity}
                  </td>
                  <td className="py-4 px-5">
                    <UrgencyBadge urgency={req.urgency} />
                  </td>
                  <td className="py-4 px-5">
                    <span className="inline-flex items-center gap-1.5 font-mono font-bold text-slate-200">
                      <Vote className="w-4 h-4 text-indigo-400" />
                      {req.votes_count || 0}
                    </span>
                  </td>
                  <td className="py-4 px-5">
                    <div className="flex items-baseline gap-1">
                      <span className="font-mono font-extrabold text-amber-400 text-lg">
                        {req.priority_score ? Number(req.priority_score).toFixed(1) : '0.0'}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">/100</span>
                    </div>
                  </td>
                  <td className="py-4 px-5">
                    <RequestStatusBadge status={req.status} />
                  </td>
                  <td className="py-4 px-5 text-right">
                    <button
                      onClick={() => handleOpenExplanation(req.id)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-500/15 hover:bg-indigo-500 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-bold transition-all shadow-sm"
                    >
                      <HelpCircle className="w-4 h-4" />
                      Why this rank?
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Explanation Modal */}
      <ExplanationModal
        isOpen={isExplanationOpen}
        onClose={() => setIsExplanationOpen(false)}
        explanationData={explanationData}
      />

    </div>
  );
}
