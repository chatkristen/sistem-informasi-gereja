'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import { Card, CardHeader, CardTitle, CardContent, Badge, Input, Select } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Department } from '@/lib/types';
import { exportToExcel, exportToPDF } from '@/lib/export-utils';
import {
  Building2,
  Users,
  Plus,
  FileSpreadsheet,
  FileText,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';

export default function DepartemenPage() {
  const { roleCode, can, currentUser } = useAuth();
  const { showToast } = useNotification();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    category: 'KOMISI' as 'KOMISI' | 'PELAYANAN' | 'BIDANG',
    leader_member_id: '',
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [resDept, resMem] = await Promise.all([
        fetch('/api/departemen'),
        fetch('/api/jemaat'),
      ]);
      const dataDept = await resDept.json();
      const dataMem = await resMem.json();

      if (dataDept.success) setDepartments(dataDept.data);
      if (dataMem.success) setMembers(dataMem.data);
    } catch (err) {
      console.error(err);
      showToast('error', 'Gagal memuat departemen');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) {
      showToast('warning', 'Validasi Gagal', 'Kode dan nama komisi wajib diisi');
      return;
    }

    const leaderObj = members.find((m) => m.id === formData.leader_member_id);

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/departemen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          leader_member_name: leaderObj?.full_name,
          actor_name: currentUser?.full_name || 'Admin',
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast('success', 'Komisi Dibuat', `Departemen ${json.data.name} berhasil ditambahkan.`);
        setIsModalOpen(false);
        setFormData({ code: '', name: '', description: '', category: 'KOMISI', leader_member_id: '' });
        loadData();
      }
    } catch (err: any) {
      showToast('error', 'Gagal', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDept = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/departemen?id=${deleteTarget.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        showToast('success', 'Departemen Dihapus', `Departemen "${deleteTarget.name}" berhasil dihapus.`);
        setDeleteTarget(null);
        loadData();
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
      { header: 'Kode', key: 'code' },
      { header: 'Nama Departemen / Komisi', key: 'name' },
      { header: 'Kategori', key: 'category' },
      { header: 'Ketua Pelayanan', key: 'leader_member_name' },
      { header: 'Jumlah Anggota', key: 'members_count' },
      { header: 'Status', key: 'status' },
    ];
    exportToExcel('Data_Departemen_GKKA', 'Departemen', departments, columns);
    showToast('info', 'Excel Berhasil', 'Data komisi & departemen telah diekspor.');
  };

  const handleExportPDF = () => {
    const columns = [
      { header: 'Kode', key: 'code' },
      { header: 'Departemen / Komisi', key: 'name' },
      { header: 'Kategori', key: 'category' },
      { header: 'Ketua', key: 'leader_member_name' },
      { header: 'Anggota', key: 'members_count' },
    ];
    exportToPDF('STRUKTUR DEPARTEMEN & KOMISI GEREJA', 'GKKA Jakarta', departments, columns, 'Laporan_Departemen_GKKA');
    showToast('info', 'PDF Berhasil', 'Dokumen departemen telah diunduh.');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-navy-950 tracking-tight flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-navy-900" />
            Departemen, Komisi & Bidang Pelayanan
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            7 Komisi awal gereja, keanggotaan multi-komisi, struktur kepengurusan, dan program kerja mandiri.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" onClick={handleExportExcel} leftIcon={<FileSpreadsheet className="w-4 h-4 text-emerald-600" />}>
            Excel
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPDF} leftIcon={<FileText className="w-4 h-4 text-rose-600" />}>
            PDF
          </Button>
          {can('departemen', 'create') && (
            <Button variant="gold" size="sm" onClick={() => setIsModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
              Tambah Komisi
            </Button>
          )}
        </div>
      </div>

      {/* Grid of Departments */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading ? (
          <div className="col-span-3 p-12 text-center text-slate-400">
            <div className="inline-block w-6 h-6 border-2 border-navy-900 border-t-gold-500 rounded-full animate-spin"></div>
            <p className="mt-2 text-xs">Memuat departemen...</p>
          </div>
        ) : (
          departments.map((dept) => (
            <Card key={dept.id} className="hover:border-navy-400 flex flex-col justify-between">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <span className="text-[10px] font-bold tracking-wider uppercase text-gold-700 bg-gold-50 border border-gold-200 px-2.5 py-0.5 rounded-full">
                    {dept.category}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-bold text-navy-800 bg-navy-50 px-2 py-0.5 rounded">
                      {dept.code}
                    </span>
                    {can('departemen', 'delete') && (
                      <button
                        onClick={() => setDeleteTarget({ id: dept.id, name: dept.name })}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="Hapus departemen"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-extrabold text-navy-950 tracking-tight">{dept.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {dept.description}
                  </p>
                </div>

                <div className="space-y-1.5 text-xs border-t border-slate-100 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Ketua Pelayanan:</span>
                    <span className="font-bold text-navy-900">{dept.leader_member_name || '-'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Total Anggota Terdaftar:</span>
                    <span className="font-bold text-gold-700 bg-gold-50 px-2 py-0.5 rounded">
                      {dept.members_count || 0} Jemaat
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <Link href={`/departemen/${dept.id}`} className="w-full">
                    <Button variant="secondary" size="sm" className="w-full justify-between" rightIcon={<ChevronRight className="w-4 h-4" />}>
                      <span className="font-bold text-navy-900">Kelola Anggota & Program</span>
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modal Tambah Departemen */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Tambah Departemen / Komisi Baru"
        maxWidth="md"
      >
        <form onSubmit={handleCreateDept} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Kode Departemen *"
              placeholder="Contoh: KOM-LANSIA"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              required
            />

            <Select
              label="Kategori *"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
            >
              <option value="KOMISI">Komisi</option>
              <option value="PELAYANAN">Tim Pelayanan</option>
              <option value="BIDANG">Bidang</option>
            </Select>
          </div>

          <Input
            label="Nama Lengkap Departemen / Komisi *"
            placeholder="Contoh: Komisi Lanjut Usia (Simeon & Hana)"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <Select
            label="Ketua Pelayanan"
            value={formData.leader_member_id}
            onChange={(e) => setFormData({ ...formData, leader_member_id: e.target.value })}
          >
            <option value="">-- Pilih Jemaat Sebagai Ketua --</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.member_number} - {m.full_name}
              </option>
            ))}
          </Select>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">Deskripsi / Visi Misi Pelayanan</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Tujuan pembinaan rohani dan pelayanan komisi..."
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:outline-none focus:border-navy-600"
            ></textarea>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button variant="secondary" size="md" type="button" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button variant="gold" size="md" type="submit" isLoading={isSubmitting}>
              Simpan Departemen
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Modal Hapus Departemen */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteDept}
        title="Hapus Departemen / Komisi"
        message={`Apakah Anda yakin ingin menghapus departemen / komisi "${deleteTarget?.name}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Ya, Hapus Departemen"
        cancelText="Batalkan"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
