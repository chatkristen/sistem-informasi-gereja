'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import { Card, CardHeader, CardTitle, CardContent, Badge, Input, Select } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { WorkProgram, WorkProgramStatus } from '@/lib/types';
import { formatCurrency, getProgramStatusBadge } from '@/lib/utils';
import { exportToExcel, exportToPDF } from '@/lib/export-utils';
import {
  Sparkles,
  Plus,
  FileSpreadsheet,
  FileText,
  Filter,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';

export default function ProgramKerjaPage() {
  const { roleCode, can, currentUser } = useAuth();
  const { showToast } = useNotification();

  const [programs, setPrograms] = useState<WorkProgram[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    department_id: '',
    description: '',
    target_audience: 'Seluruh Jemaat',
    pic_member_id: '',
    year: '2026',
    budget_allocated: '',
    status: 'DRAFT' as WorkProgramStatus,
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [resProg, resDept, resMem] = await Promise.all([
        fetch(`/api/program-kerja?department_id=${deptFilter}&status=${statusFilter}`),
        fetch('/api/departemen'),
        fetch('/api/jemaat'),
      ]);
      const dataProg = await resProg.json();
      const dataDept = await resDept.json();
      const dataMem = await resMem.json();

      if (dataProg.success) setPrograms(dataProg.data);
      if (dataDept.success) {
        setDepartments(dataDept.data);
        if (dataDept.data.length > 0 && !formData.department_id) {
          setFormData((prev) => ({ ...prev, department_id: dataDept.data[0].id }));
        }
      }
      if (dataMem.success) setMembers(dataMem.data);
    } catch (err) {
      console.error(err);
      showToast('error', 'Gagal memuat program kerja');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [deptFilter, statusFilter]);

  const handleCreateProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      showToast('warning', 'Validasi Gagal', 'Nama program kerja wajib diisi');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/program-kerja', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          budget_allocated: Number(formData.budget_allocated) || 0,
          actor_name: currentUser?.full_name || 'Ketua Komisi',
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast('success', 'Program Disimpan', `Program ${json.data.title} berhasil didaftarkan.`);
        setIsModalOpen(false);
        setFormData({
          title: '',
          department_id: departments[0]?.id || '',
          description: '',
          target_audience: 'Seluruh Jemaat',
          pic_member_id: '',
          year: '2026',
          budget_allocated: '',
          status: 'DRAFT',
        });
        loadData();
      }
    } catch (err: any) {
      showToast('error', 'Gagal', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: WorkProgramStatus) => {
    try {
      const res = await fetch('/api/program-kerja', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          status: newStatus,
          actor_name: currentUser?.full_name || 'Admin',
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast('success', 'Status Diperbarui', `Status program diubah menjadi ${newStatus}`);
        loadData();
      }
    } catch (err) {
      showToast('error', 'Gagal update status');
    }
  };

  const handleExportExcel = () => {
    const columns = [
      { header: 'Nama Program', key: 'title' },
      { header: 'Komisi Penyelenggara', key: 'department_name' },
      { header: 'Target Sasaran', key: 'target_audience' },
      { header: 'PIC', key: 'pic_member_name' },
      { header: 'Pagu Anggaran', key: 'budget_allocated', format: (v: number) => formatCurrency(v) },
      { header: 'Status', key: 'status' },
      { header: 'Hasil / Evaluasi', key: 'results' },
    ];
    exportToExcel('Program_Kerja_GKKA_2026', 'Program Kerja', programs, columns);
    showToast('info', 'Excel Berhasil', 'Data program kerja telah diekspor.');
  };

  const handleExportPDF = () => {
    const columns = [
      { header: 'Program Kerja', key: 'title' },
      { header: 'Komisi', key: 'department_name' },
      { header: 'PIC', key: 'pic_member_name' },
      { header: 'Anggaran', key: 'budget_allocated', format: (v: number) => formatCurrency(v) },
      { header: 'Status', key: 'status' },
    ];
    exportToPDF('PROGRAM KERJA & KEGIATAN KOMISI 2026', 'GKKA Jakarta', programs, columns, 'Laporan_Program_Kerja_GKKA');
    showToast('info', 'PDF Berhasil', 'Dokumen program kerja telah diunduh.');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-navy-950 tracking-tight flex items-center gap-2.5">
            <Sparkles className="w-6 h-6 text-navy-900" />
            Program Kerja Departemen & Komisi
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Perencanaan program kerja tahunan/bulanan, target pencapaian, alur persetujuan, dan realisasi anggaran.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" onClick={handleExportExcel} leftIcon={<FileSpreadsheet className="w-4 h-4 text-emerald-600" />}>
            Excel
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPDF} leftIcon={<FileText className="w-4 h-4 text-rose-600" />}>
            PDF
          </Button>
          {can('program_kerja', 'create') && (
            <Button variant="gold" size="sm" onClick={() => setIsModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
              Usulkan Program Baru
            </Button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row items-center gap-3">
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="w-full md:w-56 bg-slate-50 text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none"
          >
            <option value="">Semua Departemen / Komisi</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full md:w-48 bg-slate-50 text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none"
          >
            <option value="">Semua Status Pelaksanaan</option>
            <option value="DRAFT">Draft</option>
            <option value="PENDING_APPROVAL">Menunggu Persetujuan</option>
            <option value="APPROVED">Disetujui</option>
            <option value="ONGOING">Sedang Berjalan</option>
            <option value="COMPLETED">Selesai</option>
            <option value="CANCELLED">Dibatalkan</option>
          </select>
        </CardContent>
      </Card>

      {/* Programs Cards / List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {isLoading ? (
          <div className="col-span-2 p-12 text-center text-slate-400">
            <div className="inline-block w-6 h-6 border-2 border-navy-900 border-t-gold-500 rounded-full animate-spin"></div>
            <p className="mt-2 text-xs">Memuat program kerja...</p>
          </div>
        ) : programs.length === 0 ? (
          <div className="col-span-2 p-12 text-center text-slate-400">
            Tidak ada program kerja yang ditemukan.
          </div>
        ) : (
          programs.map((wp) => {
            const statusBadge = getProgramStatusBadge(wp.status);

            return (
              <Card key={wp.id} className="hover:border-navy-300 flex flex-col justify-between">
                <CardContent className="p-5 space-y-3.5">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-navy-600 bg-navy-50 border border-navy-200 px-2.5 py-0.5 rounded-full">
                        {wp.department_name}
                      </span>
                      <h3 className="text-base font-extrabold text-navy-950 mt-1.5">{wp.title}</h3>
                    </div>

                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${statusBadge.color}`}>
                      {statusBadge.label}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">{wp.description}</p>

                  <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Target Sasaran:</span>
                      <span className="font-semibold text-slate-800">{wp.target_audience}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Penanggung Jawab (PIC):</span>
                      <span className="font-bold text-navy-900">{wp.pic_member_name || '-'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Alokasi Anggaran:</span>
                      <span className="font-black text-navy-950">{formatCurrency(wp.budget_allocated)}</span>
                    </div>
                    {wp.results && (
                      <div className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-200 text-emerald-950 text-[11px] mt-1">
                        <strong>Laporan Capaian:</strong> {wp.results}
                      </div>
                    )}
                  </div>

                  {/* Status Workflow Action Buttons (Role Based) */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-slate-400">Tahun Buku {wp.year}</span>
                    <div className="flex items-center gap-1.5">
                      {can('program_kerja', 'approve') && wp.status === 'PENDING_APPROVAL' && (
                        <button
                          onClick={() => handleStatusChange(wp.id, 'APPROVED')}
                          className="px-2 py-1 rounded bg-blue-600 text-white text-[10px] font-bold hover:bg-blue-700"
                        >
                          Setujui
                        </button>
                      )}
                      {wp.status === 'APPROVED' && (
                        <button
                          onClick={() => handleStatusChange(wp.id, 'ONGOING')}
                          className="px-2 py-1 rounded bg-purple-600 text-white text-[10px] font-bold hover:bg-purple-700"
                        >
                          Mulai Berjalan
                        </button>
                      )}
                      {wp.status === 'ONGOING' && (
                        <button
                          onClick={() => handleStatusChange(wp.id, 'COMPLETED')}
                          className="px-2 py-1 rounded bg-emerald-600 text-white text-[10px] font-bold hover:bg-emerald-700"
                        >
                          Tandai Selesai
                        </button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Modal Tambah Program */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Usulan Program Kerja Komisi"
        subtitle="Menyusun target kegiatan komisi dan estimasi anggaran"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateProgram} className="space-y-4">
          <Input
            label="Nama Program Kerja *"
            placeholder="Contoh: Youth Camp & Leadership Retreat 2026"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Komisi Penyelenggara *"
              value={formData.department_id}
              onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
            >
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>

            <Select
              label="Penanggung Jawab (PIC) *"
              value={formData.pic_member_id}
              onChange={(e) => setFormData({ ...formData, pic_member_id: e.target.value })}
            >
              <option value="">-- Pilih PIC dari Jemaat --</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.member_number} - {m.full_name}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Estimasi Pagu Anggaran (Rp) *"
              type="number"
              placeholder="Contoh: 15000000"
              value={formData.budget_allocated}
              onChange={(e) => setFormData({ ...formData, budget_allocated: e.target.value })}
              required
            />

            <Input
              label="Target Peserta / Sasaran *"
              placeholder="Contoh: Pemuda & Remaja (17-30 thn)"
              value={formData.target_audience}
              onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">Deskripsi Lengkap Program *</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Jelaskan tujuan, jadwal pelaksanaan, dan sasaran rohani..."
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:outline-none focus:border-navy-600"
              required
            ></textarea>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button variant="secondary" size="md" type="button" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button variant="gold" size="md" type="submit" isLoading={isSubmitting}>
              Simpan Usulan Program
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
