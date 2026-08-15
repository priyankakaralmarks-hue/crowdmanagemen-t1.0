import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Boxes, Lock, Mail, ArrowRight, Shield, User, AlertCircle, Sparkles } from 'lucide-react';

export function LoginPage() {
  const { login, quickLogin } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email.trim(), password);
      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail, demoRole) => {
    setError('');
    setLoading(true);
    try {
      const user = await quickLogin(demoEmail, 'user123');
      navigate(demoRole === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Quick login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[90vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-xl shadow-indigo-500/20 mb-4">
            <Boxes className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            Sign In to ResourceSync
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Fair & Transparent Crowd-Sourced Resource Allocation Tool
          </p>
        </div>

        {/* Quick Demo Test Buttons */}
        <div className="mt-6 p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 backdrop-blur-md">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-400 mb-2.5">
            <Sparkles className="w-3.5 h-3.5" />
            1-Click Demo Evaluation Profiles
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('admin@allocator.com', 'admin')}
              className="p-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-left transition-all text-purple-200 text-xs flex items-center gap-2 group"
            >
              <Shield className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
              <div>
                <div className="font-bold">Admin Officer</div>
                <div className="text-[10px] text-slate-400">Full control & allocations</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('alice@example.com', 'user')}
              className="p-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-left transition-all text-emerald-200 text-xs flex items-center gap-2 group"
            >
              <User className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              <div>
                <div className="font-bold">Alice Green</div>
                <div className="text-[10px] text-slate-400">Emergency responder</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('bob@example.com', 'user')}
              className="p-2.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-left transition-all text-blue-200 text-xs flex items-center gap-2 group"
            >
              <User className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
              <div>
                <div className="font-bold">Bob Vance</div>
                <div className="text-[10px] text-slate-400">Field logistics ops</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('charlie@example.com', 'user')}
              className="p-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-left transition-all text-amber-200 text-xs flex items-center gap-2 group"
            >
              <User className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
              <div>
                <div className="font-bold">Dr. Charlie Kelly</div>
                <div className="text-[10px] text-slate-400">Health outreach</div>
              </div>
            </button>
          </div>
        </div>

        {/* Card */}
        <div className="mt-6 bg-slate-900/90 py-8 px-6 sm:px-8 border border-slate-800 rounded-2xl shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : (
                <>
                  Sign In <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-400 border-t border-slate-800 pt-4">
            Don't have an account?{' '}
            <Link to="/signup" className="text-indigo-400 hover:text-indigo-300 font-semibold">
              Create an account
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
