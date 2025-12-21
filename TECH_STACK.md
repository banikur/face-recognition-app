# Tech Stack - Approved & Implemented

## Overview

This document defines the approved technology stack for the Face Recognition Based Skincare Recommendation App. All documentation should reference this stack consistently.

---

## Core Technologies

### Frontend
- **Framework**: Next.js 15 (App Router)
- **UI Library**: React 19
- **Styling**: TailwindCSS 4
- **Language**: TypeScript 5

### Backend
- **Framework**: Next.js API Routes (monolith architecture)
- **Language**: TypeScript
- **No separate backend server** - All API routes in Next.js

### Database
- **Database**: SQLite
- **Driver**: better-sqlite3
- **ORM**: None (raw SQL queries)

---

## Machine Learning & Deep Learning

### Face Detection
- **Method**: CNN-based
- **Library**: MediaPipe Face Detection OR TensorFlow.js face detection models
- **Dependencies**:
  - `@mediapipe/face_mesh`: ^0.4.1633559619
  - `@tensorflow-models/face-landmarks-detection`: ^1.0.2
  - `@tensorflow/tfjs`: ^4.22.0
  - `@tensorflow/tfjs-backend-webgl`: ^4.22.0

### Skin Classification
- **Method**: CNN-based
- **Model**: Trained skin classifier (TensorFlow.js format)
- **Location**: `public/models/skin-classifier/tfjs/`
- **Training**: TypeScript script (`scripts/train-skin-model.ts`)
- **No Python required** - All training and inference in TypeScript/JavaScript

### Product Recommendation
- **Method**: Rule-based ONLY (NOT ML-based)
- **Note**: This is the ONLY rule-based component in the system
- **Algorithm**: Keyword matching + dot product scoring
- **Formula**: `score = skinScores · productWeights`
- **Implementation**: `data/models.ts` - `calculateWeights()` function
- Face detection and skin classification use CNN (NOT rule-based)

---

## Data Export

- **Excel**: XLSX library (`xlsx`: ^0.18.5)
- **PDF**: PDFKit (`pdfkit`: ^0.15.0)

---

## Development Tools

- **Package Manager**: npm
- **TypeScript Runner**: tsx (for scripts)
- **Linting**: ESLint with Next.js config
- **Build Tool**: Next.js built-in

---

## Training & Model Development

### Training Script
- **Language**: TypeScript (NOT Python)
- **File**: `scripts/train-skin-model.ts`
- **Framework**: TensorFlow.js
- **Command**: `npm run train-model`

### Model Formats
- **TensorFlow.js**: Primary format (for browser)
- **Keras**: Source format (if needed)
- **TFLite**: Mobile format (if needed)

---

## Architecture Principles

### ✅ Approved
- Direct route handlers (Next.js API routes)
- Raw SQL queries (no ORM)
- Client-side ML inference (browser-based)
- Rule-based recommendation system
- TypeScript/JavaScript only (no Python)

### ❌ NOT Approved
- Python scripts or dependencies
- MySQL/PostgreSQL (use SQLite)
- ORM libraries
- Service/repository abstraction layers
- State management libraries (Redux, Zustand, etc.)
- Server-side ML inference (use client-side)

---

## Key Methods

### Face Detection & Recognition
- **CNN-based** (Deep Learning) using MediaPipe or TensorFlow.js
- Real-time detection in browser
- Extracts face bounding boxes
- **NOT rule-based** - Uses trained CNN models

### Skin Classification
- **CNN-based** (Deep Learning) using trained TensorFlow.js model
- Processes 128x128 RGB images
- Outputs 4-class probabilities: [acne, normal, oily, dry]
- **NOT rule-based** - Uses trained CNN models

### Product Recommendation
- **Rule-based ONLY** (NOT ML-based)
- **This is the ONLY rule-based component** in the entire system
- Keyword matching from ingredients
- Automatic weight calculation
- Dot product scoring algorithm

---

## Dependencies Summary

### Core
- `next`: ^15.5.3
- `react`: ^19.1.0
- `react-dom`: ^19.1.0
- `typescript`: ^5
- `tailwindcss`: ^4

### Database
- `better-sqlite3`: ^12.2.0
- `@types/better-sqlite3`: ^7.6.13

### ML/DL
- `@tensorflow/tfjs`: ^4.22.0
- `@tensorflow/tfjs-backend-webgl`: ^4.22.0
- `@mediapipe/face_mesh`: ^0.4.1633559619
- `@tensorflow-models/face-landmarks-detection`: ^1.0.2

### Export
- `xlsx`: ^0.18.5
- `pdfkit`: ^0.15.0

### Utilities
- `sharp`: ^0.33.5 (image processing)
- `better-auth`: ^1.4.4 (authentication)
- `tsx`: ^4.20.5 (TypeScript execution)

---

## Notes

- **No Python**: All code is TypeScript/JavaScript
- **No MySQL**: Uses SQLite for simplicity
- **Client-side ML**: All ML inference happens in browser
- **Rule-based recommendation**: Intentional design choice (not ML-based)
- **Training**: Can be done with TypeScript script (no Python needed)

---

## Version Control

This tech stack is **locked** and should not be changed without approval. All documentation must reference this stack consistently.

