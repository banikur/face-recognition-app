# 📋 Project Brief — SkinLab: Face Recognition Skincare Recommendation System

---

## 1. Ringkasan Eksekutif

**SkinLab** adalah aplikasi web berbasis AI yang memungkinkan pengguna menganalisis kondisi kulit wajah secara real-time melalui kamera perangkat mereka, kemudian menerima rekomendasi produk skincare yang dipersonalisasi berdasarkan hasil analisis tersebut.

Sistem ini dibangun di atas model CNN (Convolutional Neural Network) yang dilatih untuk mengenali 6 kondisi kulit dan dijalankan langsung di browser menggunakan TensorFlow.js — tanpa mengirimkan data wajah ke server, menjaga privasi pengguna.

---

## 2. Latar Belakang & Motivasi

Industri skincare terus berkembang pesat, namun konsumen sering kesulitan memilih produk yang sesuai dengan kondisi kulit spesifik mereka. Konsultasi dermatologis bersifat mahal dan tidak selalu aksesibel. Di sisi lain, kemajuan AI/ML memungkinkan analisis kondisi kulit secara otomatis melalui citra wajah.

Proyek ini hadir sebagai solusi jembatan: memanfaatkan teknologi computer vision yang berjalan sepenuhnya di sisi klien (browser) untuk memberikan rekomendasi skincare yang terpersonalisasi, cepat, dan gratis.

---

## 3. Tujuan Proyek

- **Primer:** Membangun sistem rekomendasi produk skincare berbasis analisis citra wajah menggunakan CNN
- **Sekunder:**
  - Melatih model CNN custom untuk klasifikasi 6 kondisi kulit
  - Mengimplementasikan inference model secara client-side (TensorFlow.js)
  - Membangun admin dashboard untuk manajemen data produk, laporan, dan aturan rekomendasi
  - Mengintegrasikan sistem ke dalam aplikasi web full-stack yang dapat di-deploy

---

## 4. Ruang Lingkup Sistem

### 4.1 Fitur Pengguna (Public)

| # | Fitur | Deskripsi |
|---|---|---|
| F01 | **Scan Wajah via Kamera** | Capture snapshot dari webcam, deteksi wajah, klasifikasi kondisi kulit |
| F02 | **Hasil Analisis Kulit** | Tampilkan skor 6 kondisi kulit dalam bentuk visual (bar/score) |
| F03 | **Rekomendasi Produk** | Tampilkan TOP-N produk berdasarkan weighted scoring |
| F04 | **Halaman Produk** | Browse semua produk skincare yang tersedia |
| F05 | **Halaman Kampanye** | Informasi jenis-jenis tipe kulit |

### 4.2 Fitur Admin (Protected `/admin`)

| # | Fitur | Deskripsi |
|---|---|---|
| A01 | **Dashboard** | Statistik penggunaan, distribusi kondisi kulit, produk terpopuler |
| A02 | **Manajemen Produk** | CRUD produk beserta bobot kondisi kulit (6 parameter) |
| A03 | **Manajemen Brand** | CRUD brand produk |
| A04 | **Manajemen Kategori** | CRUD kategori produk (serum, toner, dll.) |
| A05 | **Manajemen Bahan Aktif** | CRUD ingredients beserta bobot kontribusi per kondisi |
| A06 | **Manajemen Rekomendasi** | CRUD teks panduan per kondisi kulit |
| A07 | **Manajemen Rules** | Aturan eksplisit kondisi → produk dengan confidence score |
| A08 | **Log Analisis** | Riwayat semua scan yang disimpan sistem |
| A09 | **Laporan & Export** | Ekspor data ke Excel (.xlsx), PDF, CSV, JSON |
| A10 | **Manajemen Akun** | CRUD akun admin |

---

## 5. Arsitektur Sistem

```
┌─────────────────────────────────────────────────────┐
│                    Browser (Client)                  │
│                                                      │
│  ┌──────────────┐    ┌───────────────────────────┐  │
│  │  Kamera/     │    │   TensorFlow.js Engine     │  │
│  │  Webcam      │───▶│   - MediaPipe Face Det.    │  │
│  │              │    │   - CNN Skin Classifier    │  │
│  └──────────────┘    └─────────────┬─────────────┘  │
│                                    │ Scores (6 dim)  │
│  ┌─────────────────────────────────▼──────────────┐  │
│  │            Next.js React UI                    │  │
│  │  CameraPanel → ResultPanel → RecommendationCard│  │
│  └─────────────────────────────────┬──────────────┘  │
└────────────────────────────────────┼────────────────┘
                                     │ HTTP POST
                      ┌──────────────▼──────────────┐
                      │    Next.js API Routes        │
                      │  /api/analysis/save-from-scan│
                      │  /api/products               │
                      │  /api/reports/*              │
                      └──────────────┬───────────────┘
                                     │
                      ┌──────────────▼───────────────┐
                      │    PostgreSQL Database        │
                      │    (Supabase / pg direct)     │
                      │                              │
                      │  products, ingredients,      │
                      │  brands, categories,         │
                      │  rules, analysis_logs, users │
                      └──────────────────────────────┘
```

