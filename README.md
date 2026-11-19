# CHURCH MANAGEMENT SYSTEM (SISTEM INFORMASI GEREJA)
## Sistem Informasi Gereja Modern, Terintegrasi, dan Siap Operasional

Aplikasi SaaS Enterprise untuk tata kelola administrasi gereja modern, pengelolaan jemaat, struktur keluarga, keuangan komprehensif, multi-komisi, program kerja, inventaris aset, dan pelayanan diakonia.

---

### ✝️ FITUR UTAMA & MODUL APLIKASI

1. **Dashboard Utama Multi-Role**:
   - 8 Metrik aktual dari basis data: Total Jemaat, Total Keluarga, Total Departemen, Pengguna Aktif, Pemasukan Bulan Ini, Pengeluaran Bulan Ini, Saldo Kas & Bank, Kegiatan Terjadwal.
   - Grafik Recharts dinamis: Arus Kas 6 Bulan, Pertumbuhan Jemaat, Distribusi Anggota Komisi, Realisasi RAPBG 2026.
   - Widget real-time kalender ibadah, transaksi terkini, program berjalan, dan warta jemaat.

2. **Manajemen Jemaat & Keluarga**:
   - Nomor anggota unik otomatis: `JMT-2026-XXXX`.
   - Profil jemaat dengan 6 Tab: Informasi Pribadi, Keluarga, Keanggotaan Komisi, Pelayanan, Dokumen Sakramen, dan Riwayat Administrasi.
   - Cetak Kartu Tanda Anggota (KTA) Digital format resmi dengan foto dan barcode identitas.
   - Pengelompokan kartu keluarga otomatis (`KK-2026-XXXX`), struktur silsilah visual (Kepala Keluarga, Pasangan, Anak-anak), serta relasi dinamis tanpa duplikasi anggota.

3. **Manajemen Keuangan Gereja**:
   - **Pemasukan**: Persembahan Umum, Perpuluhan, Pembangunan, Misi, Khusus, dan Donasi.
   - **Pencatatan Ganda**: Kolektif (umum) vs Individual (Rahasia).
   - **Privasi Finansial Terproteksi**: Data persembahan individual hanya dapat diakses oleh Bendahara dan Super Admin.
   - **Pengeluaran**: Operasional, utilitas, pemeliharaan, konsumsi, dan bantuan sosial dengan bukti nota.
   - **Kas & Rekening Bank**: Kas Tunai Utama, Kas Operasional, Rekening BCA, Rekening Mandiri.
   - **Transfer Antar-Rekening**: Perpindahan dana murni yang tidak menduplikasi saldo pemasukan atau pengeluaran.
   - **Mekanisme Reversal Transaksi**: Pembatalan transaksi wajib menyertakan alasan audit log dan otomatis mengembalikan saldo kas tanpa penghapusan diam-diam.
   - **RAPBG 2026**: Pagu tahunan, alokasi per komisi, realisasi otomatis, dan sisa anggaran.

4. **Departemen & 7 Komisi Awal**:
   - 1. Komisi Pemuda
   - 2. Komisi Anak / Sekolah Minggu
   - 3. Komisi Ibu-ibu
   - 4. Komisi Bapak-bapak
   - 5. Tim Musik dan Pujian
   - 6. Tim Multimedia
   - 7. Diakonia
   - **Keanggotaan Multi-Komisi**: Satu jemaat dapat bergabung dan melayani di beberapa departemen sekaligus dengan jabatan berbeda.
   - Ketua Departemen hanya dapat mengelola komisi miliknya sendiri.

5. **Program Kerja & Kegiatan Gereja**:
   - Alur status program: *Draft -> Menunggu Persetujuan -> Disetujui -> Sedang Berjalan -> Selesai -> Dibatalkan*.
   - Kalender kegiatan terpusat untuk Ibadah Raya, Sekolah Minggu, Persekutuan Doa, Latihan Musik, Rapat, dan Bakti Sosial.

6. **Pelayanan Diakonia (Bantuan Sosial)**:
   - Pengajuan santunan duka, beasiswa anak asuh, bantuan rawat inap medis, dan sembako.
   - Perlindungan privasi khusus: nama penerima dan deskripsi bantuan dilindungi secara rahasia.

7. **Inventaris & Aset Gereja**:
   - Kode aset otomatis `AST-2026-XXXX`, kondisi barang (Baik, Rusak Ringan, Rusak Berat), lokasi gedung, dan PIC.
   - Log peminjaman perlengkapan dan riwayat pemeliharaan.

8. **Pusat Laporan & Eksekutif**:
   - Pratinjau langsung seluruh data operasional gereja.
   - Cetak resmi, Ekspor Microsoft Excel (`.xlsx`), dan Dokumen PDF (`.pdf`) berkop resmi gereja.

9. **Pengaturan, Multi-Branch Ready & Keamanan**:
   - Seluruh tabel dilengkapi `church_id (UUID)` untuk kesiapan skalabilitas multi-cabang tanpa refactoring skema.
   - Audit trail lengkap mencatat seluruh mutasi data, waktu, dan pelaku.
   - Skema migrasi PostgreSQL / Supabase lengkap dengan Row-Level Security (RLS) di `supabase/migrations/20261119_church_schema.sql`.

---

### 👥 6 AKUN ROLE PENGGUNA (ROLE-BASED ACCESS CONTROL)

Anda dapat langsung mengganti role secara interaktif pada tombol **Role Switcher** di bagian header aplikasi, atau login dengan akun berikut:

| No | Role | Nama Akun | Username | Password | Deskripsi Kewenangan |
|:---|:---|:---|:---|:---|:---|
| 1 | **Super Admin** | Pdt. Samuel Hartono, M.Th | `admin` | `admin123` | Akses penuh seluruh modul, audit log, konfigurasi, dan pengguna |
| 2 | **Gembala / Pendeta** | Pdt. Andreas Wicaksono, M.Div | `pendeta` | `pendeta123` | Pastoral jemaat, catatan pastoral rahasia, persetujuan program & diakonia *(Persembahan individual terkunci)* |
| 3 | **Sekretaris** | Debora Santoso, S.Kom | `sekretaris` | `sekretaris123` | Administrasi jemaat, keluarga, warta pengumuman, dan kalender kegiatan |
| 4 | **Bendahara** | Lydia Kusuma, S.E., Ak. | `bendahara` | `bendahara123` | Pengelolaan buku kas, saldo bank, persembahan individual rahasia, reversal, dan RAPBG |
| 5 | **Ketua Komisi** | Daniel Kristianto, S.T. | `ketua.pemuda` | `pemuda123` | Anggota komisi pemuda, usulan program kerja, dan usulan anggaran komisi |
| 6 | **Pengurus Komisi** | Jonathan Setiawan | `pengurus.musik` | `musik123` | Pelaksana kepengurusan dan tugas kegiatan di dalam tim musik |

---

### 🚀 CARA MENJALANKAN APLIKASI

1. **Jalankan Mode Pengembangan (Development)**:
   ```bash
   npm run dev
   ```
   Aplikasi akan aktif di `http://localhost:3000`.

2. **Jalankan Mode Produksi**:
   ```bash
   npm run build
   npm start
   ```

3. **Migrasi PostgreSQL / Supabase (Jika Menggunakan Cloud Database)**:
   File SQL lengkap dengan indeks dan Row Level Security (RLS) tersedia di:
   `supabase/migrations/20261119_church_schema.sql`.
# sistem-informasi-gereja
