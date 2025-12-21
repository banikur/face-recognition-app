# Face Wash Recommendation System - Development Documentation

## Project Overview

This is a Next.js monolith application with SQLite database that provides face wash recommendations based on face recognition analysis. The system allows users to upload face images, analyzes their skin condition, and provides personalized product recommendations. Admins can manage master data, view reports, and export data.

## Technology Stack

- **Frontend**: Next.js 15 with App Router, React 19, TypeScript, TailwindCSS
- **Backend**: Next.js API Routes (monolith architecture)
- **Database**: SQLite with better-sqlite3
- **Face Detection**: CNN-based using MediaPipe/TensorFlow.js
- **Skin Classification**: CNN-based using trained TensorFlow.js model
- **Product Recommendation**: Rule-based (keyword matching + dot product scoring)
- **Data Export**: XLSX (Excel), PDFKit (PDF)

## Project Structure

```
face-recognition-app/
├── data/                 # Database files and models
├── public/               # Static assets
│   └── models/           # CNN models (TensorFlow.js format)
│       └── skin-classifier/  # Trained skin classification model
├── src/
│   └── app/              # Next.js app directory
│       ├── admin/        # Admin dashboard
│       ├── api/          # API routes
│       ├── components/   # React components
│       ├── lib/          # Utilities (skinAnalyzer, etc.)
│       ├── layout.tsx    # Main layout
│       └── page.tsx      # Home page
├── scripts/              # Training scripts (TypeScript)
├── memory/               # Development documentation
└── package.json          # Project dependencies
```

## Database Schema

The application uses SQLite with the following tables:

1. **products** - Face wash products with auto-calculated weights (w_oily, w_dry, w_normal, w_acne)
2. **analysis_logs** - Records of user analysis sessions with skin scores and recommendations

## Setup and Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Initialize the database:
   ```
   npm run init-db
   ```
4. Inject sample data (optional):
   ```
   npm run inject-data
   ```
5. Start the development server:
   ```
   npm run dev
   ```

## Development Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run init-db` - Initialize database with schema and seed data

## Key Features Implemented

### User Features
- CNN-based face detection and skin classification
- Personalized product recommendations (rule-based)
- Analysis history tracking

### Admin Features
- CRUD operations for products (auto weight mapping)
- Analytics dashboard with reports
- Data export to Excel/PDF formats

## Data Models

All database operations are handled through TypeScript models in `data/models.ts`:
- Product (with auto weight calculation)
- AnalysisLog

Key functions:
- `calculateWeights(ingredients)` - Auto-calculates product weights from ingredients
- `getAllProducts()` - Retrieve all products
- `createProduct()` - Create product with auto weight mapping
- `getAllAnalysisLogs()` - Retrieve analysis logs with filtering

## Face Recognition Implementation

The face recognition feature uses **CNN-based models** (Deep Learning):
1. **Face Detection**: CNN-based (Deep Learning) using MediaPipe or TensorFlow.js face detection models
   - **NOT rule-based** - Uses trained CNN models
   - Detects face bounding boxes in real-time
   - Extracts face region for analysis
2. **Skin Classification**: CNN-based (Deep Learning) using trained skin classifier model
   - **NOT rule-based** - Uses trained CNN models
   - Model located at `public/models/skin-classifier/`
   - Classifies skin into 4 categories: oily, dry, normal, acne
   - Returns confidence scores for each category
3. **Product Recommendation**: Rule-based system (HANYA ini yang rule-based)
   - **ONLY rule-based component** in the entire system
   - Keyword matching from product ingredients
   - Dot product scoring: `score = skinScores · productWeights`
   - Returns top 3 matching products

## Admin Functionality

The admin section provides a complete CRUD interface for all master data:
- Products management
- Skin types configuration
- Ingredients database
- Recommendation rules
- Analysis reports
- Data export capabilities

## Implementation Methods

### Face Detection & Recognition
- **CNN-based (Deep Learning)**: Uses MediaPipe Face Detection or TensorFlow.js models
- **NOT rule-based** - Uses trained CNN models
- Real-time face detection in browser
- Extracts face regions for skin analysis

### Skin Classification
- **CNN-based (Deep Learning)**: Uses trained skin classifier model
- **NOT rule-based** - Uses trained CNN models
- Model processes 128x128 RGB face images
- Outputs probabilities for 4 skin conditions

### Product Recommendation
- **Rule-based ONLY** (NOT ML-based): Keyword matching + dot product scoring
- **This is the ONLY rule-based component** in the entire system
- Automatic weight calculation from ingredients
- Returns top 3 products based on skin condition scores

## Future Improvements

1. Add face recognition (identify specific users)
2. Add user authentication and personalized history
3. Fine-tune CNN models with more training data
4. Add model versioning and A/B testing
5. Implement more detailed analytics and reporting
6. Optimize model loading and inference performance