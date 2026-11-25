'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import { Card, CardHeader, CardTitle, CardContent, Badge, Select } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  formatCurrency,
  formatDateIndo,
  formatDateTimeIndo,
  getOfferingTypeLabel,
} from '@/lib/utils';
import { exportToExcel, exportToPDF } from '@/lib/export-utils';
import {
  FileSpreadsheet,
  FileText,
  Printer,
  Users,
  DollarSign,
  PieChart,
  Box,
  HeartHandshake,
  Sparkles,
  Download,
} from 'lucide-react';

export default function LaporanPage() {
  const { roleCode, can, currentUser } = useAuth();
  const { showToast } = useNotification();

  const [selectedReport, setSelectedReport] = useState<
    'jemaat' | 'keuangan' | 'persembahan' | 'anggaran' | 'program' | 'inventaris' | 'diakonia'
  >('jemaat');

  const [reportData, setReportData] = useState<any[]>([]);
  const [budgetSummary, setBudgetSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchReportData() {
      setIsLoading(true);
      try {
        if (selectedReport === 'jemaat') {
          const res = await fetch(`/api/jemaat?role=${roleCode}`);
          const json = await res.json();
          if (json.success) setReportData(json.data);
        } else if (selectedReport === 'keuangan') {
          const res = await fetch(`/api/keuangan/transaksi?role=${roleCode}`);
          const json = await res.json();
          if (json.success) setReportData(json.data);
        } else if (selectedReport === 'persembahan') {
          const res = await fetch(`/api/keuangan/transaksi?type=INCOME&role=${roleCode}`);
          const json = await res.json();
          if (json.success) setReportData(json.data);
        } else if (selectedReport === 'anggaran') {
          const res = await fetch('/api/keuangan/anggaran');
          const json = await res.json();
          if (json.success) {
            setReportData(json.details);
            setBudgetSummary(json.budget);
          }
        } else if (selectedReport === 'program') {
          const res = await fetch('/api/program-kerja');
          const json = await res.json();
          if (json.success) setReportData(json.data);
        } else if (selectedReport === 'inventaris') {
          const res = await fetch('/api/inventaris');
          const json = await res.json();
          if (json.success) setReportData(json.items);
        } else if (selectedReport === 'diakonia') {
          const res = await fetch(`/api/diakonia?role=${roleCode}`);
          const json = await res.json();
          if (json.success) setReportData(json.data);
        }
      } catch (err) {
        console.error(err);
        showToast('error', 'Gagal memuat preview laporan');
      } finally {
        setIsLoading(false);
      }
    }

    fetchReportData();
  }, [selectedReport, roleCode]);

  // Export handlers tailored for each report type
  const handleExportExcel = () => {
    if (selectedReport === 'jemaat') {
      const cols = [
        { header: 'No. Anggota', key: 'member_number' },
        { header: 'Nama Lengkap', key: 'full_name' },
        { header: 'L/P', key: 'gender' },
        { header: 'Telepon', key: 'phone' },
        { header: 'Alamat', key: 'address' },
        { header: 'Status', key: 'status' },
      ];
      exportToExcel('Laporan_Jemaat_GKKA', 'Jemaat', reportData, cols);
    } else if (selectedReport === 'keuangan' || selectedReport === 'persembahan') {
      const cols = [
        { header: 'No. Transaksi', key: 'transaction_number' },
        { header: 'Tanggal', key: 'transaction_date' },
        { header: 'Tipe', key: 'type' },
        { header: 'Kategori', key: 'category_name' },
        { header: 'Akun Kas', key: 'account_name' },
        { header: 'Nominal', key: 'amount', format: (v: number) => formatCurrency(v) },
        { header: 'Keterangan', key: 'description' },
      ];
      exportToExcel('Laporan_Keuangan_GKKA', 'Keuangan', reportData, cols);
    } else if (selectedReport === 'anggaran') {
      const cols = [
        { header: 'Pos Anggaran', key: 'department_name' },
        { header: 'Kategori', key: 'category_name' },
        { header: 'Alokasi Pagu', key: 'allocated_amount', format: (v: number) => formatCurrency(v) },
        { header: 'Realisasi', key: 'realized_amount', format: (v: number) => formatCurrency(v) },
      ];
      exportToExcel('Laporan_Anggaran_RAPBG_GKKA', 'Anggaran', reportData, cols);
    } else if (selectedReport === 'program') {
      const cols = [
        { header: 'Program Kerja', key: 'title' },
        { header: 'Komisi', key: 'department_name' },
        { header: 'PIC', key: 'pic_member_name' },
        { header: 'Pagu Anggaran', key: 'budget_allocated', format: (v: number) => formatCurrency(v) },
        { header: 'Status', key: 'status' },
      ];
      exportToExcel('Laporan_Program_Kerja_GKKA', 'Program', reportData, cols);
    } else if (selectedReport === 'inventaris') {
      const cols = [
        { header: 'Kode Aset', key: 'item_code' },
        { header: 'Nama Perlengkapan', key: 'name' },
        { header: 'Kategori', key: 'category_name' },
        { header: 'Jumlah', key: 'quantity' },
        { header: 'Kondisi', key: 'condition' },
        { header: 'Lokasi', key: 'location' },
      ];
      exportToExcel('Laporan_Inventaris_Aset_GKKA', 'Inventaris', reportData, cols);
    } else if (selectedReport === 'diakonia') {
      const cols = [
        { header: 'No. Surat', key: 'request_number' },
        { header: 'Tanggal', key: 'request_date' },
        { header: 'Kategori', key: 'category' },
        { header: 'Penerima', key: 'recipient_name' },
        { header: 'Nominal', key: 'requested_amount', format: (v: number) => formatCurrency(v) },
        { header: 'Status', key: 'status' },
      ];
      exportToExcel('Laporan_Diakonia_GKKA', 'Diakonia', reportData, cols);
    }
    showToast('info', 'Excel Berhasil', 'File laporan spreadsheet telah diunduh.');
  };

  const handleExportPDF = () => {
    const titles = {
      jemaat: 'LAPORAN REKAPITULASI ANGGOTA JEMAAT',
      keuangan: 'LAPORAN PEMBUKUAN KAS & KEUANGAN UMUM',
      persembahan: 'LAPORAN PENERIMAAN PERSEMBAHAN & PERPULUHAN',
      anggaran: 'LAPORAN EVALUASI & REALISASI ANGGARAN (RAPBG)',
      program: 'LAPORAN PENCAPAIAN PROGRAM KERJA KOMISI',
      inventaris: 'LAPORAN BUKU INDUK ASET & INVENTARIS',
      diakonia: 'LAPORAN PENYALURAN BANTUAN SOSIAL DIAKONIA',
    };

    let cols: any[] = [];
    if (selectedReport === 'jemaat') {
      cols = [
        { header: 'No. Anggota', key: 'member_number' },
        { header: 'Nama Lengkap', key: 'full_name' },
        { header: 'L/P', key: 'gender' },
        { header: 'Telepon', key: 'phone' },
        { header: 'Status', key: 'status' },
      ];
    } else if (selectedReport === 'keuangan' || selectedReport === 'persembahan') {
      cols = [
        { header: 'No. Bukti', key: 'transaction_number' },
        { header: 'Tanggal', key: 'transaction_date' },
        { header: 'Kategori', key: 'category_name' },
        { header: 'Akun Kas', key: 'account_name' },
        { header: 'Nominal', key: 'amount', format: (v: number) => formatCurrency(v) },
      ];
    } else if (selectedReport === 'anggaran') {
      cols = [
        { header: 'Pos Komisi', key: 'department_name' },
        { header: 'Kategori', key: 'category_name' },
        { header: 'Pagu', key: 'allocated_amount', format: (v: number) => formatCurrency(v) },
        { header: 'Realisasi', key: 'realized_amount', format: (v: number) => formatCurrency(v) },
      ];
    } else if (selectedReport === 'program') {
      cols = [
        { header: 'Program Kerja', key: 'title' },
        { header: 'Komisi', key: 'department_name' },
        { header: 'PIC', key: 'pic_member_name' },
        { header: 'Status', key: 'status' },
      ];
    } else if (selectedReport === 'inventaris') {
      cols = [
        { header: 'Kode', key: 'item_code' },
        { header: 'Nama Barang', key: 'name' },
        { header: 'Kategori', key: 'category_name' },
        { header: 'Kondisi', key: 'condition' },
        { header: 'Lokasi', key: 'location' },
      ];
    } else if (selectedReport === 'diakonia') {
      cols = [
        { header: 'No. Surat', key: 'request_number' },
        { header: 'Kategori', key: 'category' },
        { header: 'Penerima', key: 'recipient_name' },
        { header: 'Nominal', key: 'requested_amount', format: (v: number) => formatCurrency(v) },
        { header: 'Status', key: 'status' },
      ];
    }

    exportToPDF(titles[selectedReport], 'Gereja Kristen Kasih Anugerah', reportData, cols, `Laporan_${selectedReport}_GKKA`);
    showToast('info', 'PDF Berhasil', 'Dokumen PDF resmi gereja telah dicetak.');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-navy-950 tracking-tight flex items-center gap-2.5">
            <FileSpreadsheet className="w-6 h-6 text-navy-900" />
            Pusat Laporan & Eksekutif Terpadu
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Pratinjau laporan seluruh modul operasional dengan fasilitas ekspor resmi format Excel dan PDF.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" onClick={handleExportExcel} leftIcon={<FileSpreadsheet className="w-4 h-4 text-emerald-600" />}>
            Export Excel (.xlsx)
          </Button>
          <Button variant="gold" size="sm" onClick={handleExportPDF} leftIcon={<Printer className="w-4 h-4" />}>
            Cetak PDF Resmi
          </Button>
        </div>
      </div>

      {/* Report Selector Pills */}
      <Card>
        <CardContent className="p-4 flex flex-wrap items-center gap-2">
          {[
            { key: 'jemaat', label: 'Laporan Data Jemaat', icon: Users },
            { key: 'keuangan', label: 'Laporan Keuangan & Kas', icon: DollarSign },
            { key: 'persembahan', label: 'Laporan Persembahan', icon: DollarSign },
            { key: 'anggaran', label: 'Laporan Realisasi RAPBG', icon: PieChart },
            { key: 'program', label: 'Laporan Program Kerja', icon: Sparkles },
            { key: 'inventaris', label: 'Laporan Inventaris Aset', icon: Box },
            { key: 'diakonia', label: 'Laporan Penyaluran Diakonia', icon: HeartHandshake },
          ].map((item) => {
            const Icon = item.icon;
            const active = selectedReport === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setSelectedReport(item.key as any)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                  active
                    ? 'bg-navy-900 text-gold-400 shadow-md shadow-navy-950/20'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </button>
            );
          })}
        </CardContent>
      </Card>

      {/* Live Report Preview Container */}
      <Card>
        <CardHeader className="bg-slate-50/50">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gold-600">
              Pratinjau Dokumen Cetak
            </span>
            <CardTitle className="text-base mt-0.5">
              {selectedReport.toUpperCase()} — GEREJA KRISTEN KASIH ANUGERAH
            </CardTitle>
          </div>
          <Badge variant="navy">Total Record: {reportData.length}</Badge>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                {selectedReport === 'jemaat' && (
                  <tr>
                    <th className="px-5 py-3">No. Anggota</th>
                    <th className="px-4 py-3">Nama Lengkap</th>
                    <th className="px-4 py-3">Gender</th>
                    <th className="px-4 py-3">Telepon</th>
                    <th className="px-4 py-3">Alamat</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                )}
                {(selectedReport === 'keuangan' || selectedReport === 'persembahan') && (
                  <tr>
                    <th className="px-5 py-3">No. Transaksi</th>
                    <th className="px-4 py-3">Tanggal</th>
                    <th className="px-4 py-3">Tipe / Kategori</th>
                    <th className="px-4 py-3">Akun Kas</th>
                    <th className="px-4 py-3">Keterangan</th>
                    <th className="px-4 py-3 text-right">Nominal</th>
                  </tr>
                )}
                {selectedReport === 'anggaran' && (
                  <tr>
                    <th className="px-5 py-3">Pos Komisi</th>
                    <th className="px-4 py-3">Kategori</th>
                    <th className="px-4 py-3 text-right">Pagu Alokasi</th>
                    <th className="px-4 py-3 text-right">Realisasi Aktual</th>
                    <th className="px-4 py-3 text-right">Sisa Pagu</th>
                  </tr>
                )}
                {selectedReport === 'program' && (
                  <tr>
                    <th className="px-5 py-3">Program Kerja</th>
                    <th className="px-4 py-3">Komisi</th>
                    <th className="px-4 py-3">PIC</th>
                    <th className="px-4 py-3">Pagu Anggaran</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                )}
                {selectedReport === 'inventaris' && (
                  <tr>
                    <th className="px-5 py-3">Kode Aset</th>
                    <th className="px-4 py-3">Nama Perlengkapan</th>
                    <th className="px-4 py-3">Kategori</th>
                    <th className="px-4 py-3">Jumlah</th>
                    <th className="px-4 py-3">Kondisi</th>
                    <th className="px-4 py-3">Lokasi</th>
                  </tr>
                )}
                {selectedReport === 'diakonia' && (
                  <tr>
                    <th className="px-5 py-3">No. Surat</th>
                    <th className="px-4 py-3">Tanggal</th>
                    <th className="px-4 py-3">Kategori</th>
                    <th className="px-4 py-3">Penerima Bantuan</th>
                    <th className="px-4 py-3 text-right">Nominal</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                )}
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      <div className="inline-block w-6 h-6 border-2 border-navy-900 border-t-gold-500 rounded-full animate-spin"></div>
                      <p className="mt-2 text-xs">Menyiapkan laporan...</p>
                    </td>
                  </tr>
                ) : reportData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      Tidak ada data untuk laporan ini.
                    </td>
                  </tr>
                ) : (
                  reportData.map((row: any, idx: number) => (
                    <tr key={row.id || idx} className="hover:bg-slate-50 transition">
                      {selectedReport === 'jemaat' && (
                        <>
                          <td className="px-5 py-3 font-mono font-bold text-navy-900">{row.member_number}</td>
                          <td className="px-4 py-3 font-bold text-slate-900">{row.full_name}</td>
                          <td className="px-4 py-3 text-slate-600">{row.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</td>
                          <td className="px-4 py-3 text-slate-600">{row.phone}</td>
                          <td className="px-4 py-3 text-slate-600 break-words min-w-[200px]">{row.address}</td>
                          <td className="px-4 py-3">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {row.status}
                            </span>
                          </td>
                        </>
                      )}

                      {(selectedReport === 'keuangan' || selectedReport === 'persembahan') && (
                        <>
                          <td className="px-5 py-3 font-mono font-bold text-navy-900">{row.transaction_number}</td>
                          <td className="px-4 py-3 text-slate-600">{formatDateIndo(row.transaction_date)}</td>
                          <td className="px-4 py-3 font-semibold text-slate-900">{row.category_name || row.type}</td>
                          <td className="px-4 py-3 text-slate-600">{row.account_name}</td>
                          <td className="px-4 py-3 text-slate-500 line-clamp-2 leading-relaxed min-w-[180px]">{row.description}</td>
                          <td className="px-4 py-3 text-right font-black text-navy-950">{formatCurrency(row.amount)}</td>
                        </>
                      )}

                      {selectedReport === 'anggaran' && (
                        <>
                          <td className="px-5 py-3 font-bold text-navy-900">{row.department_name}</td>
                          <td className="px-4 py-3 text-slate-600">{row.category_name}</td>
                          <td className="px-4 py-3 text-right font-semibold text-slate-800">{formatCurrency(row.allocated_amount)}</td>
                          <td className="px-4 py-3 text-right font-black text-rose-700">{formatCurrency(row.realized_amount)}</td>
                          <td className="px-4 py-3 text-right font-black text-emerald-700">
                            {formatCurrency(row.allocated_amount - row.realized_amount)}
                          </td>
                        </>
                      )}

                      {selectedReport === 'program' && (
                        <>
                          <td className="px-5 py-3 font-bold text-navy-900">{row.title}</td>
                          <td className="px-4 py-3 text-slate-700">{row.department_name}</td>
                          <td className="px-4 py-3 text-slate-600">{row.pic_member_name}</td>
                          <td className="px-4 py-3 font-bold text-slate-900">{formatCurrency(row.budget_allocated)}</td>
                          <td className="px-4 py-3">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                              {row.status}
                            </span>
                          </td>
                        </>
                      )}

                      {selectedReport === 'inventaris' && (
                        <>
                          <td className="px-5 py-3 font-mono font-bold text-navy-900">{row.item_code}</td>
                          <td className="px-4 py-3 font-bold text-slate-900">{row.name}</td>
                          <td className="px-4 py-3 text-slate-600">{row.category_name}</td>
                          <td className="px-4 py-3 font-semibold text-slate-800">{row.quantity} {row.unit}</td>
                          <td className="px-4 py-3 text-emerald-700 font-bold">{row.condition}</td>
                          <td className="px-4 py-3 text-slate-600">{row.location}</td>
                        </>
                      )}

                      {selectedReport === 'diakonia' && (
                        <>
                          <td className="px-5 py-3 font-mono font-bold text-navy-900">{row.request_number}</td>
                          <td className="px-4 py-3 text-slate-600">{formatDateIndo(row.request_date)}</td>
                          <td className="px-4 py-3 font-bold text-navy-950">{row.category.replace('_', ' ')}</td>
                          <td className="px-4 py-3 font-semibold text-slate-800">{row.recipient_name}</td>
                          <td className="px-4 py-3 text-right font-black text-navy-950">{formatCurrency(row.requested_amount)}</td>
                          <td className="px-4 py-3">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {row.status}
                            </span>
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
