'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import { Card, CardHeader, CardTitle, CardContent, Badge, Input, Select } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Budget, BudgetDetail } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { exportToExcel, exportToPDF } from '@/lib/export-utils';
import {
  PieChart,
  Plus,
  FileSpreadsheet,
  FileText,
  Building2,
  TrendingUp,
  AlertCircle,
  Trash2,
} from 'lucide-react';

export default function AnggaranPage() {
  const { roleCode, can, currentUser } = useAuth();
  const { showToast } = useNotification();

  const [budget, setBudget] = useState<Budget | null>(null);
  const [details, setDetails] = useState<BudgetDetail[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    department_id: '',
    allocated_amount: '',
    category_name: 'Kegiatan & Program Kerja Komisi',
  });

  const loadBudget = async () => {
    setIsLoading(true);
    try {
      const [resBgt, resDept] = await Promise.all([
        fetch('/api/keuangan/anggaran?year=2026'),
        fetch('/api/departemen'),
      ]);
      const dataBgt = await resBgt.json();
      const dataDept = await resDept.json();

      if (dataBgt.success) {
        setBudget(dataBgt.budget);
        setDetails(dataBgt.details);
      }
      if (dataDept.success) setDepartments(dataDept.data);
    } catch (err) {
      console.error(err);
      showToast('error', 'Gagal memuat anggaran');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBudget();
  }, []);

  const handleCreateDetail = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(formData.allocated_amount);
    if (!amountNum || amountNum <= 0) {
      showToast('warning', 'Nominal Tidak Valid', 'Masukkan nominal alokasi anggaran lebih dari 0');
      return;
    }

    const deptObj = departments.find((d) => d.id === formData.department_id);

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/keuangan/anggaran', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          budget_id: budget?.id || 'b2026',
          department_id: formData.department_id || undefined,
          department_name: deptObj?.name || 'Operasional Umum',
          category_name: formData.category_name,
          allocated_amount: amountNum,
          actor_name: currentUser?.full_name || 'Bendahara',
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast('success', 'Anggaran Ditambahkan', 'Alokasi pos anggaran baru berhasil disimpan.');
        setIsModalOpen(false);
        setFormData({ department_id: '', allocated_amount: '', category_name: 'Kegiatan & Program Kerja Komisi' });
        loadBudget();
      }
    } catch (err: any) {
      showToast('error', 'Gagal', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDetail = async (id: string, name: string) => {
    if (!window.confirm(`Hapus alokasi anggaran "${name}"?`)) return;
    try {
      const res = await fetch(`/api/keuangan/anggaran?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        showToast('success', 'Anggaran Dihapus', `Pos "${name}" berhasil dihapus.`);
        loadBudget();
      } else {
        showToast('error', 'Gagal', json.message);
      }
    } catch (err: any) {
      showToast('error', 'Gagal', err.message);
    }
  };

  const totalAllocated = details.reduce((sum, d) => sum + d.allocated_amount, 0);
  const totalRealized = details.reduce((sum, d) => sum + d.realized_amount, 0);
  const totalRemaining = totalAllocated - totalRealized;
  const overallPercentage = totalAllocated > 0 ? Math.round((totalRealized / totalAllocated) * 100) : 0;

  const handleExportExcel = () => {
    const columns = [
      { header: 'Pos / Komisi', key: 'department_name' },
      { header: 'Kategori Belanja', key: 'category_name' },
      { header: 'Pagu Alokasi', key: 'allocated_amount', format: (v: number) => formatCurrency(v) },
      { header: 'Realisasi Pengeluaran', key: 'realized_amount', format: (v: number) => formatCurrency(v) },
      { header: 'Sisa Anggaran', key: 'allocated_amount', format: (_: any, r: any) => formatCurrency(r.allocated_amount - r.realized_amount) },
    ];
    exportToExcel('RAPBG_GKKA_2026', 'Anggaran 2026', details, columns);
    showToast('info', 'Excel Berhasil', 'Data anggaran telah diekspor.');
  };

  const handleExportPDF = () => {
    const columns = [
      { header: 'Departemen / Pos', key: 'department_name' },
      { header: 'Kategori', key: 'category_name' },
      { header: 'Pagu', key: 'allocated_amount', format: (v: number) => formatCurrency(v) },
      { header: 'Realisasi', key: 'realized_amount', format: (v: number) => formatCurrency(v) },
    ];
    exportToPDF('RENCANA ANGGARAN & REALISASI (RAPBG 2026)', 'GKKA Jakarta', details, columns, 'Laporan_RAPBG_GKKA');
    showToast('info', 'PDF Berhasil', 'Dokumen anggaran telah diunduh.');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-navy-950 tracking-tight flex items-center gap-2.5">
            <PieChart className="w-6 h-6 text-navy-900" />
            Rencana Anggaran Pendapatan & Belanja Gereja (RAPBG)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Alokasi pagu tahunan komisi, persentase penyerapan dana, dan sisa anggaran operasional tahun 2026.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" onClick={handleExportExcel} leftIcon={<FileSpreadsheet className="w-4 h-4 text-emerald-600" />}>
            Excel
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPDF} leftIcon={<FileText className="w-4 h-4 text-rose-600" />}>
            PDF
          </Button>
          {can('anggaran', 'create') && (
            <Button variant="gold" size="sm" onClick={() => setIsModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
              Tambah Pos Anggaran
            </Button>
          )}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-semibold text-slate-500">Total Pagu Anggaran 2026</p>
            <h3 className="text-xl font-black text-navy-950 mt-1">{formatCurrency(totalAllocated)}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Disahkan Sidang Majelis</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-semibold text-slate-500">Total Realisasi Penyerapan</p>
            <h3 className="text-xl font-black text-rose-700 mt-1">{formatCurrency(totalRealized)}</h3>
            <p className="text-[11px] text-rose-600 font-bold mt-0.5">{overallPercentage}% Terserap</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-semibold text-slate-500">Sisa Pagu Anggaran</p>
            <h3 className="text-xl font-black text-emerald-700 mt-1">{formatCurrency(totalRemaining)}</h3>
            <p className="text-[11px] text-emerald-600 font-bold mt-0.5">{100 - overallPercentage}% Tersedia</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-semibold text-slate-500">Status RAPBG</p>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <h3 className="text-sm font-black text-emerald-800">BERJALAN AKTIF</h3>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Tahun Buku 2026</p>
          </CardContent>
        </Card>
      </div>

      {/* Budget Breakdown Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Pos / Departemen</th>
                <th className="px-4 py-3.5">Kategori Belanja</th>
                <th className="px-4 py-3.5 text-right">Pagu Alokasi</th>
                <th className="px-4 py-3.5 text-right">Realisasi Aktual</th>
                <th className="px-4 py-3.5 text-right">Sisa Pagu</th>
                <th className="px-5 py-3.5 w-48">Penggunaan (%)</th>
                <th className="px-4 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    <div className="inline-block w-6 h-6 border-2 border-navy-900 border-t-gold-500 rounded-full animate-spin"></div>
                    <p className="mt-2 text-xs">Memuat data anggaran...</p>
                  </td>
                </tr>
              ) : (
                details.map((d) => {
                  const sisa = d.allocated_amount - d.realized_amount;
                  const percent = d.allocated_amount > 0 ? Math.round((d.realized_amount / d.allocated_amount) * 100) : 0;

                  return (
                    <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-navy-950">
                        {d.department_name || 'Operasional Umum'}
                      </td>

                      <td className="px-4 py-3.5 text-slate-600">
                        {d.category_name || 'Beban Operasional'}
                      </td>

                      <td className="px-4 py-3.5 text-right font-semibold text-slate-900">
                        {formatCurrency(d.allocated_amount)}
                      </td>

                      <td className="px-4 py-3.5 text-right font-black text-rose-700">
                        {formatCurrency(d.realized_amount)}
                      </td>

                      <td className="px-4 py-3.5 text-right font-black text-emerald-700">
                        {formatCurrency(sisa)}
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-bold">
                            <span className="text-slate-500">{percent}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                percent > 90 ? 'bg-rose-500' : percent > 60 ? 'bg-amber-500' : 'bg-navy-900'
                              }`}
                              style={{ width: `${Math.min(percent, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        {can('keuangan_umum', 'delete') && (
                          <button
                            onClick={() => handleDeleteDetail(d.id, d.department_name || d.category_name || '')}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                            title="Hapus pos anggaran"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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

      {/* Modal Tambah Pos Anggaran */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Alokasi Pos Anggaran RAPBG Baru"
        maxWidth="md"
      >
        <form onSubmit={handleCreateDetail} className="space-y-4">
          <Select
            label="Departemen / Komisi Terkait *"
            value={formData.department_id}
            onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
          >
            <option value="">-- Operasional Gereja Umum --</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>

          <Input
            label="Kategori / Nama Beban *"
            value={formData.category_name}
            onChange={(e) => setFormData({ ...formData, category_name: e.target.value })}
            required
          />

          <Input
            label="Nominal Pagu Alokasi (Rp) *"
            type="number"
            placeholder="Contoh: 25000000"
            value={formData.allocated_amount}
            onChange={(e) => setFormData({ ...formData, allocated_amount: e.target.value })}
            required
          />

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button variant="secondary" size="md" type="button" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button variant="gold" size="md" type="submit" isLoading={isSubmitting}>
              Simpan Pos Anggaran
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
