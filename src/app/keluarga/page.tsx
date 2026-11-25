'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import { Card, CardHeader, CardTitle, CardContent, Badge, Input, Select } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Family, Member } from '@/lib/types';
import { formatDateIndo } from '@/lib/utils';
import { exportToExcel, exportToPDF } from '@/lib/export-utils';
import {
  Home,
  Users,
  Search,
  Plus,
  FileSpreadsheet,
  FileText,
  Eye,
  Trash2,
  Phone,
  MapPin,
  ChevronRight,
  GitFork,
} from 'lucide-react';
import Link from 'next/link';

export default function KeluargaPage() {
  const { roleCode, can, currentUser } = useAuth();
  const { showToast } = useNotification();

  const [families, setFamilies] = useState<Family[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formData, setFormData] = useState({
    family_name: '',
    head_member_id: '',
    spouse_member_id: '',
    address: '',
    phone: '',
    rt_rw: '',
    city: 'Jakarta Pusat',
    postal_code: '',
  });

  const loadFamilies = async () => {
    setIsLoading(true);
    try {
      const [resFam, resMem] = await Promise.all([
        fetch(`/api/keluarga?search=${encodeURIComponent(search)}`),
        fetch('/api/jemaat'),
      ]);
      const dataFam = await resFam.json();
      const dataMem = await resMem.json();
      if (dataFam.success) setFamilies(dataFam.data);
      if (dataMem.success) setMembers(dataMem.data);
    } catch (err) {
      console.error(err);
      showToast('error', 'Gagal memuat data keluarga');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFamilies();
  }, [search]);

  const handleCreateFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.family_name.trim()) {
      showToast('warning', 'Validasi Gagal', 'Nama keluarga wajib diisi');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/keluarga', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          actor_name: currentUser?.full_name || 'Sekretaris',
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast('success', 'Berhasil', `Data keluarga ${json.data.family_name} (${json.data.family_number}) telah dibuat.`);
        setIsModalOpen(false);
        setFormData({
          family_name: '',
          head_member_id: '',
          spouse_member_id: '',
          address: '',
          phone: '',
          rt_rw: '',
          city: 'Jakarta Pusat',
          postal_code: '',
        });
        loadFamilies();
      } else {
        showToast('error', 'Gagal', json.message);
      }
    } catch (err: any) {
      showToast('error', 'Kesalahan Sistem', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteFamily = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/keluarga/${deleteTarget.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        showToast('success', 'Keluarga Diarsipkan', `Data "${deleteTarget.name}" berhasil diarsipkan.`);
        setDeleteTarget(null);
        loadFamilies();
      } else {
        showToast('error', 'Gagal', json.message);
      }
    } catch (err: any) {
      showToast('error', 'Gagal', err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportExcel = () => {
    const columns = [
      { header: 'No. KK', key: 'family_number' },
      { header: 'Nama Keluarga', key: 'family_name' },
      { header: 'Kepala Keluarga', key: 'head_member_name' },
      { header: 'Pasangan', key: 'spouse_member_name' },
      { header: 'Telepon', key: 'phone' },
      { header: 'Alamat', key: 'address' },
      { header: 'Jumlah Anggota', key: 'members_count' },
    ];
    exportToExcel('Data_Keluarga_GKKA_2026', 'Data Keluarga', families, columns);
    showToast('info', 'Excel Berhasil', 'Data keluarga telah diekspor.');
  };

  const handleExportPDF = () => {
    const columns = [
      { header: 'No. KK', key: 'family_number' },
      { header: 'Nama Keluarga', key: 'family_name' },
      { header: 'Kepala Keluarga', key: 'head_member_name' },
      { header: 'Telepon', key: 'phone' },
      { header: 'Alamat', key: 'address' },
      { header: 'Anggota', key: 'members_count' },
    ];
    exportToPDF('DAFTAR KEPALA KELUARGA JEMAAT', 'GKKA Jakarta', families, columns, 'Laporan_Keluarga_GKKA');
    showToast('info', 'PDF Berhasil', 'Dokumen PDF keluarga telah diunduh.');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-navy-950 tracking-tight flex items-center gap-2.5">
            <Home className="w-6 h-6 text-navy-900" />
            Manajemen Keluarga
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Pengelompokan jemaat berbasis kartu keluarga, struktur silsilah, dan hubungan keluarga.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" onClick={handleExportExcel} leftIcon={<FileSpreadsheet className="w-4 h-4 text-emerald-600" />}>
            Excel
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPDF} leftIcon={<FileText className="w-4 h-4 text-rose-600" />}>
            PDF
          </Button>
          {can('keluarga', 'create') && (
            <Button variant="gold" size="sm" onClick={() => setIsModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
              Tambah Keluarga
            </Button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama keluarga, nomor KK, atau nama kepala keluarga..."
              className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-xs pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-navy-500 focus:outline-none transition"
            />
          </div>
        </CardContent>
      </Card>

      {/* Families Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {isLoading ? (
          <div className="col-span-2 p-12 text-center text-slate-400">
            <div className="inline-block w-6 h-6 border-2 border-navy-900 border-t-gold-500 rounded-full animate-spin"></div>
            <p className="mt-2 text-xs">Memuat data keluarga...</p>
          </div>
        ) : families.length === 0 ? (
          <div className="col-span-2 p-12 text-center text-slate-400">
            Tidak ada data keluarga yang ditemukan.
          </div>
        ) : (
          families.map((f) => (
            <Card key={f.id} className="hover:border-navy-300">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-xs font-bold text-navy-800 bg-navy-50 border border-navy-200 px-2.5 py-0.5 rounded-full">
                      {f.family_number}
                    </span>
                    <h3 className="text-base font-extrabold text-navy-950 mt-2">
                      {f.family_name}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-xs font-bold bg-gold-50 text-gold-900 border border-gold-200 px-2.5 py-1 rounded-xl">
                      {f.members_count} Jiwa
                    </span>
                    {can('keluarga', 'delete') && (
                      <button
                        onClick={() => setDeleteTarget({ id: f.id, name: f.family_name })}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="Hapus / Arsipkan Keluarga"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Kepala Keluarga:</span>
                    <span className="font-bold text-navy-950">{f.head_member_name || '-'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Pasangan:</span>
                    <span className="font-semibold text-slate-800">{f.spouse_member_name || '-'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Telepon:</span>
                    <span className="text-slate-700">{f.phone || '-'}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1 pt-0.5">
                    <span className="text-slate-400 shrink-0">Alamat:</span>
                    <span className="sm:text-right text-slate-700 break-words">{f.address}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <Link href={`/keluarga/${f.id}`} className="w-full">
                    <Button variant="secondary" size="sm" className="w-full justify-between" rightIcon={<ChevronRight className="w-4 h-4" />}>
                      <span className="flex items-center gap-1.5 font-bold text-navy-900">
                        <GitFork className="w-3.5 h-3.5 text-gold-600" />
                        Struktur & Silsilah Keluarga
                      </span>
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modal Tambah Keluarga */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Daftarkan Kartu Keluarga Baru"
        subtitle="Nomor KK otomatis dibuat dengan format KK-2026-XXXX"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateFamily} className="space-y-4">
          <Input
            label="Nama Kartu Keluarga *"
            placeholder="Contoh: Keluarga Hartono - Maria"
            value={formData.family_name}
            onChange={(e) => setFormData({ ...formData, family_name: e.target.value })}
            required
          />

          <Select
            label="Kepala Keluarga (Pilih dari Jemaat Terdaftar)"
            value={formData.head_member_id}
            onChange={(e) => {
              const headId = e.target.value;
              const headObj = members.find((m) => m.id === headId);
              setFormData({
                ...formData,
                head_member_id: headId,
                address: headObj?.address || formData.address,
                phone: headObj?.phone || formData.phone,
              });
            }}
          >
            <option value="">-- Pilih Anggota Jemaat --</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.member_number} - {m.full_name} ({m.gender === 'L' ? 'Laki-laki' : 'Perempuan'})
              </option>
            ))}
          </Select>

          <Select
            label="Pasangan (Istri/Suami)"
            value={formData.spouse_member_id}
            onChange={(e) => setFormData({ ...formData, spouse_member_id: e.target.value })}
          >
            <option value="">-- Pilih Pasangan (Opsional) --</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.member_number} - {m.full_name}
              </option>
            ))}
          </Select>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Nomor Telepon Keluarga"
              placeholder="0812-xxxx-xxxx"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            <Input
              label="Kota"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">Alamat Tempat Tinggal</label>
            <textarea
              rows={2}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Alamat domisili keluarga..."
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:outline-none focus:border-navy-600"
            ></textarea>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button variant="secondary" size="md" type="button" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button variant="gold" size="md" type="submit" isLoading={isSubmitting}>
              Simpan Keluarga
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Modal Hapus / Arsip Keluarga */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteFamily}
        title="Arsipkan / Hapus Keluarga"
        message={`Apakah Anda yakin ingin mengarsipkan data keluarga "${deleteTarget?.name}"? Data riwayat jemaat di dalamnya akan tetap aman tercatat dalam sistem.`}
        confirmText="Ya, Arsipkan Data"
        cancelText="Batalkan"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
