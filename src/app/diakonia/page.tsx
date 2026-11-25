'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import { Card, CardHeader, CardTitle, CardContent, Badge, Input, Select } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { DiakoniaRequest, DiakoniaStatus } from '@/lib/types';
import { formatDateIndo, formatCurrency, getDiakoniaStatusBadge } from '@/lib/utils';
import { exportToExcel, exportToPDF } from '@/lib/export-utils';
import {
  HeartHandshake,
  Plus,
  Lock,
  FileSpreadsheet,
  FileText,
  ShieldAlert,
  CheckCircle,
  Clock,
  AlertTriangle,
  Trash2,
} from 'lucide-react';

export default function DiakoniaPage() {
  const { roleCode, can, currentUser } = useAuth();
  const { showToast } = useNotification();

  const [requests, setRequests] = useState<DiakoniaRequest[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    recipient_name: '',
    member_id: '',
    category: 'BANTUAN_KESEHATAN',
    requested_amount: '',
    urgency_level: 'MEDIUM',
    description: '',
    verification_notes: '',
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [resDia, resMem] = await Promise.all([
        fetch(`/api/diakonia?role=${roleCode}`),
        fetch('/api/jemaat'),
      ]);
      const dataDia = await resDia.json();
      const dataMem = await resMem.json();

      if (dataDia.success) setRequests(dataDia.data);
      if (dataMem.success) setMembers(dataMem.data);
    } catch (err) {
      console.error(err);
      showToast('error', 'Gagal memuat permohonan diakonia');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [roleCode]);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.recipient_name.trim() || !formData.description.trim()) {
      showToast('warning', 'Validasi Gagal', 'Nama penerima dan deskripsi kebutuhan wajib diisi');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/diakonia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          requested_amount: Number(formData.requested_amount) || 0,
          actor_name: currentUser?.full_name || 'Tim Diakonia',
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast('success', 'Permohonan Didaftarkan', `Permohonan bantuan ${json.data.request_number} berhasil disimpan.`);
        setIsModalOpen(false);
        setFormData({
          recipient_name: '',
          member_id: '',
          category: 'BANTUAN_KESEHATAN',
          requested_amount: '',
          urgency_level: 'MEDIUM',
          description: '',
          verification_notes: '',
        });
        loadData();
      }
    } catch (err: any) {
      showToast('error', 'Gagal', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: DiakoniaStatus) => {
    try {
      const res = await fetch('/api/diakonia', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          status: newStatus,
          approved_by_name: currentUser?.full_name || 'Gembala',
          actor_name: currentUser?.full_name || 'Admin',
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast('success', 'Status Diakonia Diperbarui', `Status permohonan diubah menjadi ${newStatus}`);
        loadData();
      }
    } catch (err) {
      showToast('error', 'Gagal update status');
    }
  };

  const handleDeleteRequest = async (id: string, reqNum: string) => {
    if (!window.confirm(`Hapus permohonan diakonia "${reqNum}"?`)) return;
    try {
      const res = await fetch(`/api/diakonia?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        showToast('success', 'Permohonan Dihapus', `Data "${reqNum}" berhasil dihapus.`);
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
      { header: 'No. Permohonan', key: 'request_number' },
      { header: 'Tanggal', key: 'request_date' },
      { header: 'Kategori Bantuan', key: 'category' },
      { header: 'Penerima Bantuan', key: 'recipient_name' },
      { header: 'Nominal Diajukan', key: 'requested_amount', format: (v: number) => formatCurrency(v) },
      { header: 'Tingkat Urgensi', key: 'urgency_level' },
      { header: 'Status', key: 'status' },
    ];
    exportToExcel('Laporan_Pelayanan_Diakonia_GKKA', 'Diakonia', requests, columns);
    showToast('info', 'Excel Berhasil', 'Data diakonia telah diekspor.');
  };

  const handleExportPDF = () => {
    const columns = [
      { header: 'No. Surat', key: 'request_number' },
      { header: 'Tanggal', key: 'request_date' },
      { header: 'Kategori', key: 'category' },
      { header: 'Penerima', key: 'recipient_name' },
      { header: 'Nominal', key: 'requested_amount', format: (v: number) => formatCurrency(v) },
      { header: 'Status', key: 'status' },
    ];
    exportToPDF('LAPORAN PELAYANAN SOSIAL DIAKONIA', 'GKKA Jakarta', requests, columns, 'Laporan_Diakonia_GKKA');
    showToast('info', 'PDF Berhasil', 'Laporan diakonia telah diunduh.');
  };

  const canAccessConfidential = roleCode === 'SUPER_ADMIN' || roleCode === 'PENDETA' || roleCode === 'BENDAHARA';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-navy-950 tracking-tight flex items-center gap-2.5">
            <HeartHandshake className="w-6 h-6 text-navy-900" />
            Pelayanan Diakonia & Bantuan Jemaat
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Pengelolaan permohonan santunan kasih, beasiswa pendidikan, bantuan kesehatan, dan sembako.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" onClick={handleExportExcel} leftIcon={<FileSpreadsheet className="w-4 h-4 text-emerald-600" />}>
            Excel
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPDF} leftIcon={<FileText className="w-4 h-4 text-rose-600" />}>
            PDF
          </Button>
          {can('diakonia', 'create') && (
            <Button variant="gold" size="sm" onClick={() => setIsModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
              Ajukan Permohonan Bantuan
            </Button>
          )}
        </div>
      </div>

      {/* Security Privacy Notice */}
      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-start gap-3 text-xs text-amber-900">
        <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold">Perlindungan Privasi Martabat Penerima Bantuan</h4>
          <p className="mt-0.5 text-amber-800 leading-relaxed">
            Data penerima santunan dan catatan survei kebutuhan sosial bersifat rahasia (Confidential).
            Hanya Gembala Sidang, Bendahara, dan Panitia Diakonia yang berwenang meninjau dokumen lengkap.
          </p>
        </div>
      </div>

      {/* Requests Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">No. Pengajuan</th>
                <th className="px-4 py-3.5">Tanggal</th>
                <th className="px-4 py-3.5">Kategori Bantuan</th>
                <th className="px-4 py-3.5">Penerima Manfaat</th>
                <th className="px-4 py-3.5">Tingkat Urgensi</th>
                <th className="px-4 py-3.5 text-right">Nominal Diajukan</th>
                <th className="px-4 py-3.5">Status Pengajuan</th>
                <th className="px-4 py-3.5 text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    <div className="inline-block w-6 h-6 border-2 border-navy-900 border-t-gold-500 rounded-full animate-spin"></div>
                    <p className="mt-2 text-xs">Memuat data diakonia...</p>
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    Belum ada pengajuan bantuan sosial yang tercatat.
                  </td>
                </tr>
              ) : (
                requests.map((dia) => {
                  const statusBadge = getDiakoniaStatusBadge(dia.status);
                  const isCritical = dia.urgency_level === 'CRITICAL' || dia.urgency_level === 'HIGH';

                  return (
                    <tr key={dia.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-[11px] font-bold text-navy-900">
                        {dia.request_number}
                      </td>

                      <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap">
                        {formatDateIndo(dia.request_date)}
                      </td>

                      <td className="px-4 py-3.5 font-bold text-navy-950">
                        {dia.category.replace('_', ' ')}
                        <p className="text-[11px] text-slate-400 font-normal line-clamp-1 max-w-[180px]">
                          {dia.description}
                        </p>
                      </td>

                      <td className="px-4 py-3.5 font-semibold text-slate-800">
                        {dia.recipient_name}
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            isCritical
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {dia.urgency_level}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-right font-black text-navy-950">
                        {formatCurrency(dia.requested_amount)}
                      </td>

                      <td className="px-4 py-3.5">
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusBadge.color}`}>
                          {statusBadge.label}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {can('diakonia', 'approve') && dia.status === 'SUBMITTED' && (
                            <button
                              onClick={() => handleStatusChange(dia.id, 'VERIFIED')}
                              className="px-2 py-1 rounded bg-blue-600 text-white text-[10px] font-bold hover:bg-blue-700"
                            >
                              Verifikasi
                            </button>
                          )}
                          {can('diakonia', 'approve') && dia.status === 'VERIFIED' && (
                            <button
                              onClick={() => handleStatusChange(dia.id, 'APPROVED')}
                              className="px-2 py-1 rounded bg-purple-600 text-white text-[10px] font-bold hover:bg-purple-700"
                            >
                              Setujui
                            </button>
                          )}
                          {can('diakonia', 'approve') && dia.status === 'APPROVED' && (
                            <button
                              onClick={() => handleStatusChange(dia.id, 'DISTRIBUTED')}
                              className="px-2 py-1 rounded bg-emerald-600 text-white text-[10px] font-bold hover:bg-emerald-700"
                            >
                              Salurkan
                            </button>
                          )}
                          {can('diakonia', 'delete') && (
                            <button
                              onClick={() => handleDeleteRequest(dia.id, dia.request_number)}
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                              title="Hapus permohonan"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Pengajuan Diakonia */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Pengajuan Bantuan Sosial Diakonia"
        subtitle="Data penerima manfaat dirahasiakan dan dilindungi kebijakan privasi"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateRequest} className="space-y-4">
          <Input
            label="Nama Penerima Bantuan (Jemaat / Warga) *"
            placeholder="Contoh: Keluarga Binaan Ibu Rina"
            value={formData.recipient_name}
            onChange={(e) => setFormData({ ...formData, recipient_name: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Kategori Bantuan *"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              <option value="BANTUAN_KESEHATAN">Bantuan Medis / Kesehatan</option>
              <option value="BANTUAN_PENDIDIKAN">Beasiswa / Pendidikan Anak</option>
              <option value="BANTUAN_DUKA">Santunan Kedukaan</option>
              <option value="SEMBAKO">Bantuan Sembako & Kebutuhan Pokok</option>
              <option value="LAINNYA">Bantuan Kesejahteraan Lainnya</option>
            </Select>

            <Select
              label="Tingkat Urgensi *"
              value={formData.urgency_level}
              onChange={(e) => setFormData({ ...formData, urgency_level: e.target.value })}
            >
              <option value="LOW">Rendah (Berkala)</option>
              <option value="MEDIUM">Menengah (Standar)</option>
              <option value="HIGH">Tinggi (Mendesak)</option>
              <option value="CRITICAL">Kritis (Darurat Medis / Duka)</option>
            </Select>
          </div>

          <Input
            label="Estimasi Nominal Bantuan (Rp) *"
            type="number"
            placeholder="Contoh: 2500000"
            value={formData.requested_amount}
            onChange={(e) => setFormData({ ...formData, requested_amount: e.target.value })}
            required
          />

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">Rincian Kebutuhan & Hasil Survei Lapangan *</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Jelaskan kondisi ekonomi, diagnosa medis, surat keterangan rumah sakit, atau kebutuhan SPP..."
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:outline-none focus:border-navy-600"
              required
            ></textarea>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button variant="secondary" size="md" type="button" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button variant="gold" size="md" type="submit" isLoading={isSubmitting}>
              Kirim Pengajuan Diakonia
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
