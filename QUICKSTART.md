# Quick Start Guide

## Get Running in 3 Steps

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Initialize Database
```bash
npm run init-db
```

### Step 3: Start Server
```bash
npm run dev
```

Open **http://localhost:3000** in your browser.

---

## What You'll See

### Home Page
- Two cards: "For Users" and "For Admins"
- Click **"Start Analysis"** to begin skin analysis
- Click **"Admin Dashboard"** to manage products and view reports

### User Flow (Start Analysis)
1. Enter your name and age (email/phone optional)
2. Click "Continue to Capture"
3. Either:
   - Click "Start Camera" → "Capture Photo"
   - Or click "Upload Photo" to select a file
4. Wait for analysis (a few seconds)
5. View your results:
   - Skin condition scores (Oily, Dry, Normal, Acne)
   - Dominant condition
   - Top 3 recommended products

### Admin Flow (Admin Dashboard)
1. **Products Tab**
   - View all products with auto-calculated weights
   - Click "Add Product" to create new product
   - Enter ingredients (comma-separated) and weights calculate automatically
   - Edit or delete existing products

2. **Analysis Logs Tab**
   - View all user analyses
   - Filter by condition (oily/dry/normal/acne)
   - Filter by date range

3. **Reports Tab**
   - View statistics (total analyses, condition distribution)
   - See top recommended products
   - Export to Excel or PDF

---

## Sample Test Data

### Add a Product
- **Name**: Test Face Wash
- **Brand**: TestBrand
- **Description**: A test product
- **Ingredients**: Salicylic Acid, Aloe Vera, Niacinamide
- **Image URL**: /images/test.jpg

The system will automatically calculate:
- w_oily: ~0.5 (from Salicylic Acid)
- w_dry: ~0.5 (from Aloe Vera)
- w_normal: ~0.3 (from Niacinamide)
- w_acne: ~0.5 (from Salicylic Acid)

### Test User Analysis
- **Name**: John Doe
- **Age**: 25
- **Email**: john@example.com
- Upload any face photo (or use camera)

---

## Troubleshooting

### "Cannot find module" errors
Run: `npm install`

### Database errors
Delete and recreate:
```bash
rm data/database.db
npm run init-db
```

### Port 3000 in use
Use different port:
```bash
npm run dev -- -p 3001
```

### Camera not working
- Use file upload instead
- Ensure HTTPS or localhost
- Check browser permissions

---

## Next Steps

1. ✅ Test user analysis flow
2. ✅ Add more products via admin
3. ✅ View reports and export data
4. ✅ Test on mobile devices (use network IP)

---

## Key Features

✅ **Auto Weight Mapping** - Products automatically get weights based on ingredients
✅ **Smart Recommendations** - Top 3 products based on skin analysis
✅ **Complete Admin** - Full CRUD for products
✅ **Reports & Export** - Excel and PDF export with statistics
✅ **Local Network** - Access from any device on your network

---

## Need Help?

- Check **SETUP.md** for detailed setup instructions
- Check **IMPLEMENTATION_SUMMARY.md** for technical details
- Check **README.md** for full documentation
