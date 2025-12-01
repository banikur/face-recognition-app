# Face Recognition Based Skincare Recommendation App

**(Developer-Ready Specification, Analysis-Centric Version)**

---

## 🧩 Problem Statement

Pria sering bingung memilih sabun wajah yang sesuai dengan kondisi kulit (berminyak, kering, normal, atau berjerawat).
Aplikasi ini memberikan **rekomendasi otomatis** berdasarkan **analisis wajah** (deteksi kondisi kulit) menggunakan **TensorFlow.js + MediaPipe**, dan menyimpan hasil analisis untuk **laporan serta insight produk**.

---

## 🎯 Goals

* Deteksi wajah dan klasifikasi kondisi kulit (multi-label).
* Rekomendasi **Top-3 produk** berdasarkan komposisi bahan.
* Simpan hasil analisis, profil user, dan rekomendasi ke log.
* Admin dapat kelola produk, melihat hasil analisis, dan ekspor laporan.

---

## 👥 Features

### User (Publik)

* Isi identitas ringan: nama, umur, email/telp (opsional).
* Upload foto atau capture wajah (via `getUserMedia`).
* Analisis wajah di browser menggunakan TensorFlow.js.
* Hasil rekomendasi muncul **langsung di area capture**.
* Riwayat hasil (seluruh user) tersimpan untuk laporan admin.

### Admin

* Login sederhana via `/admin` (password dari ENV).
* CRUD Produk (marketing-friendly form).

  * Input bahan aktif, sistem otomatis menghitung bobot.
* Lihat log hasil analisis pengguna.
* Filter data berdasarkan tanggal & kondisi kulit dominan.
* Laporan & ekspor hasil ke Excel/PDF.

---

## 🧱 Data Model (Final)

### `products`

| Field       | Type         | Description                          |
| ----------- | ------------ | ------------------------------------ |
| id          | BIGINT       | Primary Key                          |
| name        | VARCHAR(150) | Nama produk                          |
| brand       | VARCHAR(100) | Nama brand                           |
| description | TEXT         | Deskripsi singkat                    |
| ingredients | TEXT         | Daftar bahan aktif (comma separated) |
| image_url   | VARCHAR(255) | Link gambar produk                   |
| w_oily      | DECIMAL(4,3) | Bobot hasil kalkulasi otomatis       |
| w_dry       | DECIMAL(4,3) | Bobot hasil kalkulasi otomatis       |
| w_normal    | DECIMAL(4,3) | Bobot hasil kalkulasi otomatis       |
| w_acne      | DECIMAL(4,3) | Bobot hasil kalkulasi otomatis       |
| created_at  | TIMESTAMP    | Timestamp create/update              |

> Catatan:
> Bobot `w_*` dihasilkan otomatis dari analisis bahan aktif menggunakan *keyword mapping* (lihat bagian “Auto Weight Mapping”).

---

### `analysis_logs`

| Field                   | Type         | Description                            |
| ----------------------- | ------------ | -------------------------------------- |
| id                      | BIGINT       | Primary Key                            |
| user_name               | VARCHAR(100) | Nama user                              |
| user_email              | VARCHAR(150) | Email (opsional)                       |
| user_phone              | VARCHAR(50)  | Telepon (opsional)                     |
| user_age                | TINYINT      | Usia                                   |
| oily_score              | DECIMAL(4,3) | Hasil skor wajah berminyak             |
| dry_score               | DECIMAL(4,3) | Hasil skor kulit kering                |
| normal_score            | DECIMAL(4,3) | Hasil skor normal                      |
| acne_score              | DECIMAL(4,3) | Hasil skor berjerawat                  |
| dominant_condition      | VARCHAR(50)  | Kondisi kulit dominan (auto-generated) |
| recommended_product_ids | VARCHAR(100) | ID produk rekomendasi “Top-3”          |
| created_at              | TIMESTAMP    | Waktu analisis                         |

> Tabel ini menjadi **inti sistem**: semua insight, statistik, dan laporan diambil dari sini.

---

## ⚙️ Auto Weight Mapping (Produk → Bobot Kulit)

Saat produk disimpan, backend menjalankan analisis otomatis terhadap kolom `ingredients` menggunakan *keyword-to-weight mapping*.
Contoh dictionary dasar:

| Keyword                                  | Dampak      | Bobot (+)                         |
| ---------------------------------------- | ----------- | --------------------------------- |
| “Salicylic Acid”, “Charcoal”, “Tea Tree” | oily, acne  | +0.5 oily, +0.5 acne              |
| “Aloe Vera”, “Glycerin”, “Hyaluronic”    | dry, normal | +0.5 dry, +0.3 normal             |
| “Niacinamide”                            | all         | +0.3 oily, +0.3 acne, +0.2 normal |
| “Menthol”                                | oily        | +0.4 oily                         |
| “Ceramide”                               | dry         | +0.5 dry                          |

Sistem akan:

1. Tokenisasi bahan.
2. Cari kecocokan keyword.
3. Akumulasi bobot tiap kategori.
4. Normalisasi hasil ke [0..1].
5. Simpan ke kolom `w_*`.

Tidak perlu CRUD “rules”; perhitungan dilakukan otomatis di runtime saat rekomendasi.

---

## 🔍 Rekomendasi Produk

### Input:

