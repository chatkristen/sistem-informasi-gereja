'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import { Card, CardHeader, CardTitle, CardContent, Badge, Input, Select } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { InventoryItem, InventoryLoan, InventoryCategory } from '@/lib/types';
import { formatCurrency, formatDateIndo } from '@/lib/utils';
import { exportToExcel, exportToPDF } from '@/lib/export-utils';
import {
  Box,
  Plus,
  FileSpreadsheet,
  FileText,
  MapPin,
  Clock,
  ArrowRightLeft,
  CheckCircle,
  Wrench,
  AlertCircle,
  Trash2,
} from 'lucide-react';

export default function InventarisPage() {
  const { roleCode, can, currentUser } = useAuth();
  const { showToast } = useNotification();

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [loans, setLoans] = useState<InventoryLoan[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    quantity: '1',
    unit: 'Unit',
    purchase_date: new Date().toISOString().split('T')[0],
    purchase_price: '',
    condition: 'BAIK' as any,
    location: 'Sanctuary Gedung Utama',
    pic_member_id: '',
    photo_url: '',
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [resInv, resMem] = await Promise.all([
        fetch('/api/inventaris'),
        fetch('/api/jemaat'),
      ]);
      const dataInv = await resInv.json();
      const dataMem = await resMem.json();

      if (dataInv.success) {
        setItems(dataInv.items);
        setCategories(dataInv.categories);
        setLoans(dataInv.loans);
        if (dataInv.categories.length > 0 && !formData.category_id) {
          setFormData((prev) => ({ ...prev, category_id: dataInv.categories[0].id }));
        }
      }
      if (dataMem.success) setMembers(dataMem.data);
    } catch (err) {
      console.error(err);
      showToast('error', 'Gagal memuat inventaris');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('warning', 'Validasi Gagal', 'Nama barang inventaris wajib diisi');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/inventaris', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          quantity: Number(formData.quantity) || 1,
          purchase_price: Number(formData.purchase_price) || 0,
          actor_name: currentUser?.full_name || 'Sekretariat',
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast('success', 'Aset Tercatat', `Barang ${json.data.name} (${json.data.item_code}) berhasil didaftarkan.`);
        setIsModalOpen(false);
        setFormData({
          name: '',
          category_id: categories[0]?.id || '',
          quantity: '1',
          unit: 'Unit',
          purchase_date: new Date().toISOString().split('T')[0],
          purchase_price: '',
          condition: 'BAIK',
          location: 'Sanctuary Gedung Utama',
          pic_member_id: '',
          photo_url: '',
        });
        loadData();
      }
    } catch (err: any) {
      showToast('error', 'Gagal', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteItem = async (id: string, name: string) => {
    if (!window.confirm(`Hapus barang inventaris "${name}"?`)) return;
    try {
      const res = await fetch(`/api/inventaris?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        showToast('success', 'Aset Dihapus', `Barang "${name}" berhasil dihapus.`);
        loadData();
      } else {
        showToast('error', 'Gagal', json.message);
      }
    } catch (err: any) {
      showToast('error', 'Gagal', err.message);
    }
  };

  const handleExportExcel = () => {
    const columns = [
      { header: 'Kode Aset', key: 'item_code' },
      { header: 'Nama Barang', key: 'name' },
      { header: 'Kategori', key: 'category_name' },
      { header: 'Jumlah', key: 'quantity' },
      { header: 'Satuan', key: 'unit' },
      { header: 'Kondisi', key: 'condition' },
      { header: 'Lokasi Penyimpanan', key: 'location' },
      { header: 'Penanggung Jawab', key: 'pic_member_name' },
      { header: 'Harga Perolehan', key: 'purchase_price', format: (v: number) => formatCurrency(v) },
      { header: 'Status', key: 'status' },
    ];
    exportToExcel('Inventaris_Aset_GKKA', 'Aset Gereja', items, columns);
    showToast('info', 'Excel Berhasil', 'Data inventaris telah diekspor.');
  };

  const handleExportPDF = () => {
    const columns = [
      { header: 'Kode', key: 'item_code' },
      { header: 'Nama Aset', key: 'name' },
      { header: 'Kategori', key: 'category_name' },
      { header: 'Qty', key: 'quantity' },
      { header: 'Kondisi', key: 'condition' },
      { header: 'Lokasi', key: 'location' },
    ];
    exportToPDF('BUKU INDUK INVENTARIS & ASET GEREJA', 'GKKA Jakarta', items, columns, 'Laporan_Inventaris_GKKA');
    showToast('info', 'PDF Berhasil', 'Dokumen inventaris telah diunduh.');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-navy-950 tracking-tight flex items-center gap-2.5">
            <Box className="w-6 h-6 text-navy-900" />
            Inventaris & Pengelolaan Aset Gereja
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Pencatatan kode aset otomatis, lokasi penempatan, pemeliharaan berkala, dan log peminjaman barang.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" onClick={handleExportExcel} leftIcon={<FileSpreadsheet className="w-4 h-4 text-emerald-600" />}>
            Excel
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPDF} leftIcon={<FileText className="w-4 h-4 text-rose-600" />}>
            PDF
          </Button>
          {can('inventaris', 'create') && (
            <Button variant="gold" size="sm" onClick={() => setIsModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
              Tambah Aset Baru
            </Button>
          )}
        </div>
      </div>

      {/* Items Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Kode Aset</th>
                <th className="px-4 py-3.5">Nama Perlengkapan</th>
                <th className="px-4 py-3.5">Kategori</th>
                <th className="px-4 py-3.5">Jumlah</th>
                <th className="px-4 py-3.5">Kondisi</th>
                <th className="px-4 py-3.5">Lokasi Simpan</th>
                <th className="px-4 py-3.5">Penanggung Jawab</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    <div className="inline-block w-6 h-6 border-2 border-navy-900 border-t-gold-500 rounded-full animate-spin"></div>
                    <p className="mt-2 text-xs">Memuat inventaris...</p>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    Belum ada aset inventaris yang terdaftar.
                  </td>
                </tr>
              ) : (
                items.map((ast) => {
                  const isAvailable = ast.status === 'AVAILABLE';
                  const isBorrowed = ast.status === 'BORROWED';

                  return (
                    <tr key={ast.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-[11px] font-bold text-navy-900">
                        {ast.item_code}
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          {ast.photo_url ? (
                            <img
                              src={ast.photo_url}
                              alt={ast.name}
                              className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0 shadow-sm"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-navy-50 text-navy-800 flex items-center justify-center shrink-0 border border-slate-200">
                              <Box className="w-5 h-5 text-navy-600" />
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-navy-950">{ast.name}</p>
                            {ast.purchase_price > 0 && (
                              <p className="text-[10px] text-slate-400 font-normal">
                                Harga: {formatCurrency(ast.purchase_price)}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-slate-600 font-medium">
                        {ast.category_name || '-'}
                      </td>

                      <td className="px-4 py-3.5 font-semibold text-slate-800">
                        {ast.quantity} {ast.unit}
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            ast.condition === 'BAIK'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {ast.condition}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-slate-600">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {ast.location}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 font-medium text-navy-900">
                        {ast.pic_member_name || '-'}
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            isAvailable
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : isBorrowed
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {ast.status === 'AVAILABLE'
                            ? 'Tersedia'
                            : ast.status === 'BORROWED'
                            ? 'Dipinjam'
                            : 'Servis'}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        {can('inventaris', 'delete') && (
                          <button
                            onClick={() => handleDeleteItem(ast.id, ast.name)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                            title="Hapus aset"
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

      {/* Log Peminjaman Barang */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-navy-900" />
            <CardTitle>Log Peminjaman Perlengkapan Gereja</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Nama Barang</th>
                  <th className="px-4 py-3">Peminjam</th>
                  <th className="px-4 py-3">Tgl Pinjam</th>
                  <th className="px-4 py-3">Rencana Kembali</th>
                  <th className="px-4 py-3">Keperluan</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-slate-50 transition">
                    <td className="px-5 py-3 font-bold text-navy-950">{loan.item_name}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{loan.borrower_name}</td>
                    <td className="px-4 py-3 text-slate-600">{formatDateIndo(loan.borrow_date)}</td>
                    <td className="px-4 py-3 text-slate-600">{formatDateIndo(loan.expected_return_date)}</td>
                    <td className="px-4 py-3 text-slate-600 line-clamp-2 leading-snug">{loan.purpose}</td>
                    <td className="px-4 py-3">
                      <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        {loan.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal Tambah Aset */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Pendaftaran Barang Inventaris & Aset"
        subtitle="Kode aset unik digenerate otomatis dengan format AST-2026-XXXX"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateItem} className="space-y-4">
          <ImageUpload
            value={formData.photo_url}
            onChange={(b64) => setFormData({ ...formData, photo_url: b64 })}
            label="Foto Fisik Aset / Inventaris (Opsional)"
            helperText="Unggah foto fisik barang (JPG/PNG). Foto dikompres otomatis dan disimpan ke database."
          />

          <Input
            label="Nama Barang / Aset *"
            placeholder="Contoh: Digital Audio Mixer Behringer X32"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Kategori Aset *"
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>

            <Select
              label="Kondisi Fisik *"
              value={formData.condition}
              onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
            >
              <option value="BAIK">Baik (Siap Pakai)</option>
              <option value="RUSAK_RINGAN">Rusak Ringan (Perlu Servis)</option>
              <option value="RUSAK_BERAT">Rusak Berat (Tidak Berfungsi)</option>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Jumlah Kuantitas *"
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              required
            />

            <Input
              label="Satuan *"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              placeholder="Unit / Pcs / Set"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Lokasi Penyimpanan *"
              placeholder="Contoh: Sanctuary Altar / Ruang Multimedia"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              required
            />

            <Select
              label="Penanggung Jawab (PIC)"
              value={formData.pic_member_id}
              onChange={(e) => setFormData({ ...formData, pic_member_id: e.target.value })}
            >
              <option value="">-- Pilih PIC Aset --</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.member_number} - {m.full_name}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Tanggal Perolehan / Pembelian"
              type="date"
              value={formData.purchase_date}
              onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
            />

            <Input
              label="Harga Perolehan (Rp)"
              type="number"
              placeholder="Contoh: 35000000"
              value={formData.purchase_price}
              onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button variant="secondary" size="md" type="button" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button variant="gold" size="md" type="submit" isLoading={isSubmitting}>
              Simpan Aset
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
