// import sqlite3 from 'sqlite3';
// import { open, Database } from 'sqlite';

// // Function to initialize the SQLite database
// export async function initDB(): Promise<Database<sqlite3.Database, sqlite3.Statement>> {
//   const db = await open({
//     filename: 'mydatabase.sqlite',
//     driver: sqlite3.Database,
//   });

//   // Create the 'gateways' table if it doesn't exist
//   await db.exec(`
//     CREATE TABLE IF NOT EXISTS Gateways (
//       macAddress TEXT PRIMARY KEY,
//       secret TEXT NOT NULL,
//       claimRequested BOOLEAN DEFAULT 0,
//       claimed BOOLEAN DEFAULT 0
//     )
//   `);

//   return db;
// }


import pkg from 'pg';
const { Client } = pkg;

const POSTGRES_USER = process.env.POSTGRES_USER;
const POSTGRES_PASS=process.env.POSTGRES_PASS;
const POSTGRES_HOST=process.env.POSTGRES_HOST;
const POSTGRES_PORT = process.env.POSTGRES_PORT ? Number.parseInt(process.env.POSTGRES_PORT, 10) : 5434;

// Database connection configuration
const client = new Client({
  user: POSTGRES_USER,
  host: POSTGRES_HOST,
  database: 'onboarding_db',
  password: POSTGRES_PASS,
  port: POSTGRES_PORT,
});

export async function initDB(): Promise<pkg.Client> {
  try {
    // Connect to the database
    await client.connect();

    // Create table idempotently
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS gateways (
        macAddress TEXT PRIMARY KEY,
        secret TEXT NOT NULL,
        claimRequested BOOLEAN DEFAULT false,
        claimed BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    await client.query(createTableQuery);

    console.log('Database initialized successfully!')
  } catch(error) {
    console.error('Failed to instantiate database: ', error);
    throw error;
  }
  return client;
};

//   // Create the 'gateways' table if it doesn't exist
//   await db.exec(`
//     CREATE TABLE IF NOT EXISTS Gateways (
//       macAddress TEXT PRIMARY KEY,
//       secret TEXT NOT NULL,
//       claimRequested BOOLEAN DEFAULT 0,
//       claimed BOOLEAN DEFAULT 0
//     )
//   `);

//   return db;
// }