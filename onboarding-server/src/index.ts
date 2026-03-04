import express, { Request, Response } from 'express';
import crypto from 'crypto';
import got from 'got';
import { Database, initDB } from './db.js';
import { performance } from 'perf_hooks';
import { logPerformanceMetrics } from "./utils.js";

const RABBITMQ_HOST = process.env.RABBITMQ_HOST || 'rabbitmq';
const RABBITMQ_PORT = process.env.RABBITMQ_PORT || '15672';
const RABBITMQ_USERNAME = process.env.RABBITMQ_USER || 'guest';
const RABBITMQ_PASSWORD = process.env.RABBITMQ_PASS || 'guest';

// onboarding server
const app = express();
const port = 3015;
await initDB();
const db = new Database();

// Middleware to parse JSON
app.use(express.json());

console.log('setting up the express server, with updated build!');

function hashSecret(secret: string): string {
  return crypto.createHash('sha256').update(secret).digest('hex');
}

function isHexSha256(secret: string): boolean {
  return /^[a-f0-9]{64}$/i.test(secret);
}

function secretsMatch(providedSecret: string, storedSecretHash?: string): boolean {
  if (!storedSecretHash || !isHexSha256(storedSecretHash)) {
    return false;
  }

  const normalizedProvidedSecret = isHexSha256(providedSecret)
    ? providedSecret.toLowerCase()
    : hashSecret(providedSecret);

  const providedBuffer = Buffer.from(normalizedProvidedSecret, 'hex');
  const storedBuffer = Buffer.from(storedSecretHash.toLowerCase(), 'hex');

  if (providedBuffer.length !== storedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(Uint8Array.from(providedBuffer), Uint8Array.from(storedBuffer));
}


//endpoint 3010: registers new users in the .sqlite database
app.get('/register', async (req: Request, res: Response) => {
  const startTime = performance.now();
  const startDate = new Date();
  console.log('Received register request for MAC:', req.query.macAddress);

  const macAddress: string | undefined = req.query.macAddress as string;
  if (!macAddress) {
    const endTime = performance.now();
    logPerformanceMetrics("Onboarding-API: Register",startTime, endTime, startDate, new Date()); 
    return res.status(400).json({ error: 'Missing parameter' });
  }

  // TODO: here we compute an actually cryptographically secure key, which would be used in production.
  const computedSecret1 = macAddress + 'abcd';

  const hashedSecret = hashSecret(computedSecret1);

  // for dev/test purposes we return the simpler fake key which is predictable instead.
  // const computedSecret = macAddress + 'abcd';
  const computedSecret = hashedSecret;

  try {
    await db.addGateway(macAddress, computedSecret);
    res.status(201).json({
      message: `Gateway ${macAddress} added successfully!`,
      computedSecret,
    });
  } catch (err) {
    console.error('Error inserting gateway:', err);
    res.status(500).json({ error: `Failed to add gateway: ${macAddress}` });
  } finally {
    const endTime = performance.now(); 
    logPerformanceMetrics("Onboarding-API: Register",startTime, endTime, startDate, new Date()) 
  }
});

// Called by the customer admin when assigning the gateway
// to the account. Changes the gateway into the pairing mode.
app.get("/requestClaim", async (req: Request, res: Response) => {
  const startTime = performance.now();
  const startDate = new Date();

  const macAddress: string | undefined = req.query.macAddress as string;
  const secret: string | undefined = req.query.secret as string;

  // Check parameters
  if (!macAddress || !secret) {
    const endTime = performance.now();
    logPerformanceMetrics("Onboarding-API: RequestClaim",startTime, endTime, startDate, new Date());
    return res.status(400).send("Missing parameters");
  }

  // Checks the secret against the database entry
  const { secret: storedSecret, claimrequested: claimRequested, claimed } = await db.getGateway(macAddress) ?? {};

  if (!secretsMatch(secret, storedSecret)) {
    const endTime = performance.now();
    logPerformanceMetrics("Onboarding-API: RequestClaim",startTime, endTime, startDate, new Date());
    return res.status(403).send("No match for gateway/secret");
  }

  console.log("Returned row status: ", claimRequested, claimed);

  if (claimRequested === true) {
    const endTime = performance.now();
    logPerformanceMetrics("Onboarding-API: RequestClaim",startTime, endTime, startDate, new Date());
    return res.status(400).send("The device is already in pairing mode!");
  }

  if (claimed === true) {
    const endTime = performance.now();
    logPerformanceMetrics("Onboarding-API: RequestClaim",startTime, endTime, startDate, new Date());
    return res.status(400).send("The device is already claimed!");
  }

  // Update status
  await db.updateGatewayStatus({ macAddress, claimRequested: true, claimed: true }); // we shortcut a little bit here for the demo

  console.log("Endpoint /Claim executed command.");
  const endTime = performance.now();
  logPerformanceMetrics("Onboarding-API: RequestClaim",startTime, endTime, startDate, new Date());
  res.status(200).json({ Status: "OK" });
});

// Called by the gateway when it has registered successfully.
app.get('/getCredentials', async (req: Request, res: Response) => {
  const startTime = performance.now();
  const startDate = new Date();

  const macAddress: string | undefined = req.query.macAddress as string;
  const secret: string | undefined = req.query.secret as string;

  // Check if not macAddress
  if (!macAddress) {
    const endTime = performance.now();
    logPerformanceMetrics("Onboarding-API: GetCredentials",startTime, endTime, startDate, new Date());
    return res.status(400).json({ error: 'Missing parameter' });
  }

  // Check if not secret
  if (!secret) {
    const endTime = performance.now();
    logPerformanceMetrics("Onboarding-API: GetCredentials",startTime, endTime, startDate, new Date());
    return res.status(400).send("Missing parameters");
  }

  // Checks the secret against the database entry
  // const queryResult = await db.query('SELECT secret, claimRequested, claimed FROM gateways WHERE macAddress = $1', [macAddress])
  const { secret: storedSecret, claimrequested: claimRequested, claimed } = await db.getGateway(macAddress) ?? {};
  if (!secretsMatch(secret, storedSecret)) {
    const endTime = performance.now();
    logPerformanceMetrics("Onboarding-API: GetCredentials",startTime, endTime, startDate, new Date());
    return res.status(403).send("No match for gateway/secret");
  }

  console.log('Returned row status: ', claimRequested, claimed);

  if (claimRequested === false) {
    const endTime = performance.now();
    logPerformanceMetrics("Onboarding-API: GetCredentials",startTime, endTime, startDate, new Date());
    return res.status(400).send("The device is not in pairing mode!");
  }

  if (claimed === true) {
    const endTime = performance.now();
    logPerformanceMetrics("Onboarding-API: GetCredentials",startTime, endTime, startDate, new Date());
    return res.status(400).send("The device is already claimed!");
  }

  // Creates new MQTT users
  const mqttCredentials = { username: macAddress, password: macAddress + '1234' };
  const onboardingServer = new OnboardingServer();
  const createdUser = await onboardingServer.createUser(mqttCredentials.username, mqttCredentials.password);
  const setPermissions = await onboardingServer.setPermissions(mqttCredentials.username);

  // Creates a new exchange
  // const newExchange = await onboardingServer.createExchange(macAddress);
  const newBinding = await onboardingServer.createQueue(macAddress);
  const newQueue = await onboardingServer.bindQueueToExchange(macAddress);
  const message = await onboardingServer.publishMessage(macAddress, 'AK');

  // Update status
  await db.updateGatewayStatus({ macAddress, claimRequested: false, claimed: true });

  const endTime = performance.now();
  logPerformanceMetrics("Onboarding-API: GetCredentials",startTime, endTime, startDate, new Date());
  res.status(200).json({ mqttCredentials });
});


app.get("/unclaim", async (req: Request, res: Response) => {
  const startTime = performance.now();
  const startDate = new Date();

  const macAddress: string | undefined = req.query.macAddress as string;
  const secret: string | undefined = req.query.secret as string;

  // Check if not macAddress
  if (!macAddress) {
    const endTime = performance.now();
    logPerformanceMetrics("Onboarding-API: Unclaim",startTime, endTime, startDate, new Date());
    return res.status(400).json({ error: 'Missing parameter' });
  }

  // Check if not secret
  if (!secret) {
    const endTime = performance.now();
    logPerformanceMetrics("Onboarding-API: Unclaim",startTime, endTime, startDate, new Date());
    return res.status(400).send("Missing parameters");
  }

  // Checks the secret against the database entry
  const { secret: storedSecret, claimrequested: claimRequested, claimed } = await db.getGateway(macAddress) ?? {};
  if (!secretsMatch(secret, storedSecret)) {
    const endTime = performance.now();
    logPerformanceMetrics("Onboarding-API: Unclaim",startTime, endTime, startDate, new Date());
    return res.status(403).send("No match for gateway/secret");
  }

  console.log("Returned row status: ", claimRequested, claimed);

  if (claimed === false) {
    const endTime = performance.now();
    logPerformanceMetrics("Onboarding-API: Unclaim",startTime, endTime, startDate, new Date());
    return res.status(400).send("The device is not yet claimed!");
  }

  // const onboardingServer = new OnboardingServer();
  // const deleteduser = await onboardingServer.deleteUser(macAddress);

  await db.updateGatewayStatus({ macAddress, claimRequested: false, claimed: false });

  console.log("Endpoint /Unclaim executed command.");

  // TODO: Send a message to the gateway
  const endTime = performance.now();
  logPerformanceMetrics("Onboarding-API: Unclaim",startTime, endTime, startDate, new Date());
  res.status(200).json({ Status: "OK" });
});

app.post('/publishMessage', async (req: Request, res: Response) => {
  const startTime = performance.now();
  const startDate = new Date();

  const { message, macAddress, secret } = req.body ?? {}

  // Check parameters
  if (!macAddress || !secret || !message) {
    return res.status(400).json({ error: 'Invalid request' });
  }

  const onboardingServer = new OnboardingServer();
  await onboardingServer.publishMessage(macAddress, message);

  console.log("Endpoint /publishMessage executed command.");

  const endTime = performance.now();
  logPerformanceMetrics("Onboarding-API: publishMessage",startTime, endTime, startDate, new Date());
  res.status(200).json({ Status: "OK" });
});


// endpoint on 3010: Wipe (user)
app.get("/Wipe", async (req: Request, res: Response) => {
  const startTime = performance.now();
  const startDate = new Date();

  const macAddress: string | undefined = req.query.macAddress as string;
  const onlydb: string | undefined = req.query.onlydb as string;

  // Checks if not macAddress
  if (!macAddress) {
    const endTime = performance.now();
    // logPerformanceMetrics("Onboarding-API: Wipe",startTime, endTime, startDate, new Date());
    return res.status(400).send("Missing parameters");
  }

  // Deletes user from RabbitMQ DB
  if (!onlydb) {
    const onboardingServer = new OnboardingServer();
    const deleteduser = await onboardingServer.deleteUser(macAddress);
  }

  // TODO: Remove also user's exchange

  // Deletes user from REST_DB
  await db.removeGateway({ macAddress });

  const endTime = performance.now();
  // logPerformanceMetrics("Onboarding-API: Wipe",startTime, endTime, startDate, new Date());
  res.status(200).json({ Status: "OK" });
});



app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});


