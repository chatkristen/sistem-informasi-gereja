'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import { Card, CardHeader, CardTitle, CardContent, Badge, Input, Select } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { FinancialTransaction, FinancialAccount, FinancialCategory } from '@/lib/types';
import {
  formatCurrency,
  formatDateIndo,
  getTransactionStatusBadge,
} from '@/lib/utils';
import { exportToExcel, exportToPDF } from '@/lib/export-utils';
import {
  Wallet,
  Plus,
  FileSpreadsheet,
  FileText,
  RotateCcw,
  Receipt,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';

export default function PengeluaranPage() {
  const { roleCode, can, currentUser } = useAuth();
  const { showToast } = useNotification();

  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    transaction_date: new Date().toISOString().split('T')[0],
    category_id: 'fc7',
    account_id: 'fa2',
    amount: '',
    payment_method: 'CASH',
    recipient_name: '',
    description: '',
    receipt_url: '',
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [resTrx, resAcc] = await Promise.all([
        fetch(`/api/keuangan/transaksi?type=EXPENSE&role=${roleCode}`),
        fetch('/api/keuangan/akun'),
      ]);
      const dataTrx = await resTrx.json();
      const dataAcc = await resAcc.json();

      if (dataTrx.success) setTransactions(dataTrx.data);
      if (dataAcc.success) setAccounts(dataAcc.data);
    } catch (err) {
      console.error(err);
      showToast('error', 'Gagal memuat pengeluaran');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [roleCode]);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(formData.amount);
    if (!amountNum || amountNum <= 0) {
      showToast('warning', 'Nominal Tidak Valid', 'Masukkan nominal pengeluaran lebih dari 0');
      return;
    }

    if (!formData.recipient_name.trim()) {
      showToast('warning', 'Penerima Diperlukan', 'Nama penerima pembayaran wajib diisi');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/keuangan/transaksi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          type: 'EXPENSE',
          amount: amountNum,
          actor_name: currentUser?.full_name || 'Bendahara',
          recording_type: 'COLLECTIVE',
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast('success', 'Tercatat', `Pengeluaran ${formatCurrency(amountNum)} berhasil dibukukan.`);
        setIsModalOpen(false);
        setFormData({
          transaction_date: new Date().toISOString().split('T')[0],
          category_id: 'fc7',
          account_id: 'fa2',
          amount: '',
          payment_method: 'CASH',
          recipient_name: '',
          description: '',
          receipt_url: '',
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
      { header: 'Kategori Pengeluaran', key: 'category_name' },
      { header: 'Penerima Pembayaran', key: 'recipient_name' },
      { header: 'Sumber Akun Kas', key: 'account_name' },
      { header: 'Nominal', key: 'amount', format: (v: number) => formatCurrency(v) },
      { header: 'Deskripsi / Keperluan', key: 'description' },
      { header: 'Status', key: 'status' },
    ];
    exportToExcel('Laporan_Pengeluaran_GKKA', 'Pengeluaran', transactions, columns);
    showToast('info', 'Excel Berhasil', 'Data pengeluaran telah diekspor.');
  };

  const handleExportPDF = () => {
    const columns = [
      { header: 'No. Transaksi', key: 'transaction_number' },
      { header: 'Tanggal', key: 'transaction_date' },
      { header: 'Kategori', key: 'category_name' },
      { header: 'Penerima', key: 'recipient_name' },
      { header: 'Sumber Kas', key: 'account_name' },
      { header: 'Nominal', key: 'amount', format: (v: number) => formatCurrency(v) },
    ];
    exportToPDF('LAPORAN PENGELUARAN GEREJA', 'GKKA Jakarta', transactions, columns, 'Laporan_Pengeluaran_GKKA');
    showToast('info', 'PDF Berhasil', 'Dokumen laporan pengeluaran telah diunduh.');
  };

  const totalExpense = transactions
    .filter((t) => t.status !== 'REVERSED')
    .reduce((s, t) => s + t.amount, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-navy-950 tracking-tight flex items-center gap-2.5">
            <Wallet className="w-6 h-6 text-navy-900" />
            Pengeluaran & Belanja Operasional
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Pengelolaan beban operasional kantor, utilitas, pemeliharaan gedung, konsumsi, dan bantuan sosial.
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
            <Button variant="danger" size="sm" onClick={() => setIsModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
              Catat Pengeluaran
            </Button>
          )}
        </div>
      </div>

      {/* Summary Banner */}
      <Card>
        <CardContent className="p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Total Pengeluaran Tercatat (Kas Keluar)</p>
            <h3 className="text-2xl font-black text-rose-700 mt-1">{formatCurrency(totalExpense)}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Divalidasi oleh Bendahara Gereja</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xl">
            -
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
                <th className="px-4 py-3.5">Kategori & Keperluan</th>
                <th className="px-4 py-3.5">Penerima Pembayaran</th>
                <th className="px-4 py-3.5">Sumber Dana Kas</th>
                <th className="px-4 py-3.5">Bukti Kuitansi</th>
                <th className="px-4 py-3.5 text-right">Nominal</th>
                <th className="px-4 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    <div className="inline-block w-6 h-6 border-2 border-navy-900 border-t-gold-500 rounded-full animate-spin"></div>
                    <p className="mt-2 text-xs">Memuat data pengeluaran...</p>
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    Tidak ada pengeluaran yang tercatat.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => {
                  const statusBadge = getTransactionStatusBadge(tx.status);

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-[11px] font-bold text-navy-900">
                        {tx.transaction_number}
                      </td>

                      <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap">
                        {formatDateIndo(tx.transaction_date)}
                      </td>

                      <td className="px-4 py-3.5">
                        <p className="font-bold text-navy-950">{tx.category_name || 'Beban Lainnya'}</p>
                        <p className="text-[11px] text-slate-400 line-clamp-1 max-w-[200px]">{tx.description}</p>
                      </td>

                      <td className="px-4 py-3.5 font-semibold text-slate-800">
                        {tx.recipient_name || '-'}
                      </td>

                      <td className="px-4 py-3.5 font-medium text-slate-700">
                        {tx.account_name}
                      </td>

                      <td className="px-4 py-3.5">
                        {tx.receipt_url ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-navy-700 bg-navy-50 border border-navy-200 px-2 py-0.5 rounded">
                            <Receipt className="w-3 h-3 text-navy-500" /> Terlampir
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">Tidak ada</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-right font-black text-rose-700 text-xs">
                        -{formatCurrency(tx.amount)}
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

      {/* Modal Catat Pengeluaran */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Pencatatan Pengeluaran Kas Gereja"
        subtitle="Nomor bukti pengeluaran otomatis digenerate dan memotong saldo akun terpilih"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateExpense} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Kategori Pengeluaran *"
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
            >
              <option value="fc7">Operasional Kantor & Kebersihan</option>
              <option value="fc8">Listrik, Air & Internet</option>
              <option value="fc9">Pemeliharaan Gedung & Sound System</option>
              <option value="fc10">Konsumsi Pelayan & Fellowship</option>
              <option value="fc11">Bantuan Sosial Diakonia</option>
              <option value="fc12">Kegiatan Program Kerja Komisi</option>
            </Select>

            <Select
              label="Sumber Dana Kas / Bank *"
              value={formData.account_id}
              onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.account_name} (Sisa: {formatCurrency(acc.current_balance)})
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Nominal Pengeluaran (Rp) *"
              type="number"
              placeholder="Contoh: 750000"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
            />

            <Input
              label="Penerima Pembayaran / Vendor *"
              placeholder="Contoh: PLN Persero / Toko ATK Surya"
              value={formData.recipient_name}
              onChange={(e) => setFormData({ ...formData, recipient_name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Tanggal Transaksi *"
              type="date"
              value={formData.transaction_date}
              onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
              required
            />

            <Select
              label="Metode Pembayaran *"
              value={formData.payment_method}
              onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
            >
              <option value="CASH">Tunai (Kas)</option>
              <option value="TRANSFER">Transfer Bank</option>
              <option value="GIRO">Cek / Bilyet Giro</option>
            </Select>
          </div>

          <Input
            label="Tautan Bukti Nota / Kuitansi (Opsional)"
            placeholder="/receipts/nota-pembelian.pdf atau URL gambar"
            value={formData.receipt_url}
            onChange={(e) => setFormData({ ...formData, receipt_url: e.target.value })}
          />

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">Deskripsi / Keperluan Pengeluaran *</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Rincian barang atau jasa yang dibayarkan..."
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:outline-none focus:border-navy-600"
              required
            ></textarea>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button variant="secondary" size="md" type="button" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button variant="danger" size="md" type="submit" isLoading={isSubmitting}>
              Bukukan Pengeluaran
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
