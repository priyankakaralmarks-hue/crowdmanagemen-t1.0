import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Boxes,
  LayoutDashboard,
  Vote,
  Trophy,
  History,
  LogOut,
  User,
  Shield,
  Layers,
  PlusCircle,
  ChevronDown,
  Sparkles
} from 'lucide-react';

export function Navbar({ onOpenRequestModal }) {
  const { user, isAdmin, logout, quickLogin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [demoDropdownOpen, setDemoDropdownOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const handleDemoSwitch = async (email) => {
    setDemoDropdownOpen(false);
    await quickLogin(email, 'user123');
    navigate(email === 'admin@allocator.com' ? '/admin' : '/dashboard');
  };

  const navLinks = isAdmin
    ? [
        { path: '/admin', label: 'Admin Hub', icon: LayoutDashboard },
        { path: '/ranking', label: 'Ranked Allocations', icon: Trophy },
        { path: '/resources', label: 'Inventory', icon: Boxes },
        { path: '/history', label: 'Allocation History', icon: History }
      ]
    : [
        { path: '/dashboard', label: 'My Dashboard', icon: LayoutDashboard },
        { path: '/resources', label: 'Browse Resources', icon: Boxes },
        { path: '/voting', label: 'Community Voting', icon: Vote },
        { path: '/ranking', label: 'Live Rankings', icon: Trophy }
      ];

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-900/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-8">
            <Link
              to={isAdmin ? '/admin' : '/dashboard'}
              className="flex items-center gap-2.5 group"
            >
              <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-500 text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <Boxes className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-indigo-300">
                  ResourceSync
                </span>
                <span className="hidden sm:inline-block ml-2 text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  Explainable Allocator
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const active = isActive(link.path);
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                      active
                        ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? 'text-indigo-400' : 'text-slate-400'}`} />
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-3">
            {/* Quick Request Button for Users */}
            {!isAdmin && onOpenRequestModal && (
              <button
                onClick={onOpenRequestModal}
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/25 transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                Request Resource
              </button>
            )}

            {/* Role Switcher Dropdown (Quick Demo Tool) */}
            <div className="relative">
              <button
                onClick={() => setDemoDropdownOpen(!demoDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-800/80 border border-slate-700 hover:bg-slate-700 text-slate-200 transition-colors"
                title="Switch persona for evaluation"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Switch Persona:</span>
                <span className="font-bold text-indigo-300">{user?.name?.split(' ')[0] || 'User'}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {demoDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-xl bg-slate-850 border border-slate-700 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-700/50 mb-1">
                    Quick Persona Switcher
                  </div>
                  <button
                    onClick={() => handleDemoSwitch('admin@allocator.com')}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-slate-750 flex items-center justify-between text-slate-200"
                  >
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-purple-400" />
                      <div>
                        <div className="font-semibold text-purple-300">Admin Officer</div>
                        <div className="text-[10px] text-slate-400">admin@allocator.com</div>
                      </div>
                    </div>
                    <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded">Admin</span>
                  </button>

                  <button
                    onClick={() => handleDemoSwitch('alice@example.com')}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-slate-750 flex items-center justify-between text-slate-200"
                  >
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-emerald-400" />
                      <div>
                        <div className="font-semibold text-emerald-300">Alice Green</div>
                        <div className="text-[10px] text-slate-400">alice@example.com</div>
                      </div>
                    </div>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded">User A</span>
                  </button>

                  <button
                    onClick={() => handleDemoSwitch('bob@example.com')}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-slate-750 flex items-center justify-between text-slate-200"
                  >
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-blue-400" />
                      <div>
                        <div className="font-semibold text-blue-300">Bob Vance</div>
                        <div className="text-[10px] text-slate-400">bob@example.com</div>
                      </div>
                    </div>
                    <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded">User B</span>
                  </button>

                  <button
                    onClick={() => handleDemoSwitch('charlie@example.com')}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-slate-750 flex items-center justify-between text-slate-200"
                  >
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-amber-400" />
                      <div>
                        <div className="font-semibold text-amber-300">Dr. Charlie Kelly</div>
                        <div className="text-[10px] text-slate-400">charlie@example.com</div>
                      </div>
                    </div>
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded">User C</span>
                  </button>
                </div>
              )}
            </div>

            {/* Current User Pill & Role Badge */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="hidden lg:block text-right">
                <div className="text-xs font-semibold text-slate-200">{user?.name}</div>
                <div className="text-[10px] text-slate-400 capitalize">{user?.role}</div>
              </div>

              <div className={`p-1.5 rounded-lg border ${isAdmin ? 'bg-purple-500/15 border-purple-500/30 text-purple-300' : 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300'}`}>
                {isAdmin ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>

              {/* Logout */}
              <button
                onClick={logout}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

          </div>

        </div>

        {/* Mobile Navigation bar */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-slate-800/80">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex flex-col items-center gap-0.5 px-3 py-1 text-[11px] font-medium ${
                  active ? 'text-indigo-400 font-bold' : 'text-slate-400'
                }`}
              >
                <Icon className="w-4 h-4" />
                {link.label}
              </Link>
            );
          })}
        </div>

      </div>
    </nav>
  );
}
