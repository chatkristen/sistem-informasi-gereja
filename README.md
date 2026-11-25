# CHURCH MANAGEMENT SYSTEM (SISTEM INFORMASI GEREJA)
## Sistem Informasi Gereja Modern, Terintegrasi, Aman, dan Siap Operasional

Aplikasi SaaS Enterprise untuk tata kelola administrasi gereja modern, pengelolaan jemaat, struktur keluarga, keuangan komprehensif, multi-komisi, program kerja, inventaris aset, pelayanan diakonia, serta penjadwalan ibadah dan warta kegiatan yang adaptif untuk **gereja perintisan kecil** hingga **gereja besar dengan multi-cabang**.

---

### ✝️ FITUR UTAMA & MODUL APLIKASI

#### 1. Dashboard Utama Multi-Role
- **8 Metrik Real-Time**: Total Jemaat, Total Keluarga, Total Departemen, Pengguna Aktif, Pemasukan Bulan Ini, Pengeluaran Bulan Ini, Saldo Kas & Bank, Kegiatan Terjadwal.
- **Grafik Interaktif Recharts**: Arus Kas 6 Bulan, Tren Pertumbuhan Jemaat, Distribusi Anggota Komisi, Realisasi RAPBG 2026.
- **Widget Agenda & Transaksi Cepat**: Kalender ibadah mendatang lengkap dengan tombol **Share WhatsApp**, daftar mutasi keuangan terkini, program berjalan, dan warta jemaat.

#### 2. Kalender & Jadwal Kegiatan Terintegrasi WhatsApp
- **Penjadwalan Ibadah Fleksibel**:
  - Cocok untuk gereja kecil hingga gereja besar.
  - Kategori lengkap: Ibadah Raya, Sekolah Minggu, Persekutuan Doa, Latihan Musik, Rapat, dan Bakti Sosial.
  - **Aturan Validasi Adaptif**: Hanya PIC (Pengkhotbah) dan MC (Worship Leader) yang wajib diisi; bagian pelayan lainnya bersifat opsional sesuai kebutuhan ibadah.
- **Dukungan Petugas Pelayan Lengkap**:
  - **Pemain Musik**: Mendukung 1, 2, 3, 4 atau lebih instrumen (Keyboard, Gitar, Bass, Drum, Saxophone, dll).
  - **Singer**: Mendukung penambahan multi-personil.
  - **Petugas Persembahan / Kolektan**: Penugasan terdata rapi.
  - **Aser / Usher**: Penerima tamu ibadah.
  - **Pemisahan Multimedia & Sound System**:
    - **Multimedia**: Operator slide proyektor, kamera, live streaming (bisa tambah banyak orang).
    - **Sound System**: Soundman, audio engineer, mixer operator.
  - **Metode Input Fleksibel**: Setiap petugas dapat **dipilih langsung dari database jemaat** atau **diketik manual** (untuk pembicara/musisi tamu).
- **Fitur 1-Klik Duplikat Jadwal**:
  - Salin seluruh susunan pelayan dan liturgi dari ibadah minggu sebelumnya ke minggu berikutnya (+7 hari) dalam 1 klik tanpa input ulang.
- **Fitur Berbagi ke WhatsApp (Share WA)**:
  - **Warta Jemaat (Format Ringkas)**: Format ringkas berisi waktu, lokasi, pengkhotbah, WL/MC, tema firman, dan ajakan ibadah untuk grup jemaat umum.
  - **Jadwal Pelayan (Format Lengkap)**: Format detail mencakup seluruh daftar pelayan tugas untuk koordinasi grup internal majelis/pelayan.
  - **Share WA Kalender Keseluruhan**: Tombol di header kalender untuk membagikan rekap seluruh agenda ibadah yang sedang difilter.
- **Ekspor Dokumen**: Cetak langsung, ekspor Microsoft Excel (`.xlsx`), dan PDF resmi ber-kop gereja.

