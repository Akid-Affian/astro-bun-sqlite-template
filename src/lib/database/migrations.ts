import { db } from './db';

const migrations = [
  {
    version: 1,
    up: () => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE,
          password TEXT,
          created_at INTEGER NOT NULL
        );
      `);
    },
  },
  {
    version: 2,
    up: () => {
      db.exec(`
        ALTER TABLE users ADD COLUMN email TEXT;
      `);
    },
  },
];

export { migrations };
