const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, '..', 'data', 'database.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err);
    return;
  }
  
  console.log('Connected to the database');
  
  // Check the structure of analysis_logs table
  db.all("PRAGMA table_info(analysis_logs)", [], (err, rows) => {
    if (err) {
      console.error('Error getting table info:', err);
      return;
    }
    
    console.log('\nAnalysis Logs Table Structure:');
    console.table(rows);
    
    // Close the database connection
    db.close();
  });
});
