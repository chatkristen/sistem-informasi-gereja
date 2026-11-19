import { RoleCode } from './types';

export type ActionType = 'view' | 'create' | 'edit' | 'delete' | 'approve' | 'export';

export type ModuleName = 
  | 'dashboard'
  | 'jemaat'
  | 'jemaat_pastoral_notes'
  | 'keluarga'
  | 'keuangan_umum'
  | 'persembahan_kolektif'
  | 'persembahan_individual' // Highly confidential
  | 'kas_bank'
  | 'anggaran'
  | 'departemen'
  | 'program_kerja'
  | 'kegiatan'
  | 'diakonia' // Confidential
  | 'inventaris'
  | 'pengumuman'
  | 'laporan'
  | 'pengguna'
  | 'audit_log';

export interface RoleDefinition {
  code: RoleCode;
  name: string;
  badgeColor: string;
  description: string;
}

export const ROLES: Record<RoleCode, RoleDefinition> = {
  SUPER_ADMIN: {
    code: 'SUPER_ADMIN',
    name: 'Super Admin',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
    description: 'Akses penuh ke seluruh modul, konfigurasi sistem, audit log, dan hak akses pengguna.',
  },
  PENDETA: {
    code: 'PENDETA',
    name: 'Gembala / Pendeta',
    badgeColor: 'bg-navy-100 text-navy-800 border-navy-300',
    description: 'Pelayanan pastoral, pengawasan jemaat, evaluasi program kerja, dan laporan umum.',
  },
  SEKRETARIS: {
    code: 'SEKRETARIS',
    name: 'Sekretaris Gereja',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
    description: 'Pengelolaan data jemaat, keluarga, surat menyurat, pengumuman, dan kalender kegiatan.',
  },
  BENDAHARA: {
    code: 'BENDAHARA',
    name: 'Bendahara Gereja',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    description: 'Pengelolaan pemasukan, pengeluaran, kas & bank, anggaran, serta persembahan kolektif & individual.',
  },
  KETUA_DEPARTEMEN: {
    code: 'KETUA_DEPARTEMEN',
    name: 'Ketua Departemen / Komisi',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
    description: 'Pengelolaan keanggotaan komisi, penyusunan program kerja, kegiatan, dan pengajuan anggaran departemen.',
  },
  PENGURUS_DEPARTEMEN: {
    code: 'PENGURUS_DEPARTEMEN',
    name: 'Pengurus Komisi',
    badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
    description: 'Mendukung pelaksanaan kegiatan dan administrasi di dalam komisi masing-masing.',
  },
};

