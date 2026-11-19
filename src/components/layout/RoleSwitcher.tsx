'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { RoleCode } from '@/lib/types';
import { ROLES } from '@/lib/rbac';
import { Shield, ChevronDown, Check, UserCheck } from 'lucide-react';

export const RoleSwitcher: React.FC = () => {
  const { roleCode, switchRole, currentUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const roleList: RoleCode[] = [
    'SUPER_ADMIN',
    'PENDETA',
    'SEKRETARIS',
    'BENDAHARA',
    'KETUA_DEPARTEMEN',
    'PENGURUS_DEPARTEMEN',
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-800 text-xs font-semibold transition shadow-sm"
      >
        <span className="w-2 h-2 rounded-full bg-gold-500 animate-pulse"></span>
        <Shield className="w-3.5 h-3.5 text-navy-800" />
        <span className="hidden sm:inline">Role Aktif:</span>
        <span className="font-bold text-navy-950">{ROLES[roleCode].name}</span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 p-2 animate-fade-in">
            <div className="px-3 py-2 border-b border-slate-100 mb-1">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Simulasi Hak Akses Role
              </p>
              <p className="text-xs text-slate-600">
                Pilih role di bawah untuk menguji pembatasan fitur & keamanan:
              </p>
            </div>

            <div className="space-y-1">
              {roleList.map((code) => {
                const role = ROLES[code];
                const active = roleCode === code;

                return (
                  <button
                    key={code}
                    onClick={() => {
                      switchRole(code);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left p-2.5 rounded-xl text-xs transition flex items-start gap-2.5 ${
                      active
                        ? 'bg-navy-50 border border-navy-200 text-navy-900 font-bold'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        active ? 'bg-navy-900 text-gold-400' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{role.name}</span>
                        {active && <Check className="w-3.5 h-3.5 text-navy-700" />}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                        {role.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
