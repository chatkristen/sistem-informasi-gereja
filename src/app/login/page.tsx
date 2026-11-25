'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, USERS } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import { RoleCode } from '@/lib/types';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Info,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Building2,
  Users,
  DollarSign,
  HeartHandshake,
  BookOpen,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

export default function LoginPage() {
  const router = useRouter();
  const { login, quickLogin, currentUser, isAuthenticated } = useAuth();
  const { showToast } = useNotification();

  const [identifier, setIdentifier] = useState('admin@gkka.org');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Help / Forgot Password Modal
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      router.push('/');
    }
  }, [isAuthenticated, currentUser, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!identifier.trim() || !password.trim()) {
      setErrorMessage('Silakan masukkan email/username dan kata sandi Anda.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await login(identifier, password, rememberMe);
      if (res.success) {
        showToast('success', 'Login Berhasil', res.message || 'Selamat datang di Sistem Informasi Gereja.');
        router.push('/');
      } else {
        setErrorMessage(res.message || 'Kredensial tidak valid. Silakan coba kembali.');
        showToast('error', 'Gagal Masuk', res.message || 'Email atau kata sandi tidak cocok.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan sistem saat mencoba login.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (role: RoleCode) => {
    const user = USERS[role];
    if (!user?.email) return;

    setIdentifier(user.email);
    setPassword('password123');
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await quickLogin(role);
      if (res.success) {
        showToast('success', 'Masuk Berhasil', `Berhasil masuk sebagai ${user.role_name} (${user.full_name}).`);
        router.push('/');
      } else {
        setErrorMessage(res.message || 'Gagal masuk akun');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Kesalahan saat masuk akun');
    } finally {
      setIsLoading(false);
    }
  };

  const roleCards: {
    role: RoleCode;
    title: string;
    name: string;
    email: string;
    color: string;
    icon: string;
  }[] = [
    {
      role: 'SUPER_ADMIN',
      title: 'Super Admin',
      name: 'Pdt. Samuel Hartono, M.Th',
      email: 'admin@gkka.org',
      color: 'border-gold-500/40 bg-gold-500/10 text-gold-300',
      icon: '👑',
    },
    {
      role: 'PENDETA',
      title: 'Gembala / Pendeta',
      name: 'Pdt. Andreas Wicaksono, M.Div',
      email: 'andreas.wicaksono@gkka.org',
      color: 'border-blue-500/40 bg-blue-500/10 text-blue-300',
      icon: '✝️',
    },
    {
      role: 'SEKRETARIS',
      title: 'Sekretaris Gereja',
      name: 'Debora Santoso, S.Kom',
      email: 'debora.santoso@gkka.org',
      color: 'border-indigo-500/40 bg-indigo-500/10 text-indigo-300',
      icon: '📝',
    },
    {
      role: 'BENDAHARA',
      title: 'Bendahara Gereja',
      name: 'Lydia Kusuma, S.E., Ak.',
      email: 'lydia.kusuma@gkka.org',
      color: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
      icon: '💰',
    },
    {
      role: 'KETUA_DEPARTEMEN',
      title: 'Ketua Komisi Pemuda',
      name: 'Daniel Kristianto, S.T.',
      email: 'daniel.kristianto@gkka.org',
      color: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
      icon: '👥',
    },
    {
      role: 'PENGURUS_DEPARTEMEN',
      title: 'Pengurus Tim Musik',
      name: 'Jonathan Setiawan',
      email: 'jonathan.setiawan@gkka.org',
      color: 'border-purple-500/40 bg-purple-500/10 text-purple-300',
      icon: '🎵',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#071328] via-[#0B2046] to-[#061022] text-slate-100 flex flex-col justify-between relative overflow-hidden font-sans">
      {/* Decorative Background Lighting Effects */}
      <div className="absolute top-0 right-0 -mr-40 -mt-40 w-96 h-96 bg-gold-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 -ml-40 -mb-40 w-96 h-96 bg-navy-600/20 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Header Brand */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-400 via-gold-500 to-gold-600 flex items-center justify-center text-navy-950 font-black text-xl shadow-lg shadow-gold-500/20">
            ✝
          </div>
          <div>
            <h1 className="text-sm font-extrabold text-white tracking-wide uppercase">
              Gereja Kristen Kasih Anugerah
            </h1>
            <p className="text-[11px] text-gold-400 font-semibold tracking-wider">
              GKKA Jakarta • Sistem Informasi Manajemen Gereja
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsHelpModalOpen(true)}
          className="text-xs text-slate-300 hover:text-white flex items-center gap-1.5 transition bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-xl border border-white/10"
        >
          <HelpCircle className="w-3.5 h-3.5 text-gold-400" />
          <span>Bantuan Akses</span>
        </button>
      </header>

      {/* Main Container */}
      <main className="relative z-10 w-full max-w-6xl mx-auto px-6 py-8 flex-1 flex flex-col lg:flex-row items-center justify-center gap-12">
        {/* Left Presentation Column */}
        <div className="lg:w-1/2 space-y-6 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-gold-400/10 text-gold-300 border border-gold-400/20 backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-gold-400" />
            <span>Sistem Operasional Gereja Terpadu</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            Digitalisasi Administrasi & <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-300 via-gold-400 to-amber-200">
              Pelayanan Jemaat
            </span>
          </h2>

          <p className="text-sm text-slate-300 leading-relaxed max-w-lg mx-auto lg:mx-0">
            Platform terintegrasi untuk pengelolaan data jemaat, keluarga, persembahan & keuangan akuntabel, program kerja komisi, serta aset dan inventaris gereja secara transparan dan aman.
          </p>

          <div className="grid grid-cols-2 gap-3 max-w-md mx-auto lg:mx-0 pt-2">
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3 text-left">
              <ShieldCheck className="w-5 h-5 text-gold-400 shrink-0" />
              <div>
                <p className="text-xs font-bold text-white">RBAC 6 Peran</p>
                <p className="text-[10px] text-slate-400">Hak akses terproteksi</p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3 text-left">
              <DollarSign className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <p className="text-xs font-bold text-white">Keuangan Akuntabel</p>
                <p className="text-[10px] text-slate-400">Reversal & audit log</p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3 text-left">
              <Users className="w-5 h-5 text-blue-400 shrink-0" />
              <div>
                <p className="text-xs font-bold text-white">Database Jemaat</p>
                <p className="text-[10px] text-slate-400">Foto & kartu digital</p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3 text-left">
              <HeartHandshake className="w-5 h-5 text-rose-400 shrink-0" />
              <div>
                <p className="text-xs font-bold text-white">Pelayanan Diakonia</p>
                <p className="text-[10px] text-slate-400">Kerahasiaan terjaga</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Form Card */}
        <div className="w-full lg:w-1/2 max-w-md">
          <div className="bg-white rounded-3xl p-8 shadow-2xl text-slate-900 border border-slate-100 relative">
            <div className="mb-6">
              <h3 className="text-xl font-black text-navy-950 tracking-tight">
                Masuk ke Portal Pengurus
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Masukkan email atau nama pengguna yang telah terdaftar.
              </p>
            </div>

            {/* Error Message Alert */}
            {errorMessage && (
              <div className="mb-5 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span className="leading-tight">{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Input Email / Username */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  Email / Nama Pengguna *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="admin@gkka.org atau username"
                    className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-xs pl-10 pr-4 py-3 rounded-2xl border border-slate-200 focus:border-navy-600 focus:ring-2 focus:ring-navy-600/10 focus:outline-none transition"
                  />
                </div>
              </div>

              {/* Input Password */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">
                    Kata Sandi *
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsHelpModalOpen(true)}
                    className="text-[11px] font-semibold text-navy-800 hover:text-gold-600 transition"
                  >
                    Lupa Kata Sandi?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-xs pl-10 pr-10 py-3 rounded-2xl border border-slate-200 focus:border-navy-600 focus:ring-2 focus:ring-navy-600/10 focus:outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-navy-900 focus:ring-navy-800 focus:ring-offset-0"
                  />
                  <span>Ingat saya di perangkat ini</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-navy-950 via-navy-900 to-navy-800 hover:from-navy-900 hover:to-navy-700 text-white font-bold text-xs shadow-lg shadow-navy-950/20 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed group mt-2"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-gold-400 rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Masuk ke Sistem</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-gold-400" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Access Section */}
            <div className="mt-6 pt-5 border-t border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-gold-500" />
                  Pilihan Akun Pengurus
                </span>
                <span className="text-[10px] text-slate-400 font-semibold">1-Klik Masuk</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {roleCards.map((rc) => (
                  <button
                    key={rc.role}
                    type="button"
                    onClick={() => handleQuickLogin(rc.role)}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-navy-600 hover:bg-slate-50 transition text-left flex items-center gap-2 group cursor-pointer"
                  >
                    <span className="text-base shrink-0 group-hover:scale-110 transition-transform">
                      {rc.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold text-navy-950 truncate leading-tight group-hover:text-navy-700">
                        {rc.title}
                      </p>
                      <p className="text-[9px] text-slate-400 truncate">{rc.email}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 border-t border-white/5 gap-2">
        <p>
          © 2026 Gereja Kristen Kasih Anugerah (GKKA) Jakarta. Hak cipta dilindungi.
        </p>
        <p className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-gold-400" />
          <span>Keamanan Terenkripsi & Audit Log Operasional Aktif</span>
        </p>
      </footer>

      {/* Modal Bantuan Akses & Lupa Kata Sandi */}
      <Modal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
        title="Bantuan Akses & Reset Kata Sandi"
        subtitle="Petunjuk pemulihan akun pengurus dan kredensial default sistem gereja"
        maxWidth="md"
      >
        <div className="space-y-4 text-xs text-slate-700">
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1.5">
            <p className="font-bold flex items-center gap-1.5">
              <Info className="w-4 h-4 text-amber-700 shrink-0" />
              Kata Sandi Standar Pengurus:
            </p>
            <p className="font-mono text-xs bg-white px-2.5 py-1 rounded-lg border border-amber-200 inline-block text-navy-950 font-bold">
              password123
            </p>
            <p className="text-[11px] text-amber-800">
              Seluruh akun seeded menggunakan kata sandi standar di atas, atau gunakan tombol <strong>Pilihan Akun Pengurus</strong> pada halaman login.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-navy-950">Layanan Sekretariat & Administrator:</h4>
            <p className="text-slate-600 leading-relaxed">
              Jika Anda adalah pelayan atau majelis yang lupa kata sandi akun pribadi, silakan hubungi Sekretariat Gereja untuk penerbitan ulang kata sandi:
            </p>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
              <p><strong>Sekretariat:</strong> (021) 555-0192</p>
              <p><strong>Email:</strong> sekretariat@gkka-kasihanugerah.org</p>
              <p><strong>Alamat:</strong> Jl. Kasih Anugerah No. 7, Gambir, Jakarta Pusat</p>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="secondary" size="sm" onClick={() => setIsHelpModalOpen(false)}>
              Mengerti & Tutup
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
