'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import { Card, CardHeader, CardTitle, CardContent, Badge, Select } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { formatDateIndo, getFamilyRelationBadge, getMemberStatusBadge } from '@/lib/utils';
import {
  Home,
  Users,
  ArrowLeft,
  Plus,
  GitFork,
  Heart,
  Baby,
  UserCheck,
  Phone,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';

export default function FamilyDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { roleCode, can, currentUser } = useAuth();
  const { showToast } = useNotification();

  const [family, setFamily] = useState<any>(null);
  const [allMembers, setAllMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Add Member to Family Modal
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [relation, setRelation] = useState('ANAK');
  const [isAssigning, setIsAssigning] = useState(false);

  const loadFamilyDetail = async () => {
    setIsLoading(true);
    try {
      const [resFam, resMem] = await Promise.all([
        fetch(`/api/keluarga/${id}`),
        fetch('/api/jemaat'),
      ]);
      const dataFam = await resFam.json();
      const dataMem = await resMem.json();

      if (dataFam.success) setFamily(dataFam.data);
      if (dataMem.success) setAllMembers(dataMem.data);
    } catch (err) {
      console.error(err);
      showToast('error', 'Gagal memuat detail keluarga');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadFamilyDetail();
  }, [id]);

  const handleAssignMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId) {
      showToast('warning', 'Pilih Anggota', 'Silakan pilih jemaat yang akan ditambahkan');
      return;
    }

    setIsAssigning(true);
    try {
      // Update member's family_id and relation
      const res = await fetch(`/api/jemaat/${selectedMemberId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          family_id: id,
          family_relation: relation,
          actor_name: currentUser?.full_name || 'Sekretaris',
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast('success', 'Berhasil', `${json.data.full_name} berhasil ditambahkan ke keluarga`);
        setIsAssignModalOpen(false);
        setSelectedMemberId('');
        loadFamilyDetail();
      }
    } catch (err: any) {
      showToast('error', 'Gagal', err.message);
    } finally {
      setIsAssigning(false);
    }
  };

  if (isLoading || !family) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-navy-900 border-t-gold-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  const { head, spouse, children, others } = family.tree || {};

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Link href="/keluarga">
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Kembali ke Daftar Keluarga
          </Button>
        </Link>

        {can('keluarga', 'edit') && (
          <Button
            variant="gold"
            size="sm"
            onClick={() => setIsAssignModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Hubungkan Anggota Jemaat ke KK Ini
          </Button>
        )}
      </div>

      {/* Family Main Info Card */}
      <Card className="bg-gradient-to-r from-navy-950 to-navy-900 text-white border-navy-800">
        <CardContent className="p-6 md:p-8 flex flex-col md:flex-row items-start justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-3 py-1 rounded-full bg-gold-500 text-navy-950">
                {family.family_number}
              </span>
              <span className="text-xs bg-navy-800 text-navy-200 px-3 py-1 rounded-full">
                {family.members_count} Anggota Keluarga
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white">{family.family_name}</h1>
            <div className="flex flex-wrap items-center gap-4 text-xs text-navy-200 pt-1">
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-gold-400" />
                {family.phone || '-'}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-gold-400" />
                {family.address}, {family.city}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visual Family Tree / Silsilah Struktur Keluarga */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <GitFork className="w-5 h-5 text-gold-600" />
            <CardTitle>Struktur & Silsilah Keluarga</CardTitle>
          </div>
          <span className="text-xs text-slate-400">Hubungan hierarki orang tua dan anak</span>
        </CardHeader>
        <CardContent className="p-6 md:p-10 space-y-8">
          {/* Level 1: Orang Tua (Kepala Keluarga & Istri) */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 relative">
            {/* Kepala Keluarga Card */}
            {head ? (
              <div className="w-full sm:w-72 p-4 rounded-2xl border-2 border-blue-400 bg-blue-50/40 shadow-sm flex items-center gap-3.5 hover:shadow-md transition">
                <img
                  src={head.photo_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'}
                  alt={head.full_name}
                  className="w-12 h-12 rounded-xl object-cover border border-blue-300 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <span className="inline-block text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                    Kepala Keluarga
                  </span>
                  <Link href={`/jemaat/${head.id}`} className="block font-bold text-xs text-navy-950 truncate hover:text-gold-600 mt-0.5">
                    {head.full_name}
                  </Link>
                  <p className="font-mono text-[10px] text-slate-500">{head.member_number}</p>
                </div>
              </div>
            ) : (
              <div className="w-full sm:w-72 p-4 rounded-2xl border border-dashed border-slate-300 text-center text-xs text-slate-400">
                Belum ditentukan Kepala Keluarga
              </div>
            )}

            {/* Marriage Connection Icon */}
            <div className="w-8 h-8 rounded-full bg-pink-100 text-pink-600 border border-pink-200 flex items-center justify-center shrink-0">
              <Heart className="w-4 h-4 fill-pink-500" />
            </div>

            {/* Pasangan (Istri) Card */}
            {spouse ? (
              <div className="w-full sm:w-72 p-4 rounded-2xl border-2 border-pink-400 bg-pink-50/40 shadow-sm flex items-center gap-3.5 hover:shadow-md transition">
                <img
                  src={spouse.photo_url || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100'}
                  alt={spouse.full_name}
                  className="w-12 h-12 rounded-xl object-cover border border-pink-300 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <span className="inline-block text-[10px] font-bold text-pink-700 bg-pink-100 px-2 py-0.5 rounded-full">
                    Istri / Pasangan
                  </span>
                  <Link href={`/jemaat/${spouse.id}`} className="block font-bold text-xs text-navy-950 truncate hover:text-gold-600 mt-0.5">
                    {spouse.full_name}
                  </Link>
                  <p className="font-mono text-[10px] text-slate-500">{spouse.member_number}</p>
                </div>
              </div>
            ) : (
              <div className="w-full sm:w-72 p-4 rounded-2xl border border-dashed border-slate-300 text-center text-xs text-slate-400">
                Belum ditentukan Pasangan
              </div>
            )}
          </div>

          {/* Tree Vertical Branch Connector Line */}
          {children && children.length > 0 && (
            <div className="relative flex justify-center items-center">
              <div className="w-0.5 h-8 bg-slate-300"></div>
            </div>
          )}

          {/* Level 2: Anak-anak */}
          {children && children.length > 0 && (
            <div className="space-y-3">
              <div className="text-center">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  <Baby className="w-3.5 h-3.5" /> Anak-anak dalam Keluarga ({children.length})
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
                {children.map((child: any) => (
                  <div
                    key={child.id}
                    className="p-3.5 rounded-2xl border border-emerald-300 bg-emerald-50/30 flex items-center gap-3 hover:border-emerald-500 transition"
                  >
                    <img
                      src={child.photo_url || 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100'}
                      alt={child.full_name}
                      className="w-10 h-10 rounded-xl object-cover border border-emerald-200 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <Link href={`/jemaat/${child.id}`} className="block font-bold text-xs text-navy-950 truncate hover:text-gold-600">
                        {child.full_name}
                      </Link>
                      <p className="font-mono text-[10px] text-slate-400">{child.member_number}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {child.dob ? `${new Date().getFullYear() - new Date(child.dob).getFullYear()} Tahun` : '-'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Level 3: Famili Lain (Orang tua / Lainnya) */}
          {others && others.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block text-center">
                Famili / Anggota Lain dalam Rumah
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {others.map((oth: any) => (
                  <div key={oth.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center gap-3">
                    <img
                      src={oth.photo_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'}
                      alt={oth.full_name}
                      className="w-9 h-9 rounded-full object-cover shrink-0"
                    />
                    <div>
                      <Link href={`/jemaat/${oth.id}`} className="font-bold text-xs text-navy-950 truncate hover:text-gold-600">
                        {oth.full_name}
                      </Link>
                      <p className="text-[10px] text-slate-400">{oth.family_relation.replace('_', ' ')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Hubungkan Jemaat ke Keluarga */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="Hubungkan Anggota Jemaat ke KK"
        subtitle={`Tambahkan jemaat terdaftar ke ${family.family_name}`}
        maxWidth="md"
      >
        <form onSubmit={handleAssignMember} className="space-y-4">
          <Select
            label="Pilih Anggota Jemaat *"
            value={selectedMemberId}
            onChange={(e) => setSelectedMemberId(e.target.value)}
            required
          >
            <option value="">-- Pilih dari Jemaat Aktif --</option>
            {allMembers
              .filter((m) => m.family_id !== id)
              .map((m) => (
                <option key={m.id} value={m.id}>
                  {m.member_number} - {m.full_name}
                </option>
              ))}
          </Select>

          <Select
            label="Hubungan Keluarga *"
            value={relation}
            onChange={(e) => setRelation(e.target.value)}
          >
            <option value="ANAK">Anak</option>
            <option value="ISTRI">Istri</option>
            <option value="KEPALA_KELUARGA">Kepala Keluarga</option>
            <option value="ORANG_TUA">Orang Tua</option>
            <option value="FAMILI_LAIN">Famili Lain</option>
          </Select>

          <p className="text-[11px] text-slate-400">
            Catatan: Relasi keluarga akan diperbarui tanpa membuat duplikasi data jemaat.
          </p>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button variant="secondary" size="md" type="button" onClick={() => setIsAssignModalOpen(false)}>
              Batal
            </Button>
            <Button variant="gold" size="md" type="submit" isLoading={isAssigning}>
              Hubungkan ke KK
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
