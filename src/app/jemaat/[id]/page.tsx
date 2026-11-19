'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import { Card, CardHeader, CardTitle, CardContent, Badge, Input, Select } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ImageUpload } from '@/components/ui/ImageUpload';
import {
  formatDateIndo,
  formatCurrency,
  getMemberStatusBadge,
  getFamilyRelationBadge,
  getOfferingTypeLabel,
} from '@/lib/utils';
import {
  Users,
  Home,
  Building2,
  FileText,
  Clock,
  ArrowLeft,
  CreditCard,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Briefcase,
  GraduationCap,
  ShieldAlert,
  CheckCircle2,
  DollarSign,
  Edit2,
  Download,
  Camera,
} from 'lucide-react';
import Link from 'next/link';

export default function MemberDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { roleCode, can, currentUser } = useAuth();
  const { showToast } = useNotification();

  const [member, setMember] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'pribadi' | 'keluarga' | 'departemen' | 'pelayanan' | 'dokumen' | 'riwayat'>('pribadi');
  const [isLoading, setIsLoading] = useState(true);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<any>({});
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    async function fetchDetail() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/jemaat/${id}?role=${roleCode}`);
        const json = await res.json();
        if (json.success) {
          setMember(json.data);
          setEditFormData({
            full_name: json.data.full_name,
            phone: json.data.phone,
            email: json.data.email,
            address: json.data.address,
            status: json.data.status,
            occupation: json.data.occupation,
            education: json.data.education,
            photo_url: json.data.photo_url || '',
            notes: json.data.notes,
          });
        } else {
          showToast('error', 'Gagal', json.message);
        }
      } catch (err: any) {
        showToast('error', 'Gagal memuat profil', err.message);
      } finally {
        setIsLoading(false);
      }
    }
    if (id) fetchDetail();
  }, [id, roleCode]);

  const handleDirectPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('error', 'Format Berkas Salah', 'Hanya gambar (JPG, PNG, WebP) yang diperbolehkan');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 600;
        const MAX_HEIGHT = 600;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        const compressedBase64 = ctx
          ? (ctx.drawImage(img, 0, 0, width, height), canvas.toDataURL('image/jpeg', 0.85))
          : (event.target?.result as string);

        try {
          const res = await fetch(`/api/jemaat/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              photo_url: compressedBase64,
              actor_name: currentUser?.full_name || 'Admin',
            }),
          });
          const json = await res.json();
          if (json.success) {
            showToast('success', 'Foto Disimpan', 'Foto profil jemaat berhasil diunggah dan disimpan ke database.');
            setMember((prev: any) => ({ ...prev, photo_url: compressedBase64 }));
            setEditFormData((prev: any) => ({ ...prev, photo_url: compressedBase64 }));
          }
        } catch (err) {
          showToast('error', 'Gagal menyimpan foto');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/jemaat/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editFormData,
          actor_name: currentUser?.full_name || 'Admin',
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast('success', 'Berhasil', 'Data jemaat telah diperbarui');
        setMember((prev: any) => ({ ...prev, ...json.data }));
        setIsEditModalOpen(false);
      }
    } catch (err: any) {
      showToast('error', 'Gagal update', err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading || !member) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-navy-900 border-t-gold-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  const statusBadge = getMemberStatusBadge(member.status);
  const canSeePastoralNotes = roleCode === 'SUPER_ADMIN' || roleCode === 'PENDETA';
  const canSeeIndividualFinance = roleCode === 'SUPER_ADMIN' || roleCode === 'BENDAHARA';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between">
        <Link href="/jemaat">
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Kembali ke Direktori Jemaat
          </Button>
        </Link>

        <div className="flex items-center gap-2.5">
          <Link href={`/jemaat/kartu?id=${member.id}`}>
            <Button variant="outline" size="sm" leftIcon={<CreditCard className="w-4 h-4 text-gold-600" />}>
              Cetak Kartu Digital
            </Button>
          </Link>
          {can('jemaat', 'edit') && (
            <Button
              variant="gold"
              size="sm"
              onClick={() => setIsEditModalOpen(true)}
              leftIcon={<Edit2 className="w-4 h-4" />}
            >
              Ubah Data
            </Button>
          )}
        </div>
      </div>

      {/* Member Header Profile Card */}
      <Card className="bg-gradient-to-r from-navy-950 to-navy-900 text-white border-navy-800">
        <CardContent className="p-6 md:p-8 flex flex-col md:flex-row items-center md:items-start gap-6">
          <div className="relative group shrink-0">
            <img
              src={member.photo_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200'}
              alt={member.full_name}
              className="w-28 h-28 rounded-2xl object-cover border-2 border-gold-400/50 shadow-xl"
            />
            {can('jemaat', 'edit') && (
              <label className="absolute inset-0 bg-navy-950/60 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-white text-[11px] font-bold gap-1 shadow-inner">
                <Camera className="w-5 h-5 text-gold-400" />
                <span>Ganti Foto</span>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  onChange={handleDirectPhotoChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          <div className="flex-1 text-center md:text-left space-y-2">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
              <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-gold-500 text-navy-950">
                {member.member_number}
              </span>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${statusBadge.color}`}>
                {statusBadge.label}
              </span>
              {member.family && (
                <span className="text-xs bg-navy-800 text-navy-200 px-2.5 py-0.5 rounded-full">
                  {member.family.family_name}
                </span>
              )}
            </div>

            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              {member.full_name}
            </h1>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-navy-200 pt-1">
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-gold-400" />
                {member.phone || '-'}
              </span>
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-gold-400" />
                {member.email || '-'}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-gold-400" />
                {member.address || '-'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Detail Tabs (6 Tabs) */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-2 text-xs font-bold">
        {[
          { key: 'pribadi', label: '1. Informasi Pribadi', icon: Users },
          { key: 'keluarga', label: '2. Informasi Keluarga', icon: Home },
          { key: 'departemen', label: '3. Keanggotaan Komisi', icon: Building2 },
          { key: 'pelayanan', label: '4. Riwayat Pelayanan', icon: Clock },
          { key: 'dokumen', label: '5. Dokumen Gereja', icon: FileText },
          { key: 'riwayat', label: '6. Riwayat Administrasi', icon: DollarSign },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 py-3 px-4 border-b-2 transition whitespace-nowrap ${
                active
                  ? 'border-navy-900 text-navy-950 bg-white rounded-t-xl'
                  : 'border-transparent text-slate-500 hover:text-navy-900 hover:border-slate-300'
              }`}
            >
              <Icon className={`w-4 h-4 ${active ? 'text-gold-600' : 'text-slate-400'}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Informasi Pribadi */}
      {activeTab === 'pribadi' && (
        <Card>
          <CardHeader>
            <CardTitle>Biodata Lengkap Jemaat</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="space-y-3.5">
              <div>
                <p className="text-slate-400 font-semibold">Nama Lengkap</p>
                <p className="font-bold text-navy-950 text-sm mt-0.5">{member.full_name}</p>
              </div>
              <div>
                <p className="text-slate-400 font-semibold">Jenis Kelamin</p>
                <p className="font-semibold text-slate-800 mt-0.5">{member.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</p>
              </div>
              <div>
                <p className="text-slate-400 font-semibold">Tempat, Tanggal Lahir</p>
                <p className="font-semibold text-slate-800 mt-0.5">
                  {member.pob || '-'}, {formatDateIndo(member.dob)}
                </p>
              </div>
              <div>
                <p className="text-slate-400 font-semibold">Tanggal Bergabung GKKA</p>
                <p className="font-semibold text-slate-800 mt-0.5">{formatDateIndo(member.join_date)}</p>
              </div>
            </div>

            <div className="space-y-3.5">
              <div>
                <p className="text-slate-400 font-semibold">Pendidikan Terakhir</p>
                <p className="font-semibold text-slate-800 mt-0.5">{member.education || '-'}</p>
              </div>
              <div>
                <p className="text-slate-400 font-semibold">Pekerjaan / Profesi</p>
                <p className="font-semibold text-slate-800 mt-0.5">{member.occupation || '-'}</p>
              </div>
              <div>
                <p className="text-slate-400 font-semibold">Alamat Domisili</p>
                <p className="font-semibold text-slate-800 mt-0.5 leading-relaxed">{member.address || '-'}</p>
              </div>
              <div>
                <p className="text-slate-400 font-semibold">Catatan Administrasi & Pastoral</p>
                {member.is_confidential_notes && !canSeePastoralNotes ? (
                  <p className="text-rose-600 font-medium italic mt-0.5">
                    [Catatan pastoral rahasia: Hanya dapat diakses oleh Gembala & Super Admin]
                  </p>
                ) : (
                  <p className="font-medium text-slate-700 mt-0.5 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    {member.notes || 'Tidak ada catatan.'}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab 2: Informasi Keluarga */}
      {activeTab === 'keluarga' && (
        <Card>
          <CardHeader>
            <CardTitle>Susunan Anggota Keluarga</CardTitle>
            {member.family && (
              <Link href={`/keluarga/${member.family.id}`}>
                <Button variant="outline" size="sm">
                  Lihat Struktur KK Lengkap
                </Button>
              </Link>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {member.family ? (
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row justify-between gap-4">
                  <div>
                    <span className="font-mono text-xs font-bold text-navy-800">{member.family.family_number}</span>
                    <h3 className="text-sm font-bold text-navy-950 mt-0.5">{member.family.family_name}</h3>
                    <p className="text-slate-500 mt-1">{member.family.address}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-semibold">Telepon Keluarga</p>
                    <p className="font-bold text-slate-800 mt-0.5">{member.family.phone}</p>
                  </div>
                </div>

                <h4 className="font-bold text-slate-800 uppercase tracking-wider pt-2">
                  Daftar Anggota dalam Satu KK:
                </h4>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {member.familyMembers?.map((fm: any) => {
                    const relBadge = getFamilyRelationBadge(fm.family_relation);
                    const isSelf = fm.id === member.id;
                    return (
                      <div
                        key={fm.id}
                        className={`p-3.5 flex items-center justify-between ${
                          isSelf ? 'bg-gold-50/50' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={fm.photo_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'}
                            alt={fm.full_name}
                            className="w-8 h-8 rounded-full object-cover shrink-0"
                          />
                          <div>
                            <p className="font-bold text-navy-950 flex items-center gap-2">
                              {fm.full_name}
                              {isSelf && <span className="text-[10px] text-gold-700 font-semibold">(Profil Ini)</span>}
                            </p>
                            <p className="text-[11px] text-slate-400 font-mono">{fm.member_number}</p>
                          </div>
                        </div>

                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${relBadge.color}`}>
                          {relBadge.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 p-6 text-center">
                Jemaat ini belum terdaftar di dalam kepala keluarga manapun.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab 3: Keanggotaan Komisi (Multi-Komisi) */}
      {activeTab === 'departemen' && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Keanggotaan Multi-Komisi & Pelayanan</CardTitle>
              <p className="text-xs text-slate-400 mt-0.5">
                Satu jemaat dapat melayani dan tergabung di beberapa komisi sekaligus
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {member.departmentMemberships?.length === 0 ? (
              <p className="text-xs text-slate-400 p-6 text-center">
                Jemaat belum terdaftar di departemen/komisi manapun.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {member.departmentMemberships.map((dept: any) => (
                  <div
                    key={dept.id}
                    className="p-4 rounded-xl border border-slate-200 bg-white hover:border-navy-300 transition space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gold-600 bg-gold-50 px-2 py-0.5 rounded">
                        {dept.category || 'KOMISI'}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        {dept.status}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-navy-950">{dept.department_name}</h4>
                    <p className="text-xs font-semibold text-navy-800 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-navy-900"></span>
                      Jabatan: {dept.position_name || 'Anggota'}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Bergabung sejak: {formatDateIndo(dept.joined_at)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab 4: Riwayat Pelayanan */}
      {activeTab === 'pelayanan' && (
        <Card>
          <CardHeader>
            <CardTitle>Riwayat Pelayanan & Kepanitiaan Ibadah</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-navy-950">Tim Pelayan Ibadah Raya GKKA</h4>
                <p className="text-slate-500 mt-0.5">
                  Tercatat melayani sebagai worship team liturgis dan kepanitiaan hari raya gereja (Paskah & Natal).
                </p>
                <p className="text-[10px] text-slate-400 mt-1">Status: Aktif Bertugas 2026</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab 5: Dokumen Gereja */}
      {activeTab === 'dokumen' && (
        <Card>
          <CardHeader>
            <CardTitle>Arsip Surat & Dokumen Sakramen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-8 h-8 text-navy-800" />
                  <div>
                    <h4 className="font-bold text-navy-950">Surat Baptis Kudus</h4>
                    <p className="text-[11px] text-slate-400">Terdaftar di Buku Induk GKKA</p>
                  </div>
                </div>
                <Badge variant="success">Terverifikasi</Badge>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-8 h-8 text-navy-800" />
                  <div>
                    <h4 className="font-bold text-navy-950">Surat Pengakuan Percaya (Sidi)</h4>
                    <p className="text-[11px] text-slate-400">Kelas Peneguhan Sidi GKKA</p>
                  </div>
                </div>
                <Badge variant="success">Terverifikasi</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab 6: Riwayat Administrasi / Finansial */}
      {activeTab === 'riwayat' && (
        <Card>
          <CardHeader>
            <CardTitle>Riwayat Administrasi & Finansial Jemaat</CardTitle>
            {!canSeeIndividualFinance && (
              <Badge variant="danger">Akses Terbatas: Rahasia</Badge>
            )}
          </CardHeader>
          <CardContent>
            {!canSeeIndividualFinance ? (
              <div className="p-8 text-center space-y-2">
                <ShieldAlert className="w-10 h-10 text-rose-500 mx-auto" />
                <h4 className="text-sm font-bold text-slate-800">Data Persembahan Terkunci</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Sesuai kebijakan kerahasiaan keuangan gereja, data persembahan dan perpuluhan individual hanya dapat diakses oleh Bendahara dan Super Admin.
                </p>
              </div>
            ) : member.offerings?.length === 0 ? (
              <p className="text-xs text-slate-400 p-6 text-center">
                Belum ada transaksi persembahan perorangan yang tercatat atas nama jemaat ini.
              </p>
            ) : (
              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">No. Transaksi</th>
                      <th className="px-4 py-3">Tanggal</th>
                      <th className="px-4 py-3">Jenis Persembahan</th>
                      <th className="px-4 py-3">Akun Tujuan</th>
                      <th className="px-4 py-3 text-right">Nominal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {member.offerings.map((tx: any) => (
                      <tr key={tx.id}>
                        <td className="px-4 py-3 font-mono font-bold text-navy-900">{tx.transaction_number}</td>
                        <td className="px-4 py-3 text-slate-600">{formatDateIndo(tx.transaction_date)}</td>
                        <td className="px-4 py-3 font-semibold text-slate-800">
                          {getOfferingTypeLabel(tx.offering_type)}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{tx.account_name}</td>
                        <td className="px-4 py-3 text-right font-black text-emerald-700">
                          {formatCurrency(tx.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Ubah Data Jemaat"
        subtitle={`Mengubah data anggota ${member.member_number}`}
        maxWidth="lg"
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          <ImageUpload
            value={editFormData.photo_url || ''}
            onChange={(base64) => setEditFormData({ ...editFormData, photo_url: base64 })}
            label="Perbarui Foto Profil Jemaat"
            helperText="Unggah foto baru (JPG/PNG). Foto langsung dikonversi dan disimpan ke database."
          />

          <Input
            label="Nama Lengkap *"
            value={editFormData.full_name || ''}
            onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Nomor Telepon"
              value={editFormData.phone || ''}
              onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
            />
            <Input
              label="Email"
              value={editFormData.email || ''}
              onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Status Keanggotaan"
              value={editFormData.status || 'ACTIVE'}
              onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
            >
              <option value="ACTIVE">Aktif</option>
              <option value="INACTIVE">Tidak Aktif</option>
              <option value="MOVED">Pindah</option>
              <option value="DECEASED">Meninggal Dunia</option>
            </Select>

            <Input
              label="Pekerjaan"
              value={editFormData.occupation || ''}
              onChange={(e) => setEditFormData({ ...editFormData, occupation: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">Alamat</label>
            <textarea
              rows={2}
              value={editFormData.address || ''}
              onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:outline-none focus:border-navy-600"
            ></textarea>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button variant="secondary" size="md" type="button" onClick={() => setIsEditModalOpen(false)}>
              Batal
            </Button>
            <Button variant="gold" size="md" type="submit" isLoading={isUpdating}>
              Simpan Perubahan
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
