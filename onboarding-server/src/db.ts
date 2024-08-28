import Database from 'better-sqlite3';

// Convert the current module's URL to a file path

// Function to initialize the SQLite database
export async function initDB(): Promise<any> {
  const dbPath = 'foobar.db';

  console.log('dbPath: ', dbPath);

  // Open the database using better-sqlite3
  const db = new Database(dbPath);

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