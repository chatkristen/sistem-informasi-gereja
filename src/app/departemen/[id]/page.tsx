'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import { Card, CardHeader, CardTitle, CardContent, Badge, Input, Select } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { formatDateIndo, formatCurrency, getProgramStatusBadge } from '@/lib/utils';
import {
  Building2,
  Users,
  Plus,
  ArrowLeft,
  UserPlus,
  Trash2,
  Sparkles,
  Calendar,
  Phone,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';

export default function DepartmentDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { roleCode, can, currentUser } = useAuth();
  const { showToast } = useNotification();

  const [dept, setDept] = useState<any>(null);
  const [allMembers, setAllMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State for Enrolling Member
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignData, setAssignData] = useState({
    member_id: '',
    position_name: 'Anggota',
    notes: '',
  });
  const [isAssigning, setIsAssigning] = useState(false);

  const loadDeptDetail = async () => {
    setIsLoading(true);
    try {
      const [resDept, resMem] = await Promise.all([
        fetch(`/api/departemen/${id}`),
        fetch('/api/jemaat'),
      ]);
      const dataDept = await resDept.json();
      const dataMem = await resMem.json();

      if (dataDept.success) setDept(dataDept.data);
      if (dataMem.success) setAllMembers(dataMem.data);
    } catch (err) {
      console.error(err);
      showToast('error', 'Gagal memuat detail komisi');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadDeptDetail();
  }, [id]);

  const handleAssignMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignData.member_id) {
      showToast('warning', 'Pilih Jemaat', 'Silakan pilih jemaat yang ingin didaftarkan ke komisi');
      return;
    }

    setIsAssigning(true);
    try {
      const res = await fetch(`/api/departemen/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...assignData,
          actor_name: currentUser?.full_name || 'Admin',
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast('success', 'Anggota Terdaftar', `Jemaat berhasil didaftarkan ke ${dept.name} sebagai ${assignData.position_name}`);
        setIsAssignModalOpen(false);
        setAssignData({ member_id: '', position_name: 'Anggota', notes: '' });
        loadDeptDetail();
      }
    } catch (err: any) {
      showToast('error', 'Gagal', err.message);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Keluarkan ${memberName} dari keanggotaan ${dept.name}?`)) return;

    try {
      const res = await fetch(`/api/departemen/${id}?member_id=${memberId}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        showToast('info', 'Dikeluarkan', `${memberName} telah dikeluarkan dari ${dept.name}`);
        loadDeptDetail();
      }
    } catch (err) {
      showToast('error', 'Gagal mengeluarkan anggota');
    }
  };

  if (isLoading || !dept) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-navy-900 border-t-gold-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Check if current user is Ketua of this department
  const isKetuaOfThisDept =
    roleCode === 'SUPER_ADMIN' ||
    (roleCode === 'KETUA_DEPARTEMEN' && currentUser?.department_id === id);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <Link href="/departemen">
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Kembali ke Daftar Komisi
          </Button>
        </Link>

        {isKetuaOfThisDept && (
          <Button
            variant="gold"
            size="sm"
            onClick={() => setIsAssignModalOpen(true)}
            leftIcon={<UserPlus className="w-4 h-4" />}
          >
            Daftarkan Anggota Baru
          </Button>
        )}
      </div>

      {/* Dept Header Card */}
      <Card className="bg-gradient-to-r from-navy-950 to-navy-900 text-white border-navy-800">
        <CardContent className="p-6 md:p-8 flex flex-col md:flex-row items-start justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-gold-500 text-navy-950">
                {dept.code}
              </span>
              <span className="text-xs bg-navy-800 text-navy-200 px-2.5 py-0.5 rounded-full">
                {dept.category}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white">{dept.name}</h1>
            <p className="text-xs text-navy-200 max-w-2xl leading-relaxed">{dept.description}</p>
          </div>

          <div className="p-4 rounded-xl bg-white/10 backdrop-blur text-xs space-y-1 shrink-0 text-right">
            <p className="text-navy-300">Total Anggota Komisi</p>
            <p className="text-2xl font-black text-gold-400">{dept.members?.length || 0} Jemaat</p>
          </div>
        </CardContent>
      </Card>

      {/* Roster of Department Members */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-navy-900" />
            <CardTitle>Susunan Pengurus & Anggota Komisi</CardTitle>
          </div>
          <span className="text-xs text-slate-400">
            Mendukung keanggotaan multi-komisi dengan jabatan masing-masing
          </span>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Nama Anggota</th>
                  <th className="px-4 py-3">No. Anggota</th>
                  <th className="px-4 py-3">Jabatan / Peran</th>
                  <th className="px-4 py-3">Kontak Telepon</th>
                  <th className="px-4 py-3">Bergabung Sejak</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dept.members?.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      Belum ada anggota yang terdaftar di komisi ini.
                    </td>
                  </tr>
                ) : (
                  dept.members.map((dm: any) => (
                    <tr key={dm.id} className="hover:bg-slate-50 transition">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={dm.photo_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'}
                            alt={dm.member_name}
                            className="w-8 h-8 rounded-full object-cover shrink-0"
                          />
                          <Link href={`/jemaat/${dm.member_id}`} className="font-bold text-navy-950 hover:text-gold-600">
                            {dm.member_name}
                          </Link>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 font-mono text-[11px] font-bold text-slate-600">
                        {dm.member_number}
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-navy-50 text-navy-900 border border-navy-200">
                          {dm.position_name}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-slate-600">{dm.phone || '-'}</td>

                      <td className="px-4 py-3.5 text-slate-500">{formatDateIndo(dm.joined_at)}</td>

                      <td className="px-4 py-3.5 text-right">
                        {isKetuaOfThisDept && (
                          <button
                            onClick={() => handleRemoveMember(dm.member_id, dm.member_name)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                            title="Keluarkan dari Komisi"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Program Kerja Komisi */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-gold-600" />
            <CardTitle>Program Kerja {dept.name}</CardTitle>
          </div>
          <Link href="/program-kerja">
            <Button variant="ghost" size="sm">
              Kelola Program Kerja
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="space-y-3">
          {dept.workPrograms?.length === 0 ? (
            <p className="text-xs text-slate-400 p-6 text-center">
              Belum ada program kerja yang disusun untuk komisi ini.
            </p>
          ) : (
            dept.workPrograms.map((wp: any) => {
              const statusBadge = getProgramStatusBadge(wp.status);
              return (
                <div key={wp.id} className="p-4 rounded-xl border border-slate-200 bg-white flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-navy-950">{wp.title}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">{wp.description}</p>
                    <p className="text-[10px] text-slate-400 mt-1">PIC: {wp.pic_member_name} • Pagu: {formatCurrency(wp.budget_allocated)}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusBadge.color}`}>
                    {statusBadge.label}
                  </span>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Modal Pendaftaran Anggota ke Komisi */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="Daftarkan Anggota ke Komisi"
        subtitle={`Menambahkan jemaat ke dalam pelayanan ${dept.name}`}
        maxWidth="md"
      >
        <form onSubmit={handleAssignMember} className="space-y-4">
          <Select
            label="Pilih Jemaat *"
            value={assignData.member_id}
            onChange={(e) => setAssignData({ ...assignData, member_id: e.target.value })}
            required
          >
            <option value="">-- Pilih Anggota Jemaat --</option>
            {allMembers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.member_number} - {m.full_name}
              </option>
            ))}
          </Select>

          <Select
            label="Jabatan / Peran dalam Komisi *"
            value={assignData.position_name}
            onChange={(e) => setAssignData({ ...assignData, position_name: e.target.value })}
          >
            <option value="Ketua">Ketua</option>
            <option value="Wakil Ketua">Wakil Ketua</option>
            <option value="Sekretaris">Sekretaris</option>
            <option value="Bendahara">Bendahara</option>
            <option value="Anggota">Anggota</option>
            <option value="Worship Leader / Song Leader">Worship Leader / Song Leader</option>
            <option value="Pemain Musik (Keyboard / Bass / Drum)">Pemain Musik (Keyboard / Bass / Drum)</option>
            <option value="Operator Slide & Live Stream">Operator Slide & Live Stream</option>
            <option value="Sound Engineer">Sound Engineer</option>
          </Select>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">Catatan Pelayanan</label>
            <textarea
              rows={2}
              value={assignData.notes}
              onChange={(e) => setAssignData({ ...assignData, notes: e.target.value })}
              placeholder="Catatan talenta, jadwal latihan, dll..."
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:outline-none focus:border-navy-600"
            ></textarea>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button variant="secondary" size="md" type="button" onClick={() => setIsAssignModalOpen(false)}>
              Batal
            </Button>
            <Button variant="gold" size="md" type="submit" isLoading={isAssigning}>
              Daftarkan ke Komisi
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