#### 3. Keamanan Siber & Proteksi Data (Enterprise Security)
- **Proteksi Brute-Force (Rate Limiting)**:
  - Pembatasan maksimal 5 kali kegagalan login berturut-turut dengan penangguhan otomatis selama 10 menit (HTTP 429).
- **HTTP Security Headers Standar OWASP (Next.js Middleware)**:
  - `X-Frame-Options: SAMEORIGIN` (Mencegah serangan Clickjacking).
  - `X-Content-Type-Options: nosniff` (Mencegah MIME type sniffing).
  - `X-XSS-Protection: 1; mode=block` (Mencegah Cross-Site Scripting).
  - `Referrer-Policy: strict-origin-when-cross-origin`.
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()` (Mencegah penyalahgunaan hardware).
- **Enkripsi Kriptografis Password & Sesi**:
  - Penyimpanan password menggunakan hashing **PBKDF2 dengan Cryptographic Salt 64-byte**.
  - Token sesi bertanda tangan digital **HMAC-SHA256** dengan verifikasi `timingSafeEqual` untuk mencegah manipulasi token dan *timing attacks*.
- **Manajemen Kata Sandi Mandiri**:
  - Menu khusus **Keamanan Akun & Sandi** di halaman Pengaturan untuk mengganti kata sandi dengan validasi keamanan minimal 8 karakter.
  - Indikator status keamanan sistem live di antarmuka admin.
- **Sanitasi Input**:
  - Penyaringan otomatis karakter berisiko injeksi XSS pada seluruh form input.

#### 4. Manajemen Jemaat & Kartu Keluarga (KK)
- Penomoran anggota unik otomatis: `JMT-2026-XXXX`.
- Profil jemaat dengan 6 Tab: Informasi Pribadi, Keluarga, Keanggotaan Komisi, Pelayanan, Dokumen Sakramen (Baptis/Sidi/Pernikahan), dan Riwayat Administrasi.
- **Cetak KTA Digital**: Kartu Tanda Anggota format resmi dengan foto dan barcode identitas.
- Kartu Keluarga otomatis (`KK-2026-XXXX`), struktur silsilah visual (Kepala Keluarga, Pasangan, Anak-anak), serta relasi dinamis tanpa duplikasi anggota.

#### 5. Manajemen Keuangan & Persembahan
- **Pemasukan**: Persembahan Umum, Perpuluhan, Pembangunan, Misi, Khusus, dan Donasi.
- **Pencatatan Ganda & Privasi**: Kolektif (umum) vs Individual (Rahasia).
- **Privasi Finansial Terproteksi**: Data persembahan individual hanya dapat diakses oleh Bendahara dan Super Admin.
- **Pengeluaran**: Operasional, utilitas, pemeliharaan, konsumsi, dan bantuan sosial dengan bukti nota.
- **Kas & Rekening Bank**: Kas Tunai Utama, Kas Operasional, Rekening BCA, Rekening Mandiri.
- **Transfer Antar-Rekening**: Perpindahan dana murni yang tidak menduplikasi saldo pemasukan atau pengeluaran.
- **Mekanisme Reversal Transaksi**: Pembatalan transaksi wajib menyertakan alasan audit log dan otomatis mengembalikan saldo kas tanpa penghapusan diam-diam.
- **RAPBG 2026**: Pagu tahunan, alokasi per komisi, realisasi otomatis, dan sisa anggaran.

#### 6. Departemen & 7 Komisi Pelayanan
- 1. Komisi Pemuda
- 2. Komisi Anak / Sekolah Minggu
- 3. Komisi Ibu-ibu
- 4. Komisi Bapak-bapak
- 5. Tim Musik dan Pujian
- 6. Tim Multimedia
- 7. Diakonia
- **Keanggotaan Multi-Komisi**: Satu jemaat dapat bergabung dan melayani di beberapa departemen sekaligus dengan jabatan berbeda.
- Ketua Departemen memiliki hak akses terbatas untuk mengelola komisinya sendiri.

#### 7. Program Kerja & Evaluasi
- Alur status program bertingkat: *Draft -> Menunggu Persetujuan -> Disetujui -> Sedang Berjalan -> Selesai -> Dibatalkan*.
- Pelacakan realisasi program kerja terhadap anggaran departemen.

#### 8. Pelayanan Diakonia (Bantuan Sosial)
- Pengajuan santunan duka, beasiswa anak asuh, bantuan rawat inap medis, dan sembako.
- Perlindungan privasi khusus: nama penerima dan deskripsi bantuan dilindungi secara rahasia.

#### 9. Inventaris & Aset Gereja
- Kode aset otomatis `AST-2026-XXXX`, kondisi barang (Baik, Rusak Ringan, Rusak Berat), lokasi gedung/ruangan, dan PIC.
- Log peminjaman perlengkapan dan riwayat pemeliharaan.

#### 10. Pusat Laporan, Backup & Multi-Cabang
- Pratinjau langsung seluruh data operasional gereja.
- Cetak resmi, Ekspor Microsoft Excel (`.xlsx`), dan Dokumen PDF (`.pdf`) berkop resmi gereja.
- Backup database 1-klik (`.json`) dan pemulihan data aman.
- Arsitektur tabel dilengkapi `church_id (UUID)` untuk kesiapan skalabilitas multi-cabang.
- Audit trail komprehensif mencatat seluruh mutasi data, waktu, pengguna, dan snapshot perubahan.

---

### 👥 6 AKUN ROLE PENGGUNA (ROLE-BASED ACCESS CONTROL)

Anda dapat langsung mengganti role secara interaktif pada tombol **Role Switcher** di bagian header aplikasi, atau login dengan akun berikut:

| No | Role | Nama Akun | Username | Password | Deskripsi Kewenangan |
|:---|:---|:---|:---|:---|:---|
| 1 | **Super Admin** | Pdt. Samuel Hartono, M.Th | `admin` | `admin123` | Akses penuh seluruh modul, audit log, konfigurasi keamanan, dan pengguna |
| 2 | **Gembala / Pendeta** | Pdt. Andreas Wicaksono, M.Div | `pendeta` | `pendeta123` | Pastoral jemaat, catatan pastoral rahasia, persetujuan program & diakonia *(Persembahan individual terkunci)* |
| 3 | **Sekretaris** | Debora Santoso, S.Kom | `sekretaris` | `sekretaris123` | Administrasi jemaat, keluarga, warta pengumuman, dan kalender kegiatan |
| 4 | **Bendahara** | Lydia Kusuma, S.E., Ak. | `bendahara` | `bendahara123` | Pengelolaan buku kas, saldo bank, persembahan individual rahasia, reversal, dan RAPBG |
| 5 | **Ketua Komisi** | Daniel Kristianto, S.T. | `ketua.pemuda` | `pemuda123` | Anggota komisi pemuda, usulan program kerja, dan usulan anggaran komisi |
| 6 | **Pengurus Komisi** | Jonathan Setiawan | `pengurus.musik` | `musik123` | Pelaksana kepengurusan dan tugas kegiatan di dalam tim musik |

---

### 🚀 TEKNOLOGI & CARA MENJALANKAN

#### Stack Teknologi:
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Charts**: Recharts
- **Export Engine**: XLSX, jsPDF, jsPDF-AutoTable
- **Security**: Node.js Crypto (PBKDF2 Salted Hash, HMAC-SHA256), Next.js Middleware Security Headers

#### Menjalankan Aplikasi:
1. **Instal Dependensi**:
   ```bash
   npm install
   ```

2. **Jalankan Mode Pengembangan (Development)**:
   ```bash
   npm run dev
   ```
   Aplikasi aktif di `http://localhost:3000`.

3. **Build & Start Mode Produksi**:
   ```bash
   npm run build
   npm start
   ```

4. **Migrasi PostgreSQL / Supabase (Cloud Database Ready)**:
   File skema SQL lengkap dengan indexing dan Row Level Security (RLS) tersedia di:
   `supabase/migrations/20261119_church_schema.sql`.
