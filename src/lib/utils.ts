import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Currency formatting (IDR)
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Date formatting in Indonesian
export function formatDateIndo(dateStr?: string | null): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateStr;
  }
}

// DateTime formatting
export function formatDateTimeIndo(dateTimeStr?: string | null): string {
  if (!dateTimeStr) return '-';
  try {
    const d = new Date(dateTimeStr);
    if (isNaN(d.getTime())) return dateTimeStr;
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return dateTimeStr;
  }
}

// Status Badges Colors & Labels in Indonesian
export function getMemberStatusBadge(status: string) {
  switch (status) {
    case 'ACTIVE':
      return { label: 'Aktif', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    case 'INACTIVE':
      return { label: 'Tidak Aktif', color: 'bg-slate-100 text-slate-700 border-slate-200' };
    case 'MOVED':
      return { label: 'Pindah', color: 'bg-amber-50 text-amber-700 border-amber-200' };
    case 'DECEASED':
      return { label: 'Meninggal Dunia', color: 'bg-rose-50 text-rose-700 border-rose-200' };
    default:
      return { label: status, color: 'bg-slate-100 text-slate-700 border-slate-200' };
  }
}

export function getFamilyRelationBadge(rel: string) {
  switch (rel) {
    case 'KEPALA_KELUARGA':
      return { label: 'Kepala Keluarga', color: 'bg-blue-50 text-blue-700 border-blue-200' };
    case 'ISTRI':
      return { label: 'Istri', color: 'bg-pink-50 text-pink-700 border-pink-200' };
    case 'ANAK':
      return { label: 'Anak', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    case 'ORANG_TUA':
      return { label: 'Orang Tua', color: 'bg-purple-50 text-purple-700 border-purple-200' };
    case 'FAMILI_LAIN':
      return { label: 'Famili Lain', color: 'bg-slate-100 text-slate-700 border-slate-200' };
    default:
      return { label: rel, color: 'bg-slate-100 text-slate-700 border-slate-200' };
  }
}

export function getTransactionStatusBadge(status: string) {
  switch (status) {
    case 'RECORDED':
      return { label: 'Tercatat', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    case 'VERIFIED':
      return { label: 'Terverifikasi', color: 'bg-blue-50 text-blue-700 border-blue-200' };
    case 'REVERSED':
      return { label: 'Dibatalkan / Reversal', color: 'bg-rose-50 text-rose-700 border-rose-200' };
    default:
      return { label: status, color: 'bg-slate-100 text-slate-700 border-slate-200' };
  }
}

export function getProgramStatusBadge(status: string) {
  switch (status) {
    case 'DRAFT':
      return { label: 'Draft', color: 'bg-slate-100 text-slate-700 border-slate-200' };
    case 'PENDING_APPROVAL':
      return { label: 'Menunggu Persetujuan', color: 'bg-amber-50 text-amber-700 border-amber-200' };
    case 'APPROVED':
      return { label: 'Disetujui', color: 'bg-blue-50 text-blue-700 border-blue-200' };
    case 'ONGOING':
      return { label: 'Sedang Berjalan', color: 'bg-purple-50 text-purple-700 border-purple-200' };
    case 'COMPLETED':
      return { label: 'Selesai', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    case 'CANCELLED':
      return { label: 'Dibatalkan', color: 'bg-rose-50 text-rose-700 border-rose-200' };
    default:
      return { label: status, color: 'bg-slate-100 text-slate-700 border-slate-200' };
  }
}

export function getDiakoniaStatusBadge(status: string) {
  switch (status) {
    case 'SUBMITTED':
      return { label: 'Diajukan', color: 'bg-amber-50 text-amber-700 border-amber-200' };
    case 'VERIFIED':
      return { label: 'Terverifikasi', color: 'bg-blue-50 text-blue-700 border-blue-200' };
    case 'APPROVED':
      return { label: 'Disetujui', color: 'bg-purple-50 text-purple-700 border-purple-200' };
    case 'REJECTED':
      return { label: 'Ditolak', color: 'bg-rose-50 text-rose-700 border-rose-200' };
    case 'DISTRIBUTED':
      return { label: 'Telah Disalurkan', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    default:
      return { label: status, color: 'bg-slate-100 text-slate-700 border-slate-200' };
  }
}

export function getOfferingTypeLabel(type?: string) {
  switch (type) {
    case 'PERSEMBAHAN_UMUM': return 'Persembahan Umum';
    case 'PERPULUHAN': return 'Perpuluhan';
    case 'PEMBANGUNAN': return 'Persembahan Pembangunan';
    case 'MISI': return 'Persembahan Misi';
    case 'KHUSUS': return 'Persembahan Khusus';
    case 'DONASI': return 'Donasi / Syukur';
    default: return type || 'Pemasukan Lainnya';
  }
}