// export async function startServer(port: number) {
//   const server = await app.listen(port, () => {
//       console.log(`Server is running on port ${port}`);
//     })
//   return server;
// }

// export default app;


// Step I: http://localhost:3010/register?macAddress=user2
// Step II: http://localhost:3010/requestClaim?macAddress=user2&secret=user2abcd
// Step III: http://localhost:3010/getCredentials?macAddress=user2&secret=user2abcd
// Step IV: http://localhost:3010/requestClaim?macAddress=user2&secret=user2abcd


class OnboardingServer {

  // Creates a new user
  async createUser(username: string, password: string): Promise<void> {
    const startTime = performance.now();
    const startDate = new Date();
    const url = `http://${RABBITMQ_HOST}:${RABBITMQ_PORT}/api/users`;
    console.log(`${url}/${username}`);

    const newUser = {
      password,
      tags: ''
    };

    try {
      // Adding a new user via RabbitMQ HTTP API
      const response = await got.put(`${url}/${username}`, {
        json: newUser,
        responseType: 'json',
        username: RABBITMQ_USERNAME,
        password: RABBITMQ_PASSWORD,
      });

      if (response.statusCode === 201) {
        console.log('User created successfully!');
      } else {
        console.log(`Failed to create user: ${response.statusCode} - ${response.body}`);
      }
    } catch (error: any) {
      console.error(`Error creating user: ${error.message}`);
    } finally {
      const endTime = performance.now();
      logPerformanceMetrics("RabbitMQ: CreateUser",startTime, endTime, startDate, new Date());
    }
  };

