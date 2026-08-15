import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { resourceApi, requestApi, voteApi, rankingApi } from '../services/api';
import {
  Boxes,
  PlusCircle,
  Vote,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  TrendingUp,
  Inbox,
  Send
} from 'lucide-react';
import { UrgencyBadge, RequestStatusBadge, InventoryBadge, RankPositionBadge } from '../components/StatusBadge';
import { ExplanationModal } from '../components/ExplanationModal';
import { RequestModal } from '../components/RequestModal';

export function UserDashboard() {
  const { user } = useAuth();

  const [resources, setResources] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [votingFeed, setVotingFeed] = useState([]);
  const [myVotedIds, setMyVotedIds] = useState([]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Modals state
  const [explanationData, setExplanationData] = useState(null);
  const [isExplanationOpen, setIsExplanationOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [selectedResourceId, setSelectedResourceId] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [resData, myReqData, rankData, votesData] = await Promise.all([
        resourceApi.getAll(),
        requestApi.getMyRequests(),
        rankingApi.getLeaderboard(),
        voteApi.getMyVotes()
      ]);

      setResources(resData.data.resources || []);
      setMyRequests(myReqData.data.requests || []);
      setVotingFeed(rankData.data.ranking || []);
      setMyVotedIds(votesData.data.votedRequestIds || []);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRequest = (resourceId = null) => {
    setSelectedResourceId(resourceId);
    setIsRequestModalOpen(true);
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

  const handleVote = async (requestId) => {
    setActionLoading(true);
    setFeedback({ type: '', message: '' });
    try {
      const res = await voteApi.castVote(requestId);
      setFeedback({ type: 'success', message: res.data.message || 'Vote recorded!' });
      await loadDashboardData();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.error || 'Failed to cast vote.'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnvote = async (requestId) => {
    setActionLoading(true);
    try {
      await voteApi.removeVote(requestId);
      await loadDashboardData();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const pendingRequestsCount = myRequests.filter(r => r.status === 'pending').length;
  const allocatedRequestsCount = myRequests.filter(r => r.status === 'allocated').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Welcome Banner */}
      <div className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-indigo-900/60 via-slate-850 to-purple-900/40 border border-indigo-500/20 backdrop-blur-xl overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              Community Demand Portal
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Welcome back, {user?.name}
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-xl">
              Demand resources with clear urgency, participate in transparent community prioritization, and trace exactly why requests get ranked.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleOpenRequest()}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 hover:scale-105 transition-all"
            >
              <PlusCircle className="w-5 h-5" />
              Request a Resource
            </button>
          </div>
        </div>

        {/* Quick User Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-700/40">
          <div>
            <div className="text-xs text-slate-400 font-medium">My Active Demands</div>
            <div className="text-2xl font-bold text-white mt-0.5">{pendingRequestsCount}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Allocated Fulfillments</div>
            <div className="text-2xl font-bold text-emerald-400 mt-0.5">{allocatedRequestsCount}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Community Votes Cast</div>
            <div className="text-2xl font-bold text-indigo-400 mt-0.5">{myVotedIds.length}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Available Catalog Items</div>
            <div className="text-2xl font-bold text-amber-400 mt-0.5">{resources.length}</div>
          </div>
        </div>
      </div>

      {/* Notification Banner */}
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

      {/* SECTION 1: Available Resources Pool */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Boxes className="w-5 h-5 text-indigo-400" />
              Available Resources
            </h2>
            <p className="text-xs text-slate-400">
              Limited public pool items available for prioritized allocation
            </p>
          </div>
        </div>

        {resources.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-slate-850 border border-slate-800 text-slate-400 text-sm">
            No resources currently registered in the pool.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {resources.map((res) => (
              <div
                key={res.id}
                className="group relative p-5 rounded-2xl bg-slate-850/80 border border-slate-800 hover:border-indigo-500/40 backdrop-blur-md transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-slate-800 text-[11px] font-semibold text-slate-300 border border-slate-700">
                      {res.category}
                    </span>
                    <InventoryBadge available={res.available_quantity} total={res.total_quantity} />
                  </div>

                  <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">
                    {res.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {res.description || 'No description provided.'}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                    <span>Available / Total:</span>
                    <span className="font-mono font-bold text-slate-200">
                      {res.available_quantity} / {res.total_quantity} units
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3">
                  <button
                    onClick={() => handleOpenRequest(res.id)}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-bold transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Request This Resource
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* SECTION 2: My Submitted Requests */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Inbox className="w-5 h-5 text-indigo-400" />
              My Resource Requests
            </h2>
            <p className="text-xs text-slate-400">
              Live tracking of your demands, priority scores, and transparent ranking reasons
            </p>
          </div>
        </div>

        {myRequests.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-slate-850 border border-slate-800 text-slate-400 text-sm">
            You haven't submitted any resource requests yet. Click "Request Resource" above to create one.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-850/70 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-4">Rank</th>
                  <th className="py-3.5 px-4">Resource</th>
                  <th className="py-3.5 px-4">Qty</th>
                  <th className="py-3.5 px-4">Urgency</th>
                  <th className="py-3.5 px-4">Community Votes</th>
                  <th className="py-3.5 px-4">Priority Score</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Explainability</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {myRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4">
                      {req.status === 'pending' ? (
                        <RankPositionBadge position={req.ranking_position} />
                      ) : (
                        <span className="text-xs text-slate-500 font-mono">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white">{req.resource_name}</div>
                      <div className="text-xs text-slate-400 line-clamp-1">{req.reason}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-300">
                      {req.requested_quantity}
                    </td>
                    <td className="py-3.5 px-4">
                      <UrgencyBadge urgency={req.urgency} />
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-300">
                      <span className="inline-flex items-center gap-1">
                        <Vote className="w-3.5 h-3.5 text-indigo-400" />
                        {req.votes_count || 0}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-amber-400">
                        {req.priority_score ? Number(req.priority_score).toFixed(1) : '0.0'}
                      </span>
                      <span className="text-[11px] text-slate-500"> /100</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <RequestStatusBadge status={req.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleViewExplanation(req.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 text-xs font-semibold transition-colors"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                        Why this rank?
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* SECTION 3: Community Voting Feed */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Vote className="w-5 h-5 text-indigo-400" />
              Community Voting Stream
            </h2>
            <p className="text-xs text-slate-400">
              Cast your vote to help prioritize urgent community demands (1 vote per request; self-voting disabled)
            </p>
          </div>
        </div>

        {votingFeed.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-slate-850 border border-slate-800 text-slate-400 text-sm">
            No pending community requests currently awaiting votes.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {votingFeed.map((req) => {
              const isOwnRequest = req.user_id === user?.id;
              const hasVoted = myVotedIds.includes(req.id);

              return (
                <div
                  key={req.id}
                  className={`p-5 rounded-2xl border backdrop-blur-md transition-all ${
                    hasVoted
                      ? 'bg-indigo-950/20 border-indigo-500/40 ring-1 ring-indigo-500/30'
                      : 'bg-slate-850/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <RankPositionBadge position={req.ranking_position} />
                      <div>
                        <h4 className="font-bold text-white text-base">
                          {req.resource_name} ({req.requested_quantity} requested)
                        </h4>
                        <div className="text-xs text-slate-400">
                          By <strong className="text-slate-300">{req.user_name || 'Community Member'}</strong>
                        </div>
                      </div>
                    </div>
                    <UrgencyBadge urgency={req.urgency} />
                  </div>

                  <p className="text-xs text-slate-300 mt-2 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 leading-relaxed">
                    <strong className="text-slate-200">Reason:</strong> {req.reason}
                    {req.description && (
                      <span className="block mt-1 text-slate-400">{req.description}</span>
                    )}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs">
                      <span className="font-mono text-slate-300 flex items-center gap-1 font-bold">
                        <Vote className="w-4 h-4 text-indigo-400" />
                        {req.votes_count || 0} votes
                      </span>
                      <span className="text-slate-500">•</span>
                      <span className="font-mono font-bold text-amber-400">
                        Score: {req.priority_score ? Number(req.priority_score).toFixed(1) : '0.0'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewExplanation(req.id)}
                        className="p-2 rounded-xl text-slate-400 hover:text-indigo-300 hover:bg-slate-800 transition-colors"
                        title="Why this rank?"
                      >
                        <HelpCircle className="w-4 h-4" />
                      </button>

                      {isOwnRequest ? (
                        <span
                          className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-500 border border-slate-700/60 text-xs font-semibold cursor-not-allowed"
                          title="You cannot vote for your own request."
                        >
                          Your Own Request
                        </span>
                      ) : hasVoted ? (
                        <button
                          onClick={() => handleUnvote(req.id)}
                          disabled={actionLoading}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-md shadow-indigo-600/30 hover:bg-indigo-700 transition-all"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Voted (Withdraw)
                        </button>
                      ) : (
                        <button
                          onClick={() => handleVote(req.id)}
                          disabled={actionLoading}
                          className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-bold transition-all"
                        >
                          <Vote className="w-3.5 h-3.5" />
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
      </section>

      {/* Explanation Modal */}
      <ExplanationModal
        isOpen={isExplanationOpen}
        onClose={() => setIsExplanationOpen(false)}
        explanationData={explanationData}
      />

      {/* Request Modal */}
      <RequestModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        preselectedResourceId={selectedResourceId}
        onSubmitted={() => {
          setFeedback({ type: 'success', message: 'Request submitted successfully and ranked!' });
          loadDashboardData();
        }}
      />

    </div>
  );
}
