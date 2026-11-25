'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import { Bell, Search, LogOut, User as UserIcon, Shield, ChevronDown, CheckCheck, Megaphone, Calendar, AlertCircle, Menu } from 'lucide-react';
import { formatDateTimeIndo } from '@/lib/utils';

interface HeaderProps {
  onMenuToggle?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuToggle }) => {
  const { currentUser, roleCode, logout } = useAuth();
  const { showToast } = useNotification();
  const router = useRouter();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Fetch announcements/activities for notifications
  const loadNotifications = async () => {
    try {
      const [resAnc, resEvt] = await Promise.all([
        fetch('/api/pengumuman'),
        fetch('/api/kegiatan'),
      ]);
      const dataAnc = await resAnc.json();
      const dataEvt = await resEvt.json();

      const notifList: any[] = [];

      if (dataAnc.success && Array.isArray(dataAnc.data)) {
        dataAnc.data.slice(0, 4).forEach((a: any) => {
          notifList.push({
            id: 'notif-anc-' + a.id,
            type: 'ANNOUNCEMENT',
            title: a.title,
            message: a.content || 'Warta jemaat terbaru telah diterbitkan.',
            time: a.publish_date || a.created_at,
            category: 'Warta Jemaat',
            link: '/pengumuman',
          });
        });
      }

      if (dataEvt.success && Array.isArray(dataEvt.data)) {
        dataEvt.data.slice(0, 3).forEach((e: any) => {
          notifList.push({
            id: 'notif-evt-' + e.id,
            type: 'EVENT',
            title: e.title,
            message: `Jadwal ibadah/kegiatan di ${e.location || 'Sanctuary'}`,
            time: e.start_time || e.created_at,
            category: e.category?.replace('_', ' ') || 'Kegiatan',
            link: '/kegiatan',
          });
        });
      }

      setNotifications(notifList);
      setUnreadCount(notifList.length);
    } catch (err) {
      console.error('Error loading notifications:', err);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
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
    <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Mobile Menu Button & Search Bar */}
      <div className="flex items-center gap-3 w-full max-w-xs sm:max-w-md">
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-navy-950 hover:bg-slate-100 transition cursor-pointer shrink-0"
            title="Buka Navigasi Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari jemaat, kegiatan, keuangan..."
            className="w-full bg-slate-100 hover:bg-slate-200/60 focus:bg-white text-xs text-slate-800 placeholder:text-slate-400 pl-9 pr-3 sm:pr-4 py-2 rounded-xl border border-transparent focus:border-navy-400 focus:outline-none transition"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative p-2 rounded-xl text-slate-600 hover:text-navy-950 hover:bg-slate-100 transition cursor-pointer"
            title="Notifikasi Warta & Administrasi"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
            )}
          </button>

          {/* Notification Dropdown Panel */}
          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200/80 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-navy-950">Notifikasi & Informasi</h4>
                  {unreadCount > 0 && (
                    <span className="text-[10px] bg-rose-100 text-rose-700 font-bold px-2 py-0.5 rounded-full">
                      {unreadCount} Baru
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={() => {
                      setUnreadCount(0);
                      showToast('info', 'Notifikasi Dibaca', 'Semua notifikasi telah ditandai dibaca.');
                    }}
                    className="text-[10px] text-navy-700 hover:text-navy-950 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <CheckCheck className="w-3 h-3" /> Tandai Dibaca
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-slate-400">
                    <Bell className="w-6 h-6 mx-auto mb-2 text-slate-300" />
                    <p className="text-xs">Belum ada notifikasi baru</p>
                  </div>
                ) : (
                  notifications.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        setIsNotifOpen(false);
                        router.push(item.link);
                      }}
                      className="p-3.5 hover:bg-slate-50 transition cursor-pointer flex items-start gap-3"
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        item.type === 'ANNOUNCEMENT' ? 'bg-amber-50 text-amber-600' : 'bg-navy-50 text-navy-700'
                      }`}>
                        {item.type === 'ANNOUNCEMENT' ? (
                          <Megaphone className="w-4 h-4" />
                        ) : (
                          <Calendar className="w-4 h-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            {item.category}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-900 truncate mt-0.5">
                          {item.title}
                        </p>
                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                          {item.message}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-2 border-t border-slate-100 bg-slate-50/50 flex justify-between text-[11px]">
                <button
                  onClick={() => {
                    setIsNotifOpen(false);
                    router.push('/pengumuman');
                  }}
                  className="w-full text-center py-1 font-bold text-navy-900 hover:text-navy-700 cursor-pointer"
                >
                  Lihat Semua Warta & Pengumuman →
                </button>
              </div>
            </div>
          )}
        </div>

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