---

## 6. Alur Kerja Utama (Main Flow)

### 6.1 Alur Analisis Kulit

```
1. Pengguna membuka halaman utama (/)
2. Kamera diakses via browser (getUserMedia)
3. ModelLoader memuat 2 model secara paralel:
   - MediaPipe Face Detection model
   - CNN Skin Classifier (TF.js)
4. Pengguna menekan tombol "Capture"
5. Snapshot frame video → canvas
6. MediaPipe mendeteksi wajah di canvas
   - Tidak ada wajah → tampilkan pesan error
   - Wajah terdeteksi → crop bounding box
7. CNN mengklasifikasikan crop wajah (128×128 px)
8. Output: probabilitas 6 kondisi kulit
9. Sistem menghitung weighted score per produk:
   score_produk = Σ (w_kondisi_produk × skor_kondisi_pengguna)
10. TOP produk dengan skor tertinggi ditampilkan
11. Data disimpan ke analysis_logs via API
```

### 6.2 Alur Sistem Rekomendasi

```
Scores CNN (6 dimensi)
    acne: 0.82, blackheads: 0.45, clear_skin: 0.1,
    dark_spots: 0.3, puffy_eyes: 0.15, wrinkles: 0.2
         ↓
Untuk setiap produk di database:
    product_score = (w_acne × 0.82) + (w_blackheads × 0.45) + ...
         ↓
Sort produk berdasarkan product_score (DESC)
         ↓
Return TOP-N produk sebagai rekomendasi
```

---

## 7. Model CNN — Detail Teknis

### 7.1 Spesifikasi Model

| Parameter | Nilai |
|---|---|
| Framework Training | TensorFlow / Keras (Python) |
| Framework Inference | TensorFlow.js (browser) |
| Input Size | 128 × 128 × 3 (RGB) |
| Output Classes | 6 (softmax) |
| Epochs | 15 |
| Batch Size | 32 |
| Learning Rate | 0.001 (Adam) |
| Validation Split | 20% |

### 7.2 Label Klasifikasi

```python
LABELS = ['acne', 'blackheads', 'clear_skin', 'dark_spots', 'puffy_eyes', 'wrinkles']
```

### 7.3 Format Model

| Format | Lokasi | Kegunaan |
|---|---|---|
| TF.js | `public/models/skin-classifier/tfjs/` | Inference di browser |
| Keras `.keras` | `public/models/skin-classifier/model.keras` | Fine-tuning |
| SavedModel | `public/models/skin-classifier/saved_model/` | Deployment Python |
| TFLite | `public/models/skin-classifier/model.tflite` | Mobile app |

### 7.4 Training Environment

- **Lokal:** `scripts/train_model.py` (Python)
- **Cloud:** `scripts/train_colab.ipynb` (Google Colab — GPU T4)
- **Dataset:** `data/training/{label}/` — gambar per kondisi kulit

---

## 8. Skema Database

### 8.1 Entity Relationship

```
brands ─────────────── products ─── product_ingredients ─── ingredients
                           │
                    product_categories
                           │
                         rules ─── recommendations
                           
analysis_logs (standalone — hasil scan)
users (admin accounts)
```

### 8.2 Tabel Utama

**`products`** — Produk skincare dengan bobot kondisi kulit
```sql
id, name, brand_id, category_id, description, image_url,
w_acne, w_blackheads, w_clear_skin, w_dark_spots, w_puffy_eyes, w_wrinkles
```

**`ingredients`** — Bahan aktif dengan efek per kondisi
```sql
id, name, effect,
w_acne, w_blackheads, w_clear_skin, w_dark_spots, w_puffy_eyes, w_wrinkles
```

**`analysis_logs`** — Log histori setiap scan
```sql
id, user_name, user_email, user_phone, user_age,
acne_score, blackheads_score, clear_skin_score,
dark_spots_score, puffy_eyes_score, wrinkles_score,
dominant_condition, recommended_product_ids, created_at
```

**`rules`** — Aturan kondisi → produk
```sql
id, skin_type_id (→ recommendations), product_id, confidence_score
```