// RBAC Permissions Mapping
export const ROLE_PERMISSIONS: Record<RoleCode, Record<ModuleName, ActionType[]>> = {
  SUPER_ADMIN: {
    dashboard: ['view', 'export'],
    jemaat: ['view', 'create', 'edit', 'delete', 'export'],
    jemaat_pastoral_notes: ['view', 'create', 'edit'],
    keluarga: ['view', 'create', 'edit', 'delete', 'export'],
    keuangan_umum: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
    persembahan_kolektif: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
    persembahan_individual: ['view', 'create', 'edit', 'delete', 'export'],
    kas_bank: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
    anggaran: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
    departemen: ['view', 'create', 'edit', 'delete', 'export'],
    program_kerja: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
    kegiatan: ['view', 'create', 'edit', 'delete', 'export'],
    diakonia: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
    inventaris: ['view', 'create', 'edit', 'delete', 'export'],
    pengumuman: ['view', 'create', 'edit', 'delete', 'export'],
    laporan: ['view', 'export'],
    pengguna: ['view', 'create', 'edit', 'delete', 'export'],
    audit_log: ['view', 'export'],
  },
  PENDETA: {
    dashboard: ['view'],
    jemaat: ['view', 'edit', 'export'],
    jemaat_pastoral_notes: ['view', 'create', 'edit'], // Exclusive pastoral privilege
    keluarga: ['view', 'export'],
    keuangan_umum: ['view', 'export'], // Ringkasan global saja
    persembahan_kolektif: ['view', 'export'],
    persembahan_individual: [], // STRICT: Locked from pastoral by church spec
    kas_bank: ['view'],
    anggaran: ['view'],
    departemen: ['view'],
    program_kerja: ['view', 'approve'],
    kegiatan: ['view'],
    diakonia: ['view', 'approve'], // Bantuan jemaat dapat disetujui gembala
    inventaris: ['view'],
    pengumuman: ['view', 'create', 'edit'],
    laporan: ['view', 'export'],
    pengguna: [],
    audit_log: [],
  },
  SEKRETARIS: {
    dashboard: ['view'],
    jemaat: ['view', 'create', 'edit', 'delete', 'export'],
    jemaat_pastoral_notes: [], // STRICT: Locked
    keluarga: ['view', 'create', 'edit', 'delete', 'export'],
    keuangan_umum: [],
    persembahan_kolektif: [],
    persembahan_individual: [],
    kas_bank: [],
    anggaran: [],
    departemen: ['view', 'create', 'edit'],
    program_kerja: ['view', 'export'],
    kegiatan: ['view', 'create', 'edit', 'delete', 'export'],
    diakonia: [],
    inventaris: ['view', 'create', 'edit', 'export'],
    pengumuman: ['view', 'create', 'edit', 'delete', 'export'],
    laporan: ['view', 'export'],
    pengguna: [],
    audit_log: [],
  },
  BENDAHARA: {
    dashboard: ['view', 'export'],
    jemaat: ['view'], // Hanya untuk referensi pencatatan persembahan
    jemaat_pastoral_notes: [],
    keluarga: ['view'],
    keuangan_umum: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
    persembahan_kolektif: ['view', 'create', 'edit', 'approve', 'export'],
    persembahan_individual: ['view', 'create', 'edit', 'export'], // Authorized
    kas_bank: ['view', 'create', 'edit', 'approve', 'export'],
    anggaran: ['view', 'create', 'edit', 'approve', 'export'],
    departemen: ['view'],
    program_kerja: ['view'], // Untuk memeriksa alokasi anggaran
    kegiatan: ['view'],
    diakonia: ['view', 'approve'], // Untuk verifikasi pencairan dana sosial
    inventaris: ['view'],
    pengumuman: ['view'],
    laporan: ['view', 'export'],
    pengguna: [],
    audit_log: [],
  },
  KETUA_DEPARTEMEN: {
    dashboard: ['view'],
    jemaat: ['view'], // Melihat anggota komisi
    jemaat_pastoral_notes: [],
    keluarga: [],
    keuangan_umum: [],
    persembahan_kolektif: [],
    persembahan_individual: [],
    kas_bank: [],
    anggaran: ['view', 'create'], // Melihat anggaran dept sendiri & mengajukan usulan
    departemen: ['view', 'edit'], // Hanya departemen sendiri
    program_kerja: ['view', 'create', 'edit'], // Program kerja dept sendiri
    kegiatan: ['view', 'create', 'edit'], // Kegiatan dept sendiri
    diakonia: [],
    inventaris: ['view', 'create'], // Peminjaman aset
    pengumuman: ['view', 'create'], // Pengumuman departemen
    laporan: ['view', 'export'], // Laporan departemen sendiri
    pengguna: [],
    audit_log: [],
  },
  PENGURUS_DEPARTEMEN: {
    dashboard: ['view'],
    jemaat: [],
    jemaat_pastoral_notes: [],
    keluarga: [],
    keuangan_umum: [],
    persembahan_kolektif: [],
    persembahan_individual: [],
    kas_bank: [],
    anggaran: ['view'],
    departemen: ['view'],
    program_kerja: ['view', 'create'],
    kegiatan: ['view', 'create'],
    diakonia: [],
    inventaris: ['view'],
    pengumuman: ['view'],
    laporan: [],
    pengguna: [],
    audit_log: [],
  },
};

export function hasPermission(
  role: RoleCode,
  module: ModuleName,
  action: ActionType
): boolean {
  if (role === 'SUPER_ADMIN') return true;
  const permissions = ROLE_PERMISSIONS[role]?.[module] || [];
  return permissions.includes(action);
}

export function canAccessIndividualOfferings(role: RoleCode): boolean {
  return role === 'SUPER_ADMIN' || role === 'BENDAHARA';
}

export function canAccessPastoralNotes(role: RoleCode): boolean {
  return role === 'SUPER_ADMIN' || role === 'PENDETA';
}

export function canAccessDiakoniaDetails(role: RoleCode): boolean {
  return role === 'SUPER_ADMIN' || role === 'PENDETA' || role === 'BENDAHARA';
}