  // // creates a new exchange
  // async createExchange(username: string) {
  //   const vhost = '/'
  //   const u = `http://${RABBITMQ_HOST}:${RABBITMQ_PORT}/api/exchanges/${encodeURIComponent(vhost)}/${encodeURIComponent(username)}`;
  //   console.log(u)
  //   try {
  //       const response = await got.put(u, {
  //           json: {
  //               type: 'topic', // We are using a topic exchange
  //               durable: true, // The exchange should survive server restarts
  //           },
  //           responseType: 'json',
  //           username: RABBITMQ_USERNAME,
  //           password: RABBITMQ_PASSWORD
  //       });

  //       console.log(`Exchange '${username}' created successfully:`, response.body);
  //   } catch (error: any) {
  //       console.error('Failed to create exchange:', error.response ? error.response.body : error.message);
  //   }
  // }

  // Creates a queue
  async createQueue(username: string): Promise<void> {
    const startTime = performance.now();
    const startDate = new Date();
    const vhost = '/';
    // const queue = 'onboarding queue';
    const url = `http://${RABBITMQ_HOST}:${RABBITMQ_PORT}/api/queues/${encodeURIComponent(vhost)}/${encodeURIComponent(username)}`;
    console.log(url);

    try {
      const response = await got.put(url, {
        json: { 
          durable: true, // The queue should survive server restarts
        },
        responseType: 'json',
        username: RABBITMQ_USERNAME,
        password: RABBITMQ_PASSWORD
      });

      console.log(`Queue '${username}' created successfully:`, response.body);
    } catch (error: any) {
      console.error('Failed to create queue:', error.response ? error.response.body : error.message);
    } finally {
      const endTime = performance.now();
      logPerformanceMetrics("RabbitMQ: CreateQueue",startTime, endTime, startDate, new Date());
    }
  }

