import express, { Request, Response } from 'express';
import got from 'got';
import { initDB } from './db.js';

const RABBITMQ_HOST = process.env.RABBITMQ_HOST || 'rabbitmq';
const RABBITMQ_PORT = process.env.RABBITMQ_PORT || '15672';
const RABBITMQ_USERNAME = process.env.RABBITMQ_USER || 'guest';
const RABBITMQ_PASSWORD = process.env.RABBITMQ_PASS || 'guest';

// onboarding server
const app = express();
const port = 3015;
const db = await initDB();

// Middleware to parse JSON
app.use(express.json());

//endpoint 3010: registers new users in the .sqlite database
app.get('/register', async (req: Request, res: Response) => {
  const macAddress: string | undefined = req.query.macAddress as string;
  if (!macAddress) {
    return res.status(400).json({ error: 'Missing parameter' });
  }

  const computedSecret = macAddress+'abcd';

  // register in database
  try {
    await db.run(
      `INSERT INTO gateways (macAddress, secret, claimRequested, claimed) VALUES (?, ?, ?, ?)`,
      [macAddress, computedSecret, 0, 0]
    );
  } catch (err) {
    console.error('Error inserting gateway:', err);
    res.status(500).json({ error: 'Failed to add gateway.' });
  }

  res.status(201).json({ message: 'Gateway added successfully!', computedSecret });
});

// endpoint on 3010: getCredentials
// Called by the gateway when claimRequested status is set to 0.
app.get('/getCredentials', async (req: Request, res: Response) => {
  const macAddress: string | undefined = req.query.macAddress as string;
  const secret: string | undefined = req.query.secret as string;
  if (!macAddress) {
    return res.status(400).json({ error: 'Missing parameter' });
  }
  // TODO: check if macAddress==secret
  // TODO: check if claim==0
  // TODO: check if Claimrequested==1
  const mqttCredentials = { username: macAddress, password: macAddress+'1234' };
  const onboardingServer = new OnboardingServer();
  const createdUser = await onboardingServer.createUser(mqttCredentials.username, mqttCredentials.password);
  const setPermissions = await onboardingServer.setPermissions(mqttCredentials.username)

  // TODO: claim=1
  // TODO: claimRequested==0
  res.status(200).json({ mqttCredentials });
});

//endpoint on 3010: Claim (device)
// Called by the customer admin when assigning the gateway
// to the acccount. Changes the gateway into the pairing mode.
app.get("/Claim", async(req: Request, res: Response) => {
  const macAddress: string | undefined = req.query.macAddress as string;
  const secret: string | undefined = req.query.secret as string;
  // Check if not macAddress
  if (!macAddress) {
    return res.status(400).send('Missing parameterss')
  }
  // Check if not secret
  if (!secret) {
    return res.status(400).send("Missing parameters")
  }  
  
  // checks the secret against the database entry
  const storedSecretDict = await db.get('SELECT secret FROM gateways WHERE macAddress = ?', [macAddress])
  const storedSecret = storedSecretDict['secret']
  if (secret !== storedSecret) {
    return res.status(400).send("The secret does not match against the database entry!")
  }

  // checks if claimed is set to 0
  const claimStatusDict = await db.get('SELECT claimed FROM gateways WHERE macAddress = ?', [macAddress])
  const claimStatus = claimStatusDict['claimed']
  if (claimStatus !== 0) {
    return res.status(400).send("The device is already claimed!") 
  } 
  
  // checks if claimRequested is set to 0.
  const claimRequestedStatusDict = await db.get('SELECT claimRequested FROM gateways WHERE macAddress = ?', [macAddress])
  const claimRequestedStatus = claimRequestedStatusDict['claimRequested']
  if (claimRequestedStatus !== 0) {
    return res.status(400).send("The device is already in pairing mode!")
  }

  // updates claimRequested to 1.
  await db.run("UPDATE gateways SET claimRequested = ? WHERE macAddress = ?", [1, macAddress])
  console.log('Endpoint /Claim executed command.')
});

// endpoint on 3010: Unclaim (device)
app.get("/Unclaim", async(req: Request, res: Response) => {
  const macAddress: string | undefined = req.query.macAddress as string;
  const secret: string | undefined = req.query.secret as string;
  if (!macAddress) {
    return res.status(400).send('Missing parameterss')}
  // TODO: check if not secret
  
  // TODO: check if macAddress==secret
  // TODO: check if claimRequest==0
  // TODO: check if claim==1
  // TODO: Delete from RabbitMQ database
  // TODO: set claim=0
  console.log('Endpoint /Unclaim executed command.')
});


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// Step I: http://localhost:3010/register?macAddress=user2
// Step II: http://localhost:3010/Claim?macAddress=user2
// Step III: http://localhost:3010/getCredentials?macAddress=user2
// Step IV: http://localhost:3010/Claim?macAddress=user2


class OnboardingServer {
  // private readonly blabla;

  // constructor() {
  //   // If needed
  // }

  async createUser(username: string, password: string) {

    console.log(RABBITMQ_HOST, RABBITMQ_PORT, )
    const url = `http://${RABBITMQ_HOST}:${RABBITMQ_PORT}/api/users`;
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
    }
  };

  async setPermissions(user: string) {
  
    const vhost = '%2F';
    const url = `http://${RABBITMQ_HOST}:${RABBITMQ_PORT}/api/permissions/${vhost}/${user}`;
    const permissions = {
    configure: '.*',
    write: '.*',
    read: '.*'
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
    }
  };
}