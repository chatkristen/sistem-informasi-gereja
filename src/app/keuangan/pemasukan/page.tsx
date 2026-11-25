'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import { Card, CardHeader, CardTitle, CardContent, Badge, Input, Select } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { FinancialTransaction, FinancialAccount, FinancialCategory, OfferingType, RecordingType } from '@/lib/types';
import {
  formatCurrency,
  formatDateIndo,
  getTransactionStatusBadge,
  getOfferingTypeLabel,
} from '@/lib/utils';
import { exportToExcel, exportToPDF } from '@/lib/export-utils';
import {
  CreditCard,
  Plus,
  Search,
  FileSpreadsheet,
  FileText,
  Lock,
  Users,
  User,
  ShieldAlert,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';

export default function PemasukanPage() {
  const { roleCode, can, currentUser } = useAuth();
  const { showToast } = useNotification();

  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [categories, setCategories] = useState<FinancialCategory[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [offeringFilter, setOfferingFilter] = useState('');
  const [recordingFilter, setRecordingFilter] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    transaction_date: new Date().toISOString().split('T')[0],
    category_id: 'fc1',
    account_id: 'fa1',
    amount: '',
    payment_method: 'CASH',
    recording_type: 'COLLECTIVE' as RecordingType,
    offering_type: 'PERSEMBAHAN_UMUM' as OfferingType,
    member_id: '',
    description: '',
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [resTrx, resAcc, resMem] = await Promise.all([
        fetch(`/api/keuangan/transaksi?type=INCOME&recording_type=${recordingFilter}&role=${roleCode}`),
        fetch('/api/keuangan/akun'),
        fetch('/api/jemaat'),
      ]);
      const dataTrx = await resTrx.json();
      const dataAcc = await resAcc.json();
      const dataMem = await resMem.json();

      if (dataTrx.success) setTransactions(dataTrx.data);
      if (dataAcc.success) setAccounts(dataAcc.data);
      if (dataMem.success) setMembers(dataMem.data);
    } catch (err) {
      console.error(err);
      showToast('error', 'Gagal memuat data pemasukan');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [recordingFilter, roleCode]);

  const handleCreateOffering = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(formData.amount);
    if (!amountNum || amountNum <= 0) {
      showToast('warning', 'Nominal Tidak Valid', 'Masukkan nominal persembahan lebih dari 0');
      return;
    }

    if (formData.recording_type === 'INDIVIDUAL' && !formData.member_id) {
      showToast('warning', 'Pilih Jemaat', 'Untuk pencatatan individual, jemaat wajib dipilih');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/keuangan/transaksi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          type: 'INCOME',
          amount: amountNum,
          actor_name: currentUser?.full_name || 'Bendahara',
          is_confidential: formData.recording_type === 'INDIVIDUAL',
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast('success', 'Tercatat', `Persembahan ${formatCurrency(amountNum)} berhasil dibukukan.`);
        setIsModalOpen(false);
        setFormData({
          transaction_date: new Date().toISOString().split('T')[0],
          category_id: 'fc1',
          account_id: 'fa1',
          amount: '',
          payment_method: 'CASH',
          recording_type: 'COLLECTIVE',
          offering_type: 'PERSEMBAHAN_UMUM',
          member_id: '',
          description: '',
        });
        loadData();
      } else {
        showToast('error', 'Gagal', json.message);
      }
    } catch (err: any) {
      showToast('error', 'Kesalahan', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportExcel = () => {
    const columns = [
      { header: 'No. Transaksi', key: 'transaction_number' },
      { header: 'Tanggal', key: 'transaction_date' },
      { header: 'Kategori', key: 'offering_type', format: (v: string) => getOfferingTypeLabel(v) },
      { header: 'Metode Pencatatan', key: 'recording_type' },
      { header: 'Jemaat (Jika Individual)', key: 'member_name' },
      { header: 'Akun Kas', key: 'account_name' },
      { header: 'Nominal', key: 'amount', format: (v: number) => formatCurrency(v) },
      { header: 'Keterangan', key: 'description' },
    ];
    exportToExcel('Laporan_Pemasukan_Persembahan_GKKA', 'Pemasukan', transactions, columns);
    showToast('info', 'Excel Berhasil', 'Data pemasukan telah diekspor.');
  };

  const handleExportPDF = () => {
    const columns = [
      { header: 'No. Transaksi', key: 'transaction_number' },
      { header: 'Tanggal', key: 'transaction_date' },
      { header: 'Jenis Persembahan', key: 'offering_type', format: (v: string) => getOfferingTypeLabel(v) },
      { header: 'Pencatatan', key: 'recording_type' },
      { header: 'Akun', key: 'account_name' },
      { header: 'Nominal', key: 'amount', format: (v: number) => formatCurrency(v) },
    ];
    exportToPDF('LAPORAN PERSEMBAHAN & PERPULUHAN', 'GKKA Jakarta', transactions, columns, 'Laporan_Persembahan_GKKA');
    showToast('info', 'PDF Berhasil', 'Dokumen laporan persembahan telah diunduh.');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-navy-950 tracking-tight flex items-center gap-2.5">
            <CreditCard className="w-6 h-6 text-navy-900" />
            Pemasukan & Persembahan Gereja
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Pencatatan persembahan umum kolektif, perpuluhan individual rahasia, donasi, dan pembangunan.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" onClick={handleExportExcel} leftIcon={<FileSpreadsheet className="w-4 h-4 text-emerald-600" />}>
            Excel
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPDF} leftIcon={<FileText className="w-4 h-4 text-rose-600" />}>
            PDF
          </Button>
          {(roleCode === 'SUPER_ADMIN' || roleCode === 'BENDAHARA') && (
            <Button variant="gold" size="sm" onClick={() => setIsModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
              Catat Persembahan
            </Button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => setRecordingFilter('')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                recordingFilter === '' ? 'bg-navy-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua Pencatatan
            </button>
            <button
              onClick={() => setRecordingFilter('COLLECTIVE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                recordingFilter === 'COLLECTIVE' ? 'bg-navy-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Pencatatan Kolektif
            </button>
            <button
              onClick={() => setRecordingFilter('INDIVIDUAL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                recordingFilter === 'INDIVIDUAL' ? 'bg-navy-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Lock className="w-3.5 h-3.5 text-gold-500" />
              Individual (Rahasia)
            </button>
          </div>

          <div className="text-xs text-slate-500">
            Total Pemasukan: <strong className="text-emerald-700 font-black">
              {formatCurrency(transactions.reduce((s, t) => (t.status !== 'REVERSED' ? s + t.amount : s), 0))}
            </strong>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">No. Transaksi</th>
                <th className="px-4 py-3.5">Tanggal</th>
                <th className="px-4 py-3.5">Kategori / Jenis</th>
                <th className="px-4 py-3.5">Metode Pencatatan</th>
                <th className="px-4 py-3.5">Nama Jemaat / Sumber</th>
                <th className="px-4 py-3.5">Akun Kas Tujuan</th>
                <th className="px-4 py-3.5 text-right">Nominal</th>
                <th className="px-4 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    <div className="inline-block w-6 h-6 border-2 border-navy-900 border-t-gold-500 rounded-full animate-spin"></div>
                    <p className="mt-2 text-xs">Memuat persembahan...</p>
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    Tidak ada data persembahan yang tercatat.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => {
                  const statusBadge = getTransactionStatusBadge(tx.status);
                  const isIndividual = tx.recording_type === 'INDIVIDUAL';

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-[11px] font-bold text-navy-900">
                        {tx.transaction_number}
                      </td>

                      <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap">
                        {formatDateIndo(tx.transaction_date)}
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="font-bold text-navy-950">
                          {getOfferingTypeLabel(tx.offering_type)}
                        </span>
                        <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{tx.description}</p>
                      </td>

                      <td className="px-4 py-3.5">
                        {isIndividual ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                            <Lock className="w-3 h-3 text-amber-600" /> Individual
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                            <Users className="w-3 h-3 text-blue-600" /> Kolektif
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        {isIndividual ? (
                          <p className="font-semibold text-gold-700">{tx.member_name || 'Jemaat'}</p>
                        ) : (
                          <p className="text-slate-500">Ibadah Umum GKKA</p>
                        )}
                      </td>

                      <td className="px-4 py-3.5 font-medium text-slate-700">
                        {tx.account_name}
                      </td>

                      <td className="px-4 py-3.5 text-right font-black text-emerald-700 text-xs">
                        +{formatCurrency(tx.amount)}
                      </td>

                      <td className="px-4 py-3.5">
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusBadge.color}`}>
                          {statusBadge.label}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Catat Persembahan */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Pencatatan Pemasukan & Persembahan"
        subtitle="Mendukung metode pencatatan Kolektif dan Individual (Rahasia)"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateOffering} className="space-y-4">
          {/* Method Selection: Kolektif vs Individual */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">Metode Pencatatan Persembahan *</label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition ${
                  formData.recording_type === 'COLLECTIVE'
                    ? 'border-navy-800 bg-navy-50/50 text-navy-950 font-bold'
                    : 'border-slate-200 text-slate-600'
                }`}
              >
                <input
                  type="radio"
                  name="recording_type"
                  checked={formData.recording_type === 'COLLECTIVE'}
                  onChange={() => setFormData({ ...formData, recording_type: 'COLLECTIVE', member_id: '' })}
                  className="text-navy-900"
                />
                <div>
                  <p className="text-xs">Kolektif (Umum)</p>
                  <p className="text-[10px] text-slate-400 font-normal">Kantong I & II, Syukur Ibadah</p>
                </div>
              </label>

              <label
                className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition ${
                  formData.recording_type === 'INDIVIDUAL'
                    ? 'border-gold-600 bg-gold-50/50 text-gold-950 font-bold'
                    : 'border-slate-200 text-slate-600'
                }`}
              >
                <input
                  type="radio"
                  name="recording_type"
                  checked={formData.recording_type === 'INDIVIDUAL'}
                  onChange={() => setFormData({ ...formData, recording_type: 'INDIVIDUAL' })}
                  className="text-gold-600"
                />
                <div>
                  <p className="text-xs flex items-center gap-1">
                    <Lock className="w-3 h-3 text-gold-600" /> Individual (Rahasia)
                  </p>
                  <p className="text-[10px] text-slate-400 font-normal">Perpuluhan / Persembahan Perorangan</p>
                </div>
              </label>
            </div>
          </div>

          {/* If Individual, show member selector */}
          {formData.recording_type === 'INDIVIDUAL' && (
            <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2">
              <Select
                label="Pilih Anggota Jemaat (Wajib untuk Individual) *"
                value={formData.member_id}
                onChange={(e) => setFormData({ ...formData, member_id: e.target.value })}
                required
              >
                <option value="">-- Pilih Jemaat --</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.member_number} - {m.full_name}
                  </option>
                ))}
              </Select>
              <p className="text-[10px] text-amber-800">
                Data jemaat dilindungi secara ketat. Pengguna selain Bendahara & Super Admin tidak dapat melihat nama pemberi perpuluhan.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Jenis Persembahan *"
              value={formData.offering_type}
              onChange={(e) => setFormData({ ...formData, offering_type: e.target.value as OfferingType })}
            >
              <option value="PERSEMBAHAN_UMUM">Persembahan Umum</option>
              <option value="PERPULUHAN">Perpuluhan</option>
              <option value="PEMBANGUNAN">Persembahan Pembangunan</option>
              <option value="MISI">Persembahan Misi</option>
              <option value="KHUSUS">Persembahan Khusus / Syukur</option>
              <option value="DONASI">Donasi / Bantuan</option>
            </Select>

            <Select
              label="Akun Kas / Bank Tujuan *"
              value={formData.account_id}
              onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.account_name} ({formatCurrency(acc.current_balance)})
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Nominal (Rp) *"
              type="number"
              placeholder="Contoh: 1500000"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
            />

            <Select
              label="Metode Pembayaran *"
              value={formData.payment_method}
              onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
            >
              <option value="CASH">Tunai (Kas)</option>
              <option value="TRANSFER">Transfer Bank</option>
              <option value="QRIS">QRIS Statis/Dinamis</option>
              <option value="GIRO">Cek / Giro</option>
            </Select>
          </div>

          <Input
            label="Tanggal Transaksi *"
            type="date"
            value={formData.transaction_date}
            onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
            required
          />

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">Keterangan Transaksi</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Contoh: Persembahan Ibadah Raya 1 Minggu ke-3, amplop syukur baptisan..."
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:outline-none focus:border-navy-600"
            ></textarea>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button variant="secondary" size="md" type="button" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button variant="gold" size="md" type="submit" isLoading={isSubmitting}>
              Bukukan Persembahan
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
