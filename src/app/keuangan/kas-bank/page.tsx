'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import { Card, CardHeader, CardTitle, CardContent, Badge, Input, Select } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { FinancialAccount, FinancialTransaction } from '@/lib/types';
import { formatCurrency, formatDateIndo } from '@/lib/utils';
import {
  ArrowRightLeft,
  Wallet,
  Building,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

export default function KasBankPage() {
  const { roleCode, can, currentUser } = useAuth();
  const { showToast } = useNotification();

  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [transfers, setTransfers] = useState<FinancialTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Transfer Modal State
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isSubmittingTransfer, setIsSubmittingTransfer] = useState(false);
  const [transferData, setTransferData] = useState({
    from_account_id: '',
    to_account_id: '',
    amount: '',
    transaction_date: new Date().toISOString().split('T')[0],
    description: '',
  });

  // New Account Modal State
  const [isNewAccountOpen, setIsNewAccountOpen] = useState(false);
  const [newAccountData, setNewAccountData] = useState({
    account_number: '',
    account_name: '',
    account_type: 'BANK' as 'CASH' | 'BANK',
    initial_balance: '',
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [resAcc, resTrx] = await Promise.all([
        fetch('/api/keuangan/akun'),
        fetch('/api/keuangan/transaksi?type=TRANSFER'),
      ]);
      const dataAcc = await resAcc.json();
      const dataTrx = await resTrx.json();

      if (dataAcc.success) {
        setAccounts(dataAcc.data);
        if (dataAcc.data.length >= 2) {
          setTransferData((prev) => ({
            ...prev,
            from_account_id: dataAcc.data[0].id,
            to_account_id: dataAcc.data[1].id,
          }));
        }
      }
      if (dataTrx.success) setTransfers(dataTrx.data);
    } catch (err) {
      console.error(err);
      showToast('error', 'Gagal memuat akun kas');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(transferData.amount);
    if (!amountNum || amountNum <= 0) {
      showToast('warning', 'Nominal Tidak Valid', 'Masukkan nominal transfer lebih dari 0');
      return;
    }

    if (transferData.from_account_id === transferData.to_account_id) {
      showToast('warning', 'Akun Sama', 'Akun asal dan akun tujuan tidak boleh sama');
      return;
    }

    setIsSubmittingTransfer(true);
    try {
      const res = await fetch('/api/keuangan/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...transferData,
          amount: amountNum,
          actor_name: currentUser?.full_name || 'Bendahara',
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast('success', 'Transfer Berhasil', `Dana ${formatCurrency(amountNum)} berhasil dipindahkan.`);
        setIsTransferOpen(false);
        setTransferData((prev) => ({ ...prev, amount: '', description: '' }));
        loadData();
      } else {
        showToast('error', 'Gagal', json.message);
      }
    } catch (err: any) {
      showToast('error', 'Kesalahan', err.message);
    } finally {
      setIsSubmittingTransfer(false);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccountData.account_name.trim() || !newAccountData.account_number.trim()) {
      showToast('warning', 'Validasi Gagal', 'Nomor rekening dan nama akun wajib diisi');
      return;
    }

    try {
      const res = await fetch('/api/keuangan/akun', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newAccountData,
          initial_balance: Number(newAccountData.initial_balance) || 0,
          actor_name: currentUser?.full_name || 'Bendahara',
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast('success', 'Akun Dibuat', `Akun kas ${json.data.account_name} berhasil ditambahkan.`);
        setIsNewAccountOpen(false);
        setNewAccountData({ account_number: '', account_name: '', account_type: 'BANK', initial_balance: '' });
        loadData();
      }
    } catch (err: any) {
      showToast('error', 'Gagal membuat akun', err.message);
    }
  };

  const totalLiquid = accounts.reduce((sum, a) => sum + a.current_balance, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-navy-950 tracking-tight flex items-center gap-2.5">
            <ArrowRightLeft className="w-6 h-6 text-navy-900" />
            Kas & Rekening Bank Gereja
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Pengelolaan brankas tunai, kas operasional kantor, rekening bank penampung persembahan, dan mutasi transfer antar-kas.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {can('kas_bank', 'create') && (
            <>
              <Button variant="outline" size="sm" onClick={() => setIsNewAccountOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
                Tambah Rekening / Kas
              </Button>
              <Button variant="gold" size="sm" onClick={() => setIsTransferOpen(true)} leftIcon={<ArrowRightLeft className="w-4 h-4" />}>
                Transfer Antar Rekening
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Total Balance Banner */}
      <Card className="bg-gradient-to-r from-navy-950 to-navy-900 text-white border-navy-800">
        <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-xs text-navy-200 font-semibold">Total Saldo Likuiditas Bersih (Seluruh Kas & Bank)</p>
            <h2 className="text-3xl font-black text-white mt-1">{formatCurrency(totalLiquid)}</h2>
            <p className="text-[11px] text-gold-400 mt-0.5">Semua dana terverifikasi dalam neraca kas operasional</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-navy-200 bg-white/10 px-4 py-2 rounded-xl backdrop-blur">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Rekonsiliasi Otomatis Non-Duplikasi Saldo</span>
          </div>
        </CardContent>
      </Card>

      {/* Account Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {accounts.map((acc) => {
          const isCash = acc.account_type === 'CASH';
          return (
            <Card key={acc.id} className="hover:border-navy-400">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
                      isCash ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'
                    }`}
                  >
                    {isCash ? <Wallet className="w-4 h-4" /> : <Building className="w-4 h-4" />}
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase font-mono">
                    {acc.account_number}
                  </span>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-navy-950 truncate" title={acc.account_name}>
                    {acc.account_name}
                  </h4>
                  <p className="text-lg font-black text-navy-950 mt-1">
                    {formatCurrency(acc.current_balance)}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Saldo Awal: {formatCurrency(acc.initial_balance)}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Riwayat Mutasi Transfer Antar-Kas */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-navy-900" />
            <CardTitle>Riwayat Transfer Antar-Rekening & Kas</CardTitle>
          </div>
          <p className="text-xs text-slate-400">
            Perpindahan dana murni (tidak dihitung sebagai pemasukan atau pengeluaran baru)
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">No. Transaksi</th>
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">Dari Akun Asal</th>
                  <th className="px-4 py-3">Ke Akun Tujuan</th>
                  <th className="px-4 py-3">Keterangan</th>
                  <th className="px-4 py-3 text-right">Nominal Transfer</th>
                  <th className="px-4 py-3">Petugas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transfers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-400">
                      Belum ada transaksi pemindahan dana antar-kas yang tercatat.
                    </td>
                  </tr>
                ) : (
                  transfers.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50 transition">
                      <td className="px-5 py-3 font-mono font-bold text-navy-900">{tx.transaction_number}</td>
                      <td className="px-4 py-3 text-slate-600">{formatDateIndo(tx.transaction_date)}</td>
                      <td className="px-4 py-3 font-semibold text-rose-700 flex items-center gap-1">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        {tx.account_name}
                      </td>
                      <td className="px-4 py-3 font-semibold text-emerald-700">
                        <span className="flex items-center gap-1">
                          <ArrowDownLeft className="w-3.5 h-3.5" />
                          {tx.destination_account_name || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 max-w-xs truncate">{tx.description}</td>
                      <td className="px-4 py-3 text-right font-black text-navy-950">
                        {formatCurrency(tx.amount)}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{tx.created_by_name}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal Transfer Antar Rekening */}
      <Modal
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        title="Transfer Antar Rekening & Kas"
        subtitle="Memindahkan saldo antar akun tanpa menciptakan duplikasi pemasukan/pengeluaran"
        maxWidth="md"
      >
        <form onSubmit={handleTransferSubmit} className="space-y-4">
          <Select
            label="Dari Akun Asal (Sumber Dana) *"
            value={transferData.from_account_id}
            onChange={(e) => setTransferData({ ...transferData, from_account_id: e.target.value })}
            required
          >
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.account_name} (Saldo: {formatCurrency(acc.current_balance)})
              </option>
            ))}
          </Select>

          <Select
            label="Ke Akun Tujuan (Penerima Dana) *"
            value={transferData.to_account_id}
            onChange={(e) => setTransferData({ ...transferData, to_account_id: e.target.value })}
            required
          >
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.account_name} (Saldo: {formatCurrency(acc.current_balance)})
              </option>
            ))}
          </Select>

          <Input
            label="Nominal Pemindahan Dana (Rp) *"
            type="number"
            placeholder="Contoh: 5000000"
            value={transferData.amount}
            onChange={(e) => setTransferData({ ...transferData, amount: e.target.value })}
            required
          />

          <Input
            label="Tanggal Transfer *"
            type="date"
            value={transferData.transaction_date}
            onChange={(e) => setTransferData({ ...transferData, transaction_date: e.target.value })}
            required
          />

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">Keterangan / Alasan Transfer *</label>
            <textarea
              rows={2}
              value={transferData.description}
              onChange={(e) => setTransferData({ ...transferData, description: e.target.value })}
              placeholder="Contoh: Tarik tunai kas kecil kantor dari rekening BCA operasional..."
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:outline-none focus:border-navy-600"
              required
            ></textarea>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button variant="secondary" size="md" type="button" onClick={() => setIsTransferOpen(false)}>
              Batal
            </Button>
            <Button variant="gold" size="md" type="submit" isLoading={isSubmittingTransfer}>
              Eksekusi Pemindahan Dana
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Tambah Akun Baru */}
      <Modal
        isOpen={isNewAccountOpen}
        onClose={() => setIsNewAccountOpen(false)}
        title="Tambah Akun Kas atau Rekening Bank Baru"
        maxWidth="md"
      >
        <form onSubmit={handleCreateAccount} className="space-y-4">
          <Input
            label="Nama Akun Kas / Bank *"
            placeholder="Contoh: Rekening BNI Pelayanan Misi"
            value={newAccountData.account_name}
            onChange={(e) => setNewAccountData({ ...newAccountData, account_name: e.target.value })}
            required
          />

          <Input
            label="Nomor Rekening / Kode Kas *"
            placeholder="Contoh: BNI-0988776655 atau KAS-03"
            value={newAccountData.account_number}
            onChange={(e) => setNewAccountData({ ...newAccountData, account_number: e.target.value })}
            required
          />

          <Select
            label="Tipe Akun"
            value={newAccountData.account_type}
            onChange={(e) => setNewAccountData({ ...newAccountData, account_type: e.target.value as any })}
          >
            <option value="BANK">Rekening Bank</option>
            <option value="CASH">Kas Tunai (Cash in Hand)</option>
          </Select>

          <Input
            label="Saldo Awal (Rp)"
            type="number"
            placeholder="0"
            value={newAccountData.initial_balance}
            onChange={(e) => setNewAccountData({ ...newAccountData, initial_balance: e.target.value })}
          />

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button variant="secondary" size="md" type="button" onClick={() => setIsNewAccountOpen(false)}>
              Batal
            </Button>
            <Button variant="gold" size="md" type="submit">
              Simpan Akun
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
