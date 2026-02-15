# Dokumentasi Sequence Diagram

Dokumentasi ini berisi diagram urutan (sequence diagram) untuk aplikasi Face Recognition / Skin Analysis. Semua diagram ditulis dalam **PlantUML** dan bisa di-render di [PlantUML Online](https://www.plantuml.com/plantuml/uml), [PlantText](https://www.planttext.com/), atau extension PlantUML di VS Code.

**File diagram:** `docs/sequence-diagrams.puml`

---

## Daftar Sequence Diagram

| No | Nama Diagram | Blok PlantUML |
|----|--------------|----------------|
| 1 | **Melakukan Analisis Kulit** (Karyawan/User) | `@startuml sequence_analisis_kulit` |
| 2 | **Melihat Hasil & Rekomendasi** (Karyawan/User) | `@startuml sequence_hasil_rekomendasi` |
| 3 | **Login** (Administrator) | `@startuml sequence_login_admin` |
| 4 | **Melihat Riwayat Analisis** (Administrator) | `@startuml sequence_riwayat_analisis` |
| 5 | **Melihat Laporan** (Administrator) | `@startuml sequence_melihat_laporan` |
| 6 | **Ekspor Laporan** (Administrator) | `@startuml sequence_ekspor_laporan` |
| 7 | **Kelola Data Produk** (Administrator) | `@startuml sequence_kelola_produk` |
| 8 | **Kelola Kandungan Produk** (Administrator) | `@startuml sequence_kelola_kandungan` |
| 9 | **Kelola Brand Produk** (Administrator) | `@startuml sequence_kelola_brand` |

---

## Cara Menggunakan

1. **Online (PlantUML):**
   - Buka [plantuml.com/plantuml/uml](https://www.plantuml.com/plantuml/uml).
   - Salin isi satu blok `@startuml ... @enduml` dari `sequence-diagrams.puml` ke editor.
   - Diagram akan ter-render otomatis.

2. **Online (PlantText):**
   - Buka [planttext.com](https://www.planttext.com/).
   - Paste kode PlantUML (satu diagram per kali).
   - Export sebagai PNG/SVG jika perlu.

3. **VS Code:**
   - Pasang extension "PlantUML" (jebbs.plantuml).
   - Buka `docs/sequence-diagrams.puml`.
   - Gunakan perintah "Preview Current Diagram" atau export dari palette.

4. **CLI (generate gambar):**
   ```bash
   java -jar plantuml.jar docs/sequence-diagrams.puml
   ```
   Akan menghasilkan satu file PNG per diagram (nama sesuai `@startuml`).

---

## Ringkasan Alur

- **User/Karyawan:** Analisis kulit lewat kamera/upload → hasil & skor di browser → rekomendasi produk dari API.
- **Admin:** Login (better-auth) → akses dashboard → riwayat analisis (API analysis-logs), laporan (summary + filter), ekspor (xlsx/pdf), kelola produk (REST API), kelola kandungan & brand (server actions).

Semua diagram disesuaikan dengan implementasi di repo (Next.js, API routes, server actions, model data).
