# Setup Guide

## Quick Start

Follow these steps to get the application running:

### 1. Install Dependencies

```bash
npm install
```

This will install all required packages including:
- Next.js 15 and React 19
- TailwindCSS for styling
- better-sqlite3 for database
- xlsx for Excel export
- pdfkit for PDF export
- TensorFlow.js packages (optional, for future ML integration)

### 2. Initialize Database

```bash
npm run init-db
```

This command will:
- Create the SQLite database file at `data/database.db`
- Execute the schema from `data/schema.sql`
- Seed initial product data with auto-calculated weights

### 3. Start Development Server

```bash
npm run dev
```

The application will be available at:
- Local: http://localhost:3000
- Network: http://YOUR_IP:3000 (accessible from other devices on same network)

## Troubleshooting

### Database Issues

If you encounter database errors:

1. Delete the existing database:
   ```bash
   rm data/database.db
   ```

2. Reinitialize:
   ```bash
   npm run init-db
   ```

### Port Already in Use

If port 3000 is already in use, you can specify a different port:

```bash
npm run dev -- -p 3001
```

### TypeScript Errors

If you see TypeScript errors related to xlsx or pdfkit, you may need to install type definitions:

```bash
npm install --save-dev @types/pdfkit
```

Note: xlsx includes its own types, so no additional installation is needed.

## Testing the Application

### Test User Flow

1. Open http://localhost:3000
2. Click "Start Analysis"
3. Fill in test data:
   - Name: Test User
   - Age: 25
   - Email: test@example.com (optional)
4. Upload a face photo or use camera
5. Wait for analysis
6. View recommendations

### Test Admin Flow

1. Open http://localhost:3000
2. Click "Admin Dashboard"
3. Navigate through tabs:
   - **Products**: Add a new product with ingredients
   - **Analysis Logs**: View logged analyses
   - **Reports**: View statistics and export data

## Database Structure

The application uses SQLite with two main tables:

### products
- Stores product information
- Auto-calculates weights based on ingredients
- Fields: id, name, brand, description, ingredients, image_url, w_oily, w_dry, w_normal, w_acne, created_at

### analysis_logs
- Stores user analysis results
- Fields: id, user_name, user_email, user_phone, user_age, oily_score, dry_score, normal_score, acne_score, dominant_condition, recommended_product_ids, created_at

## Environment Variables

Create a `.env.local` file for custom configuration:

```env
ADMIN_PASSWORD=your_secure_password
```

Currently, the admin dashboard doesn't require authentication, but you can add it by implementing a simple password check.

## Production Build

To build for production:

```bash
npm run build
npm run start
```

This will create an optimized production build and start the server.

## Network Access

To allow access from other devices on your local network:

1. Find your local IP address:
   - Windows: `ipconfig` (look for IPv4 Address)
   - Mac/Linux: `ifconfig` or `ip addr`

2. Start the dev server:
   ```bash
   npm run dev
   ```

3. Access from other devices:
   ```
   http://YOUR_IP_ADDRESS:3000
   ```

Make sure your firewall allows connections on port 3000.

## Common Issues

### Camera Access Denied

If the camera doesn't work:
- Ensure you're accessing via HTTPS or localhost
- Check browser permissions for camera access
- Use the file upload option as fallback

### Export Not Working

If Excel/PDF export fails:
- Check that xlsx and pdfkit are properly installed
- Verify the API routes are accessible
- Check browser console for errors

### Database Locked

If you get "database is locked" errors:
- Close any other processes accessing the database
- Restart the development server
- If persistent, delete and reinitialize the database

## Next Steps

After successful setup:

1. Add more products through the admin dashboard
2. Test the analysis with different face photos
3. Review the reports and analytics
4. Customize the ingredient weight mapping in `data/models.ts`
5. Adjust the skin analysis heuristics in `src/app/capture/page.tsx`

## Support

For issues or questions:
- Check the main README.md for detailed documentation
- Review the code comments in key files
- Ensure all dependencies are properly installed
