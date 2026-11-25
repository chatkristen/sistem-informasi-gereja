'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import { Card, CardHeader, CardTitle, CardContent, Badge, Input, Select } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { FinancialTransaction, FinancialAccount } from '@/lib/types';
import {
  formatCurrency,
  formatDateIndo,
  getTransactionStatusBadge,
  getOfferingTypeLabel,
} from '@/lib/utils';
import { exportToExcel, exportToPDF } from '@/lib/export-utils';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  FileSpreadsheet,
  FileText,
  RotateCcw,
  Search,
  Plus,
  Wallet,
  ShieldAlert,
  Calendar,
} from 'lucide-react';
import Link from 'next/link';

export default function KeuanganOverviewPage() {
  const { roleCode, can, currentUser } = useAuth();
  const { showToast } = useNotification();

  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [typeFilter, setTypeFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Reversal Modal State
  const [isReversalOpen, setIsReversalOpen] = useState(false);
  const [targetTrx, setTargetTrx] = useState<FinancialTransaction | null>(null);
  const [reversalReason, setReversalReason] = useState('');
  const [isReversing, setIsReversing] = useState(false);

  const loadFinanceData = async () => {
    setIsLoading(true);
    try {
      const [resTrx, resAcc] = await Promise.all([
        fetch(`/api/keuangan/transaksi?type=${typeFilter}&start_date=${startDate}&end_date=${endDate}&role=${roleCode}`),
        fetch('/api/keuangan/akun'),
      ]);
      const dataTrx = await resTrx.json();
      const dataAcc = await resAcc.json();

      if (dataTrx.success) setTransactions(dataTrx.data);
      if (dataAcc.success) setAccounts(dataAcc.data);
    } catch (err) {
      console.error(err);
      showToast('error', 'Gagal memuat pembukuan keuangan');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFinanceData();
  }, [typeFilter, startDate, endDate, roleCode]);

  // Reversal Handler
  const handleReversalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetTrx || !reversalReason.trim()) {
      showToast('warning', 'Alasan Diperlukan', 'Mohon isi alasan pembatalan/reversal');
      return;
    }

    setIsReversing(true);
    try {
      const res = await fetch(`/api/keuangan/transaksi/${targetTrx.id}/reversal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: reversalReason,
          actor_name: currentUser?.full_name || 'Bendahara',
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast('success', 'Reversal Berhasil', `Transaksi ${targetTrx.transaction_number} telah dibatalkan & saldo kas dikembalikan.`);
        setIsReversalOpen(false);
        setTargetTrx(null);
        setReversalReason('');
        loadFinanceData();
      } else {
        showToast('error', 'Gagal', json.message);
      }
    } catch (err: any) {
      showToast('error', 'Kesalahan', err.message);
    } finally {
      setIsReversing(false);
    }
  };

  // Metrics
  const totalIncome = transactions
    .filter((t) => t.type === 'INCOME' && t.status !== 'REVERSED')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'EXPENSE' && t.status !== 'REVERSED')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalBalance = accounts.reduce((sum, a) => sum + a.current_balance, 0);

  const handleExportExcel = () => {
    const columns = [
      { header: 'No. Transaksi', key: 'transaction_number' },
      { header: 'Tanggal', key: 'transaction_date' },
      { header: 'Tipe', key: 'type' },
      { header: 'Kategori', key: 'category_name' },
      { header: 'Akun Kas/Bank', key: 'account_name' },
      { header: 'Nominal', key: 'amount', format: (v: number) => formatCurrency(v) },
      { header: 'Status', key: 'status' },
      { header: 'Keterangan', key: 'description' },
    ];
    exportToExcel('Buku_Kas_Keuangan_GKKA', 'Buku Kas', transactions, columns);
    showToast('info', 'Excel Berhasil', 'Buku kas keuangan telah diekspor.');
  };

  const handleExportPDF = () => {
    const columns = [
      { header: 'No. Transaksi', key: 'transaction_number' },
      { header: 'Tanggal', key: 'transaction_date' },
      { header: 'Tipe', key: 'type' },
      { header: 'Akun', key: 'account_name' },
      { header: 'Nominal', key: 'amount', format: (v: number) => formatCurrency(v) },
      { header: 'Status', key: 'status' },
    ];
    exportToPDF('BUKU KAS UMUM & TRANSAKSI KEUANGAN', 'GKKA Jakarta', transactions, columns, 'Laporan_Keuangan_GKKA');
    showToast('info', 'PDF Berhasil', 'Laporan buku kas PDF telah diunduh.');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-navy-950 tracking-tight flex items-center gap-2.5">
            <DollarSign className="w-6 h-6 text-navy-900" />
            Ikhtisar Keuangan & Pembukuan Kas
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Rekapitulasi pemasukan, pengeluaran, audit reversal, dan mutasi saldo kas & bank.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" onClick={handleExportExcel} leftIcon={<FileSpreadsheet className="w-4 h-4 text-emerald-600" />}>
            Excel
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPDF} leftIcon={<FileText className="w-4 h-4 text-rose-600" />}>
            PDF
          </Button>
          {can('keuangan_umum', 'create') && (
            <Link href="/keuangan/pemasukan">
              <Button variant="gold" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
                Catat Transaksi
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500">Total Pemasukan (Tercatat)</p>
              <h3 className="text-xl lg:text-2xl font-black text-emerald-700 mt-1">
                {formatCurrency(totalIncome)}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Persembahan, Perpuluhan, Donasi</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <TrendingUp className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500">Total Pengeluaran (Tercatat)</p>
              <h3 className="text-xl lg:text-2xl font-black text-rose-700 mt-1">
                {formatCurrency(totalExpense)}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Operasional, Pemeliharaan & Sosial</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center shrink-0">
              <TrendingDown className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500">Total Saldo Likuiditas Berjalan</p>
              <h3 className="text-xl lg:text-2xl font-black text-navy-950 mt-1">
                {formatCurrency(totalBalance)}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Seluruh Kas & Rekening Bank</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-navy-50 text-navy-900 flex items-center justify-center shrink-0">
              <Wallet className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Nav Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-2 text-xs font-bold">
        <Link href="/keuangan" className="py-2.5 px-4 border-b-2 border-navy-900 text-navy-950 bg-white rounded-t-xl">
          Buku Kas Transaksi
        </Link>
        <Link href="/keuangan/pemasukan" className="py-2.5 px-4 text-slate-500 hover:text-navy-900">
          Pemasukan & Persembahan
        </Link>
        <Link href="/keuangan/pengeluaran" className="py-2.5 px-4 text-slate-500 hover:text-navy-900">
          Pengeluaran Gereja
        </Link>
        <Link href="/keuangan/kas-bank" className="py-2.5 px-4 text-slate-500 hover:text-navy-900">
          Kas & Rekening Bank
        </Link>
        <Link href="/keuangan/anggaran" className="py-2.5 px-4 text-slate-500 hover:text-navy-900">
          Anggaran (RAPBG 2026)
        </Link>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row items-center gap-3">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full md:w-48 bg-slate-50 text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-navy-500"
          >
            <option value="">Semua Tipe Transaksi</option>
            <option value="INCOME">Pemasukan (+)</option>
            <option value="EXPENSE">Pengeluaran (-)</option>
            <option value="TRANSFER">Transfer Antar-Kas</option>
          </select>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full md:w-40 bg-slate-50 text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none"
              title="Dari Tanggal"
            />
            <span className="text-xs text-slate-400">s/d</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full md:w-40 bg-slate-50 text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none"
              title="Sampai Tanggal"
            />
          </div>

          {(typeFilter || startDate || endDate) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setTypeFilter('');
                setStartDate('');
                setEndDate('');
              }}
              className="text-xs text-slate-500"
            >
              Reset Filter
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">No. Transaksi</th>
                <th className="px-4 py-3.5">Tanggal</th>
                <th className="px-4 py-3.5">Tipe & Kategori</th>
                <th className="px-4 py-3.5">Akun Kas/Bank</th>
                <th className="px-4 py-3.5">Metode & Sumber</th>
                <th className="px-4 py-3.5 text-right">Nominal</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    <div className="inline-block w-6 h-6 border-2 border-navy-900 border-t-gold-500 rounded-full animate-spin"></div>
                    <p className="mt-2 text-xs">Memuat pembukuan...</p>
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    Tidak ada transaksi keuangan yang sesuai filter.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => {
                  const statusBadge = getTransactionStatusBadge(tx.status);
                  const isIncome = tx.type === 'INCOME';
                  const isExpense = tx.type === 'EXPENSE';
                  const isTransfer = tx.type === 'TRANSFER';

                  return (
                    <tr
                      key={tx.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        tx.status === 'REVERSED' ? 'opacity-60 bg-slate-50/50' : ''
                      }`}
                    >
                      <td className="px-5 py-3.5 font-mono text-[11px] font-bold text-navy-900">
                        {tx.transaction_number}
                      </td>

                      <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap">
                        {formatDateIndo(tx.transaction_date)}
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isIncome ? 'bg-emerald-500' : isExpense ? 'bg-rose-500' : 'bg-blue-500'
                            }`}
                          ></span>
                          <div>
                            <p className="font-bold text-navy-950">
                              {isTransfer ? 'Transfer Antar-Kas' : tx.category_name || '-'}
                            </p>
                            <p className="text-[11px] text-slate-400 line-clamp-1 max-w-[180px]">
                              {tx.description}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-slate-700">
                        <p className="font-semibold">{tx.account_name}</p>
                        {isTransfer && tx.destination_account_name && (
                          <p className="text-[10px] text-blue-600 font-medium">
                            ➔ Ke: {tx.destination_account_name}
                          </p>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-slate-600">
                        <span className="font-medium">{tx.payment_method}</span>
                        {tx.member_name && (
                          <p className="text-[10px] text-gold-700 font-semibold leading-snug">
                            {tx.member_name}
                          </p>
                        )}
                        {tx.recipient_name && (
                          <p className="text-[10px] text-slate-500 leading-snug">
                            Kepada: {tx.recipient_name}
                          </p>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-right font-black">
                        <span
                          className={`text-xs ${
                            isIncome
                              ? 'text-emerald-700'
                              : isExpense
                              ? 'text-rose-700'
                              : 'text-blue-700'
                          }`}
                        >
                          {isIncome ? '+' : isExpense ? '-' : ''} {formatCurrency(tx.amount)}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusBadge.color}`}>
                          {statusBadge.label}
                        </span>
                        {tx.reversal_reason && (
                          <p className="text-[10px] text-rose-600 font-medium mt-0.5 leading-snug" title={tx.reversal_reason}>
                            Alasan: {tx.reversal_reason}
                          </p>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        {can('keuangan_umum', 'delete') && tx.status !== 'REVERSED' ? (
                          <button
                            onClick={() => {
                              setTargetTrx(tx);
                              setIsReversalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
                            title="Batalkan / Reversal Transaksi"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-300">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Reversal Keuangan */}
      <Modal
        isOpen={isReversalOpen}
        onClose={() => setIsReversalOpen(false)}
        title="Pembatalan / Reversal Transaksi Keuangan"
        subtitle={`Nomor Transaksi: ${targetTrx?.transaction_number}`}
        maxWidth="md"
      >
        <form onSubmit={handleReversalSubmit} className="space-y-4">
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-700" />
              Kebijakan Integritas Audit Keuangan
            </p>
            <p>
              Transaksi tidak akan dihapus permanen melainkan ditandai sebagai REVERSED. Saldo pada akun kas{' '}
              <strong className="underline">{targetTrx?.account_name}</strong> sebesar{' '}
              <strong>{formatCurrency(targetTrx?.amount || 0)}</strong> akan dikembalikan secara otomatis.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Alasan Pembatalan / Reversal (Wajib) *
            </label>
            <textarea
              rows={3}
              value={reversalReason}
              onChange={(e) => setReversalReason(e.target.value)}
              placeholder="Contoh: Kesalahan input nominal persembahan kantong, bukti transfer tidak valid, atau koreksi rekening tujuan..."
              className="w-full rounded-xl border border-slate-300 p-3 text-xs focus:outline-none focus:border-navy-600"
              required
            ></textarea>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button variant="secondary" size="md" type="button" onClick={() => setIsReversalOpen(false)}>
              Batal
            </Button>
            <Button variant="danger" size="md" type="submit" isLoading={isReversing}>
              Konfirmasi Reversal Transaksi
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
