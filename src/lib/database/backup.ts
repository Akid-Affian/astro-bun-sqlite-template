import fs from 'fs';
import path from 'path';
import { dbPath, dbName } from './db';

// Function to backup the database
export function backupDatabase() {
  const backupDir = path.join(process.cwd(), 'backups');
  const backupFileName = `${dbName}.backup-${Date.now()}.db`;
  const backupFilePath = path.join(backupDir, backupFileName);

  // Check if the database file exists and create a backup
  if (fs.existsSync(dbPath)) {
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
    }
    fs.copyFileSync(dbPath, backupFilePath);
    console.log(`Database backup created at ${backupFilePath}`);
  } else {
    console.log('Database file does not exist. No backup created.');
  }
}