Hasil analisis wajah menghasilkan vektor `S = [s_oily, s_dry, s_normal, s_acne]` (0..1).

### Perhitungan Skor:

```text
score(p) = dot(S, Wp)
```

di mana `Wp = [w_oily, w_dry, w_normal, w_acne]`.

### Output:

* Urutkan berdasarkan `score(p)` tertinggi.
* Ambil **Top-3 produk**.
* Simpan ke `analysis_logs.recommended_product_ids`.

---

## 🧠 Face Detection & Skin Heuristic

### Teknologi:

* TensorFlow.js + MediaPipe Face Mesh.
* Analisis area wajah (dahi, pipi, hidung).

### Heuristik Deteksi:

| Kondisi    | Indikator Visual                                      |
| ---------- | ----------------------------------------------------- |
| Oily       | Tinggi specular highlight (HSV-V), low local contrast |
| Dry        | Low saturation, high texture roughness                |
| Normal     | Balanced parameter dari 3 kondisi                     |
| Acne-Prone | High redness, uneven texture (blob detection)         |

> Semua inferensi berjalan **di browser (client-side)**, tidak kirim foto ke server.

---

## 📸 Capture Rules

* Pencahayaan merata (tidak backlight, EV ~ 0).
* Wajah memenuhi 60–80% frame.
* Tanpa aksesori, rambut tidak menutupi area wajah.
* Resolusi minimal 640×480, format JPG/PNG ≤ 3MB.
* Auto fallback: upload file jika kamera tidak tersedia.

---

## 🗂️ API Endpoint (Next.js Route Handlers)

| Endpoint                   | Method | Deskripsi                                        |
| -------------------------- | ------ | ------------------------------------------------ |
| `/api/analysis`            | POST   | Simpan hasil analisis wajah & hasil rekomendasi  |
| `/api/products`            | GET    | Ambil daftar produk                              |
| `/api/products`            | POST   | Tambah produk (auto weight mapping)              |
| `/api/products/:id`        | PUT    | Update produk                                    |
| `/api/reports/summary`     | GET    | Ringkasan laporan (Top produk & kondisi dominan) |
| `/api/reports/export.xlsx` | GET    | Export laporan ke Excel                          |
| `/api/reports/export.pdf`  | GET    | Export laporan ke PDF                            |

---

## 📞 Reports & Exports

* Admin dapat memfilter data dengan `created_at BETWEEN start_date AND end_date`.
* Laporan menampilkan:

  * Distribusi kondisi kulit (pie chart).
  * Produk paling sering direkomendasikan.
  * Jumlah total analisis.
* File Export:

  * **Excel (XLSX)** — dua sheet: Analyses & Summary.
  * **PDF** — hasil ringkasan dengan grafik distribusi.

---

## 🧱 UI/UX Overview

### `/`

* Form user (nama, umur, email opsional).
* Kamera / upload → area analisis.
* Setelah selesai → hasil langsung tampil (tidak reload halaman).

### `/admin`

* Login password (ENV: `ADMIN_PASSWORD`).
* Tab:

  * **Products**: Tambah/Edit produk, auto-score preview.
  * **Analyses**: Tabel hasil user, filter by date & dominant_condition.
  * **Reports**: Chart + export XLSX/PDF.

---

## 🗾 Logging & Error Handling

* Client: tampilkan snackbar jika analisis gagal.
* Server: log error disimpan di `error_logs` dan dapat dilihat admin.
* Upload gambar: MIME whitelist, strip EXIF, validasi ukuran.

---

## 🧠 Deployment

* Berjalan **di 1 PC lokal** sebagai host (Next.js dev/prod).
* Dapat diakses dari device lain di jaringan yang sama.
* Tidak butuh koneksi eksternal.

---

## ✅ Acceptance Criteria

* User dapat melakukan capture wajah → mendapatkan Top-3 produk.
* Semua hasil disimpan di `analysis_logs`.
* Admin dapat melihat, memfilter, dan mengekspor laporan.
* Bobot produk dan rekomendasi dihitung otomatis tanpa intervensi teknis.

---

## 🗓 Implementation Plan (Revised)

**Morning**

1. Setup Next.js project + kamera TensorFlow.js
2. Implement heuristic extractor
3. Buat endpoint `/api/analysis`

**Midday**
4. Bangun database MySQL
5. Implement auto weight mapping + CRUD produk
6. Simpan hasil analisis ke `analysis_logs`

**Afternoon**
7. Buat halaman admin (`/admin`)
8. Viewer log & filter laporan
9. Export ke Excel/PDF

**Evening**
10. Tambah error logging & dashboard ringkas
11. Testing end-to-end (local)

## 🧩 Implementation Constraints (for AI Agent)

### Development Scope
- Target: **Local MVP**
- Deliverables: functional demo only, not production-ready
- No Docker, CI/CD, or complex dependency injection

### Architecture Rules
- Use **direct route handlers** (Next.js API routes)
- Avoid service/repository abstraction layers
- No ORM (use `mysql2` or raw queries)
- No state management library (Redux/Zustand, etc.)

### Performance
- Optimize for readability and simplicity
- Function length ≤ 50 lines; single responsibility per file

### Dependencies (Allowed Only)
- `next`, `react`, `tensorflow.js`, `mysql2`, `xlsx`, `pdfkit`