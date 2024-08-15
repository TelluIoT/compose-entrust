import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';

// Function to initialize the SQLite database
export async function initDB(): Promise<Database<sqlite3.Database, sqlite3.Statement>> {
  const db = await open({
    filename: path.join(__dirname, '..', 'data', 'mydatabase.sqlite'),
    driver: sqlite3.Database,
  });

  // Create the 'gateways' table if it doesn't exist
  await db.exec(`
    CREATE TABLE IF NOT EXISTS Gateways (
      macAddress TEXT PRIMARY KEY,
      secret TEXT NOT NULL,
      claimRequested BOOLEAN DEFAULT 0,
      claimed BOOLEAN DEFAULT 0
    )
  `);

  return db;
}