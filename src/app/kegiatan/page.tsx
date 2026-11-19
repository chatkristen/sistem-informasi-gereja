'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import { Card, CardHeader, CardTitle, CardContent, Badge, Input, Select } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ChurchEvent } from '@/lib/types';
import { formatDateIndo, formatDateTimeIndo, formatCurrency } from '@/lib/utils';
import { exportToExcel, exportToPDF } from '@/lib/export-utils';
import {
  CalendarDays,
  Plus,
  Clock,
  MapPin,
  Users,
  FileSpreadsheet,
  FileText,
  DollarSign,
  Tag,
  CheckCircle,
} from 'lucide-react';

export default function KegiatanPage() {
  const { roleCode, can, currentUser } = useAuth();
  const { showToast } = useNotification();

  const [events, setEvents] = useState<ChurchEvent[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: 'IBADAH_RAYA',
    start_time: '2026-11-22T08:00',
    end_time: '2026-11-22T10:00',
    location: 'Sanctuary Gedung Utama Lantai 2',
    department_id: '',
    pic_member_id: '',
    budget: '',
    description: '',
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [resEvt, resDept, resMem] = await Promise.all([
        fetch(`/api/kegiatan?category=${categoryFilter}`),
        fetch('/api/departemen'),
        fetch('/api/jemaat'),
      ]);
      const dataEvt = await resEvt.json();
      const dataDept = await resDept.json();
      const dataMem = await resMem.json();

      if (dataEvt.success) setEvents(dataEvt.data);
      if (dataDept.success) setDepartments(dataDept.data);
      if (dataMem.success) setMembers(dataMem.data);
    } catch (err) {
      console.error(err);
      showToast('error', 'Gagal memuat jadwal kegiatan');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [categoryFilter]);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      showToast('warning', 'Validasi Gagal', 'Nama kegiatan wajib diisi');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/kegiatan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          budget: Number(formData.budget) || 0,
          actor_name: currentUser?.full_name || 'Sekretariat',
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast('success', 'Kegiatan Dijadwalkan', `Kegiatan ${json.data.title} berhasil disimpan.`);
        setIsModalOpen(false);
        setFormData({
          title: '',
          category: 'IBADAH_RAYA',
          start_time: '2026-11-22T08:00',
          end_time: '2026-11-22T10:00',
          location: 'Sanctuary Gedung Utama Lantai 2',
          department_id: '',
          pic_member_id: '',
          budget: '',
          description: '',
        });
        loadData();
      }
    } catch (err: any) {
      showToast('error', 'Gagal', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportExcel = () => {
    const columns = [
      { header: 'Nama Kegiatan', key: 'title' },
      { header: 'Kategori', key: 'category' },
      { header: 'Waktu Mulai', key: 'start_time', format: (v: string) => formatDateTimeIndo(v) },
      { header: 'Lokasi', key: 'location' },
      { header: 'PIC', key: 'pic_member_name' },
      { header: 'Departemen', key: 'department_name' },
      { header: 'Status', key: 'status' },
    ];
    exportToExcel('Jadwal_Kegiatan_GKKA', 'Kegiatan', events, columns);
    showToast('info', 'Excel Berhasil', 'Jadwal kegiatan telah diekspor.');
  };

  const handleExportPDF = () => {
    const columns = [
      { header: 'Kegiatan', key: 'title' },
      { header: 'Kategori', key: 'category' },
      { header: 'Waktu', key: 'start_time', format: (v: string) => formatDateTimeIndo(v) },
      { header: 'Lokasi', key: 'location' },
      { header: 'PIC', key: 'pic_member_name' },
    ];
    exportToPDF('KALENDER & JADWAL KEGIATAN GEREJA', 'GKKA Jakarta', events, columns, 'Laporan_Kegiatan_GKKA');
    showToast('info', 'PDF Berhasil', 'Dokumen kegiatan telah diunduh.');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-navy-950 tracking-tight flex items-center gap-2.5">
            <CalendarDays className="w-6 h-6 text-navy-900" />
            Kalender & Jadwal Kegiatan Gereja
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Penjadwalan ibadah raya, sekolah minggu, gladi pemusik, rapat komisi, dan acara umum.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" onClick={handleExportExcel} leftIcon={<FileSpreadsheet className="w-4 h-4 text-emerald-600" />}>
            Excel
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPDF} leftIcon={<FileText className="w-4 h-4 text-rose-600" />}>
            PDF
          </Button>
          {can('kegiatan', 'create') && (
            <Button variant="gold" size="sm" onClick={() => setIsModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
              Tambah Jadwal Kegiatan
            </Button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <Card>
        <CardContent className="p-4 flex flex-wrap items-center gap-2">
          {['', 'IBADAH_RAYA', 'SEKOLAH_MINGGU', 'PERSEKUTUAN_DOA', 'LATIHAN_MUSIK', 'RAPAT', 'BAKSOS'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                categoryFilter === cat
                  ? 'bg-navy-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat === '' ? 'Semua Kategori' : cat.replace('_', ' ')}
            </button>
          ))}
        </CardContent>
      </Card>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {isLoading ? (
          <div className="col-span-2 p-12 text-center text-slate-400">
            <div className="inline-block w-6 h-6 border-2 border-navy-900 border-t-gold-500 rounded-full animate-spin"></div>
            <p className="mt-2 text-xs">Memuat kalender kegiatan...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="col-span-2 p-12 text-center text-slate-400">
            Tidak ada kegiatan yang terjadwal.
          </div>
        ) : (
          events.map((evt) => {
            const dateObj = new Date(evt.start_time);
            return (
              <Card key={evt.id} className="hover:border-navy-300">
                <CardContent className="p-5 flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-navy-900 to-navy-800 text-white flex flex-col items-center justify-center font-bold shrink-0 border border-gold-400/30 shadow-md">
                    <span className="text-[10px] uppercase text-gold-300 tracking-wider">
                      {dateObj.toLocaleDateString('id-ID', { month: 'short' })}
                    </span>
                    <span className="text-xl font-black leading-none mt-0.5">{dateObj.getDate()}</span>
                  </div>

                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-bold text-navy-950 truncate">{evt.title}</h3>
                      <Badge variant="navy" className="text-[10px] shrink-0">
                        {evt.category.replace('_', ' ')}
                      </Badge>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2">{evt.description}</p>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                      <span className="flex items-center gap-1.5 truncate">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                      </span>
                      <span className="flex items-center gap-1.5 truncate">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {evt.location}
                      </span>
                      <span className="flex items-center gap-1.5 truncate">
                        <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        PIC: {evt.pic_member_name || '-'}
                      </span>
                      <span className="flex items-center gap-1.5 truncate">
                        <DollarSign className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {evt.budget > 0 ? formatCurrency(evt.budget) : 'Non-Budget'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Modal Tambah Kegiatan */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Jadwalkan Kegiatan Baru"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateEvent} className="space-y-4">
          <Input
            label="Nama / Judul Kegiatan *"
            placeholder="Contoh: Ibadah Raya Minggu I (Pagi)"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Kategori Kegiatan *"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              <option value="IBADAH_RAYA">Ibadah Raya</option>
              <option value="SEKOLAH_MINGGU">Sekolah Minggu</option>
              <option value="PERSEKUTUAN_DOA">Persekutuan Doa</option>
              <option value="LATIHAN_MUSIK">Latihan Musik</option>
              <option value="RAPAT">Rapat Komisi / Majelis</option>
              <option value="BAKSOS">Bakti Sosial / Diakonia</option>
            </Select>

            <Select
              label="Departemen Penyelenggara"
              value={formData.department_id}
              onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
            >
              <option value="">-- Kegiatan Umum Gereja --</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Waktu Mulai *"
              type="datetime-local"
              value={formData.start_time}
              onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
              required
            />

            <Input
              label="Waktu Selesai"
              type="datetime-local"
              value={formData.end_time}
              onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Lokasi Ruangan / Gedung *"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              required
            />

            <Select
              label="Penanggung Jawab (PIC)"
              value={formData.pic_member_id}
              onChange={(e) => setFormData({ ...formData, pic_member_id: e.target.value })}
            >
              <option value="">-- Pilih Jemaat PIC --</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.member_number} - {m.full_name}
                </option>
              ))}
            </Select>
          </div>

          <Input
            label="Estimasi Biaya / Anggaran (Rp)"
            type="number"
            placeholder="Contoh: 1500000"
            value={formData.budget}
            onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
          />

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">Keterangan / Liturgi Kegiatan</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Tema kotbah, susunan acara, pembicara tamu..."
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:outline-none focus:border-navy-600"
            ></textarea>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button variant="secondary" size="md" type="button" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button variant="gold" size="md" type="submit" isLoading={isSubmitting}>
              Jadwalkan Kegiatan
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
