'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import { Card, CardHeader, CardTitle, CardContent, Badge, Input, Select } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
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
  Volume2,
  HeartHandshake,
  Monitor,
  Sparkles,
  AlertCircle,
  Coins,
  ShieldCheck,
  Trash2,
  Edit,
  Share2,
  Copy,
  ChevronDown,
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
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
    singers: ['', ''],
    musicians: ['', ''],
    offering_officers: ['', ''],
    ushers: ['', ''],
    multimedia_officers: [''],
    sound_officers: [''],
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
        showToast('warning', 'PIC Wajib Diisi', 'Sesuai tata ibadah resmi GKKA, mohon tentukan PIC (Pengkhotbah / Pelayan Firman).');
        return;
      }

      // 2. MC
      if (!formData.mc_name.trim()) {
        showToast('warning', 'MC Wajib Diisi', 'Sesuai tata ibadah resmi GKKA, mohon tentukan MC (Worship Leader / Pemimpin Pujian).');
        return;
      }
    }

    // Prepare payload arrays (filter empty strings)
    const singersPayload = formData.singers.filter(s => s.trim());
    const musiciansPayload = formData.musicians.filter(m => m.trim());
    const offeringPayload = formData.offering_officers.filter(o => o.trim());
    const ushersPayload = formData.ushers.filter(u => u.trim());
    const multimediaPayload = formData.multimedia_officers.filter(m => m.trim());
    const soundPayload = formData.sound_officers.filter(s => s.trim());

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
          musicians: musiciansPayload,
          offering_officers: offeringPayload,
          ushers: ushersPayload,
          multimedia_officers: multimediaPayload,
          sound_officers: soundPayload,
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
          singers: ['', ''],
          musicians: ['', ''],
          offering_officers: ['', ''],
          ushers: ['', ''],
          multimedia_officers: [''],
          sound_officers: [''],
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

  const handleDeleteEvent = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/kegiatan?id=${deleteTarget.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        showToast('success', 'Kegiatan Dihapus', `Jadwal "${deleteTarget.title}" berhasil dihapus.`);
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

  const handleDuplicateEvent = (evt: ChurchEvent) => {
    // Generate new default date: next Sunday or +7 days
    const origDate = new Date(evt.start_time);
    const nextWeekDate = new Date(origDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    const dateStr = nextWeekDate.toISOString().slice(0, 16);

    let endStr = '';
    if (evt.end_time) {
      const origEnd = new Date(evt.end_time);
      const nextEnd = new Date(origEnd.getTime() + 7 * 24 * 60 * 60 * 1000);
      endStr = nextEnd.toISOString().slice(0, 16);
    }

    setFormData({
      title: evt.title,
      category: evt.category,
      start_time: dateStr,
      end_time: endStr,
      location: evt.location || '',
      department_id: evt.department_id || '',
      pic_member_id: evt.pic_member_id || '',
      pic_member_name: evt.pic_member_name || '',
      mc_name: evt.mc_name || '',
      singers: evt.singers && evt.singers.length > 0 ? [...evt.singers] : ['', ''],
      musicians: evt.musicians && evt.musicians.length > 0 ? [...evt.musicians] : ['', ''],
      offering_officers: evt.offering_officers && evt.offering_officers.length > 0 ? [...evt.offering_officers] : ['', ''],
      ushers: evt.ushers && evt.ushers.length > 0 ? [...evt.ushers] : ['', ''],
      multimedia_officers: evt.multimedia_officers && evt.multimedia_officers.length > 0 ? [...evt.multimedia_officers] : [''],
      sound_officers: evt.sound_officers && evt.sound_officers.length > 0 ? [...evt.sound_officers] : [''],
      budget: evt.budget ? String(evt.budget) : '',
      description: evt.description || '',
    });

    setIsModalOpen(true);
    showToast('info', 'Jadwal Diduplikasi', 'Data pelayan dan susunan acara telah disalin. Silakan sesuaikan tanggal/waktu.');
  };

  const handleShareWhatsApp = (evt: ChurchEvent, format: 'detail' | 'ringkas' = 'detail') => {
    const isIbadah = evt.category === 'IBADAH_RAYA';
    const dateFormatted = formatDateTimeIndo(evt.start_time);

    const getList = (val: any) => {
      if (Array.isArray(val)) return val.filter((item) => typeof item === 'string' && item.trim() !== '');
      if (typeof val === 'string' && val.trim()) return [val.trim()];
      return [];
    };

    const picName = evt.pic_member_name || (evt as any).pic_name;
    const mcName = evt.mc_name;
    const validSingers = getList(evt.singers);
    const validMusicians = getList(evt.musicians);
    const validOfferings = getList(evt.offering_officers);
    const validUshers = getList(evt.ushers);
    const multimediaList = getList(evt.multimedia_officers);
    const soundList = getList(evt.sound_officers);

    let text = '';

    if (format === 'ringkas') {
      text = `*WARTA IBADAH & KEGIATAN GEREJA*\n` +
        `*${evt.title.toUpperCase()}*\n\n` +
        `🗓 Waktu: ${dateFormatted} WIB\n` +
        (evt.location ? `📍 Lokasi: ${evt.location}\n` : '') +
        (picName ? `👤 ${isIbadah ? 'Pengkhotbah' : 'PIC'}: ${picName}\n` : '') +
        (mcName ? `🎤 ${isIbadah ? 'Worship Leader' : 'MC'}: ${mcName}\n` : '') +
        (evt.description ? `📖 Tema: ${evt.description}\n` : '') +
        `\n_Mari hadir bersekutu bersama. Tuhan Yesus memberkati!_\n*GKKA Jakarta*`;
    } else {
      text = `*JADWAL PELAYAN ${isIbadah ? 'IBADAH RAYA' : 'KEGIATAN GEREJA'}*\n` +
        `*${evt.title.toUpperCase()}*\n` +
        `_Waktu: ${dateFormatted} WIB_\n` +
        (evt.location ? `_Lokasi: ${evt.location}_\n` : '') +
        (evt.description ? `_Tema: ${evt.description}_\n` : '') +
        `\n*Daftar Pelayan:*\n`;

      if (picName) text += `• ${isIbadah ? 'Pengkhotbah / PIC' : 'Penanggung Jawab'}: ${picName}\n`;
      if (mcName) text += `• ${isIbadah ? 'MC / Worship Leader' : 'Pembawa Acara'}: ${mcName}\n`;
      if (validMusicians.length > 0) text += `• Pemain Musik: ${Array.from(new Set(validMusicians)).join(', ')}\n`;
      if (validSingers.length > 0) text += `• Singer: ${Array.from(new Set(validSingers)).join(', ')}\n`;
      if (validOfferings.length > 0) text += `• Petugas Persembahan: ${Array.from(new Set(validOfferings)).join(', ')}\n`;
      if (validUshers.length > 0) text += `• Aser / Penerima Tamu: ${Array.from(new Set(validUshers)).join(', ')}\n`;
      if (multimediaList.length > 0) text += `• Multimedia: ${Array.from(new Set(multimediaList)).join(', ')}\n`;
      if (soundList.length > 0) text += `• Sound System: ${Array.from(new Set(soundList)).join(', ')}\n`;

      text += `\n_Mari bersama melayani dengan sukacita bagi kemuliaan Tuhan._\n*GKKA Jakarta*`;
    }

    const encoded = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  const handleShareAllWhatsApp = () => {
    if (!events || events.length === 0) {
      showToast('warning', 'Tidak Ada Jadwal', 'Belum ada kegiatan untuk dibagikan.');
      return;
    }

    const currentCatLabel = categoryFilter ? categoryFilter.replace('_', ' ') : 'SEMUA KEGIATAN';
    let text = `*KALENDER & JADWAL KEGIATAN GEREJA*\n*GKKA Jakarta*\n` +
      `_Kategori: ${currentCatLabel}_\n` +
      `_Tanggal Pembaruan: ${formatDateIndo(new Date().toISOString())}_\n` +
      `──────────────────────────\n\n`;

    events.forEach((evt, idx) => {
      const isIbadah = evt.category === 'IBADAH_RAYA';
      const dateFormatted = formatDateTimeIndo(evt.start_time);
      const picName = evt.pic_member_name || (evt as any).pic_name;
      const mcName = evt.mc_name;

      text += `*${idx + 1}. ${evt.title}*\n`;
      text += `📅 _${dateFormatted} WIB_\n`;
      if (evt.location) text += `📍 _${evt.location}_\n`;
      if (picName) text += `👤 ${isIbadah ? 'Pengkhotbah' : 'PIC'}: ${picName}\n`;
      if (mcName) text += `🎤 ${isIbadah ? 'WL / MC' : 'MC'}: ${mcName}\n`;
      if (evt.description) text += `ℹ️ ${evt.description}\n`;
      text += `\n`;
    });

    text += `──────────────────────────\n` +
      `_Mari hadir dan bersekutu bersama dalam hadirat Tuhan._\n` +
      `*GKKA Jakarta*`;

    const encoded = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
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
        header: 'Pemain Musik',
        key: 'musicians',
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
      {
        header: 'Sound System',
        key: 'sound_officers',
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
          <Button
            variant="outline"
            size="sm"
            onClick={handleShareAllWhatsApp}
            leftIcon={<Share2 className="w-4 h-4 text-emerald-600" />}
            className="text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 border-emerald-200"
          >
            Share WA
          </Button>
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
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${categoryFilter === cat
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {isLoading ? (
          <div className="col-span-full p-12 text-center text-slate-400">
            <div className="inline-block w-6 h-6 border-2 border-navy-900 border-t-gold-500 rounded-full animate-spin"></div>
            <p className="mt-2 text-xs">Memuat kalender kegiatan...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="col-span-full p-12 text-center text-slate-400">
            Tidak ada kegiatan yang terjadwal.
          </div>
        ) : (
          events.map((evt) => {
            const dateObj = new Date(evt.start_time);
            const isIbadah = evt.category === 'IBADAH_RAYA';

            const validSingers = Array.isArray(evt.singers)
              ? evt.singers.filter((s) => s && s.trim())
              : [];
            const validMusicians = Array.isArray(evt.musicians)
              ? evt.musicians.filter((m) => m && m.trim())
              : [];
            const validOfferings = Array.isArray(evt.offering_officers)
              ? evt.offering_officers.filter((o) => o && o.trim())
              : [];
            const validUshers = Array.isArray(evt.ushers)
              ? evt.ushers.filter((u) => u && u.trim())
              : [];
            const multimediaList = Array.isArray(evt.multimedia_officers)
              ? evt.multimedia_officers.filter((m) => typeof m === 'string' && m.trim())
              : typeof evt.multimedia_officers === 'string' && (evt.multimedia_officers as string).trim()
              ? [(evt.multimedia_officers as string).trim()]
              : [];
            const soundList = Array.isArray(evt.sound_officers)
              ? evt.sound_officers.filter((s) => typeof s === 'string' && s.trim())
              : typeof evt.sound_officers === 'string' && (evt.sound_officers as string).trim()
              ? [(evt.sound_officers as string).trim()]
              : [];

            const picName = evt.pic_member_name?.trim();
            const mcName = evt.mc_name?.trim();

            const hasOfficers = Boolean(
              picName ||
              mcName ||
              multimediaList.length > 0 ||
              soundList.length > 0 ||
              validSingers.length > 0 ||
              validMusicians.length > 0 ||
              validOfferings.length > 0 ||
              validUshers.length > 0
            );

            return (
              <Card key={evt.id} className="hover:border-navy-300 transition-all shadow-sm">
                <CardContent className="p-4 sm:p-5 space-y-3.5">
                  {/* Top Bar: Tanggal, Judul, Kategori, Waktu & Tempat */}
                  <div className="flex items-start gap-3.5">
                    {/* Calendar Date Badge */}
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 text-white flex flex-col items-center justify-center font-bold shrink-0 border border-gold-400/30 shadow-sm">
                      <span className="text-[10px] uppercase font-bold text-gold-300 tracking-wider leading-none">
                        {dateObj.toLocaleDateString('id-ID', { month: 'short' })}
                      </span>
                      <span className="text-xl font-black leading-none mt-1">{dateObj.getDate()}</span>
                    </div>

                    {/* Header Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-start justify-between gap-1.5">
                        <h3 className="text-sm font-bold text-navy-950 leading-snug">{evt.title}</h3>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {can('kegiatan', 'create') && (
                            <button
                              onClick={() => handleDuplicateEvent(evt)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 font-bold transition text-xs shadow-2xs cursor-pointer"
                              title="Duplikasi Jadwal untuk minggu depan / kegiatan serupa"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              Duplikat
                            </button>
                          )}
                          <button
                            onClick={() => handleShareWhatsApp(evt, 'detail')}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/90 font-bold transition text-xs shadow-2xs cursor-pointer"
                            title="Bagikan rincian jadwal pelayan ke WhatsApp"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                            Share WA
                          </button>
                          <Badge variant={isIbadah ? 'gold' : 'navy'} className="text-[10px] font-bold">
                            {evt.category.replace('_', ' ')}
                          </Badge>
                          {can('kegiatan', 'delete') && (
                            <button
                              onClick={() => setDeleteTarget({ id: evt.id, title: evt.title })}
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                              title="Hapus jadwal kegiatan"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Integrated Waktu, Lokasi & Liturgi Pills */}
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] mt-1.5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-medium">
                          <Clock className="w-3.5 h-3.5 text-navy-700 shrink-0" />
                          {dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                        </span>
                        {evt.location && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-medium">
                            <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            {evt.location}
                          </span>
                        )}
                        {isIbadah && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 text-amber-800 font-bold border border-amber-200/80 text-[10px]">
                            <Sparkles className="w-3 h-3 text-gold-600" /> Liturgi Resmi
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Deskripsi / Tema Firman (Hanya Ditampilkan Jika Diisi) */}
                  {evt.description && evt.description.trim() && (
                    <div className="p-2.5 rounded-xl bg-slate-50/90 border border-slate-200/60 text-xs text-slate-700 leading-relaxed flex items-start gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-gold-500 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{evt.description}</span>
                    </div>
                  )}

                  {/* Petugas Pelayan Kegiatan (Hanya Ditampilkan Bagian yang Terisi) */}
                  {hasOfficers && (
                    <div className="pt-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          {isIbadah ? 'Petugas Pelayan Ibadah Raya' : 'Petugas Pelayan Kegiatan'}
                        </span>
                        <div className="h-px flex-1 bg-slate-100"></div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-[11px]">
                        {/* PIC / Pengkhotbah */}
                        {picName && (
                          <div className="p-2.5 rounded-xl bg-slate-50/80 hover:bg-slate-50 border border-slate-200/70 transition-all flex flex-col justify-between">
                            <span className="font-semibold text-slate-500 text-[10px] flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5 text-navy-700" />
                              {isIbadah ? 'PIC / Pengkhotbah' : 'PIC / Penanggung Jawab'}
                            </span>
                            <p className="font-bold text-navy-950 text-xs mt-1.5 leading-snug">{picName}</p>
                          </div>
                        )}

                        {/* MC / Worship Leader */}
                        {mcName && (
                          <div className="p-2.5 rounded-xl bg-slate-50/80 hover:bg-slate-50 border border-slate-200/70 transition-all flex flex-col justify-between">
                            <span className="font-semibold text-slate-500 text-[10px] flex items-center gap-1.5">
                              <Mic className="w-3.5 h-3.5 text-gold-600" />
                              {isIbadah ? 'MC / Worship Leader' : 'MC / Pembawa Acara'}
                            </span>
                            <p className="font-bold text-navy-950 text-xs mt-1.5 leading-snug">{mcName}</p>
                          </div>
                        )}

                        {/* Pemain Musik */}
                        {validMusicians.length > 0 && (
                          <div className="p-2.5 rounded-xl bg-slate-50/80 hover:bg-slate-50 border border-slate-200/70 transition-all flex flex-col justify-between">
                            <span className="font-semibold text-slate-500 text-[10px] flex items-center gap-1.5">
                              <Music className="w-3.5 h-3.5 text-indigo-600" />
                              Pemain Musik
                            </span>
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                              {Array.from(new Set(validMusicians)).map((m, idx) => (
                                <span
                                  key={idx}
                                  className="bg-indigo-50 text-indigo-700 border border-indigo-200/90 px-2.5 py-0.5 rounded-lg text-[10px] font-bold"
                                >
                                  {m}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Singer (Penyanyi) */}
                        {validSingers.length > 0 && (
                          <div className="p-2.5 rounded-xl bg-slate-50/80 hover:bg-slate-50 border border-slate-200/70 transition-all flex flex-col justify-between">
                            <span className="font-semibold text-slate-500 text-[10px] flex items-center gap-1.5">
                              <Music className="w-3.5 h-3.5 text-purple-600" />
                              Singer (Penyanyi)
                            </span>
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                              {Array.from(new Set(validSingers)).map((s, idx) => (
                                <span
                                  key={idx}
                                  className="bg-purple-50 text-purple-700 border border-purple-200/90 px-2.5 py-0.5 rounded-lg text-[10px] font-bold"
                                >
                                  {s}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Multimedia */}
                        {multimediaList.length > 0 && (
                          <div className="p-2.5 rounded-xl bg-slate-50/80 hover:bg-slate-50 border border-slate-200/70 transition-all flex flex-col justify-between">
                            <span className="font-semibold text-slate-500 text-[10px] flex items-center gap-1.5">
                              <Monitor className="w-3.5 h-3.5 text-amber-600" />
                              Multimedia
                            </span>
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                              {Array.from(new Set(multimediaList)).map((m, idx) => (
                                <span
                                  key={idx}
                                  className="bg-amber-50 text-amber-800 border border-amber-200/90 px-2 py-0.5 rounded-lg text-[10px] font-bold"
                                >
                                  {m}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Sound System */}
                        {soundList.length > 0 && (
                          <div className="p-2.5 rounded-xl bg-slate-50/80 hover:bg-slate-50 border border-slate-200/70 transition-all flex flex-col justify-between">
                            <span className="font-semibold text-slate-500 text-[10px] flex items-center gap-1.5">
                              <Volume2 className="w-3.5 h-3.5 text-cyan-600" />
                              Sound System
                            </span>
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                              {Array.from(new Set(soundList)).map((snd, idx) => (
                                <span
                                  key={idx}
                                  className="bg-cyan-50 text-cyan-800 border border-cyan-200/90 px-2 py-0.5 rounded-lg text-[10px] font-bold"
                                >
                                  {snd}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Petugas Persembahan */}
                        {validOfferings.length > 0 && (
                          <div className="p-2.5 rounded-xl bg-slate-50/80 hover:bg-slate-50 border border-slate-200/70 transition-all flex flex-col justify-between">
                            <span className="font-semibold text-slate-500 text-[10px] flex items-center gap-1.5">
                              <Coins className="w-3.5 h-3.5 text-emerald-600" />
                              Petugas Persembahan
                            </span>
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                              {Array.from(new Set(validOfferings)).map((o, idx) => (
                                <span
                                  key={idx}
                                  className="bg-emerald-50 text-emerald-700 border border-emerald-200/90 px-2.5 py-0.5 rounded-lg text-[10px] font-bold"
                                >
                                  {o}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Aser (Penerima Tamu) */}
                        {validUshers.length > 0 && (
                          <div className="p-2.5 rounded-xl bg-slate-50/80 hover:bg-slate-50 border border-slate-200/70 transition-all flex flex-col justify-between">
                            <span className="font-semibold text-slate-500 text-[10px] flex items-center gap-1.5">
                              <HeartHandshake className="w-3.5 h-3.5 text-blue-600" />
                              Aser (Penerima Tamu)
                            </span>
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                              {Array.from(new Set(validUshers)).map((u, idx) => (
                                <span
                                  key={idx}
                                  className="bg-blue-50 text-blue-700 border border-blue-200/90 px-2.5 py-0.5 rounded-lg text-[10px] font-bold"
                                >
                                  {u}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Tombol Aksi Bawah: Bagikan ke WhatsApp */}
                  <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-400">Bagikan jadwal ibadah:</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleShareWhatsApp(evt, 'ringkas')}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer"
                        title="Bagikan format warta ringkas untuk jemaat umum"
                      >
                        <Share2 className="w-3.5 h-3.5 text-slate-500" />
                        Warta Jemaat
                      </button>
                      <button
                        onClick={() => handleShareWhatsApp(evt, 'detail')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm hover:shadow transition-all cursor-pointer"
                        title="Bagikan format lengkap dengan daftar petugas pelayan"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        Jadwal Pelayan (Lengkap)
                      </button>
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
        title="Jadwalkan Kegiatan & Pelayanan Gereja"
        subtitle="Tetapkan jadwal ibadah, lokasi, anggaran, dan daftar lengkap petugas pelayan ibadah"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateEvent} className="space-y-4">
          <Input
            label="Nama / Judul Kegiatan *"
            placeholder="Contoh: Ibadah Raya Minggu I (Pagi)"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
            <div className="p-4 rounded-2xl bg-gradient-to-b from-amber-50/50 via-white to-amber-50/30 border border-amber-200/80 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between border-b border-amber-200/80 pb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-gold-600" />
                  <h4 className="text-xs font-black text-navy-950 uppercase tracking-wider">
                    Petugas Pelayan Ibadah Raya
                  </h4>
                </div>
                <span className="text-[10px] font-bold text-amber-800 bg-amber-100/80 px-2.5 py-0.5 rounded-full border border-amber-200">
                  Liturgi Resmi GKKA
                </span>
              </div>

              <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-900 leading-relaxed font-medium">
                  Sesuai tata ibadah resmi GKKA, petugas wajib diisi adalah <strong>PIC (Pengkhotbah)</strong> dan <strong>MC (Worship Leader)</strong>. Petugas pelayan lainnya (Pemain Musik, Singer, Persembahan, Aser, Multimedia, Sound System) bersifat opsional sesuai kebutuhan ibadah.
                </p>
              </div>

              {/* PIC & MC */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-navy-700" /> PIC (Pengkhotbah / Pelayan Firman) *
                  </label>
                  <div className="space-y-1.5">
                    <select
                      value={formData.pic_member_id}
                      onChange={(e) => handlePicChange(e.target.value)}
                      className="w-full bg-white text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-navy-600 shadow-2xs"
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
                      className="w-full bg-white text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-navy-600 shadow-2xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Mic className="w-3.5 h-3.5 text-gold-600" /> MC (Worship Leader / Pemimpin Pujian) *
                  </label>
                  <div className="space-y-1.5">
                    <select
                      value={members.find((m) => m.full_name === formData.mc_name)?.id || ''}
                      onChange={(e) => {
                        const sel = members.find((m) => m.id === e.target.value);
                        if (sel) setFormData({ ...formData, mc_name: sel.full_name });
                      }}
                      className="w-full bg-white text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-navy-600 shadow-2xs"
                    >
                      <option value="">-- Pilih MC dari Jemaat --</option>
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.member_number} - {m.full_name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      required
                      placeholder="Atau ketik nama MC secara manual"
                      value={formData.mc_name}
                      onChange={(e) => setFormData({ ...formData, mc_name: e.target.value })}
                      className="w-full bg-white text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-navy-600 shadow-2xs"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500">Pilih dari jemaat atau ketik nama pemimpin pujian.</p>
                </div>
              </div>

              {/* PEMAIN MUSIK */}
              <div className="space-y-2 pt-1 border-t border-slate-200/60">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Music className="w-3.5 h-3.5 text-indigo-600" /> PEMAIN MUSIK (Bisa 1, 2, 3, 4 atau lebih)
                  </label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {formData.musicians.map((m, idx) => (
                    <div key={idx} className="bg-white p-2 rounded-xl border border-indigo-200/80 shadow-2xs space-y-1.5">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="text-[10px] font-bold text-indigo-700">Pemain Musik {idx + 1} (Keyboard, Gitar, Drum, Bass, dll)</span>
                        <button
                          type="button"
                          onClick={() => {
                            const newMus = formData.musicians.filter((_, i) => i !== idx);
                            setFormData({ ...formData, musicians: newMus });
                          }}
                          title="Hapus"
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <select
                        value={members.find((mem) => mem.full_name === m)?.id || ''}
                        onChange={(e) => {
                          const sel = members.find((mem) => mem.id === e.target.value);
                          const newMus = [...formData.musicians];
                          newMus[idx] = sel ? sel.full_name : '';
                          setFormData({ ...formData, musicians: newMus });
                        }}
                        className="w-full bg-white text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:border-navy-600"
                      >
                        <option value="">-- Pilih dari Jemaat --</option>
                        {members.map((mem) => (
                          <option key={mem.id} value={mem.id}>
                            {mem.member_number} - {mem.full_name}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder={`Atau ketik nama Musisi ${idx + 1} & alat musik`}
                        value={m}
                        onChange={(e) => {
                          const newMus = [...formData.musicians];
                          newMus[idx] = e.target.value;
                          setFormData({ ...formData, musicians: newMus });
                        }}
                        className="w-full bg-slate-50 text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-navy-600 text-slate-800 font-medium"
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, musicians: [...formData.musicians, ''] })}
                    className="col-span-full py-2 border border-dashed border-indigo-300 hover:border-indigo-400 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah Pemain Musik
                  </button>
                </div>
              </div>

              {/* SINGER */}
              <div className="space-y-2 pt-1 border-t border-slate-200/60">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Music className="w-3.5 h-3.5 text-purple-600" /> SINGER (Penyanyi Pujian)
                  </label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {formData.singers.map((s, idx) => (
                    <div key={idx} className="bg-white p-2 rounded-xl border border-purple-200/80 shadow-2xs space-y-1.5">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="text-[10px] font-bold text-purple-700">Singer {idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const newSingers = formData.singers.filter((_, i) => i !== idx);
                            setFormData({ ...formData, singers: newSingers });
                          }}
                          title="Hapus"
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <select
                        value={members.find((m) => m.full_name === s)?.id || ''}
                        onChange={(e) => {
                          const sel = members.find((m) => m.id === e.target.value);
                          const newSingers = [...formData.singers];
                          newSingers[idx] = sel ? sel.full_name : '';
                          setFormData({ ...formData, singers: newSingers });
                        }}
                        className="w-full bg-white text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:border-navy-600"
                      >
                        <option value="">-- Pilih dari Jemaat --</option>
                        {members.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.member_number} - {m.full_name}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder={`Atau ketik nama Singer ${idx + 1}`}
                        value={s}
                        onChange={(e) => {
                          const newSingers = [...formData.singers];
                          newSingers[idx] = e.target.value;
                          setFormData({ ...formData, singers: newSingers });
                        }}
                        className="w-full bg-slate-50 text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-navy-600 text-slate-800 font-medium"
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, singers: [...formData.singers, ''] })}
                    className="col-span-full py-2 border border-dashed border-purple-300 hover:border-purple-400 bg-purple-50/50 hover:bg-purple-50 text-purple-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah Singer
                  </button>
                </div>
              </div>

              {/* PETUGAS PERSEMBAHAN */}
              <div className="space-y-2 pt-1 border-t border-slate-200/60">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-emerald-600" /> PETUGAS PERSEMBAHAN
                  </label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {formData.offering_officers.map((o, idx) => (
                    <div key={idx} className="bg-white p-2 rounded-xl border border-emerald-200/80 shadow-2xs space-y-1.5">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="text-[10px] font-bold text-emerald-700">Petugas Persembahan {idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const newOff = formData.offering_officers.filter((_, i) => i !== idx);
                            setFormData({ ...formData, offering_officers: newOff });
                          }}
                          title="Hapus"
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <select
                        value={members.find((m) => m.full_name === o)?.id || ''}
                        onChange={(e) => {
                          const sel = members.find((m) => m.id === e.target.value);
                          const newOff = [...formData.offering_officers];
                          newOff[idx] = sel ? sel.full_name : '';
                          setFormData({ ...formData, offering_officers: newOff });
                        }}
                        className="w-full bg-white text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:border-navy-600"
                      >
                        <option value="">-- Pilih dari Jemaat --</option>
                        {members.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.member_number} - {m.full_name}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder={`Atau ketik nama Petugas ${idx + 1}`}
                        value={o}
                        onChange={(e) => {
                          const newOff = [...formData.offering_officers];
                          newOff[idx] = e.target.value;
                          setFormData({ ...formData, offering_officers: newOff });
                        }}
                        className="w-full bg-slate-50 text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-navy-600 text-slate-800 font-medium"
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, offering_officers: [...formData.offering_officers, ''] })}
                    className="col-span-full py-2 border border-dashed border-emerald-300 hover:border-emerald-400 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah Petugas Persembahan
                  </button>
                </div>
              </div>

              {/* ASER (PENERIMA TAMU) */}
              <div className="space-y-2 pt-1 border-t border-slate-200/60">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <HeartHandshake className="w-3.5 h-3.5 text-blue-600" /> ASER / USHER (Penerima Tamu)
                  </label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {formData.ushers.map((u, idx) => (
                    <div key={idx} className="bg-white p-2 rounded-xl border border-blue-200/80 shadow-2xs space-y-1.5">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="text-[10px] font-bold text-blue-700">Aser {idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const newUs = formData.ushers.filter((_, i) => i !== idx);
                            setFormData({ ...formData, ushers: newUs });
                          }}
                          title="Hapus"
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <select
                        value={members.find((m) => m.full_name === u)?.id || ''}
                        onChange={(e) => {
                          const sel = members.find((m) => m.id === e.target.value);
                          const newUs = [...formData.ushers];
                          newUs[idx] = sel ? sel.full_name : '';
                          setFormData({ ...formData, ushers: newUs });
                        }}
                        className="w-full bg-white text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:border-navy-600"
                      >
                        <option value="">-- Pilih dari Jemaat --</option>
                        {members.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.member_number} - {m.full_name}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder={`Atau ketik nama Aser ${idx + 1}`}
                        value={u}
                        onChange={(e) => {
                          const newUs = [...formData.ushers];
                          newUs[idx] = e.target.value;
                          setFormData({ ...formData, ushers: newUs });
                        }}
                        className="w-full bg-slate-50 text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-navy-600 text-slate-800 font-medium"
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, ushers: [...formData.ushers, ''] })}
                    className="col-span-full py-2 border border-dashed border-blue-300 hover:border-blue-400 bg-blue-50/50 hover:bg-blue-50 text-blue-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah Aser
                  </button>
                </div>
              </div>

              {/* MULTIMEDIA */}
              <div className="space-y-2 pt-1 border-t border-slate-200/60">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Monitor className="w-3.5 h-3.5 text-amber-600" /> MULTIMEDIA (Slide Proyektor, Kamera, Live Streaming)
                  </label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {formData.multimedia_officers.map((m, idx) => (
                    <div key={idx} className="bg-white p-2 rounded-xl border border-amber-200/80 shadow-2xs space-y-1.5">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="text-[10px] font-bold text-amber-700">Petugas Multimedia {idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const newMulti = formData.multimedia_officers.filter((_, i) => i !== idx);
                            setFormData({ ...formData, multimedia_officers: newMulti });
                          }}
                          title="Hapus"
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <select
                        value={members.find((mem) => mem.full_name === m)?.id || ''}
                        onChange={(e) => {
                          const sel = members.find((mem) => mem.id === e.target.value);
                          const newMulti = [...formData.multimedia_officers];
                          newMulti[idx] = sel ? sel.full_name : '';
                          setFormData({ ...formData, multimedia_officers: newMulti });
                        }}
                        className="w-full bg-white text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:border-navy-600"
                      >
                        <option value="">-- Pilih dari Jemaat --</option>
                        {members.map((mem) => (
                          <option key={mem.id} value={mem.id}>
                            {mem.member_number} - {mem.full_name}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder={`Atau ketik nama Petugas Multimedia ${idx + 1}`}
                        value={m}
                        onChange={(e) => {
                          const newMulti = [...formData.multimedia_officers];
                          newMulti[idx] = e.target.value;
                          setFormData({ ...formData, multimedia_officers: newMulti });
                        }}
                        className="w-full bg-slate-50 text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-navy-600 text-slate-800 font-medium"
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, multimedia_officers: [...formData.multimedia_officers, ''] })}
                    className="col-span-full py-2 border border-dashed border-amber-300 hover:border-amber-400 bg-amber-50/50 hover:bg-amber-50 text-amber-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah Petugas Multimedia
                  </button>
                </div>
              </div>

              {/* SOUND SYSTEM */}
              <div className="space-y-2 pt-1 border-t border-slate-200/60">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-cyan-600" /> SOUND SYSTEM (Soundman / Audio Engineer)
                  </label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {formData.sound_officers.map((s, idx) => (
                    <div key={idx} className="bg-white p-2 rounded-xl border border-cyan-200/80 shadow-2xs space-y-1.5">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="text-[10px] font-bold text-cyan-700">Petugas Sound {idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const newSound = formData.sound_officers.filter((_, i) => i !== idx);
                            setFormData({ ...formData, sound_officers: newSound });
                          }}
                          title="Hapus"
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <select
                        value={members.find((mem) => mem.full_name === s)?.id || ''}
                        onChange={(e) => {
                          const sel = members.find((mem) => mem.id === e.target.value);
                          const newSound = [...formData.sound_officers];
                          newSound[idx] = sel ? sel.full_name : '';
                          setFormData({ ...formData, sound_officers: newSound });
                        }}
                        className="w-full bg-white text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:border-navy-600"
                      >
                        <option value="">-- Pilih dari Jemaat --</option>
                        {members.map((mem) => (
                          <option key={mem.id} value={mem.id}>
                            {mem.member_number} - {mem.full_name}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder={`Atau ketik nama Petugas Sound ${idx + 1}`}
                        value={s}
                        onChange={(e) => {
                          const newSound = [...formData.sound_officers];
                          newSound[idx] = e.target.value;
                          setFormData({ ...formData, sound_officers: newSound });
                        }}
                        className="w-full bg-slate-50 text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-navy-600 text-slate-800 font-medium"
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, sound_officers: [...formData.sound_officers, ''] })}
                    className="col-span-full py-2 border border-dashed border-cyan-300 hover:border-cyan-400 bg-cyan-50/50 hover:bg-cyan-50 text-cyan-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah Petugas Sound System
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* NON-IBADAH GENERAL MC & PIC SECTION */
            <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-50 to-white border border-slate-200/80 space-y-3 shadow-2xs">
              <h4 className="text-xs font-bold text-navy-950 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-navy-700" />
                Petugas Pelayan Kegiatan
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800">
                    Penanggung Jawab (PIC)
                  </label>
                  <div className="space-y-1.5">
                    <select
                      value={formData.pic_member_id}
                      onChange={(e) => handlePicChange(e.target.value)}
                      className="w-full bg-white text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-navy-600 shadow-2xs"
                    >
                      <option value="">-- Pilih PIC dari Jemaat --</option>
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.member_number} - {m.full_name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Atau ketik nama PIC luar / pembicara tamu"
                      value={formData.pic_member_name}
                      onChange={(e) => setFormData({ ...formData, pic_member_name: e.target.value })}
                      className="w-full bg-white text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-navy-600 shadow-2xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800">
                    MC / Pembawa Acara (Opsional)
                  </label>
                  <div className="space-y-1.5">
                    <select
                      value={members.find((m) => m.full_name === formData.mc_name)?.id || ''}
                      onChange={(e) => {
                        const sel = members.find((m) => m.id === e.target.value);
                        if (sel) setFormData({ ...formData, mc_name: sel.full_name });
                      }}
                      className="w-full bg-white text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-navy-600 shadow-2xs"
                    >
                      <option value="">-- Pilih MC dari Jemaat --</option>
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.member_number} - {m.full_name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Atau ketik nama MC secara manual"
                      value={formData.mc_name}
                      onChange={(e) => setFormData({ ...formData, mc_name: e.target.value })}
                      className="w-full bg-white text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-navy-600 shadow-2xs"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500">Membantu memandu jalannya acara kegiatan.</p>
                </div>
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

      {/* Confirm Modal Hapus Kegiatan */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteEvent}
        title="Hapus Jadwal Kegiatan"
        message={`Apakah Anda yakin ingin menghapus jadwal kegiatan "${deleteTarget?.title}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Ya, Hapus Jadwal"
        cancelText="Batalkan"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
