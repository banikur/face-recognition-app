# Face Recognition Based Skincare Recommendation App

A Next.js application that provides personalized skincare product recommendations based on facial analysis using **CNN-based face recognition and detection** for skin analysis, with **rule-based product recommendation** system.

## Features

### User Features
- **Face Capture**: Upload photo or use camera to capture face
- **Skin Analysis**: Automatic detection of skin conditions (oily, dry, normal, acne-prone)
- **Product Recommendations**: Get top 3 personalized product recommendations
- **Analysis History**: All analyses are logged for reporting

### Admin Features
- **Product Management**: CRUD operations for skincare products
- **Auto Weight Mapping**: Automatic calculation of product weights based on ingredients
- **Analysis Logs**: View all user analyses with filtering options
- **Reports & Analytics**: 
  - Condition distribution statistics
  - Top recommended products
  - Export to Excel/PDF

## Tech Stack

- **Frontend**: Next.js 15, React 19, TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: SQLite with better-sqlite3
- **Face Detection**: CNN-based using MediaPipe/TensorFlow.js
- **Skin Classification**: CNN-based using trained skin classifier model
- **Product Recommendation**: Rule-based (keyword matching + dot product scoring)
- **Export**: XLSX (Excel), PDFKit (PDF)

## Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd face-recognition-app
```

2. **Install dependencies**
```bash
npm install
```

3. **Initialize the database**
```bash
npm run init-db
```

This will create the database schema and seed initial product data.

4. **Set up environment variables** (optional)
```bash
cp env.example .env.local
```

Edit `.env.local` if you want to customize the admin password.

5. **Run the development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

```
face-recognition-app/
├── data/
│   ├── database.db          # SQLite database
│   ├── database.ts          # Database connection
│   ├── schema.sql           # Database schema
│   ├── models.ts            # Data models and queries
│   ├── seed.ts              # Seed data
│   └── init.ts              # Database initialization
├── src/app/
│   ├── api/
│   │   ├── analysis/        # Analysis submission endpoint
│   │   ├── analysis-logs/   # Analysis logs retrieval
│   │   ├── products/        # Product CRUD endpoints
│   │   └── reports/         # Reports and export endpoints
│   ├── admin/
│   │   └── dashboard/       # Admin dashboard
│   ├── capture/             # User face capture page
│   └── page.tsx             # Home page
└── package.json
```

## Database Schema

### Products Table
- Auto-calculates weights (w_oily, w_dry, w_normal, w_acne) from ingredients
- Supports keyword-based ingredient mapping

### Analysis Logs Table
- Stores user information and skin scores
- Records recommended products
- Tracks dominant skin condition

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/products` | GET | Get all products |
| `/api/products` | POST | Create new product |
| `/api/products/:id` | PUT | Update product |
| `/api/products/:id` | DELETE | Delete product |
| `/api/analysis` | POST | Submit analysis and get recommendations |
| `/api/analysis-logs` | GET | Get analysis logs (with filters) |
| `/api/reports/summary` | GET | Get summary statistics |
| `/api/reports/export-xlsx` | GET | Export to Excel |
| `/api/reports/export-pdf` | GET | Export to PDF |

## Usage

### For Users

1. Navigate to home page
2. Click "Start Analysis"
3. Fill in your information (name, age, optional email/phone)
4. Capture or upload your face photo
5. Wait for analysis to complete
6. View your skin condition scores and top 3 product recommendations

### For Admins

1. Navigate to Admin Dashboard
2. **Products Tab**: Add, edit, or delete products
   - Enter ingredients (comma-separated)
   - Weights are automatically calculated
3. **Analysis Logs Tab**: View all user analyses
   - Filter by condition or date range
4. **Reports Tab**: View analytics and export data
   - See condition distribution
   - View top recommended products
   - Export to Excel or PDF

## Auto Weight Mapping

The system automatically calculates product weights based on ingredient keywords:

- **Oily/Acne**: Salicylic Acid, Charcoal, Tea Tree, Witch Hazel, Sulfur
- **Dry**: Aloe Vera, Glycerin, Hyaluronic Acid, Ceramide
- **Normal**: Vitamin C, Niacinamide
- **Acne**: Benzoyl Peroxide, Retinol, Salicylic Acid

## Skin Analysis Methods

### Face Detection & Recognition
- **CNN-based** (Deep Learning) using MediaPipe TensorFlow.js model
- Detects face bounding boxes and landmarks
- Runs entirely in browser (WebGL backend)
- Confidence threshold: 0.2

### Skin Classification
- **CNN-based** (Deep Learning) using custom trained TensorFlow.js model
- Architecture: Conv2D(32) → MaxPool → Conv2D(64) → MaxPool → Conv2D(128) → GlobalAvgPool → Dense(64) → Softmax(4)
- Model located at `public/models/skin-classifier/tfjs/`
- Input: 128×128 RGB image, normalized to [-1, 1]
- Output: Softmax probabilities for 4 classes (acne, normal, oily, dry)

**Limitations (Academic Disclosure):**
- Training dataset: ~135 images (small sample size)
- Class distribution: primarily acne/normal, limited oily/dry samples
- No clinical validation performed
- Results should not be used for medical diagnosis

### Product Recommendation
- **Rule-based** (keyword matching + dot product scoring)
- Uses ingredient-based weight mapping
- Returns top 3 matching products

## Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run init-db      # Initialize database
npm run lint         # Run ESLint
```

## Local Network Access

To access from other devices on the same network:

1. Find your local IP address
2. Run the dev server: `npm run dev`
3. Access from other devices: `http://YOUR_IP:3000`

## Notes

- This is a **local MVP** implementation
- No authentication system (admin password can be added via ENV)
- Images are processed client-side (not uploaded to server)
- SQLite database for simplicity
- **CNN-based face detection and skin classification** (ML models run in browser)
- **Rule-based product recommendation** (keyword matching + scoring)

## License

MIT