import React from 'react';
import { X, Sparkles, Flame, Users, Layers, Award, Info, CheckCircle2, AlertTriangle } from 'lucide-react';
import { UrgencyBadge, RequestStatusBadge } from './StatusBadge';

export function ExplanationModal({ isOpen, onClose, explanationData }) {
  if (!isOpen || !explanationData) return null;

  const {
    id,
    resource_name,
    resource_category,
    requested_quantity,
    available_quantity,
    urgency,
    user_name,
    priority_score,
    ranking_position,
    votes_count,
    explanation,
    breakdown,
    status,
    created_at
  } = explanationData;

  const urg = breakdown?.urgency || { points: 0, maxPoints: 50, description: '' };
  const comm = breakdown?.community || { points: 0, maxPoints: 30, votes: 0, description: '' };
  const avail = breakdown?.availability || { points: 0, maxPoints: 20, status: '', description: '' };

  const urgPercent = (urg.points / (urg.maxPoints || 50)) * 100;
  const commPercent = (comm.points / (comm.maxPoints || 30)) * 100;
  const availPercent = (avail.points / (avail.maxPoints || 20)) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-800 bg-slate-800/40">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                Explainable AI Ranking Audit
              </span>
              <span className="text-xs text-slate-500">• Request #{id}</span>
            </div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Why this request is ranked #{ranking_position || 'Pending'}
            </h2>
            <p className="text-sm text-slate-400 mt-0.5">
              Resource: <span className="font-medium text-slate-200">{resource_name}</span> ({requested_quantity} requested) by <span className="font-medium text-slate-200">{user_name || 'User'}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* Top Score Banner */}
          <div className="p-5 rounded-xl bg-gradient-to-r from-indigo-950/50 via-slate-850 to-purple-950/40 border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">
                Overall Priority Score
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold text-white">
                  {typeof priority_score === 'number' ? priority_score.toFixed(1) : priority_score}
                </span>
                <span className="text-sm text-slate-400 font-medium">/ 100.0 pts</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs text-slate-400">Current Position</div>
                <div className="text-lg font-bold text-amber-400">
                  {ranking_position ? `Rank #${ranking_position}` : 'Calculated'}
                </div>
              </div>
              <UrgencyBadge urgency={urgency} />
            </div>
          </div>

          {/* Dynamic Natural Language Explanation */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 shrink-0 mt-0.5">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white mb-1">Algorithmic Explanation</h4>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {explanation || 'Explanation computed based on urgency, community consensus, and real-time inventory capacity.'}
                </p>
              </div>
            </div>
          </div>

          {/* Transparent 3-Factor Breakdown */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Scoring Factors Breakdown (Transparent Weights)
            </h4>

            {/* Factor 1: Urgency */}
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 hover:border-slate-700 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-rose-400" />
                  <span className="font-semibold text-sm text-white">1. Urgency Level</span>
                  <span className="text-xs text-slate-400">(Weight: 50%)</span>
                </div>
                <div className="text-sm font-mono font-bold text-rose-300">
                  +{urg.points?.toFixed(1)} / {urg.maxPoints} pts
                </div>
              </div>
              {/* Progress Bar */}
              <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-gradient-to-r from-rose-500 to-amber-500 rounded-full transition-all duration-500"
                  style={{ width: `${urgPercent}%` }}
                ></div>
              </div>
              <p className="text-xs text-slate-400">{urg.description}</p>
            </div>

            {/* Factor 2: Community Support */}
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 hover:border-slate-700 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-400" />
                  <span className="font-semibold text-sm text-white">2. Community Voting Consensus</span>
                  <span className="text-xs text-slate-400">(Weight: 30%)</span>
                </div>
                <div className="text-sm font-mono font-bold text-indigo-300">
                  +{comm.points?.toFixed(1)} / {comm.maxPoints} pts
                </div>
              </div>
              {/* Progress Bar */}
              <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full transition-all duration-500"
                  style={{ width: `${commPercent}%` }}
                ></div>
              </div>
              <p className="text-xs text-slate-400">{comm.description}</p>
            </div>

            {/* Factor 3: Resource Availability */}
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 hover:border-slate-700 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  <span className="font-semibold text-sm text-white">3. Resource Availability & Capacity</span>
                  <span className="text-xs text-slate-400">(Weight: 20%)</span>
                </div>
                <div className="text-sm font-mono font-bold text-emerald-300">
                  +{avail.points?.toFixed(1)} / {avail.maxPoints} pts
                </div>
              </div>
              {/* Progress Bar */}
              <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                  style={{ width: `${availPercent}%` }}
                ></div>
              </div>
              <p className="text-xs text-slate-400">{avail.description}</p>
            </div>
          </div>

          {/* Mathematical Formula Footnote */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>
              <strong className="text-slate-300">Formula:</strong> Priority Score = Urgency (Max 50) + Community Normalized Votes (Max 30) + Inventory Availability (Max 20).
            </span>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-800/30 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-sm font-semibold bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors"
          >
            Close Audit
          </button>
        </div>

      </div>
    </div>
  );
}
