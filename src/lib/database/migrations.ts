import { db } from './db';

const migrations = [
  {
    version: 1,
    up: () => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          oauth_provider TEXT,
          oauth_id TEXT,
          oauth_username TEXT,
          created_at INTEGER,
          updated_at INTEGER
        );

        CREATE TABLE IF NOT EXISTS groups (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          group_name TEXT UNIQUE,
          created_at INTEGER,
          updated_at INTEGER
        );

        CREATE TABLE IF NOT EXISTS messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          group_id INTEGER,
          message TEXT,
          is_allowed INTEGER,
          moderation_reason TEXT,
          created_at INTEGER,
          updated_at INTEGER,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
        );
      `);

      // Insert the two groups: UM Confession and UMCCED Confession
      db.exec(`
        INSERT OR IGNORE INTO groups (group_name, created_at, updated_at)
        VALUES ('UM Confession', ${Date.now()}, ${Date.now()}),
               ('UMCCED Confession', ${Date.now()}, ${Date.now()});
      `);
    },
  },
];

export { migrations };
