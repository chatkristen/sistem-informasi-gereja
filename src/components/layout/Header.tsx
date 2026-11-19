'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import { RoleSwitcher } from './RoleSwitcher';
import { Bell, Search, LogOut, User as UserIcon, Shield, ChevronDown } from 'lucide-react';

export const Header: React.FC = () => {
  const { currentUser, roleCode, logout } = useAuth();
  const { showToast } = useNotification();
  const router = useRouter();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsDropdownOpen(false);
    await logout();
    showToast('info', 'Sesi Berakhir', 'Anda telah berhasil keluar dari sistem gereja.');
    router.push('/login');
  };

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
          title="Notifikasi Warta & Administrasi"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
        </button>

        {/* User Info & Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2.5 pl-3 py-1 border-l border-slate-200 hover:opacity-80 transition cursor-pointer"
          >
            <img
              src={currentUser?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
              alt="User Avatar"
              className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
            />
            <div className="hidden md:block text-left">
              <p className="text-xs font-bold text-navy-950 leading-tight">
                {currentUser?.full_name}
              </p>
              <p className="text-[10px] text-slate-500 font-medium">{currentUser?.role_name}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden md:block" />
          </button>

          {/* User Menu Dropdown */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200/80 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-xs font-bold text-navy-950 truncate">
                  {currentUser?.full_name}
                </p>
                <p className="text-[11px] text-slate-500 truncate">{currentUser?.email}</p>
                <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-navy-50 text-navy-800 border border-navy-200">
                  <Shield className="w-3 h-3 text-gold-500" />
                  <span>{currentUser?.role_name}</span>
                </div>
              </div>

              <div className="p-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition text-left cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>Keluar dari Akun (Logout)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
