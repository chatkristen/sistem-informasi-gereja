'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import { Card, CardHeader, CardTitle, CardContent, Badge, Input, Select } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Announcement } from '@/lib/types';
import { formatDateIndo } from '@/lib/utils';
import {
  Bell,
  Plus,
  Radio,
  Clock,
  Sparkles,
  Users,
  Building2,
  Trash2,
  Share2,
} from 'lucide-react';

export default function PengumumanPage() {
  const { roleCode, can, currentUser } = useAuth();
  const { showToast } = useNotification();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    target_audience: 'ALL' as any,
    department_id: '',
    attachment_url: '',
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [resAnc, resDept] = await Promise.all([
        fetch('/api/pengumuman'),
        fetch('/api/departemen'),
      ]);
      const dataAnc = await resAnc.json();
      const dataDept = await resDept.json();

      if (dataAnc.success) setAnnouncements(dataAnc.data);
      if (dataDept.success) setDepartments(dataDept.data);
    } catch (err) {
      console.error(err);
      showToast('error', 'Gagal memuat warta');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      showToast('warning', 'Validasi Gagal', 'Judul dan isi pengumuman wajib diisi');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/pengumuman', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          actor_name: currentUser?.full_name || 'Sekretariat',
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast('success', 'Dipublikasikan', `Pengumuman "${json.data.title}" berhasil disiarkan.`);
        setIsModalOpen(false);
        setFormData({ title: '', content: '', target_audience: 'ALL', department_id: '', attachment_url: '' });
        loadData();
      }
    } catch (err: any) {
      showToast('error', 'Gagal', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAnnouncement = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/pengumuman?id=${deleteTarget.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        showToast('success', 'Warta Dihapus', `Warta "${deleteTarget.title}" berhasil dihapus.`);
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

  const handleShareWhatsApp = (anc: Announcement) => {
    const text = `*WARTA & PENGUMUMAN GEREJA*\n` +
      `*${anc.title.toUpperCase()}*\n` +
      `_Tanggal: ${formatDateIndo(anc.publish_date)}_\n` +
      (anc.department_name ? `_Komisi: ${anc.department_name}_\n` : '') +
      `\n${anc.content}\n\n` +
      `_Tuhan Yesus Memberkati._\n*GKKA Jakarta*`;

    const encodedText = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encodedText}`, '_blank');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-navy-950 tracking-tight flex items-center gap-2.5">
            <Bell className="w-6 h-6 text-navy-900" />
            Warta & Pengumuman Jemaat
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Pusat informasi berita gereja, siaran pengumuman komisi, dan publikasi warta jemaat mingguan.
          </p>
        </div>

        {can('pengumuman', 'create') && (
          <Button variant="gold" size="sm" onClick={() => setIsModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
            Buat Warta Baru
          </Button>
        )}
      </div>

      {/* Announcements Feed */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400">
            <div className="inline-block w-6 h-6 border-2 border-navy-900 border-t-gold-500 rounded-full animate-spin"></div>
            <p className="mt-2 text-xs">Memuat warta...</p>
          </div>
        ) : announcements.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-slate-400">
              Belum ada warta pengumuman yang aktif.
            </CardContent>
          </Card>
        ) : (
          announcements.map((anc) => (
            <Card key={anc.id} className="hover:border-navy-300">
              <CardContent className="p-6 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-navy-50 text-navy-900 border border-navy-200">
                      <Radio className="w-3 h-3 text-gold-600 animate-pulse" />
                      Target: {anc.target_audience}
                    </span>
                    {anc.department_name && (
                      <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        {anc.department_name}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDateIndo(anc.publish_date)}
                  </span>
                </div>

                <h3 className="text-base font-extrabold text-navy-950">{anc.title}</h3>

                {anc.attachment_url && (
                  <div className="rounded-xl overflow-hidden max-h-60 border border-slate-200 bg-slate-100 flex items-center justify-center">
                    <img
                      src={anc.attachment_url}
                      alt={anc.title}
                      className="w-full h-full object-cover max-h-60"
                    />
                  </div>
                )}

                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                  {anc.content}
                </p>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Diterbitkan oleh: <strong className="text-slate-700">{anc.created_by_name}</strong></span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleShareWhatsApp(anc)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 font-bold transition text-xs"
                      title="Bagikan ke WhatsApp"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      Bagikan WA
                    </button>
                    <Badge variant="success">Publikasi Aktif</Badge>
                    {can('pengumuman', 'delete') && (
                      <button
                        onClick={() => setDeleteTarget({ id: anc.id, title: anc.title })}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="Hapus warta"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modal Buat Pengumuman */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Publikasikan Warta & Pengumuman Baru"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateAnnouncement} className="space-y-4">
          <ImageUpload
            value={formData.attachment_url}
            onChange={(b64) => setFormData({ ...formData, attachment_url: b64 })}
            label="Foto Pamflet / Flyer Warta Acara (Opsional)"
            helperText="Format JPG/PNG/WebP. Pamflet otomatis dikompresi dan disimpan ke basis data warta gereja."
          />

          <Input
            label="Judul Pengumuman *"
            placeholder="Contoh: Pelaksanaan Ibadah Doa Malam & Puasa Jemaat"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Target Penerima Sasaran *"
              value={formData.target_audience}
              onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
            >
              <option value="ALL">Seluruh Jemaat & Simpatisan</option>
              <option value="JEMAAT">Anggota Jemaat Terdaftar</option>
              <option value="PENGURUS">Khusus Pengurus & Majelis</option>
              <option value="DEPARTEMEN">Khusus Departemen Tertentu</option>
            </Select>

            <Select
              label="Komisi Terkait (Opsional)"
              value={formData.department_id}
              onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
            >
              <option value="">-- Warta Umum Gereja --</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">Isi Lengkap Pengumuman *</label>
            <textarea
              rows={4}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Tuliskan isi pengumuman, ayat renungan, kontak narahubung, atau waktu persekutuan..."
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:outline-none focus:border-navy-600"
              required
            ></textarea>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button variant="secondary" size="md" type="button" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button variant="gold" size="md" type="submit" isLoading={isSubmitting}>
              Siarkan Warta
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Modal Hapus Warta */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteAnnouncement}
        title="Hapus Warta Pengumuman"
        message={`Apakah Anda yakin ingin menghapus warta pengumuman "${deleteTarget?.title}"? Tindakan ini akan menghapus warta dari siaran seluruh jemaat.`}
        confirmText="Ya, Hapus Warta"
        cancelText="Batalkan"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
