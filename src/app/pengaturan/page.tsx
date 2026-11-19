'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import { Card, CardHeader, CardTitle, CardContent, Badge, Input, Select } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AuditLog } from '@/lib/types';
import { formatDateTimeIndo } from '@/lib/utils';
import { ROLES } from '@/lib/rbac';
import {
  ShieldCheck,
  Building2,
  Users,
  Clock,
  Key,
  Shield,
  Layers,
  CheckCircle2,
  Lock,
  Database,
  Radio,
} from 'lucide-react';

export default function PengaturanPage() {
  const { roleCode, currentUser, availableUsers } = useAuth();
  const { showToast } = useNotification();

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [activeTab, setActiveTab] = useState<'profil' | 'users' | 'audit' | 'multi_branch'>('profil');
  const [isLoading, setIsLoading] = useState(false);

  // Church Profile Form
  const [churchData, setChurchData] = useState({
    name: 'Gereja Kristen Kasih Anugerah',
    code: 'GKKA-JKT',
    address: 'Jl. Kasih Anugerah No. 7, Gambir, Jakarta Pusat 10110',
    phone: '(021) 555-0192',
    email: 'sekretariat@gkka-kasihanugerah.org',
  });

  useEffect(() => {
    async function loadAudit() {
      setIsLoading(true);
      try {
        const res = await fetch('/api/audit-log');
        const json = await res.json();
        if (json.success) setAuditLogs(json.data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadAudit();
  }, []);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('success', 'Profil Diperbarui', 'Data profil gereja berhasil disimpan.');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-navy-950 tracking-tight flex items-center gap-2.5">
          <ShieldCheck className="w-6 h-6 text-navy-900" />
          Pengaturan Sistem & Keamanan
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Konfigurasi profil gereja, manajemen 6 role pengguna, arsitektur multi-cabang, dan audit trail sistem.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-2 text-xs font-bold">
        {[
          { key: 'profil', label: 'Profil Gereja', icon: Building2 },
          { key: 'users', label: '6 Akun & Role Pengguna', icon: Users },
          { key: 'audit', label: 'Audit Log Aktivitas', icon: Clock },
          { key: 'multi_branch', label: 'Kesiapan Multi-Cabang', icon: Layers },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 py-3 px-4 border-b-2 transition whitespace-nowrap ${
                active
                  ? 'border-navy-900 text-navy-950 bg-white rounded-t-xl'
                  : 'border-transparent text-slate-500 hover:text-navy-900 hover:border-slate-300'
              }`}
            >
              <Icon className={`w-4 h-4 ${active ? 'text-gold-600' : 'text-slate-400'}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Profil Gereja */}
      {activeTab === 'profil' && (
        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle>Identitas Organisasi Gereja</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Nama Resmi Gereja *"
                  value={churchData.name}
                  onChange={(e) => setChurchData({ ...churchData, name: e.target.value })}
                  required
                />
                <Input
                  label="Kode Identitas Organisasi (Church Code) *"
                  value={churchData.code}
                  onChange={(e) => setChurchData({ ...churchData, code: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Telepon Sekretariat"
                  value={churchData.phone}
                  onChange={(e) => setChurchData({ ...churchData, phone: e.target.value })}
                />
                <Input
                  label="Email Resmi"
                  value={churchData.email}
                  onChange={(e) => setChurchData({ ...churchData, email: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">Alamat Lengkap Gedung Gereja</label>
                <textarea
                  rows={2}
                  value={churchData.address}
                  onChange={(e) => setChurchData({ ...churchData, address: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:outline-none focus:border-navy-600"
                ></textarea>
              </div>

              <div className="pt-2 flex justify-end">
                <Button variant="gold" size="md" type="submit">
                  Simpan Perubahan Profil
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Tab 2: 6 Role Pengguna */}
      {activeTab === 'users' && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Daftar Pengguna Berdasarkan 6 Role Utama</CardTitle>
              <p className="text-xs text-slate-400 mt-0.5">
                Role-Based Access Control (RBAC) dengan granularitas aksi dan pembatasan kerahasiaan
              </p>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">Nama & Username</th>
                    <th className="px-4 py-3.5">Role Pengguna</th>
                    <th className="px-4 py-3.5">Departemen Terkait</th>
                    <th className="px-4 py-3.5">Email</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5">Hak Istimewa Keamanan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {availableUsers.map((u) => {
                    const role = ROLES[u.role_code];
                    return (
                      <tr key={u.id} className="hover:bg-slate-50 transition">
                        <td className="px-5 py-3.5">
                          <p className="font-bold text-navy-950">{u.full_name}</p>
                          <p className="font-mono text-[11px] text-slate-400">@{u.username}</p>
                        </td>

                        <td className="px-4 py-3.5">
                          <span className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${role.badgeColor}`}>
                            {role.name}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 font-medium text-slate-700">
                          {u.department_name || '-'}
                        </td>

                        <td className="px-4 py-3.5 text-slate-600 font-mono text-[11px]">
                          {u.email}
                        </td>

                        <td className="px-4 py-3.5">
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            AKTIF
                          </span>
                        </td>

                        <td className="px-4 py-3.5 text-slate-500 text-[11px]">
                          {u.role_code === 'SUPER_ADMIN' && 'Akses Penuh Seluruh Modul & Audit'}
                          {u.role_code === 'PENDETA' && 'Catatan Pastoral Rahasia & Persetujuan Diakonia'}
                          {u.role_code === 'BENDAHARA' && 'Buku Kas, Saldo & Persembahan Individual Rahasia'}
                          {u.role_code === 'SEKRETARIS' && 'Data Jemaat, Keluarga, Warta, Surat Dokumen'}
                          {u.role_code === 'KETUA_DEPARTEMEN' && 'Program Kerja & Anggaran Komisi Sendiri'}
                          {u.role_code === 'PENGURUS_DEPARTEMEN' && 'Pelaksana Kegiatan & Tugas Komisi'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab 3: Audit Log Aktivitas */}
      {activeTab === 'audit' && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-navy-900" />
              <CardTitle>Audit Trail Aktivitas Sistem</CardTitle>
            </div>
            <span className="text-xs text-slate-400">
              Pencatatan mutasi data, waktu, pengguna, dan snapshot perubahan
            </span>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3">Waktu Kejadian</th>
                    <th className="px-4 py-3">Pengguna (Actor)</th>
                    <th className="px-4 py-3">Aksi</th>
                    <th className="px-4 py-3">Modul</th>
                    <th className="px-4 py-3">Identitas Rekaman</th>
                    <th className="px-4 py-3">Rincian Perubahan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 transition">
                      <td className="px-5 py-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {formatDateTimeIndo(log.created_at)}
                      </td>
                      <td className="px-4 py-3 font-bold text-navy-950">{log.user_name}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded ${
                            log.action === 'CREATE'
                              ? 'bg-emerald-50 text-emerald-700'
                              : log.action === 'UPDATE'
                              ? 'bg-blue-50 text-blue-700'
                              : log.action === 'REVERSE' || log.action === 'DELETE'
                              ? 'bg-rose-50 text-rose-700'
                              : 'bg-purple-50 text-purple-700'
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{log.module}</td>
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-600">{log.record_id || '-'}</td>
                      <td className="px-4 py-3 text-slate-500 max-w-xs truncate">
                        {log.details ? JSON.stringify(log.details) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab 4: Kesiapan Multi-Cabang */}
      {activeTab === 'multi_branch' && (
        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle>Arsitektur Kesiapan Multi-Cabang (Multi-Tenant Ready)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs text-slate-600">
            <div className="p-4 rounded-2xl bg-navy-50 border border-navy-200 space-y-2">
              <h4 className="font-bold text-navy-950 flex items-center gap-2">
                <Database className="w-4 h-4 text-navy-800" />
                Arsitektur Church Multi-Tenant ID
              </h4>
              <p className="leading-relaxed">
                Setiap tabel dalam skema basis data PostgreSQL/Supabase dan database aplikasi dilengkapi dengan kolom identitas organisasi{' '}
                <code className="bg-navy-100 text-navy-900 font-bold px-1.5 py-0.5 rounded font-mono">church_id (UUID)</code>.
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-700 pt-1">
                <li>
                  Saat ini sistem dikonfigurasi mengunci ke satu cabang tunggal:{' '}
                  <strong>Gereja Kristen Kasih Anugerah (Pusat)</strong>.
                </li>
                <li>
                  Untuk mengaktifkan multi-cabang di masa depan, sistem hanya perlu membuka selektor cabang dan Row-Level Security (RLS) partition, tanpa perlu memodifikasi struktur tabel dasar.
                </li>
                <li>Tidak ada pergantian cabang yang ditampilkan kepada staf jemaat saat ini sesuai spesifikasi.</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
