# PlantUML Diagrams - Face Recognition Skincare App

Dokumen ini berisi diagram PlantUML yang menggambarkan sistem Face Recognition Based Skincare Recommendation App secara mendalam.

## Daftar Diagram

1. **Use Case Diagram** (`use-case-diagram.puml`)
2. **Activity Diagram** (`activity-diagram.puml`)
3. **Sequence Diagram** (`sequence-diagram.puml`)
4. **Class Diagram** (`class-diagram.puml`)

## Cara Menggunakan

### Prasyarat

1. Install PlantUML:
   - **VS Code**: Install extension "PlantUML" oleh jebbs
   - **Online**: Gunakan [PlantUML Web Server](http://www.plantuml.com/plantuml/uml/)
   - **CLI**: Install Java dan PlantUML JAR file

### VS Code (Recommended)

1. Install extension "PlantUML" oleh jebbs
2. Buka file `.puml` di VS Code
3. Tekan `Alt + D` untuk preview diagram
4. Tekan `Ctrl + Shift + P` → "PlantUML: Export Current Diagram" untuk export ke PNG/SVG

### Online Editor

1. Buka [PlantUML Web Server](http://www.plantuml.com/plantuml/uml/)
2. Copy-paste isi file `.puml`
3. Diagram akan otomatis dirender
4. Download sebagai PNG/SVG

### Command Line

```bash
# Install PlantUML (requires Java)
# Download plantuml.jar from http://plantuml.com/download

# Generate PNG
java -jar plantuml.jar diagrams/*.puml

# Generate SVG
java -jar plantuml.jar -tsvg diagrams/*.puml
```

## Deskripsi Diagram

### 1. Use Case Diagram

**File**: `use-case-diagram.puml`

Diagram ini menggambarkan:
- **Actors**: User dan Admin
- **Use Cases User**:
  - Capture/Upload face image
  - View skin analysis results
  - View product recommendations
  - View analysis history
- **Use Cases Admin**:
  - Manage products, brands, categories, ingredients
  - View and filter analysis logs
  - Generate reports and export data
  - Manage recommendations and rules
- **System Use Cases**:
  - Face detection (CNN)
  - Skin classification (CNN)
  - Product weight calculation
  - Recommendation generation

**Relasi**:
- `<<include>>`: Use case yang wajib dipanggil
- `<<extends>>`: Use case opsional yang memperluas use case lain

### 2. Activity Diagram

**File**: `activity-diagram.puml`

Diagram ini menggambarkan alur proses analisis kulit secara detail:
1. **Input Selection**: User memilih mode camera atau upload
2. **Face Detection**: Deteksi wajah menggunakan CNN (MediaPipe)
3. **Image Preprocessing**: Resize dan normalisasi gambar
4. **Skin Classification**: Klasifikasi kondisi kulit menggunakan CNN
5. **Product Recommendation**: Perhitungan rekomendasi produk
6. **Save Analysis Log**: Penyimpanan hasil analisis ke database
7. **Display Results**: Menampilkan hasil ke user

**Partisi**: Setiap tahap dipisahkan dalam partisi untuk kejelasan

### 3. Sequence Diagram

**File**: `sequence-diagram.puml`

Diagram ini menggambarkan interaksi antar komponen dalam proses analisis:
- **Participants**: 
  - User
  - CameraPanel Component
  - SkinAnalyzer Service
  - FaceDetection Service
  - CNNSkinClassifier Service
  - API Routes
  - Database (Supabase)
  - UI Components (ResultPanel, RecommendationCard)

**Alur**:
1. Inisialisasi model (Face Detection & Skin Classifier)
2. Capture/Upload gambar
3. Deteksi wajah
4. Klasifikasi kulit
5. Perhitungan rekomendasi produk
6. Penyimpanan log
7. Tampilan hasil

**Activation Box**: Menunjukkan periode aktif setiap komponen

### 4. Class Diagram

**File**: `class-diagram.puml`

Diagram ini menggambarkan struktur kelas dan relasi dalam sistem:

**Package Structure**:
1. **Frontend Components**: React components (CameraPanel, ResultPanel, RecommendationCard)
2. **Core Services**: Business logic (SkinAnalyzer, FaceDetection, CNNSkinClassifier)
3. **Data Models**: Interface dan type definitions
4. **API Routes**: Next.js API endpoints
5. **Data Access Layer**: Database access layer (ModelsService, SupabaseClient)

**Relasi**:
- **Association** (`-->`): Menggunakan
- **Composition** (`*--`): Memiliki (strong ownership)
- **Dependency** (`..>`): Ketergantungan

**Catatan Penting**:
- CNN Architecture untuk Skin Classifier
- Face Detection menggunakan MediaPipe
- Recommendation Algorithm menggunakan dot product scoring

## Teknologi yang Digunakan

### Face Detection
- **Model**: MediaPipe Face Detector
- **Runtime**: TensorFlow.js
- **Backend**: WebGL (fallback: CPU)

### Skin Classification
- **Model**: Custom CNN
- **Architecture**: 
  - Input: 128×128×3 RGB
  - Conv2D(32) → MaxPool
  - Conv2D(64) → MaxPool
  - Conv2D(128) → GlobalAvgPool
  - Dense(64) → Dense(6) → Softmax
- **Output**: 6 classes (acne, blackheads, clear_skin, dark_spots, puffy_eyes, wrinkles)

### Product Recommendation
- **Algorithm**: Rule-based dengan dot product scoring
- **Formula**: `score = Σ(skin_score × product_weight)`
- **Output**: Top 3 recommended products

## Database Schema

Tabel utama:
- `products`: Produk skincare dengan weights (w_oily, w_dry, w_normal, w_acne)
- `ingredients`: Bahan dengan weights
- `brands`: Merek produk
- `product_categories`: Kategori produk
- `analysis_logs`: Log analisis pengguna
- `recommendations`: Rekomendasi berdasarkan kondisi kulit
- `rules`: Aturan rekomendasi

## Catatan untuk Tugas Akhir

Diagram-diagram ini dapat digunakan untuk:
1. **Dokumentasi Sistem**: Menjelaskan arsitektur dan alur sistem
2. **Presentasi**: Visualisasi untuk presentasi tugas akhir
3. **Pengembangan**: Panduan untuk pengembangan fitur baru
4. **Maintenance**: Referensi untuk maintenance dan debugging

## Update Diagram

Jika ada perubahan pada sistem, update diagram dengan:
1. Edit file `.puml` yang sesuai
2. Regenerate diagram (PNG/SVG)
3. Update dokumentasi jika diperlukan

## Referensi

- [PlantUML Documentation](https://plantuml.com/)
- [PlantUML Syntax Guide](https://plantuml.com/guide)
- [UML Notation Guide](https://www.uml-diagrams.org/)

