import express, { Request, Response } from 'express';
import got from 'got';
import * as dotenv from 'dotenv';


const RABBITMQ_HOST = process.env.RABBITMQ_HOST || 'rabbitmq';
const RABBITMQ_PORT = process.env.RABBITMQ_PORT || '15672';
const RABBITMQ_USERNAME = process.env.RABBITMQ_USER || 'guest';
const RABBITMQ_PASSWORD = process.env.RABBITMQ_PASS || 'guest';

const app = express();
const port = 3015;

// Middleware to parse JSON
app.use(express.json());

app.get('/getCredentials', async (req: Request, res: Response) => {
  const macAddress: string | undefined = req.query.macAddress as string;
  if (!macAddress) {
    return res.status(400).send('Missing parameter');
  }

  const computedCredentials = { username: macAddress, password: macAddress+'1234' };

  // TODO: connect to RabbitMQ container with HTTP API and create user with the new credentials
  const onboardingServer = new OnboardingServer();
  const createdUser = await onboardingServer.createUser(computedCredentials.username, computedCredentials.password);
  const setPermissions = await onboardingServer.setPermissions(computedCredentials.username)

  res.send(computedCredentials);
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// example call: http://localhost:3010/getCredentials?param=erik134


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
  
    // Delay for 10 seconds
    await new Promise(resolve => setTimeout(resolve, 10000));
  
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


// dotenv.config();

// // Environment variables
// const RABBITMQ_USER = process.env.RABBITMQ_USER || 'guest';
// const RABBITMQ_PASS = process.env.RABBITMQ_PASS || 'guest';


// Step 1: Create a user
// const RABBITMQ_HOST = 'localhost';
// const RABBITMQ_PORT = '15674';

// Step II: Set-up the permissions


// const setPermissions = async () => {
//   const adminUser = 'guest';
//   const adminPassword = 'guest';
//   const mqttUser = 'user1';
//   const vhost = '%2F';

//   const url = `http://${RABBITMQ_HOST}:${RABBITMQ_PORT}/api/permissions/${vhost}/${mqttUser}`;
//   const permissions = {
//     configure: '.*',
//     write: '.*',
//     read: '.*'
//   };

//   try {
//     const response = await got.put(url, {
//       json: permissions,
//       responseType: 'json',
//       username: adminUser,
//       password: adminPassword,
//     });

//     if (response.statusCode === 201) {
//       console.log('Permissions set successfully!');
//     } else {
//       console.log(`Failed to set permissions: ${response.statusCode} - ${response.body}`);
//     }
//   } catch (error) {
//     console.error(`Error setting permissions: ${error.message}`);
//   }
// };

// // Execute the steps
// createUser().then(() => setPermissions());