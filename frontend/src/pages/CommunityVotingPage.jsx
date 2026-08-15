import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { rankingApi, voteApi, resourceApi } from '../services/api';
import {
  Vote,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Filter,
  Users,
  Flame,
  Info
} from 'lucide-react';
import { UrgencyBadge, RankPositionBadge } from '../components/StatusBadge';
import { ExplanationModal } from '../components/ExplanationModal';

export function CommunityVotingPage() {
  const { user } = useAuth();

  const [requests, setRequests] = useState([]);
  const [votedIds, setVotedIds] = useState([]);
  const [resources, setResources] = useState([]);
  const [selectedUrgency, setSelectedUrgency] = useState('');
  const [selectedResource, setSelectedResource] = useState('');

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Modal
  const [explanationData, setExplanationData] = useState(null);
  const [isExplanationOpen, setIsExplanationOpen] = useState(false);

  useEffect(() => {
    loadVotingData();
  }, [selectedUrgency, selectedResource]);

  const loadVotingData = async () => {
    setLoading(true);
    try {
      const [rankRes, votesRes, resRes] = await Promise.all([
        rankingApi.getLeaderboard({ resource_id: selectedResource || undefined }),
        voteApi.getMyVotes(),
        resourceApi.getAll()
      ]);

      let list = rankRes.data.ranking || [];
      if (selectedUrgency) {
        list = list.filter(r => r.urgency === selectedUrgency);
      }

      setRequests(list);
      setVotedIds(votesRes.data.votedRequestIds || []);
      setResources(resRes.data.resources || []);
    } catch (err) {
      console.error('Error loading voting data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCastVote = async (requestId) => {
    setActionLoading(true);
    setFeedback({ type: '', message: '' });
    try {
      const res = await voteApi.castVote(requestId);
      setFeedback({ type: 'success', message: res.data.message || 'Vote successfully cast!' });
      await loadVotingData();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.error || 'Could not record vote.'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleWithdrawVote = async (requestId) => {
    setActionLoading(true);
    setFeedback({ type: '', message: '' });
    try {
      await voteApi.removeVote(requestId);
      setFeedback({ type: 'success', message: 'Vote withdrawn.' });
      await loadVotingData();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.error || 'Could not withdraw vote.'
      });
    } finally {
      setActionLoading(false);
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-indigo-950/70 via-slate-850 to-cyan-950/40 border border-indigo-500/25 backdrop-blur-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-2">
            <Users className="w-3.5 h-3.5" />
            Crowd Consensus Engine
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Community Peer Voting Hub
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">
            Review critical needs from your peers and vote to help the ranking engine allocate limited supplies fairly.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 space-y-1">
          <div className="font-bold text-white flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-indigo-400" /> Voting Protocol
          </div>
          <div>• 1 vote per request per user</div>
          <div>• Self-voting strictly blocked</div>
          <div>• Directly shapes 30% of priority score</div>
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

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-850 border border-slate-800">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
          <Filter className="w-4 h-4 text-indigo-400" />
          <span>Filter Demands:</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedUrgency}
            onChange={(e) => setSelectedUrgency(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Urgencies</option>
            <option value="critical">Critical Urgency</option>
            <option value="high">High Urgency</option>
            <option value="medium">Medium Urgency</option>
            <option value="low">Low Urgency</option>
          </select>

          <select
            value={selectedResource}
            onChange={(e) => setSelectedResource(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Resource Pools</option>
            {resources.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Requests Stream Cards */}
      {requests.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-slate-900 border border-slate-800 text-slate-400">
          <Vote className="w-12 h-12 text-slate-600 mx-auto mb-3 opacity-50" />
          <h3 className="text-lg font-bold text-slate-300">No Eligible Requests Found</h3>
          <p className="text-xs text-slate-500 mt-1">
            Check back soon or adjust your filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {requests.map((req) => {
            const isOwnRequest = req.user_id === user?.id;
            const hasVoted = votedIds.includes(req.id);

            return (
              <div
                key={req.id}
                className={`group relative p-6 rounded-3xl border backdrop-blur-md transition-all flex flex-col justify-between ${
                  hasVoted
                    ? 'bg-gradient-to-br from-indigo-950/40 to-slate-900 border-indigo-500/40 ring-1 ring-indigo-500/30'
                    : 'bg-slate-850/80 border-slate-800 hover:border-indigo-500/30'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <RankPositionBadge position={req.ranking_position} />
                      <div>
                        <h3 className="font-bold text-white text-base group-hover:text-indigo-300 transition-colors">
                          {req.resource_name}
                        </h3>
                        <p className="text-xs text-slate-400">
                          Requested by <strong className="text-slate-300">{req.user_name || 'User'}</strong> • {req.requested_quantity} unit(s)
                        </p>
                      </div>
                    </div>
                    <UrgencyBadge urgency={req.urgency} />
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 text-xs text-slate-300 space-y-1.5">
                    <div>
                      <strong className="text-slate-200">Justification:</strong> {req.reason}
                    </div>
                    {req.description && (
                      <p className="text-slate-400 line-clamp-2 leading-relaxed">
                        {req.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono font-bold text-indigo-300">
                      <Vote className="w-4 h-4 text-indigo-400" />
                      {req.votes_count || 0} votes
                    </div>
                    <div className="text-xs font-mono font-bold text-amber-400">
                      Score: {req.priority_score ? Number(req.priority_score).toFixed(1) : '0.0'}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenExplanation(req.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-indigo-300 hover:bg-slate-800 transition-colors"
                      title="Why this rank?"
                    >
                      <HelpCircle className="w-4 h-4" />
                    </button>

                    {isOwnRequest ? (
                      <span
                        className="px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-500 text-xs font-semibold cursor-not-allowed"
                        title="You cannot vote for your own request."
                      >
                        «You cannot vote for your own request.»
                      </span>
                    ) : hasVoted ? (
                      <button
                        onClick={() => handleWithdrawVote(req.id)}
                        disabled={actionLoading}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Voted (Withdraw)
                      </button>
                    ) : (
                      <button
                        onClick={() => handleCastVote(req.id)}
                        disabled={actionLoading}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-bold transition-all"
                      >
                        <Vote className="w-4 h-4" />
                        Upvote Request
                      </button>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
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
