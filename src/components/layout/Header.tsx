'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { RoleSwitcher } from './RoleSwitcher';
import { Bell, Search, ShieldAlert, Sparkles } from 'lucide-react';

export const Header: React.FC = () => {
  const { currentUser, roleCode } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Search Bar */}
      <div className="flex items-center gap-3 w-72 md:w-96">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari jemaat, persembahan, inventaris..."
            className="w-full bg-slate-100 hover:bg-slate-200/60 focus:bg-white text-xs text-slate-800 placeholder:text-slate-400 pl-9 pr-4 py-2 rounded-xl border border-transparent focus:border-navy-400 focus:outline-none transition"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Role Switcher */}
        <RoleSwitcher />

        {/* Notifications */}
        <button
          className="relative p-2 rounded-xl text-slate-600 hover:text-navy-950 hover:bg-slate-100 transition"
          title="Notifikasi"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
        </button>

        {/* User Info */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
          <img
            src={currentUser?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
            alt="User Avatar"
            className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
          />
          <div className="hidden md:block text-left">
            <p className="text-xs font-bold text-navy-950 leading-tight">
              {currentUser?.full_name}
            </p>
            <p className="text-[10px] text-slate-500 font-medium">{currentUser?.email}</p>
          </div>
        </div>
      </div>
    </header>
  );
};
