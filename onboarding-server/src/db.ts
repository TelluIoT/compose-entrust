import pkg from 'pg';
const { Client } = pkg;

const POSTGRES_USER = process.env.POSTGRES_USER;
const POSTGRES_PASS=process.env.POSTGRES_PASS;
const POSTGRES_HOST=process.env.POSTGRES_HOST;
const POSTGRES_PORT = process.env.POSTGRES_PORT ? Number.parseInt(process.env.POSTGRES_PORT, 10) : 5434;

export async function initDB(): Promise<pkg.Client> {
  try {
    // Connect to the database
    const connectedClient = await getConnectedDbClient();

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
    await connectedClient.query(createTableQuery);

    console.log('Database initialized successfully!')

    return connectedClient;
  } catch(error) {
    console.error('Failed to instantiate database: ', error);
    throw error;
  }
};

export async function getConnectedDbClient(): Promise<pkg.Client> {
  // Database connection configuration
  const client = new Client({
    user: POSTGRES_USER,
    host: POSTGRES_HOST,
    database: 'onboarding_db',
    password: POSTGRES_PASS,
    port: POSTGRES_PORT,
  });

  await client.connect();

  return client;
}