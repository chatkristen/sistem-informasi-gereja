'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import { Card, CardHeader, CardTitle, CardContent, Badge, Input, Select } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Member, MemberStatus, Gender, FamilyRelation } from '@/lib/types';
import { formatDateIndo, getMemberStatusBadge, getFamilyRelationBadge } from '@/lib/utils';
import { exportToExcel, exportToPDF } from '@/lib/export-utils';
import {
  Users,
  Search,
  Plus,
  FileSpreadsheet,
  FileText,
  Printer,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit2,
  Trash2,
  Filter,
  CheckCircle2,
  CreditCard,
} from 'lucide-react';
import Link from 'next/link';

export default function JemaatPage() {
  const { roleCode, can, currentUser } = useAuth();
  const { showToast } = useNotification();

  const [members, setMembers] = useState<Member[]>([]);
  const [families, setFamilies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    full_name: '',
    gender: 'L' as Gender,
    pob: '',
    dob: '',
    phone: '',
    email: '',
    address: '',
    family_id: '',
    family_relation: 'KEPALA_KELUARGA' as FamilyRelation,
    status: 'ACTIVE' as MemberStatus,
    occupation: '',
    education: '',
    notes: '',
    is_confidential_notes: false,
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [resMembers, resFamilies] = await Promise.all([
        fetch(`/api/jemaat?search=${encodeURIComponent(search)}&status=${statusFilter}&gender=${genderFilter}&role=${roleCode}`),
        fetch('/api/keluarga'),
      ]);
      const dataMembers = await resMembers.json();
      const dataFamilies = await resFamilies.json();

      if (dataMembers.success) setMembers(dataMembers.data);
      if (dataFamilies.success) setFamilies(dataFamilies.data);
    } catch (err) {
      console.error(err);
      showToast('error', 'Gagal memuat data jemaat');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, statusFilter, genderFilter, roleCode]);

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name.trim()) {
      showToast('warning', 'Validasi Gagal', 'Nama lengkap jemaat wajib diisi');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/jemaat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          actor_name: currentUser?.full_name || 'Sekretaris',
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast('success', 'Berhasil', `Data jemaat ${json.data.full_name} (${json.data.member_number}) telah didaftarkan.`);
        setIsModalOpen(false);
        setFormData({
          full_name: '',
          gender: 'L',
          pob: '',
          dob: '',
          phone: '',
          email: '',
          address: '',
          family_id: '',
          family_relation: 'KEPALA_KELUARGA',
          status: 'ACTIVE',
          occupation: '',
          education: '',
          notes: '',
          is_confidential_notes: false,
        });
        loadData();
      } else {
        showToast('error', 'Gagal', json.message);
      }
    } catch (err: any) {
      showToast('error', 'Kesalahan Sistem', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMember = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menonaktifkan/mengarsipkan data jemaat ${name}?`)) return;

    try {
      const res = await fetch(`/api/jemaat/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        showToast('success', 'Diarsipkan', `Data ${name} berhasil dinonaktifkan`);
        loadData();
      }
    } catch (err) {
      showToast('error', 'Gagal menonaktifkan data');
    }
  };

  // Export handlers
  const handleExportExcel = () => {
    const columns = [
      { header: 'No. Anggota', key: 'member_number' },
      { header: 'Nama Lengkap', key: 'full_name' },
      { header: 'Gender', key: 'gender', format: (v: string) => (v === 'L' ? 'Laki-laki' : 'Perempuan') },
      { header: 'Telepon', key: 'phone' },
      { header: 'Email', key: 'email' },
      { header: 'Alamat', key: 'address' },
      { header: 'Status', key: 'status' },
      { header: 'Keluarga', key: 'family_name' },
      { header: 'Hubungan', key: 'family_relation' },
    ];
    exportToExcel('Data_Jemaat_GKKA_2026', 'Data Jemaat', members, columns);
    showToast('info', 'Export Excel Berhasil', 'File spreadsheet data jemaat telah diunduh.');
  };

  const handleExportPDF = () => {
    const columns = [
      { header: 'No. Anggota', key: 'member_number' },
      { header: 'Nama Jemaat', key: 'full_name' },
      { header: 'L/P', key: 'gender' },
      { header: 'Telepon', key: 'phone' },
      { header: 'Alamat', key: 'address' },
      { header: 'Status', key: 'status' },
      { header: 'Keluarga', key: 'family_name' },
    ];
    exportToPDF(
      'DAFTAR ANGGOTA JEMAAT',
      'Gereja Kristen Kasih Anugerah',
      members,
      columns,
      'Laporan_Jemaat_GKKA_2026',
      'landscape'
    );
    showToast('info', 'Export PDF Berhasil', 'Dokumen PDF data jemaat telah diunduh.');
  };

  // Pagination calculation
  const totalPages = Math.ceil(members.length / itemsPerPage) || 1;
  const paginatedMembers = members.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-navy-950 tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-navy-900" />
            Direktori Jemaat
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Pengelolaan database jemaat, profil lengkap, status keanggotaan, dan kartu digital.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            leftIcon={<FileSpreadsheet className="w-4 h-4 text-emerald-600" />}
          >
            Excel
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPDF}
            leftIcon={<FileText className="w-4 h-4 text-rose-600" />}
          >
            PDF
          </Button>
          {can('jemaat', 'create') && (
            <Button
              variant="gold"
              size="sm"
              onClick={() => setIsModalOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Tambah Jemaat
            </Button>
          )}
        </div>
      </div>

      {/* Search & Filters Bar */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari berdasarkan nama lengkap, nomor anggota, no. HP, atau email..."
              className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-xs pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-navy-500 focus:outline-none transition"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full md:w-40 bg-slate-50 text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-navy-500"
            >
              <option value="">Semua Status</option>
              <option value="ACTIVE">Aktif</option>
              <option value="INACTIVE">Tidak Aktif</option>
              <option value="MOVED">Pindah</option>
              <option value="DECEASED">Meninggal Dunia</option>
            </select>

            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="w-full md:w-36 bg-slate-50 text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-navy-500"
            >
              <option value="">Semua Gender</option>
              <option value="L">Laki-laki</option>
              <option value="P">Perempuan</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Members Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Jemaat</th>
                <th className="px-4 py-3.5">No. Anggota</th>
                <th className="px-4 py-3.5">Gender / Usia</th>
                <th className="px-4 py-3.5">Kontak</th>
                <th className="px-4 py-3.5">Keluarga & Relasi</th>
                <th className="px-4 py-3.5">Komisi / Pelayanan</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    <div className="inline-block w-6 h-6 border-2 border-navy-900 border-t-gold-500 rounded-full animate-spin"></div>
                    <p className="mt-2 text-xs">Memuat data jemaat...</p>
                  </td>
                </tr>
              ) : paginatedMembers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    Tidak ada data jemaat yang sesuai kriteria pencarian.
                  </td>
                </tr>
              ) : (
                paginatedMembers.map((m) => {
                  const statusBadge = getMemberStatusBadge(m.status);
                  const relBadge = getFamilyRelationBadge(m.family_relation);

                  return (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={m.photo_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'}
                            alt={m.full_name}
                            className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                          />
                          <div>
                            <Link
                              href={`/jemaat/${m.id}`}
                              className="font-bold text-navy-950 hover:text-gold-600 transition"
                            >
                              {m.full_name}
                            </Link>
                            <p className="text-[11px] text-slate-400 truncate max-w-[180px]">
                              {m.occupation || 'Belum diisi'}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 font-mono text-[11px] font-bold text-navy-800">
                        {m.member_number}
                      </td>

                      <td className="px-4 py-3.5 text-slate-600">
                        <span>{m.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</span>
                        {m.dob && (
                          <p className="text-[10px] text-slate-400">
                            {new Date().getFullYear() - new Date(m.dob).getFullYear()} Tahun
                          </p>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-slate-600">
                        <p className="font-medium text-slate-800">{m.phone || '-'}</p>
                        <p className="text-[10px] text-slate-400 truncate max-w-[130px]">{m.email || '-'}</p>
                      </td>

                      <td className="px-4 py-3.5">
                        {m.family_name ? (
                          <div>
                            <p className="font-semibold text-slate-800 truncate max-w-[140px]">{m.family_name}</p>
                            <span className={`inline-block text-[10px] px-1.5 py-0.2 rounded border font-medium mt-0.5 ${relBadge.color}`}>
                              {relBadge.label}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Individu</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        {m.departments && m.departments.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {m.departments.map((d, idx) => (
                              <span
                                key={idx}
                                className="inline-block text-[10px] bg-navy-50 text-navy-800 border border-navy-200 px-1.5 py-0.5 rounded"
                              >
                                {d.department_name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">-</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusBadge.color}`}>
                          {statusBadge.label}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link href={`/jemaat/${m.id}`}>
                            <button className="p-1.5 rounded-lg text-slate-500 hover:text-navy-900 hover:bg-slate-100 transition" title="Lihat Profil">
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </Link>
                          <Link href={`/jemaat/kartu?id=${m.id}`}>
                            <button className="p-1.5 rounded-lg text-slate-500 hover:text-gold-600 hover:bg-slate-100 transition" title="Cetak Kartu Anggota">
                              <CreditCard className="w-3.5 h-3.5" />
                            </button>
                          </Link>
                          {can('jemaat', 'delete') && (
                            <button
                              onClick={() => handleDeleteMember(m.id, m.full_name)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
                              title="Arsipkan / Hapus"
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

        {/* Pagination Footer */}
        <div className="px-5 py-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <p>
            Menampilkan {paginatedMembers.length} dari {members.length} anggota jemaat
          </p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-semibold text-navy-950">
              Halaman {currentPage} dari {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Card>

      {/* Modal Tambah Jemaat Baru */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Pendaftaran Jemaat Baru"
        subtitle="Nomor anggota otomatis dibuat dengan format JMT-2026-XXXX"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateMember} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nama Lengkap Jemaat *"
              placeholder="Contoh: Samuel Hartono, M.Th"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              required
            />

            <Select
              label="Jenis Kelamin *"
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
            >
              <option value="L">Laki-laki</option>
              <option value="P">Perempuan</option>
            </Select>

            <Input
              label="Tempat Lahir"
              placeholder="Contoh: Jakarta"
              value={formData.pob}
              onChange={(e) => setFormData({ ...formData, pob: e.target.value })}
            />

            <Input
              label="Tanggal Lahir"
              type="date"
              value={formData.dob}
              onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
            />

            <Input
              label="Nomor Telepon / WhatsApp"
              placeholder="0812-xxxx-xxxx"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />

            <Input
              label="Email"
              type="email"
              placeholder="nama@email.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />

            <Select
              label="Keluarga (Opsional)"
              value={formData.family_id}
              onChange={(e) => setFormData({ ...formData, family_id: e.target.value })}
            >
              <option value="">-- Pilih Kepala Keluarga / Belum Terdata --</option>
              {families.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.family_number} - {f.family_name}
                </option>
              ))}
            </Select>

            <Select
              label="Hubungan dalam Keluarga"
              value={formData.family_relation}
              onChange={(e) => setFormData({ ...formData, family_relation: e.target.value as FamilyRelation })}
            >
              <option value="KEPALA_KELUARGA">Kepala Keluarga</option>
              <option value="ISTRI">Istri</option>
              <option value="ANAK">Anak</option>
              <option value="ORANG_TUA">Orang Tua</option>
              <option value="FAMILI_LAIN">Famili Lain</option>
            </Select>

            <Input
              label="Pendidikan Terakhir"
              placeholder="Contoh: S1 Teknik Informatika"
              value={formData.education}
              onChange={(e) => setFormData({ ...formData, education: e.target.value })}
            />

            <Input
              label="Pekerjaan / Profesi"
              placeholder="Contoh: Software Engineer"
              value={formData.occupation}
              onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">Alamat Lengkap</label>
            <textarea
              rows={2}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Nama jalan, nomor rumah, RT/RW, kelurahan, kecamatan..."
              className="w-full rounded-xl border border-slate-300 p-3 text-xs focus:outline-none focus:border-navy-600"
            ></textarea>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">Catatan Administrasi / Pastoral</label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Catatan baptis, sidi, talenta pelayanan, atau kebutuhan pastoral..."
              className="w-full rounded-xl border border-slate-300 p-3 text-xs focus:outline-none focus:border-navy-600"
            ></textarea>
            <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={formData.is_confidential_notes}
                onChange={(e) => setFormData({ ...formData, is_confidential_notes: e.target.checked })}
                className="rounded text-navy-900 focus:ring-navy-500"
              />
              <span>Tandai sebagai catatan pastoral rahasia (Hanya dapat dilihat Pendeta & Super Admin)</span>
            </label>
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
            <Button variant="secondary" size="md" type="button" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button variant="gold" size="md" type="submit" isLoading={isSubmitting}>
              Simpan Data Jemaat
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
