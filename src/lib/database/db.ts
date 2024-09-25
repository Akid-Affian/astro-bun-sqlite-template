import { Database } from "bun:sqlite";
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { migrations } from './migrations';
import { backupDatabase as backupDB } from './backup';

const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

const devDir = path.join(dataDir, 'dev');
const prodDir = path.join(dataDir, 'prod');
if (!fs.existsSync(devDir)) {
  fs.mkdirSync(devDir);
}
if (!fs.existsSync(prodDir)) {
  fs.mkdirSync(prodDir);
}

export const dbName = process.env.NODE_ENV === 'production' ? 'prod.db' : 'dev.db';
export const dbPath = process.env.NODE_ENV === 'production' ? path.join(prodDir, dbName) : path.join(devDir, dbName);

export let db: Database;

export function initDB() {
  if (fs.existsSync(dbPath)) {
    console.log(`Database already exist. Initialization skipped.`);
    db = new Database(dbPath);  
    return;
  }

  console.log(`Initializing new database at ${dbPath}...`);
  db = new Database(dbPath);  

  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      uuid TEXT UNIQUE
    );
  `);

  const currentVersionRow = db.prepare(`SELECT MAX(version) as version FROM schema_migrations`).get() as { version: number } | undefined;
  const currentVersion = currentVersionRow?.version || 0;

  let backupCreated = false; 
  for (const migration of migrations) {
    if (migration.version > currentVersion) {
      if (!backupCreated) {

        backupDatabase();
        backupCreated = true;
      }
      migration.up();
      db.prepare(`INSERT INTO schema_migrations (version, uuid) VALUES (?, ?)`).run(
        migration.version,
        crypto.randomUUID()
      );
      console.log(`Applied migration version ${migration.version}`);
    }
  }

  console.log("Database initialized successfully!");
}

export function backupDatabase() {
  backupDB(); 
}