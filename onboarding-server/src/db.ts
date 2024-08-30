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

interface Gateway {
  macAddress: string;
  secret: string;
  claimRequested: boolean;
  claimed: boolean;
}

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

export class Database {
  private client: pkg.Client | undefined = undefined;

  private async getConnectedDbClient(): Promise<pkg.Client> {
    if (this.client) return this.client;

    const client = new Client({
      user: POSTGRES_USER,
      host: POSTGRES_HOST,
      database: 'onboarding_db',
      password: POSTGRES_PASS,
      port: POSTGRES_PORT,
    });
  
    await client.connect();

    this.client = client;
  
    return client;
  }

  async addGateway(macAddress: string, secret: string) {
    const client = await this.getConnectedDbClient();
    await client.query(`INSERT INTO gateways (macAddress, secret) VALUES ($1, $2)`, [macAddress, secret]);
  }

  async getGateway(macAddress: string): Promise<Gateway | undefined> {
    const client = await this.getConnectedDbClient();
    const queryResult = await client.query('SELECT secret, claimRequested, claimed FROM gateways WHERE macAddress = $1', [macAddress])
    const row = queryResult.rows?.[0];
    return row;
  }

  async updateGatewayStatus({ macAddress, claimRequested, claimed }: { macAddress: string, claimRequested: boolean, claimed: boolean }) {
    const client = await this.getConnectedDbClient();
    await client.query("UPDATE gateways SET claimRequested = $2, claimed = $3 WHERE macAddress = $1", [macAddress, claimRequested, claimed])
  }


}