---

## 9. Stack Teknologi

### Frontend
- **Next.js 15** (App Router) — Framework React SSR/CSR
- **React 19** — UI library
- **Tailwind CSS v4** — Utility-first styling
- **SweetAlert2** — Dialog/notifikasi

### AI / Machine Learning
- **TensorFlow.js** `^4.22.0` — Inference CNN di browser
- **@tensorflow/tfjs-backend-webgl** — GPU acceleration via WebGL
- **MediaPipe Face Detection** `^0.4` — Deteksi bounding box wajah
- **@tensorflow-models/face-landmarks-detection** — Mesh wajah 468 titik
- **Python TensorFlow/Keras** — Training model
- **TensorFlow.js Converter** — Export model ke format browser

### Backend & Database
- **Next.js API Routes** — REST API
- **PostgreSQL** — Database relasional
- **Supabase** `^2.89.0` — Managed PostgreSQL + auth (development)
- **pg** `^8.16.3` — Driver PostgreSQL (production)
- **jose** `^6.1.3` — JWT untuk session management
- **bcryptjs** `^3.0.3` — Hashing password

### Export & Reporting
- **PDFKit** `^0.15.0` — Generate laporan PDF
- **xlsx** `^0.18.5` — Generate file Excel
- **sharp** `^0.33.5` — Image processing server-side

### DevOps & Tooling
- **Vercel** — Hosting & deployment
- **TypeScript** — Type safety
- **tsx** — Run TypeScript scripts

---

## 10. Keamanan & Privasi

| Aspek | Implementasi |
|---|---|
| **Privasi data wajah** | Inference CNN dilakukan 100% di browser (client-side). Foto wajah tidak pernah dikirim ke server |
| **Auth admin** | JWT session (httpOnly cookie), bcrypt password hashing |
| **Route protection** | Next.js middleware guard untuk semua route `/admin` |
| **Session secret** | `SESSION_SECRET` environment variable (tidak di-commit) |
| **Camera permission** | Browser native `getUserMedia` API dengan user consent |

---

## 11. Deployment

### Target Environment
- **Platform:** Vercel
- **Database:** PostgreSQL (Supabase / dedicated server)
- **Region:** Asia Pacific (terdekat dengan Indonesia)

### Environment Variables (Wajib)

```env
DATABASE_URL=postgresql://...
SESSION_SECRET=<secure-random-32-chars>
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### Build & Deploy

```bash
npm run build   # includes DB setup script
vercel --prod   # atau push ke main branch
```

---

## 12. Diagram UML

| Diagram | File | Deskripsi |
|---|---|---|
| Use Case | `diagrams/use-case-diagram.puml` | Interaksi aktor (User, Admin) dengan sistem |
| Activity | `diagrams/activity-diagram.puml` | Alur proses scan hingga rekomendasi |
| Sequence | `diagrams/sequence-diagram.puml` | Urutan pesan antar komponen |
| Class | `diagrams/class-diagram.puml` | Struktur kelas & relasi data |

---

## 13. Batasan & Asumsi

- Deteksi wajah membutuhkan pencahayaan yang cukup dan wajah menghadap kamera
- Akurasi klasifikasi bergantung pada kualitas dan kuantitas dataset training
- Kamera hanya bisa diakses di browser via HTTPS (atau localhost)
- Sistem rekomendasi bersifat asistif, bukan pengganti konsultasi dermatologis
- Aplikasi dioptimalkan untuk perangkat desktop/laptop; belum dioptimalkan untuk mobile

---

## 14. Roadmap & Pengembangan Lanjutan

- [ ] Integrasi upload gambar statis (selain kamera live)
- [ ] Analisis multi-frame untuk hasil lebih akurat
- [ ] Push notifications untuk produk baru
- [ ] Optimasi model (pruning/quantization) untuk perangkat low-end
- [ ] PWA (Progressive Web App) untuk installasi mobile
- [ ] Integrasi e-commerce (deep link ke marketplace)
- [ ] Histori analisis per pengguna (dengan sistem login)
- [ ] Dukungan multi-bahasa (ID/EN)

---

## 15. Informasi Proyek

| | |
|---|---|
| **Jenis** | Tugas Akhir (Skripsi) |
| **Domain** | Computer Vision, Web Development, Skincare Tech |
| **Framework Utama** | Next.js 15, TensorFlow.js |
| **Target Pengguna** | Pengguna umum (publik) & Admin (internal) |
| **Platform** | Web Browser (Desktop-first) |
| **Bahasa** | TypeScript, Python |