  // Binds a queue to an exchange with a routing key (topic)
  async bindQueueToExchange(username: string): Promise<void> {
    const startTime = performance.now();
    const startDate = new Date();
    const vhost = '/';
    const url = `http://${RABBITMQ_HOST}:${RABBITMQ_PORT}/api/bindings/${encodeURIComponent(vhost)}/e/amq.topic/q/${encodeURIComponent(username)}`;

    try {
      const response = await got.post(url, {
        json: { routing_key: `${username}` },
        responseType: 'json',
        username: RABBITMQ_USERNAME,
        password: RABBITMQ_PASSWORD
      });
      console.log(`Queue '${username}' bound to exchange amq.topic with routing key '${username}'`);
    } catch (error: any) {
      console.error('Failed to bind queue to exchange:', error.response ? error.response.body : error.message);
    } finally {
      const endTime = performance.now();
      logPerformanceMetrics("RabbitMQ: BindQueueToExchange",startTime, endTime, startDate, new Date());
    }
  }

  // Publishes a message to the exchange
  async publishMessage(username: string, message: string): Promise<void> {
    const startTime = performance.now();
    const startDate = new Date();
    const vhost = '/';
    const url = `http://${RABBITMQ_HOST}:${RABBITMQ_PORT}/api/exchanges/${encodeURIComponent(vhost)}/amq.topic/publish`;
    const rounting_key = `${username}`;
    console.log(rounting_key);

    try {
      const response = await got.post(url, {
        json: {
          routing_key: rounting_key,
          payload: message,
          payload_encoding: 'string',
          properties: {}
        },
        responseType: 'json',
        username: RABBITMQ_USERNAME,
        password: RABBITMQ_PASSWORD
      });
      console.log(`Message published to exchange amq.topic with routing key '${username}':`, response.body);
    } catch (error: any) {
      console.error('Failed to publish message:', error.response ? error.response.body : error.message);
    } finally {
      const endTime = performance.now();
      logPerformanceMetrics("RabbitMQ: PublishMessage",startTime, endTime, startDate, new Date());
    }
  }

