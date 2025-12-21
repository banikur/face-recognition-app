# Status Machine Learning & Deep Learning

## Ringkasan

**ML/DL ADA di repo, tapi BELUM DIGUNAKAN di aplikasi yang berjalan.**

---

## ✅ Yang ADA (Sudah Tersedia)

### 1. Deep Learning Model - CNN Skin Classifier

**Lokasi**: `public/models/skin-classifier/`

**Format Model:**
- ✅ `model.keras` - Keras format (untuk training)
- ✅ `model.tflite` - TensorFlow Lite format
- ✅ `saved_model/` - SavedModel format (TensorFlow)
- ✅ `tfjs/` - TensorFlow.js format (untuk browser)
- ✅ `labels.json` - Label kelas: `['acne', 'normal', 'oily', 'dry']`

**Arsitektur CNN:**
```
Conv2D(32, 3) → MaxPooling2D
Conv2D(64, 3) → MaxPooling2D  
Conv2D(128, 3) → GlobalAveragePooling2D
Dropout(0.5)
Dense(64, relu)
Dense(4, softmax)  # 4 kelas: acne, normal, oily, dry
```

**Input**: Gambar 128x128 RGB
**Output**: Probabilitas 4 kelas skin condition

### 2. Training Script

#### TypeScript Training Script  
**File**: `scripts/train-skin-model.ts`
- Menggunakan TensorFlow.js
- Training di Node.js environment (tidak perlu Python)
- Dataset dari `data/training/Source_1/` dan `Source_2/`
- Output: TensorFlow.js model format langsung
- Menyimpan model dalam format TensorFlow.js (siap untuk browser)

### 4. Dependencies ML/DL

**Sudah Terinstall** (di `package.json`):
- ✅ `@tensorflow/tfjs`: ^4.22.0
- ✅ `@tensorflow/tfjs-backend-webgl`: ^4.22.0
- ✅ `@mediapipe/face_mesh`: ^0.4.1633559619
- ✅ `@tensorflow-models/face-landmarks-detection`: ^1.0.2

---

## ❌ Yang BELUM DIGUNAKAN

### 1. Model CNN Tidak Di-Load

**File**: `src/lib/skinAnalyzer.ts`

**Masalah:**
- ❌ Tidak ada `tf.loadLayersModel()` atau `tf.loadModel()`
- ❌ Tidak ada import TensorFlow.js
- ❌ Fungsi `initFaceMesh()` hanya placeholder kosong
- ❌ Model di `public/models/skin-classifier/tfjs/` tidak pernah di-load

**Kode Saat Ini:**
```typescript
// Placeholder for future model loading
export async function initFaceMesh(): Promise<void> {
    return Promise.resolve(); // ❌ Tidak melakukan apa-apa
}
```

### 2. Masih Pakai Heuristic (Bukan ML)

**Face Detection:**
```typescript
// ❌ Heuristic: Deteksi berdasarkan warna kulit
function detectFacePresence(imageData: ImageData): boolean {
    // Cek RGB values untuk skin tone
    const isSkinTone = r > 60 && r < 255 && g > 40 && ...
    return (skinPixels / totalPixels) > 0.15;
}
```

**Skin Classification:**
```typescript
// ❌ Heuristic: Perhitungan manual brightness, redness, saturation
function extractFeatures(imageData: ImageData): SkinScores {
    // Perhitungan manual tanpa CNN
    const acneScore = avgRedness * 250 + (textureVariance > 30 ? 20 : 0);
    const oilyScore = (avgBrightness / 255) * 50 + ...
    // ...
}
```

### 3. Tidak Ada Face Detection CNN

- ❌ Tidak menggunakan MediaPipe Face Detection
- ❌ Tidak menggunakan TensorFlow.js face detection models
- ❌ Masih pakai skin tone color detection (heuristic)

---

## 📊 Perbandingan: Current vs Target

| Komponen | Current (Saat Ini) | Target (Roadmap) |
|----------|-------------------|------------------|
| **Face Detection** | ❌ Heuristic (skin tone) | ✅ CNN (MediaPipe/TensorFlow.js) |
| **Skin Classification** | ❌ Heuristic (brightness/redness) | ✅ CNN (trained model) |
| **Product Recommendation** | ✅ Rule-based | ✅ Rule-based (tetap - HANYA ini yang rule-based) |
| **Model Loading** | ❌ Tidak ada | ✅ Load model on init |
| **Inference** | ❌ Manual calculation | ✅ CNN inference |

**Catatan Penting**: Rule-based HANYA untuk Product Recommendation. Face Detection dan Skin Classification menggunakan CNN (Deep Learning).

---

## 🔍 Bukti ML/DL Ada Tapi Tidak Digunakan

### Bukti 1: Model File Ada
```bash
public/models/skin-classifier/
├── model.keras          # ✅ Model sudah di-train
├── model.tflite         # ✅ Format untuk mobile
├── saved_model/         # ✅ TensorFlow format
├── tfjs/                # ✅ Format untuk browser
└── labels.json          # ✅ Label classes
```

### Bukti 2: Training Script Ada
```bash
scripts/
└── train-skin-model.ts  # ✅ TypeScript training script (tidak perlu Python)
```

### Bukti 3: Kode Tidak Load Model
```typescript
// src/lib/skinAnalyzer.ts
// ❌ Tidak ada kode seperti ini:
// import * as tf from '@tensorflow/tfjs';
// const model = await tf.loadLayersModel('/models/skin-classifier/tfjs/model.json');
```

---

## 🎯 Kesimpulan

### Machine Learning & Deep Learning:

| Status | Keterangan |
|--------|------------|
| **Model Training** | ✅ **ADA** - Script training dan model sudah ada |
| **Model Files** | ✅ **ADA** - Model dalam berbagai format tersedia |
| **Dependencies** | ✅ **ADA** - TensorFlow.js sudah terinstall |
| **Implementasi** | ❌ **BELUM** - Model tidak di-load dan digunakan |
| **Inference** | ❌ **BELUM** - Masih pakai heuristic, bukan CNN |

### Yang Perlu Dilakukan:

1. **Load CNN Model** di `src/lib/skinAnalyzer.ts`
2. **Replace Heuristic** dengan CNN inference
3. **Integrate Face Detection** CNN (MediaPipe/TensorFlow.js)
4. **Test & Optimize** performance

Lihat `ROADMAP.md` untuk detail implementasi.

---

## 📝 Catatan

- Model CNN sudah **di-train** dan **siap digunakan**
- Model ada dalam format **TensorFlow.js** (siap untuk browser)
- Hanya perlu **di-load** dan **diintegrasikan** ke aplikasi
- Implementasi ada di **Phase 2** dari roadmap

---

## 🔗 Referensi

- **Roadmap**: `ROADMAP.md` - Detail implementasi CNN
- **Training Script**: `scripts/train-skin-model.ts` - Cara training model (TypeScript, tidak perlu Python)
- **Model Location**: `public/models/skin-classifier/` - Lokasi model files
- **Current Implementation**: `src/lib/skinAnalyzer.ts` - Kode saat ini (heuristic)

