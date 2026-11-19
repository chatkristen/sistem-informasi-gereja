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
  Mic,
  Music,
  HeartHandshake,
  Monitor,
  Sparkles,
  AlertCircle,
  Coins,
  ShieldCheck,
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

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    category: 'IBADAH_RAYA',
    start_time: '2026-11-22T08:00',
    end_time: '2026-11-22T10:00',
    location: 'Sanctuary Gedung Utama Lantai 2',
    department_id: '',
    pic_member_id: '',
    pic_member_name: '',
    mc_name: '',
    // Ibadah Raya Dedicated Officers
    singer1: '',
    singer2: '',
    singer3: '',
    offering1: '',
    offering2: '',
    usher1: '',
    usher2: '',
    multimedia: 'Tim Multimedia & Sound GKKA',
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

  // Handle member selection for PIC
  const handlePicChange = (memberId: string) => {
    const selected = members.find((m) => m.id === memberId);
    setFormData((prev) => ({
      ...prev,
      pic_member_id: memberId,
      pic_member_name: selected ? selected.full_name : prev.pic_member_name,
    }));
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      showToast('warning', 'Validasi Gagal', 'Nama atau judul kegiatan wajib diisi');
      return;
    }

    // Strict Validation for Ibadah Raya
    const isIbadahRaya = formData.category === 'IBADAH_RAYA';

    if (isIbadahRaya) {
      // 1. PIC
      const picName = formData.pic_member_name.trim() || members.find((m) => m.id === formData.pic_member_id)?.full_name;
      if (!picName) {
        showToast('warning', 'PIC Wajib Diisi', 'Untuk Ibadah Raya, PIC (Pengkhotbah / Pelayan Firman) wajib ditentukan.');
        return;
      }

      // 2. MC
      if (!formData.mc_name.trim()) {
        showToast('warning', 'MC Wajib Diisi', 'Untuk Ibadah Raya, MC (Worship Leader / Pemimpin Pujian) wajib ditentukan.');
        return;
      }

      // 3. SINGER (min 2 orang)
      const singers = [formData.singer1.trim(), formData.singer2.trim(), formData.singer3.trim()].filter(Boolean);
      if (singers.length < 2) {
        showToast('warning', 'Singer Kurang', 'Untuk Ibadah Raya, SINGER wajib diisi minimal 2 orang!');
        return;
      }

      // 4. PETUGAS PERSEMBAHAN (min 2 orang)
      const offeringOfficers = [formData.offering1.trim(), formData.offering2.trim()].filter(Boolean);
      if (offeringOfficers.length < 2) {
        showToast('warning', 'Petugas Persembahan Kurang', 'Untuk Ibadah Raya, PETUGAS PERSEMBAHAN wajib diisi minimal 2 orang!');
        return;
      }

      // 5. ASER (PENERIMA TAMU) (min 2 orang)
      const ushers = [formData.usher1.trim(), formData.usher2.trim()].filter(Boolean);
      if (ushers.length < 2) {
        showToast('warning', 'Aser Kurang', 'Untuk Ibadah Raya, ASER (PENERIMA TAMU) wajib diisi minimal 2 orang!');
        return;
      }

      // 6. MULTIMEDIA
      if (!formData.multimedia.trim()) {
        showToast('warning', 'Multimedia Wajib', 'Untuk Ibadah Raya, petugas MULTIMEDIA wajib diisi.');
        return;
      }
    }

    const singersPayload = isIbadahRaya
      ? [formData.singer1.trim(), formData.singer2.trim(), formData.singer3.trim()].filter(Boolean)
      : undefined;

    const offeringPayload = isIbadahRaya
      ? [formData.offering1.trim(), formData.offering2.trim()].filter(Boolean)
      : undefined;

    const ushersPayload = isIbadahRaya
      ? [formData.usher1.trim(), formData.usher2.trim()].filter(Boolean)
      : undefined;

    const multimediaPayload = isIbadahRaya && formData.multimedia.trim()
      ? [formData.multimedia.trim()]
      : undefined;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/kegiatan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          category: formData.category,
          start_time: formData.start_time,
          end_time: formData.end_time || undefined,
          location: formData.location,
          department_id: formData.department_id || undefined,
          pic_member_id: formData.pic_member_id || undefined,
          pic_member_name: formData.pic_member_name || undefined,
          mc_name: formData.mc_name.trim() || undefined,
          singers: singersPayload,
          offering_officers: offeringPayload,
          ushers: ushersPayload,
          multimedia_officers: multimediaPayload,
          budget: Number(formData.budget) || 0,
          description: formData.description,
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
          pic_member_name: '',
          mc_name: '',
          singer1: '',
          singer2: '',
          singer3: '',
          offering1: '',
          offering2: '',
          usher1: '',
          usher2: '',
          multimedia: 'Tim Multimedia & Sound GKKA',
          budget: '',
          description: '',
        });
        loadData();
      } else {
        showToast('error', 'Gagal', json.message);
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
      { header: 'PIC / Pengkhotbah', key: 'pic_member_name' },
      { header: 'MC / Worship Leader', key: 'mc_name' },
      {
        header: 'Singer',
        key: 'singers',
        format: (v: any) => (Array.isArray(v) ? v.join(', ') : v || '-'),
      },
      {
        header: 'Petugas Persembahan',
        key: 'offering_officers',
        format: (v: any) => (Array.isArray(v) ? v.join(', ') : v || '-'),
      },
      {
        header: 'Aser / Usher',
        key: 'ushers',
        format: (v: any) => (Array.isArray(v) ? v.join(', ') : v || '-'),
      },
      {
        header: 'Multimedia',
        key: 'multimedia_officers',
        format: (v: any) => (Array.isArray(v) ? v.join(', ') : v || '-'),
      },
      { header: 'Status', key: 'status' },
    ];
    exportToExcel('Jadwal_Kegiatan_GKKA', 'Kegiatan', events, columns);
    showToast('info', 'Excel Berhasil', 'Jadwal kegiatan telah diekspor lengkap dengan data MC dan pelayan.');
  };

  const handleExportPDF = () => {
    const columns = [
      { header: 'Kegiatan', key: 'title' },
      { header: 'Kategori', key: 'category' },
      { header: 'Waktu', key: 'start_time', format: (v: string) => formatDateTimeIndo(v) },
      { header: 'PIC', key: 'pic_member_name' },
      { header: 'MC', key: 'mc_name' },
      {
        header: 'Singer',
        key: 'singers',
        format: (v: any) => (Array.isArray(v) ? v.join(', ') : v || '-'),
      },
      {
        header: 'Aser / Penerima',
        key: 'ushers',
        format: (v: any) => (Array.isArray(v) ? v.join(', ') : v || '-'),
      },
    ];
    exportToPDF('KALENDER & JADWAL PELAYANAN KEGIATAN GEREJA', 'GKKA Jakarta', events, columns, 'Laporan_Kegiatan_GKKA');
    showToast('info', 'PDF Berhasil', 'Dokumen kegiatan dan pelayan telah diunduh.');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-navy-950 tracking-tight flex items-center gap-2.5">
            <CalendarDays className="w-6 h-6 text-navy-900" />
            Kalender & Jadwal Kegiatan Gereja
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Penjadwalan ibadah raya, petugas pelayan (PIC, MC, Singer, Kolektan, Aser, Multimedia), dan kegiatan komisi.
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
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                categoryFilter === cat
                  ? 'bg-navy-900 text-white shadow-sm'
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
            const isIbadah = evt.category === 'IBADAH_RAYA';
            const hasOfficers =
              evt.mc_name ||
              (evt.singers && evt.singers.length > 0) ||
              (evt.offering_officers && evt.offering_officers.length > 0) ||
              (evt.ushers && evt.ushers.length > 0) ||
              (evt.multimedia_officers && evt.multimedia_officers.length > 0);

            return (
              <Card key={evt.id} className="hover:border-navy-300 transition-all shadow-sm">
                <CardContent className="p-5 flex items-start gap-4">
                  {/* Calendar Date Badge */}
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-navy-900 to-navy-800 text-white flex flex-col items-center justify-center font-bold shrink-0 border border-gold-400/30 shadow-md">
                    <span className="text-[10px] uppercase text-gold-300 tracking-wider">
                      {dateObj.toLocaleDateString('id-ID', { month: 'short' })}
                    </span>
                    <span className="text-xl font-black leading-none mt-0.5">{dateObj.getDate()}</span>
                  </div>

                  {/* Event Information */}
                  <div className="flex-1 min-w-0 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-bold text-navy-950 truncate">{evt.title}</h3>
                      <Badge variant={isIbadah ? 'gold' : 'navy'} className="text-[10px] shrink-0">
                        {evt.category.replace('_', ' ')}
                      </Badge>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2">{evt.description}</p>

                    {/* Standard Logistics */}
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
                        <Users className="w-3.5 h-3.5 text-navy-700 shrink-0" />
                        <strong>PIC:</strong> {evt.pic_member_name || '-'}
                      </span>
                      <span className="flex items-center gap-1.5 truncate">
                        <Mic className="w-3.5 h-3.5 text-gold-600 shrink-0" />
                        <strong>MC:</strong> {evt.mc_name || '-'}
                      </span>
                    </div>

                    {/* Dedicated Service Officers Box for Ibadah Raya or Events with Officers */}
                    {hasOfficers && (
                      <div className="mt-3 p-3 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/80 border border-slate-200/90 text-xs space-y-2 shadow-xs">
                        <div className="flex items-center justify-between border-b border-slate-200/80 pb-1.5">
                          <p className="font-extrabold text-[11px] text-navy-950 uppercase tracking-wider flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-gold-500" />
                            Petugas Pelayan {isIbadah ? 'Ibadah Raya' : 'Kegiatan'}:
                          </p>
                          {isIbadah && (
                            <span className="text-[9px] font-bold text-navy-800 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                              Liturgi Resmi
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                          {/* PIC */}
                          <div>
                            <span className="font-semibold text-slate-500 flex items-center gap-1">
                              <Users className="w-3 h-3 text-slate-400" /> PIC / Pengkhotbah:
                            </span>
                            <p className="font-bold text-navy-950 mt-0.5">{evt.pic_member_name || '-'}</p>
                          </div>

                          {/* MC */}
                          <div>
                            <span className="font-semibold text-slate-500 flex items-center gap-1">
                              <Mic className="w-3 h-3 text-gold-600" /> MC / Worship Leader:
                            </span>
                            <p className="font-bold text-navy-950 mt-0.5">{evt.mc_name || '-'}</p>
                          </div>

                          {/* Singers (min 2) */}
                          <div>
                            <span className="font-semibold text-slate-500 flex items-center gap-1">
                              <Music className="w-3 h-3 text-purple-600" /> Singer (Penyanyi):
                            </span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {evt.singers && evt.singers.length > 0 ? (
                                evt.singers.map((s, idx) => (
                                  <span
                                    key={idx}
                                    className="bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-md text-[10px] font-bold"
                                  >
                                    {s}
                                  </span>
                                ))
                              ) : (
                                <span className="text-slate-400 italic text-[10px]">Belum diisi</span>
                              )}
                            </div>
                          </div>

                          {/* Petugas Persembahan (min 2) */}
                          <div>
                            <span className="font-semibold text-slate-500 flex items-center gap-1">
                              <Coins className="w-3 h-3 text-emerald-600" /> Petugas Persembahan:
                            </span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {evt.offering_officers && evt.offering_officers.length > 0 ? (
                                evt.offering_officers.map((o, idx) => (
                                  <span
                                    key={idx}
                                    className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md text-[10px] font-bold"
                                  >
                                    {o}
                                  </span>
                                ))
                              ) : (
                                <span className="text-slate-400 italic text-[10px]">Belum diisi</span>
                              )}
                            </div>
                          </div>

                          {/* Aser (Penerima Tamu) (min 2) */}
                          <div>
                            <span className="font-semibold text-slate-500 flex items-center gap-1">
                              <HeartHandshake className="w-3 h-3 text-blue-600" /> Aser (Penerima Tamu):
                            </span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {evt.ushers && evt.ushers.length > 0 ? (
                                evt.ushers.map((u, idx) => (
                                  <span
                                    key={idx}
                                    className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md text-[10px] font-bold"
                                  >
                                    {u}
                                  </span>
                                ))
                              ) : (
                                <span className="text-slate-400 italic text-[10px]">Belum diisi</span>
                              )}
                            </div>
                          </div>

                          {/* Multimedia */}
                          <div>
                            <span className="font-semibold text-slate-500 flex items-center gap-1">
                              <Monitor className="w-3 h-3 text-amber-600" /> Multimedia & Sound:
                            </span>
                            <p className="font-bold text-navy-950 mt-0.5">
                              {Array.isArray(evt.multimedia_officers)
                                ? evt.multimedia_officers.join(', ')
                                : evt.multimedia_officers || '-'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
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
        title="Jadwalkan Kegiatan & Pelayanan Gereja"
        subtitle="Tetapkan jadwal ibadah, lokasi, anggaran, dan daftar lengkap petugas pelayan ibadah"
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
              <option value="IBADAH_RAYA">✝ Ibadah Raya</option>
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

          <Input
            label="Lokasi Ruangan / Gedung *"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            required
          />

          {/* DEDICATED OFFICERS SECTION FOR IBADAH RAYA */}
          {formData.category === 'IBADAH_RAYA' ? (
            <div className="p-4 rounded-2xl bg-amber-50/70 border-2 border-gold-400/50 space-y-3.5">
              <div className="flex items-center justify-between border-b border-amber-200/80 pb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-gold-600" />
                  <h4 className="text-xs font-black text-navy-950 uppercase tracking-wider">
                    Petugas Pelayan Ibadah Raya
                  </h4>
                </div>
                <span className="text-[10px] font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full">
                  Wajib Dilengkapi
                </span>
              </div>

              <p className="text-[11px] text-amber-900 leading-tight">
                Sesuai tata ibadah resmi GKKA, mohon tentukan PIC, MC, minimal 2 Singer, minimal 2 Petugas Persembahan, minimal 2 Aser, dan Multimedia.
              </p>

              {/* PIC & MC */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-navy-950">
                    PIC (Pengkhotbah / Pelayan Firman) *
                  </label>
                  <div className="space-y-1.5">
                    <select
                      value={formData.pic_member_id}
                      onChange={(e) => handlePicChange(e.target.value)}
                      className="w-full bg-white text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-navy-600"
                    >
                      <option value="">-- Pilih dari Jemaat / Pendeta --</option>
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.member_number} - {m.full_name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Atau ketik nama pembicara tamu / pengkhotbah"
                      value={formData.pic_member_name}
                      onChange={(e) => setFormData({ ...formData, pic_member_name: e.target.value })}
                      className="w-full bg-white text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-navy-600"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-navy-950">
                    MC (Worship Leader / Pemimpin Pujian) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Debora Santoso / Jonathan Setiawan"
                    value={formData.mc_name}
                    onChange={(e) => setFormData({ ...formData, mc_name: e.target.value })}
                    className="w-full bg-white text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-navy-600"
                  />
                  <p className="text-[10px] text-slate-500">Memimpin jalannya tata ibadah dan pujian jemaat.</p>
                </div>
              </div>

              {/* SINGER (min 2 orang) */}
              <div className="space-y-1 pt-1">
                <label className="block text-xs font-bold text-purple-950">
                  SINGER (Penyanyi Pujian - Minimal 2 Orang) *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Singer 1 *"
                    value={formData.singer1}
                    onChange={(e) => setFormData({ ...formData, singer1: e.target.value })}
                    className="w-full bg-white text-xs px-3 py-2 rounded-xl border border-purple-200 focus:outline-none focus:border-purple-600"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Singer 2 *"
                    value={formData.singer2}
                    onChange={(e) => setFormData({ ...formData, singer2: e.target.value })}
                    className="w-full bg-white text-xs px-3 py-2 rounded-xl border border-purple-200 focus:outline-none focus:border-purple-600"
                  />
                  <input
                    type="text"
                    placeholder="Singer 3 (Opsional)"
                    value={formData.singer3}
                    onChange={(e) => setFormData({ ...formData, singer3: e.target.value })}
                    className="w-full bg-white text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-purple-600"
                  />
                </div>
              </div>

              {/* PETUGAS PERSEMBAHAN (min 2 orang) */}
              <div className="space-y-1 pt-1">
                <label className="block text-xs font-bold text-emerald-950">
                  PETUGAS PERSEMBAHAN (Minimal 2 Orang) *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Petugas Persembahan 1 *"
                    value={formData.offering1}
                    onChange={(e) => setFormData({ ...formData, offering1: e.target.value })}
                    className="w-full bg-white text-xs px-3 py-2 rounded-xl border border-emerald-200 focus:outline-none focus:border-emerald-600"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Petugas Persembahan 2 *"
                    value={formData.offering2}
                    onChange={(e) => setFormData({ ...formData, offering2: e.target.value })}
                    className="w-full bg-white text-xs px-3 py-2 rounded-xl border border-emerald-200 focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              {/* ASER (PENERIMA TAMU) (min 2 orang) */}
              <div className="space-y-1 pt-1">
                <label className="block text-xs font-bold text-blue-950">
                  ASER / USHER (Penerima Tamu - Minimal 2 Orang) *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Aser 1 (Pintu Utama) *"
                    value={formData.usher1}
                    onChange={(e) => setFormData({ ...formData, usher1: e.target.value })}
                    className="w-full bg-white text-xs px-3 py-2 rounded-xl border border-blue-200 focus:outline-none focus:border-blue-600"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Aser 2 (Lobby / Balkon) *"
                    value={formData.usher2}
                    onChange={(e) => setFormData({ ...formData, usher2: e.target.value })}
                    className="w-full bg-white text-xs px-3 py-2 rounded-xl border border-blue-200 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              {/* MULTIMEDIA */}
              <div className="space-y-1 pt-1">
                <label className="block text-xs font-bold text-slate-800">
                  MULTIMEDIA & SOUND SYSTEM *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Operator Slide Proyektor & Sound Engineer"
                  value={formData.multimedia}
                  onChange={(e) => setFormData({ ...formData, multimedia: e.target.value })}
                  className="w-full bg-white text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-navy-600"
                />
              </div>
            </div>
          ) : (
            /* NON-IBADAH GENERAL MC & PIC SECTION */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  Penanggung Jawab (PIC)
                </label>
                <select
                  value={formData.pic_member_id}
                  onChange={(e) => handlePicChange(e.target.value)}
                  className="w-full bg-white text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-navy-600"
                >
                  <option value="">-- Pilih PIC dari Jemaat --</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.member_number} - {m.full_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  MC / Pembawa Acara (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Daniel Kristianto"
                  value={formData.mc_name}
                  onChange={(e) => setFormData({ ...formData, mc_name: e.target.value })}
                  className="w-full bg-white text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-navy-600"
                />
              </div>
            </div>
          )}

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
