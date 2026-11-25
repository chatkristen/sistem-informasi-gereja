'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import { Card, CardHeader, CardTitle, CardContent, Badge, Input, Select } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
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
  Download,
  Upload,
  HardDrive,
  RefreshCw,
} from 'lucide-react';

export default function PengaturanPage() {
  const { roleCode, currentUser, availableUsers, refreshChurchInfo } = useAuth();
  const { showToast } = useNotification();

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [activeTab, setActiveTab] = useState<'profil' | 'users' | 'security' | 'audit' | 'backup' | 'multi_branch'>('profil');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isConfirmRestoreOpen, setIsConfirmRestoreOpen] = useState(false);
  const [pendingRestoreData, setPendingRestoreData] = useState<any>(null);

  // Password Change Form
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Church Profile Form
  const [churchData, setChurchData] = useState({
    name: 'Gereja Kristen Kasih Anugerah',
    code: 'GKKA-JKT',
    address: 'Jl. Kasih Anugerah No. 7, Gambir, Jakarta Pusat 10110',
    phone: '(021) 555-0192',
    email: 'sekretariat@gkka-kasihanugerah.org',
    logo_url: '',
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [resAudit, resProfile] = await Promise.all([
        fetch('/api/audit-log'),
        fetch('/api/pengaturan'),
      ]);
      const jsonAudit = await resAudit.json();
      const jsonProfile = await resProfile.json();

      if (jsonAudit.success) setAuditLogs(jsonAudit.data);
      if (jsonProfile.success && jsonProfile.church) {
        setChurchData({
          name: jsonProfile.church.name || '',
          code: jsonProfile.church.code || '',
          address: jsonProfile.church.address || '',
          phone: jsonProfile.church.phone || '',
          email: jsonProfile.church.email || '',
          logo_url: jsonProfile.church.logo_url || '',
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/pengaturan', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...churchData,
          actor_name: currentUser?.full_name || 'Super Admin',
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast('success', 'Profil Diperbarui', 'Data profil gereja berhasil disimpan ke database.');
        await refreshChurchInfo();
        loadData();
      } else {
        showToast('error', 'Gagal Simpan', json.message || 'Terjadi kesalahan');
      }
    } catch (err: any) {
      showToast('error', 'Gagal', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      showToast('warning', 'Konfirmasi Salah', 'Konfirmasi kata sandi baru tidak sesuai.');
      return;
    }

    if (passwordForm.new_password.length < 8) {
      showToast('warning', 'Kata Sandi Terlalu Pendek', 'Kata sandi baru minimal 8 karakter.');
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUser.id,
          current_password: passwordForm.current_password,
          new_password: passwordForm.new_password,
          confirm_password: passwordForm.confirm_password,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast('success', 'Kata Sandi Berhasil Diperbarui', json.message);
        setPasswordForm({
          current_password: '',
          new_password: '',
          confirm_password: '',
        });
      } else {
        showToast('error', 'Gagal Mengubah Kata Sandi', json.message);
      }
    } catch (err: any) {
      showToast('error', 'Gagal', err.message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDownloadBackup = () => {
    window.open('/api/pengaturan/backup', '_blank');
    showToast('success', 'Cadangan Diunduh', 'Berkas basis data gereja berhasil diunduh.');
  };

  const handleFileRestoreSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (!parsed.church || !Array.isArray(parsed.members)) {
          showToast('error', 'Format Berkas Salah', 'Berkas JSON bukan cadangan sistem GKKA yang sah.');
          return;
        }
        setPendingRestoreData(parsed);
        setIsConfirmRestoreOpen(true);
      } catch (err) {
        showToast('error', 'Gagal Membaca File', 'Berkas JSON rusak atau tidak terbaca.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const executeRestore = async () => {
    if (!pendingRestoreData) return;
    setIsRestoring(true);
    try {
      const res = await fetch('/api/pengaturan/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          database: pendingRestoreData,
          actor_name: currentUser?.full_name || 'Super Admin',
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', 'Pemulihan Berhasil', data.message);
        setIsConfirmRestoreOpen(false);
        setPendingRestoreData(null);
        await refreshChurchInfo();
        loadData();
      } else {
        showToast('error', 'Gagal Pulihkan', data.message);
      }
    } catch (e: any) {
      showToast('error', 'Kesalahan Sistem', e.message);
    } finally {
      setIsRestoring(false);
    }
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
          { key: 'security', label: 'Keamanan Akun & Sandi', icon: Lock },
          { key: 'audit', label: 'Audit Log Aktivitas', icon: Clock },
          { key: 'backup', label: 'Cadangkan & Pulihkan Data', icon: HardDrive },
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
              {/* Logo Gereja Upload */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row items-center gap-5">
                <div className="shrink-0 text-center sm:text-left">
                  {churchData.logo_url ? (
                    <img
                      src={churchData.logo_url}
                      alt="Logo Gereja"
                      className="w-20 h-20 rounded-2xl object-contain bg-white p-2 border border-slate-200 shadow-sm mx-auto sm:mx-0"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gold-400 via-gold-500 to-gold-600 flex items-center justify-center text-navy-950 font-black text-3xl shadow-sm mx-auto sm:mx-0">
                      ✝
                    </div>
                  )}
                </div>
                <div className="flex-1 w-full">
                  <ImageUpload
                    label="Unggah Logo Gereja"
                    helperText="Format: JPG, PNG, WebP (Maks. 5MB). Logo ini akan tampil di Sidebar Navigasi dan Laporan."
                    value={churchData.logo_url}
                    onChange={(base64) => setChurchData({ ...churchData, logo_url: base64 })}
                    aspectRatio="square"
                  />
                </div>
              </div>

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
                <Button variant="gold" size="md" type="submit" isLoading={isSaving}>
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
                    const handleDownloadBackup = () => {
    window.open('/api/pengaturan/backup', '_blank');
    showToast('success', 'Cadangan Diunduh', 'Berkas basis data gereja berhasil diunduh.');
  };

  const handleFileRestoreSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (!parsed.church || !Array.isArray(parsed.members)) {
          showToast('error', 'Format Berkas Salah', 'Berkas JSON bukan cadangan sistem GKKA yang sah.');
          return;
        }
        setPendingRestoreData(parsed);
        setIsConfirmRestoreOpen(true);
      } catch (err) {
        showToast('error', 'Gagal Membaca File', 'Berkas JSON rusak atau tidak terbaca.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const executeRestore = async () => {
    if (!pendingRestoreData) return;
    setIsRestoring(true);
    try {
      const res = await fetch('/api/pengaturan/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          database: pendingRestoreData,
          actor_name: currentUser?.full_name || 'Super Admin',
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', 'Pemulihan Berhasil', data.message);
        setIsConfirmRestoreOpen(false);
        setPendingRestoreData(null);
        await refreshChurchInfo();
        loadData();
      } else {
        showToast('error', 'Gagal Pulihkan', data.message);
      }
    } catch (e: any) {
      showToast('error', 'Kesalahan Sistem', e.message);
    } finally {
      setIsRestoring(false);
    }
  };

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

      {/* Tab: Keamanan Akun & Sandi */}
      {activeTab === 'security' && (
        <div className="space-y-6 max-w-2xl">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-navy-900" />
                <CardTitle>Ubah Kata Sandi Akun Anda</CardTitle>
              </div>
              <p className="text-xs text-slate-400">
                Tingkatkan keamanan akun Anda ({currentUser?.full_name}) dengan memperbarui kata sandi secara berkala.
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">Kata Sandi Saat Ini *</label>
                  <input
                    type="password"
                    required
                    value={passwordForm.current_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                    placeholder="Masukkan kata sandi lama Anda"
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:outline-none focus:border-navy-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">Kata Sandi Baru (Min. 8 Karakter) *</label>
                  <input
                    type="password"
                    required
                    value={passwordForm.new_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                    placeholder="Minimal 8 karakter unik"
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:outline-none focus:border-navy-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">Konfirmasi Kata Sandi Baru *</label>
                  <input
                    type="password"
                    required
                    value={passwordForm.confirm_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                    placeholder="Ulangi kata sandi baru"
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:outline-none focus:border-navy-600"
                  />
                </div>

                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/80 text-[11px] text-amber-900 space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-amber-700" /> Standar Keamanan Sistem
                  </p>
                  <p>
                    Kata sandi disimpan menggunakan enkripsi PBKDF2 dengan Cryptographic Salt 64-byte untuk perlindungan terhadap serangan brute-force dan kebocoran data.
                  </p>
                </div>

                <div className="pt-2">
                  <Button variant="gold" size="md" type="submit" isLoading={isChangingPassword}>
                    Simpan Kata Sandi Baru
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Indikator Keamanan Sistem */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <CardTitle>Status Keamanan Sistem Saat Ini</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div>
                    <p className="font-bold text-slate-800">Proteksi Brute-Force Login</p>
                    <p className="text-[11px] text-slate-500">Membatasi 5 kali kegagalan login per 10 menit</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                    AKTIF
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div>
                    <p className="font-bold text-slate-800">HTTP Security Headers (OWASP)</p>
                    <p className="text-[11px] text-slate-500">X-Frame-Options, No-Sniff, Permissions Policy, XSS Protection</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                    AKTIF
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div>
                    <p className="font-bold text-slate-800">Role-Based Access Control (RBAC)</p>
                    <p className="text-[11px] text-slate-500">Pembatasan akses 6 role pengguna secara ketat</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                    AKTIF
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div>
                    <p className="font-bold text-slate-800">Enkripsi Token Sesi (HMAC-SHA256)</p>
                    <p className="text-[11px] text-slate-500">Mencegah manipulasi identitas token sesi</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                    AKTIF
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
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
                      <td className="px-4 py-3 text-slate-500 font-mono text-[10px] break-all min-w-[200px]">
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

      {/* Tab 4: Cadangkan & Pulihkan Data */}
      {activeTab === 'backup' && (
        <div className="space-y-6 max-w-4xl">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-navy-900" />
                <CardTitle>Cadangkan Database (Backup 1-Klik)</CardTitle>
              </div>
              <span className="text-xs text-slate-400">
                Unduh seluruh data jemaat, keuangan, kegiatan, dan aset gereja ke dalam file arsip aman (.json)
              </span>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed space-y-2">
                <p className="font-semibold text-slate-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Keamanan & Kesiapan Backup
                </p>
                <p>
                  File cadangan mencakup struktur lengkap: Data Profil Gereja, Master Jemaat & Keluarga, Catatan Keuangan & Persembahan, Jadwal Ibadah & Pelayan, Inventaris Departemen, serta Warta & Log Audit.
                </p>
                <p className="text-slate-500">
                  Disarankan melakukan pencadangan data berkala (misal: setiap akhir pekan setelah ibadah atau akhir bulan tutup buku kas).
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button
                  variant="primary"
                  size="md"
                  leftIcon={<Download className="w-4 h-4" />}
                  onClick={handleDownloadBackup}
                >
                  Unduh File Cadangan Database Sekarang
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-amber-600" />
                <CardTitle>Pulihkan Database (Restore dari Arsip)</CardTitle>
              </div>
              <span className="text-xs text-slate-400">
                Muat kembali data dari file cadangan .json yang pernah diunduh sebelumnya
              </span>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed space-y-2">
                <p className="font-bold flex items-center gap-2 text-amber-950">
                  <Lock className="w-4 h-4 text-amber-700" />
                  Perhatian Sebelum Memulihkan Data
                </p>
                <p>
                  Proses pemulihan akan menimpa seluruh rekaman basis data saat ini dengan isi arsip yang diunggah. Pastikan Anda mengunggah file cadangan yang sah dan telah membackup data terbaru sebelum melakukan restore.
                </p>
              </div>

              <div className="pt-2">
                <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-navy-900 text-white hover:bg-navy-800 cursor-pointer shadow-sm transition">
                  <Upload className="w-4 h-4" />
                  Pilih File Cadangan (.json) untuk Dipulihkan
                  <input
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={handleFileRestoreSelect}
                    disabled={isRestoring}
                  />
                </label>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 5: Kesiapan Multi-Cabang */}
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

      {/* Confirm Modal Restore Database */}
      <ConfirmModal
        isOpen={isConfirmRestoreOpen}
        onClose={() => {
          setIsConfirmRestoreOpen(false);
          setPendingRestoreData(null);
        }}
        onConfirm={executeRestore}
        title="Konfirmasi Pemulihan Database"
        message="PERINGATAN: Memulihkan database akan menimpa seluruh rekaman aktif saat ini dengan data dari file cadangan yang Anda pilih. Tindakan ini tidak dapat dibatalkan. Apakah Anda yakin ingin melanjutkan proses pemulihan data?"
        confirmText="Ya, Pulihkan Database"
        cancelText="Batalkan"
        variant="danger"
        isLoading={isRestoring}
      />
    </div>
  );
}
