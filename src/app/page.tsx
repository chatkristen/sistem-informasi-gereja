'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent, Badge } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  formatCurrency,
  formatDateIndo,
  formatDateTimeIndo,
  getTransactionStatusBadge,
  getProgramStatusBadge,
} from '@/lib/utils';
import {
  Users,
  Home,
  Building2,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  Calendar,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Bell,
  Clock,
  MapPin,
  CheckCircle2,
  FileText,
  Plus,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import Link from 'next/link';

export default function DashboardPage() {
  const { currentUser, roleCode } = useAuth();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/dashboard?role=${roleCode}`);
        const json = await res.json();
        if (json.success) {
          setData(json);
        }
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadDashboard();
  }, [roleCode]);

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-navy-900 border-t-gold-500 rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-slate-500">Memuat data operasional gereja...</p>
        </div>
      </div>
    );
  }

  const { stats, charts, kegiatanMendatang, transaksiTerbaru, programBerjalan, pengumumanTerbaru, budgetSummary } = data;
  const budgetPercent = budgetSummary.totalBudget > 0
    ? Math.round((budgetSummary.totalSpent / budgetSummary.totalBudget) * 100)
    : 0;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-navy-950 via-navy-900 to-navy-800 p-8 text-white shadow-xl border border-navy-800">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-gold-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-500/20 text-gold-300 text-xs font-semibold border border-gold-400/30">
              <Sparkles className="w-3.5 h-3.5" />
              Sistem Informasi Gereja Terintegrasi
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight">
              Selamat Datang, {currentUser?.full_name}
            </h1>
            <p className="text-sm text-navy-200 max-w-2xl">
              Tinjauan real-time operasional jemaat, persembahan, program kerja komisi, dan jadwal ibadah Gereja Kristen Kasih Anugerah.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link href="/jemaat">
              <Button variant="gold" size="md" leftIcon={<Users className="w-4 h-4" />}>
                Kelola Jemaat
              </Button>
            </Link>
            {(roleCode === 'SUPER_ADMIN' || roleCode === 'BENDAHARA') && (
              <Link href="/keuangan/pemasukan">
                <Button variant="secondary" size="md" leftIcon={<Plus className="w-4 h-4" />}>
                  Catat Persembahan
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* 8 Primary Metric Cards (Actual Database Counts) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
        {/* Total Jemaat */}
        <Card className="hover:border-navy-300">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Total Jemaat Aktif</p>
              <h3 className="text-2xl font-black text-navy-950 mt-1">{stats.totalJemaat}</h3>
              <p className="text-[11px] text-emerald-600 font-semibold mt-0.5 flex items-center gap-1">
                <ArrowUpRight className="w-3.5 h-3.5" /> Terdaftar di GKKA
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-navy-50 text-navy-800 flex items-center justify-center shrink-0">
              <Users className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Total Keluarga */}
        <Card className="hover:border-navy-300">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Total Kepala Keluarga</p>
              <h3 className="text-2xl font-black text-navy-950 mt-1">{stats.totalKeluarga}</h3>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">Struktur KK Terdata</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-800 flex items-center justify-center shrink-0">
              <Home className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Total Departemen */}
        <Card className="hover:border-navy-300">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Komisi & Pelayanan</p>
              <h3 className="text-2xl font-black text-navy-950 mt-1">{stats.totalDepartemen}</h3>
              <p className="text-[11px] text-gold-600 font-semibold mt-0.5">7 Komisi Aktif</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Kegiatan Mendatang */}
        <Card className="hover:border-navy-300">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Kegiatan Terjadwal</p>
              <h3 className="text-2xl font-black text-navy-950 mt-1">{stats.jumlahKegiatanMendatang}</h3>
              <p className="text-[11px] text-purple-600 font-semibold mt-0.5">Ibadah & Komisi</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
              <Calendar className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Pemasukan Bulan Ini */}
        <Card className="hover:border-navy-300">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Pemasukan (Nov 2026)</p>
              <h3 className="text-xl lg:text-2xl font-black text-navy-950 mt-1">
                {formatCurrency(stats.totalPemasukanBulanIni)}
              </h3>
              <p className="text-[11px] text-emerald-600 font-semibold mt-0.5 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> Persembahan & Donasi
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <DollarSign className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Pengeluaran Bulan Ini */}
        <Card className="hover:border-navy-300">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Pengeluaran (Nov 2026)</p>
              <h3 className="text-xl lg:text-2xl font-black text-navy-950 mt-1">
                {formatCurrency(stats.totalPengeluaranBulanIni)}
              </h3>
              <p className="text-[11px] text-rose-600 font-semibold mt-0.5 flex items-center gap-1">
                <TrendingDown className="w-3.5 h-3.5" /> Ops, Utilitas & Sosial
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center shrink-0">
              <TrendingDown className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Saldo Kas & Bank */}
        <Card className="hover:border-navy-300 col-span-2">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Total Likuiditas Saldo (Kas & Bank)</p>
              <h3 className="text-2xl lg:text-3xl font-black text-emerald-800 mt-1">
                {formatCurrency(stats.saldoKasBank)}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Kas Utama + Kas Operasional + Rekening BCA + Rekening Mandiri
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <Wallet className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visual Analytics Charts (Recharts) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Keuangan 6 Bulan */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Arus Kas Pemasukan & Pengeluaran</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">Tren riwayat keuangan 6 bulan terakhir</p>
            </div>
            <Badge variant="gold">Aktual Database</Badge>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.trendKeuangan} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e11d48" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#e11d48" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="bulan" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis
                  tickFormatter={(val) => `Rp${(val / 1000000).toFixed(0)}Jt`}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                />
                <Tooltip
                  formatter={(val: any) => [formatCurrency(Number(val)), '']}
                  contentStyle={{ backgroundColor: '#0B2046', color: '#fff', borderRadius: '12px', border: 'none', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                <Area type="monotone" dataKey="pemasukan" name="Pemasukan" stroke="#059669" strokeWidth={2.5} fillOpacity={1} fill="url(#colorInc)" />
                <Area type="monotone" dataKey="pengeluaran" name="Pengeluaran" stroke="#e11d48" strokeWidth={2.5} fillOpacity={1} fill="url(#colorExp)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Realisasi Anggaran RAPBG 2026 */}
        <Card>
          <CardHeader>
            <CardTitle>Realisasi Anggaran 2026</CardTitle>
            <span className="text-xs font-bold text-navy-900">{budgetPercent}% Terpakai</span>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Pagu Total:</span>
                <span className="font-bold text-navy-950">{formatCurrency(budgetSummary.totalBudget)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Realisasi:</span>
                <span className="font-bold text-rose-600">{formatCurrency(budgetSummary.totalSpent)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Sisa Anggaran:</span>
                <span className="font-bold text-emerald-600">
                  {formatCurrency(budgetSummary.totalBudget - budgetSummary.totalSpent)}
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden mt-3">
                <div
                  className="bg-gradient-to-r from-gold-500 to-navy-900 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(budgetPercent, 100)}%` }}
                ></div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                Distribusi Anggota Komisi
              </h4>
              <div className="space-y-2.5">
                {charts.distribusiDepartemen.slice(0, 4).map((d: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 truncate max-w-[170px]">{d.name}</span>
                    <span className="font-bold text-navy-950 bg-slate-100 px-2 py-0.5 rounded-md">
                      {d.anggota} Jemaat
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grid: Jadwal Kegiatan & Transaksi Terkini */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Jadwal Kegiatan Gereja Mendatang */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-navy-800" />
              <CardTitle>Jadwal Ibadah & Kegiatan Terdekat</CardTitle>
            </div>
            <Link href="/kegiatan">
              <Button variant="ghost" size="sm" className="text-xs">
                Lihat Semua
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {kegiatanMendatang.length === 0 ? (
                <p className="p-6 text-xs text-slate-400 text-center">Belum ada kegiatan terjadwal.</p>
              ) : (
                kegiatanMendatang.map((event: any) => (
                  <div key={event.id} className="p-4 hover:bg-slate-50 transition flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-navy-50 text-navy-900 flex flex-col items-center justify-center font-bold shrink-0 border border-navy-100">
                      <span className="text-[10px] uppercase text-navy-500 leading-none">
                        {new Date(event.start_time).toLocaleDateString('id-ID', { month: 'short' })}
                      </span>
                      <span className="text-sm font-black leading-tight text-navy-900">
                        {new Date(event.start_time).getDate()}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-navy-950 truncate">{event.title}</h4>
                        <Badge variant="navy" className="text-[10px]">
                          {event.category.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-[11px] text-slate-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {new Date(event.start_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                        </span>
                        <span className="flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {event.location}
                        </span>
                      </div>
                      {(event.pic_member_name || event.mc_name) && (
                        <div className="flex flex-wrap items-center gap-2 text-[10px] text-navy-800 mt-1.5 font-semibold">
                          {event.pic_member_name && <span>PIC: {event.pic_member_name}</span>}
                          {event.mc_name && <span className="text-gold-600 font-bold">• MC: {event.mc_name}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Transaksi Keuangan Terbaru */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <CardTitle>Transaksi Keuangan Terkini</CardTitle>
            </div>
            <Link href="/keuangan">
              <Button variant="ghost" size="sm" className="text-xs">
                Buku Kas
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {transaksiTerbaru.map((tx: any) => {
                const statusBadge = getTransactionStatusBadge(tx.status);
                const isIncome = tx.type === 'INCOME';

                return (
                  <div key={tx.id} className="p-4 hover:bg-slate-50 transition flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isIncome ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {isIncome ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-navy-950 truncate max-w-[200px] sm:max-w-xs">
                          {tx.description}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {formatDateIndo(tx.transaction_date)} • {tx.account_name}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className={`text-xs font-black ${isIncome ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {isIncome ? '+' : '-'} {formatCurrency(tx.amount)}
                      </p>
                      <span className={`inline-block text-[10px] px-1.5 py-0.2 rounded font-medium mt-0.5 border ${statusBadge.color}`}>
                        {statusBadge.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grid: Program Kerja Aktif & Pengumuman */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Program Kerja Berjalan */}
        <Card>
          <CardHeader>
            <CardTitle>Program Kerja Komisi Berjalan</CardTitle>
            <Link href="/program-kerja">
              <Button variant="ghost" size="sm">
                Kelola Program
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3.5">
            {programBerjalan.map((wp: any) => {
              const statusBadge = getProgramStatusBadge(wp.status);
              return (
                <div key={wp.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-navy-500 uppercase">{wp.department_name}</span>
                      <h4 className="text-xs font-bold text-navy-950">{wp.title}</h4>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${statusBadge.color}`}>
                      {statusBadge.label}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-1">{wp.description}</p>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-200/60">
                    <span>PIC: {wp.pic_member_name}</span>
                    <span className="font-semibold text-navy-900">
                      Pagu: {formatCurrency(wp.budget_allocated)}
                    </span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Pengumuman Gereja */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-gold-600" />
              <CardTitle>Warta & Pengumuman Terbaru</CardTitle>
            </div>
            <Link href="/pengumuman">
              <Button variant="ghost" size="sm">
                Semua Warta
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {pengumumanTerbaru.map((anc: any) => (
              <div key={anc.id} className="p-3.5 rounded-xl border border-slate-100 bg-white hover:border-navy-200 transition">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-navy-950">{anc.title}</h4>
                  <span className="text-[10px] text-slate-400">{formatDateIndo(anc.publish_date)}</span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                  {anc.content}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="gold" className="text-[10px]">
                    Target: {anc.target_audience}
                  </Badge>
                  {anc.department_name && (
                    <Badge variant="navy" className="text-[10px]">
                      {anc.department_name}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
