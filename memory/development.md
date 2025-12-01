# Face Wash Recommendation System - Development Documentation

## Project Overview

This is a Next.js monolith application with SQLite database that provides face wash recommendations based on face recognition analysis. The system allows users to upload face images, analyzes their skin condition, and provides personalized product recommendations. Admins can manage master data, view reports, and export data.

## Technology Stack

- **Frontend**: Next.js 13+ with App Router, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes (monolith architecture)
- **Database**: SQLite with better-sqlite3
- **Data Export**: CSV/JSON export functionality

## Project Structure

```
face-recognition-app/
├── data/                 # Database files and models
├── public/               # Static assets
│   └── models/           # face-api.js models
├── src/
│   └── app/              # Next.js app directory
│       ├── admin/        # Admin dashboard and CRUD pages
│       ├── face-recognition/  # Face recognition components
│       ├── recommendations/   # Product recommendations
│       ├── layout.tsx    # Main layout
│       └── page.tsx      # Home page
├── memory/               # Development documentation
└── package.json          # Project dependencies
```

## Database Schema

The application uses SQLite with the following tables:

1. **skin_types** - Different skin types (Oily, Dry, Normal, etc.)
2. **products** - Face wash products with their properties
3. **ingredients** - Product ingredients and their effects
4. **rules** - Recommendation rules linking skin types to products
5. **analysis_logs** - Records of user analysis sessions

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
- Face recognition analysis using face-api.js
- Personalized product recommendations
- Analysis history tracking

### Admin Features
- CRUD operations for products, skin types, ingredients, and rules
- Analytics dashboard with reports
- Data export to CSV/JSON formats

## Data Models

All database operations are handled through TypeScript models in `data/models.ts`:
- SkinType
- Product
- Ingredient
- Rule
- AnalysisLog

Each model includes functions for:
- Retrieving all records
- Retrieving by ID
- Creating new records
- Updating existing records
- Deleting records

## Face Recognition Implementation

The face recognition feature uses face-api.js library:
1. Users can upload face images or use their camera
2. face-api.js analyzes facial features
3. Skin condition is determined based on analysis
4. Recommendations are generated based on skin type

## Admin Functionality

The admin section provides a complete CRUD interface for all master data:
- Products management
- Skin types configuration
- Ingredients database
- Recommendation rules
- Analysis reports
- Data export capabilities

## Future Improvements

1. Implement actual face analysis algorithms instead of simulated results
2. Add user authentication and personalized history
3. Enhance the recommendation engine with more sophisticated algorithms
4. Add image upload functionality in addition to camera capture
5. Implement more detailed analytics and reporting