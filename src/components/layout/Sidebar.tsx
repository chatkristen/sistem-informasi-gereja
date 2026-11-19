'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Home,
  CreditCard,
  Building2,
  CalendarDays,
  HeartHandshake,
  Box,
  FileSpreadsheet,
  Bell,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  DollarSign,
  Wallet,
  ArrowRightLeft,
  PieChart,
  LogOut,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { roleCode, currentUser, can, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const isLinkActive = (href: string) => {
    if (href === '/' && pathname === '/') return true;
    if (href !== '/' && pathname.startsWith(href)) return true;
    return false;
  };

  // Nav Groups with RBAC visibility checks
  const navGroups = [
    {
      title: 'UTAMA',
      items: [
        {
          name: 'Dashboard',
          href: '/',
          icon: LayoutDashboard,
          visible: can('dashboard', 'view'),
        },
      ],
    },
    {
      title: 'ADMINISTRASI JEMAAT',
      items: [
        {
          name: 'Data Jemaat',
          href: '/jemaat',
          icon: Users,
          visible: can('jemaat', 'view'),
        },
        {
          name: 'Data Keluarga',
          href: '/keluarga',
          icon: Home,
          visible: can('keluarga', 'view'),
        },
      ],
    },
    {
      title: 'KEUANGAN GEREJA',
      items: [
        {
          name: 'Ikhtisar Keuangan',
          href: '/keuangan',
          icon: DollarSign,
          visible: can('keuangan_umum', 'view') || can('persembahan_kolektif', 'view'),
        },
        {
          name: 'Pemasukan & Persembahan',
          href: '/keuangan/pemasukan',
          icon: CreditCard,
          visible: can('persembahan_kolektif', 'view') || can('persembahan_individual', 'view'),
        },
        {
          name: 'Pengeluaran Gereja',
          href: '/keuangan/pengeluaran',
          icon: Wallet,
          visible: can('keuangan_umum', 'view'),
        },
        {
          name: 'Kas & Rekening Bank',
          href: '/keuangan/kas-bank',
          icon: ArrowRightLeft,
          visible: can('kas_bank', 'view'),
        },
        {
          name: 'Rencana Anggaran (RAPBG)',
          href: '/keuangan/anggaran',
          icon: PieChart,
          visible: can('anggaran', 'view'),
        },
      ],
    },
    {
      title: 'PELAYANAN & KOMISI',
      items: [
        {
          name: 'Departemen & Komisi',
          href: '/departemen',
          icon: Building2,
          visible: can('departemen', 'view'),
        },
        {
          name: 'Program Kerja',
          href: '/program-kerja',
          icon: Sparkles,
          visible: can('program_kerja', 'view'),
        },
        {
          name: 'Kegiatan & Kalender',
          href: '/kegiatan',
          icon: CalendarDays,
          visible: can('kegiatan', 'view'),
        },
        {
          name: 'Pelayanan Diakonia',
          href: '/diakonia',
          icon: HeartHandshake,
          visible: can('diakonia', 'view'),
        },
      ],
    },
    {
      title: 'OPERASIONAL & LAPORAN',
      items: [
        {
          name: 'Inventaris & Aset',
          href: '/inventaris',
          icon: Box,
          visible: can('inventaris', 'view'),
        },
        {
          name: 'Pengumuman Jemaat',
          href: '/pengumuman',
          icon: Bell,
          visible: can('pengumuman', 'view'),
        },
        {
          name: 'Pusat Laporan Terpadu',
          href: '/laporan',
          icon: FileSpreadsheet,
          visible: can('laporan', 'view'),
        },
      ],
    },
    {
      title: 'SISTEM',
      items: [
        {
          name: 'Pengaturan & Audit',
          href: '/pengaturan',
          icon: ShieldCheck,
          visible: roleCode === 'SUPER_ADMIN',
        },
      ],
    },
  ];

  return (
    <aside className="w-72 bg-navy-950 text-slate-300 flex flex-col shrink-0 border-r border-navy-900 select-none min-h-screen">
      {/* Brand Header */}
      <div className="p-5 border-b border-navy-900/80 bg-navy-950/80 backdrop-blur sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-400 via-gold-500 to-gold-600 flex items-center justify-center text-navy-950 shadow-md shadow-gold-500/10 font-black text-xl shrink-0">
            ✝
          </div>
          <div className="overflow-hidden">
            <h1 className="font-bold text-white text-sm tracking-tight truncate leading-tight">
              GKKA JAKARTA
            </h1>
            <p className="text-[11px] text-gold-400 font-medium tracking-wider uppercase">
              Church Management
            </p>
          </div>
        </div>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin scrollbar-thumb-navy-800">
        {navGroups.map((group, groupIdx) => {
          const visibleItems = group.items.filter((item) => item.visible);
          if (visibleItems.length === 0) return null;

          return (
            <div key={groupIdx}>
              <h4 className="px-3 text-[10px] font-bold uppercase tracking-wider text-navy-400 mb-2">
                {group.title}
              </h4>
              <div className="space-y-1">
                {visibleItems.map((item) => {
                  const active = isLinkActive(item.href);
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 group ${
                        active
                          ? 'bg-gradient-to-r from-gold-500/20 to-gold-500/5 text-gold-300 border-l-4 border-gold-400 shadow-sm'
                          : 'text-slate-300 hover:bg-navy-900 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3 truncate">
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-colors ${
                            active ? 'text-gold-400' : 'text-slate-400 group-hover:text-gold-300'
                          }`}
                        />
                        <span className="truncate">{item.name}</span>
                      </div>
                      {active && (
                        <ChevronRight className="w-3.5 h-3.5 text-gold-400 shrink-0" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom User Card */}
      <div className="p-3.5 border-t border-navy-900 bg-navy-900/50">
        <div className="flex items-center gap-2.5 p-2 rounded-xl bg-navy-900/80 border border-navy-800">
          <img
            src={currentUser?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
            alt="Avatar"
            className="w-8 h-8 rounded-full object-cover border border-gold-400/40 shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{currentUser?.full_name}</p>
            <p className="text-[10px] text-gold-400 truncate font-medium">
              {currentUser?.role_name}
            </p>
          </div>
          <button
            onClick={handleLogout}
            title="Keluar dari sesi (Logout)"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
