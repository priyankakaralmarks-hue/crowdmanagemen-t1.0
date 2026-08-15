import React from 'react';
import { AlertCircle, Clock, CheckCircle2, XCircle, Flame, ShieldAlert, Sparkles } from 'lucide-react';

export function UrgencyBadge({ urgency, size = 'sm' }) {
  const level = (urgency || 'low').toLowerCase();

  const configs = {
    critical: {
      label: 'Critical',
      icon: Flame,
      bg: 'bg-rose-500/15 border-rose-500/30 text-rose-300',
      dot: 'bg-rose-500 animate-pulse'
    },
    high: {
      label: 'High',
      icon: ShieldAlert,
      bg: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
      dot: 'bg-amber-500'
    },
    medium: {
      label: 'Medium',
      icon: Clock,
      bg: 'bg-blue-500/15 border-blue-500/30 text-blue-300',
      dot: 'bg-blue-500'
    },
    low: {
      label: 'Low',
      icon: Sparkles,
      bg: 'bg-slate-500/15 border-slate-500/30 text-slate-300',
      dot: 'bg-slate-400'
    }
  };

  const config = configs[level] || configs.low;
  const Icon = config.icon;
  const pad = size === 'xs' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${config.bg} ${pad}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></span>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}

export function RequestStatusBadge({ status, size = 'sm' }) {
  const st = (status || 'pending').toLowerCase();

  const configs = {
    pending: {
      label: 'Pending Review',
      icon: Clock,
      bg: 'bg-amber-500/15 border-amber-500/30 text-amber-300'
    },
    ranked: {
      label: 'Ranked',
      icon: Sparkles,
      bg: 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300'
    },
    allocated: {
      label: 'Allocated & Dispatched',
      icon: CheckCircle2,
      bg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
    },
    rejected: {
      label: 'Rejected',
      icon: XCircle,
      bg: 'bg-rose-500/15 border-rose-500/30 text-rose-300'
    }
  };

  const config = configs[st] || configs.pending;
  const Icon = config.icon;
  const pad = size === 'xs' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${config.bg} ${pad}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}

export function InventoryBadge({ available, total }) {
  if (available <= 0) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
        Out of Stock
      </span>
    );
  }

  if (available <= 3) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
        Low Stock ({available} left)
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
      {available} Available
    </span>
  );
}

export function RankPositionBadge({ position }) {
  if (!position) {
    return <span className="text-slate-500 text-xs font-mono">-</span>;
  }

  if (position === 1) {
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-sm shadow-sm shadow-amber-500/20">
        🥇 #1
      </span>
    );
  }
  if (position === 2) {
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-300/20 border border-slate-300/40 text-slate-200 font-bold text-sm">
        🥈 #2
      </span>
    );
  }
  if (position === 3) {
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-amber-700/20 border border-amber-700/40 text-amber-400 font-bold text-sm">
        🥉 #3
      </span>
    );
  }

  return (
    <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300 font-mono text-xs font-semibold">
      #{position}
    </span>
  );
}
