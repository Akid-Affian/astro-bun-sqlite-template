import { Database } from "bun:sqlite";
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { migrations } from '@lib/database/migrations';
import { backupDatabase } from '@lib/database/backup';

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
export const dbPath =
  process.env.NODE_ENV === 'production' ? path.join(prodDir, dbName) : path.join(devDir, dbName);

// Initialize the database
export const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS schema_migrations (
    version INTEGER PRIMARY KEY,
    uuid TEXT UNIQUE
  );
`);

let isInitialized = false; // Flag to track whether the DB is initialized

// Function to initialize the database and apply migrations
export function initDB() {
  if (isInitialized) {
    return; // Prevent multiple initializations
  }
  
  const currentVersionRow = db
    .prepare(`SELECT MAX(version) as version FROM schema_migrations`)
    .get() as { version: number } | undefined;
  const currentVersion = currentVersionRow?.version || 0;

  // Apply pending migrations
  let backupCreated = false; // Track if backup has been created
  for (const migration of migrations) {
    if (migration.version > currentVersion) {
      if (!backupCreated) {
        // Create a backup before applying the first pending migration
        backupDatabase();
        backupCreated = true;
      }

      // Apply the migration
      migration.up();
      
      // Insert the migration version into schema_migrations to prevent reapplying
      db.prepare(`INSERT INTO schema_migrations (version, uuid) VALUES (?, ?)`).run(
        migration.version,
        crypto.randomUUID()
      );
      console.log(`Applied migration version ${migration.version}`);
    } else {
      console.log(`Migration version ${migration.version} already applied, skipping.`);
    }
  }

  isInitialized = true; // Mark the DB as initialized
}

// Function to store a user message and moderation result
export function storeMessage(userId: number, groupId: number, message: string, moderationResult: any) {
  const now = Date.now();
  const insertMessageStmt = db.prepare(`
    INSERT INTO messages (user_id, group_id, message, is_allowed, moderation_reason, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const messageId = insertMessageStmt.run(
    userId, 
    groupId, 
    message, 
    moderationResult.isAllowed ? 1 : 0, 
    moderationResult.reason || null, 
    now, 
    now
  ).lastInsertRowid;

  return messageId;
}

export { backupDatabase };
