const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Paths
const dbPath = path.join(__dirname, '..', 'data', 'database.db');
const backupDir = path.join(__dirname, '..', 'data', 'backups');

// Create backup directory if it doesn't exist
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err);
    return;
  }

  console.log('Connected to the database');

  // Backup existing data
  db.serialize(() => {
    // Backup existing analysis_logs data
    db.all('SELECT * FROM analysis_logs', [], (err, rows) => {
      if (err) {
        console.error('Error reading existing data:', err);
        return;
      }

      const backupFile = path.join(backupDir, `analysis_logs_backup_${Date.now()}.json`);
      fs.writeFileSync(backupFile, JSON.stringify(rows, null, 2));
      console.log(`Backup saved to ${backupFile}`);

      // Drop the existing table
      console.log('Dropping existing analysis_logs table...');
      
      db.run('DROP TABLE IF EXISTS analysis_logs', (err) => {
        if (err) {
          console.error('Error dropping table:', err);
          return;
        }
        
        console.log('Table dropped successfully');
        
        // Create the new table with the correct schema
        const createTableSQL = `
          CREATE TABLE IF NOT EXISTS analysis_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_name TEXT NOT NULL,
            user_email TEXT,
            user_phone TEXT,
            user_age INTEGER,
            oily_score REAL NOT NULL,
            dry_score REAL NOT NULL,
            normal_score REAL NOT NULL,
            acne_score REAL NOT NULL,
            dominant_condition TEXT NOT NULL,
            recommended_product_ids TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `;
        
        db.run(createTableSQL, (err) => {
          if (err) {
            console.error('Error creating table:', err);
            return;
          }
          
          console.log('Table created successfully with new schema');
          
          // Close the database connection
          db.close((err) => {
            if (err) {
              console.error('Error closing database:', err);
            } else {
              console.log('Database connection closed');
            }
          });
        });
      });
    });
  });
});
