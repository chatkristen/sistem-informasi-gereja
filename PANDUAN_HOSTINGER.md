# 📖 PANDUAN DEPLOY SISTEM INFORMASI GEREJA KE HOSTINGER WEB HOSTING

Panduan ini disusun khusus untuk menjalankan project **Next.js 14 App Router** pada layanan **Hostinger Web Hosting (Cloud / Business Hosting hPanel)**.

---

## 📌 STEP 1: Persiapan File di Komputer Lokal

Project telah dikonfigurasi dengan mode **`output: 'standalone'`** dan file entrypoint **`server.js`** sehingga sangat ringan saat di-upload.

1. Jalankan build di lokal:
   ```bash
   npm run build
   ```
2. Siapkan file-file berikut untuk di-upload (bisa di-zip menjadi `deploy.zip`):
   - Folder `.next/` *(hasil build)*
   - Folder `public/` *(berisi logo, aset gambar)*
   - Folder `src/data/` *(database JSON)*
   - File `server.js` *(entrypoint server Hostinger)*
   - File `package.json`
   - File `next.config.mjs`

> 💡 **Catatan:** Jangan menyertakan folder `node_modules` ke dalam file `.zip` agar proses upload cepat dan tidak memakan kuota inode.

---

## 📌 STEP 2: Konfigurasi Node.js di Hostinger hPanel

1. Buka dan login ke dashboard **Hostinger hPanel**.
2. Masuk ke menu **Websites** -> Klik **Kelola (Manage)** pada domain gereja Anda.
3. Di kolom pencarian kiri, ketik **Node.js** (berada di bawah kategori *Advanced / Tingkat Lanjut*).
4. Klik **Create Application** (Buat Aplikasi Node.js) dan isi konfigurasinya:
   - **Node.js Version:** Pilih versi **18.x** atau **20.x** (versi LTS terbaru).
   - **Application Mode:** Pilih **Production**.
   - **Application Root:** Misalnya `public_html` atau subfolder domain Anda.
   - **Application Startup File:** Ketik **`server.js`**.
5. Klik **Create** atau **Save**.

---

## 📌 STEP 3: Upload File ke Hostinger File Manager

1. Kembali ke hPanel -> Buka menu **File Manager**.
2. Masuk ke folder root aplikasi Anda (misal `public_html/`).
3. Klik tombol **Upload** (ikon panah atas) dan pilih file `deploy.zip` yang sudah Anda siapkan di Step 1.
4. Klik kanan pada `deploy.zip` -> Pilih **Extract**.
5. Pastikan struktur file di `public_html` terlihat seperti ini:
   ```text
   public_html/
   ├── .next/
   ├── public/
   ├── src/
   │   └── data/
   │       └── db.json
   ├── server.js
   ├── package.json
   └── next.config.mjs
   ```

---

## 📌 STEP 4: Install Dependencies & Jalankan Aplikasi

1. Kembali ke menu **Node.js** di hPanel.
2. Di bagian bawah pengaturan aplikasi, klik tombol **"NPM Install"** (Hostinger akan mengunduh paket dependensi produksi secara otomatis di server).
3. Setelah selesai, klik tombol **"Start"** atau **"Restart Application"**.
4. Buka domain Anda di browser (misalnya: `https://domain-gereja-anda.com`). Sistem informasi gereja akan langsung aktif!

---

## 🔐 STEP 5: SSL & Keamanan Domain (Gratis di Hostinger)

1. Di hPanel, masuk ke menu **Security** -> **SSL**.
2. Pastikan status SSL berlabel **Active** (Lifetime Free SSL dari Hostinger).
3. Aktifkan opsi **Force HTTPS** agar semua akses otomatis terenkripsi aman.