  async deleteUser(username: string): Promise<void> {
    const startTime = performance.now();
    const startDate = new Date();
    const url = `http://${RABBITMQ_HOST}:${RABBITMQ_PORT}/api/users`;
    try {
      const response = await got.delete(`${url}/${username}`, {
        responseType: 'json',
        username: RABBITMQ_USERNAME,
    password: RABBITMQ_PASSWORD,
      });

      if (response.statusCode === 204) {
        console.log('User deleted successfully!');
      } else {
        console.log(`Failed to delete user: ${response.statusCode} - ${response.body}`);
      }
    } catch (error: any) {
      console.error(`Error deleting user: ${error.message}`);
    } finally {
      const endTime = performance.now();
      logPerformanceMetrics("RabbitMQ: DeleteUser",startTime, endTime, startDate, new Date());
    }
  }
  
  async setPermissions(user: string): Promise<void> {
    const startTime = performance.now();
    const startDate = new Date();
    const vhost = '/';
    const url = `http://${RABBITMQ_HOST}:${RABBITMQ_PORT}/api/permissions/${encodeURIComponent(vhost)}/${user}`;
    console.log(url);
    // const permissions = {
    // configure: '.*', // No permission to configure anything
    // write: `^${user}`, // Allow writing only to the specific queue
    // read: `^${user}` // Allow reading only from the specific queue
    // };
    //TODO: Set a proper permission for only a selected topic
    const permissions = {
      configure: '.*',
      write: `.*`,
      read: `.*`
    };

    try {
      const response = await got.put(url, {
        json: permissions,
        responseType: 'json',
        username: RABBITMQ_USERNAME,
        password: RABBITMQ_PASSWORD,
      });

      if (response.statusCode === 201) {
        console.log('Permissions set successfully!');
      } else {
        console.log(`Failed to set permissions: ${response.statusCode} - ${response.body}`);
      }
    } catch (error: any) {
      console.error(`Error setting permissions: ${error.message}`);
    } finally {
      const endTime = performance.now();
      logPerformanceMetrics("RabbitMQ: SetPermissions",startTime, endTime, startDate, new Date());
    }
  }
}

// class Logger {
//   private functionName: string;
//   private startTime: number;
//   private startDate: Date;

//   constructor(functionName: string) {
//     this.functionName = functionName;
//   }

//   start() {
//     const startTime = performance.now();
//     const startDate = new Date();
//   }

//   end() {
//     const endTime = performance.now();
//       logPerformanceMetrics("RabbitMQ: DeleteUser",startTime, endTime, startDate, new Date());
//   }




// }