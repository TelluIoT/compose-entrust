import express from 'express';
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
app.get('/register', async (req, res) => {
    const macAddress = req.query.macAddress;
    if (!macAddress) {
        return res.status(400).json({ error: 'Missing parameter' });
    }
    const computedSecret = macAddress + 'abcd';
    // register in database
    try {
        // await db.exec(
        //   `INSERT INTO gateways (macAddress, secret, claimRequested, claimed) VALUES (${macAddress}, ${computedSecret}, ${0}, ${0})`,
        // );
        const preparedRow = { macAddress, secret: computedSecret, claimed: 0, claimRequested: 0 };
        const insert = db.prepare('INSERT INTO gateways (macAddress, secret, claimRequested, claimed) VALUES (@macAddress, @secret, @claimRequested, @claimed)');
        insert.run(preparedRow);
        res.status(201).json({ message: 'Gateway added successfully!', computedSecret });
    }
    catch (err) {
        console.error('Error inserting gateway:', err);
        res.status(500).json({ error: 'Failed to add gateway.' });
    }
});
// endpoint on 3010: getCredentials
// Called by the gateway when claimRequested status is set to 0.
// app.get('/getCredentials', async (req: Request, res: Response) => {
//   const macAddress: string | undefined = req.query.macAddress as string;
//   const secret: string | undefined = req.query.secret as string;
//   // Check if not macAddress
//   if (!macAddress) {
//     return res.status(400).json({ error: 'Missing parameter' });
//   }
//   // Check if not secret
//   if (!secret) {
//     return res.status(400).send("Missing parameters")
//   }
//   try {
//     // Check the secret against the database entry
//     const storedSecretRow = db.prepare('SELECT secret FROM Gateways WHERE macAddress = ?').get(macAddress) as { secret: any };
//     if (!storedSecretRow || secret !== storedSecretRow.secret) {
//       return res.status(400).send("The secret does not match against the database entry!");
//     }
//     // Check if claimed is set to 0
//     const claimStatusRow = db.prepare('SELECT claimed FROM Gateways WHERE macAddress = ?').get(macAddress) as DatabaseRow;
//     if (!claimStatusRow || claimStatusRow.claimed !== 0) {
//       return res.status(400).send("The device is already claimed!");
//     }
//     // Check if claimRequested is set to 1
//     const claimRequestedStatusRow = db.prepare('SELECT claimRequested FROM Gateways WHERE macAddress = ?').get(macAddress) as DatabaseRow;
//     if (!claimRequestedStatusRow || claimRequestedStatusRow.claimRequested !== 1) {
//       return res.status(400).send("The device is not in pairing mode!");
//     }
//   // creates new mqtt users
//   const mqttCredentials = { username: macAddress, password: macAddress+'1234' };
//   const onboardingServer = new OnboardingServer();
//   const createdUser = await onboardingServer.createUser(mqttCredentials.username, mqttCredentials.password);
//   const setPermissions = await onboardingServer.setPermissions(mqttCredentials.username);
//   // Creates a new exchange
//   // const newExchange = await onboardingServer.createExchange(macAddress);
//   const newBinding = await onboardingServer.createQueue(macAddress);
//   const newQueue = await onboardingServer.bindQueueToExchange(macAddress);
//   const message = await onboardingServer.publishMessage(macAddress, 'AK');
//   // updates claimRequested to 1.
//   // await db.run("UPDATE gateways SET claimRequested = ? WHERE macAddress = ?", [0, macAddress])
//   // updates claimed to 1.
//   // await db.run("UPDATE gateways SET claimed = ? WHERE macAddress = ?", [1, macAddress])
//     // Update claimRequested to 0
//     db.prepare("UPDATE Gateways SET claimRequested = ? WHERE macAddress = ?").run(0, macAddress);
//     // Update claimed to 1
//     db.prepare("UPDATE Gateways SET claimed = ? WHERE macAddress = ?").run(1, macAddress);
//   res.status(200).json({ mqttCredentials });
// } catch (error) {
//   console.error('Error processing request:', error);
//   res.status(500).send("Internal Server Error");
// }
// });
//endpoint on 3010: Claim (device)
// Called by the customer admin when assigning the gateway
// to the acccount. Changes the gateway into the pairing mode.
// app.get("/Claim", async(req: Request, res: Response) => {
//   const macAddress: string | undefined = req.query.macAddress as string;
//   const secret: string | undefined = req.query.secret as string;
//   // Check if not macAddress
//   if (!macAddress) {
//     return res.status(400).send('Missing parameterss')
//   }
//   // Check if not secret
//   if (!secret) {
//     return res.status(400).send("Missing parameters")
//   }  
//   // checks the secret against the database entry
//   const storedSecretDict = await db.get('SELECT secret FROM gateways WHERE macAddress = ?', [macAddress])
//   const storedSecret = storedSecretDict['secret']
//   if (secret !== storedSecret) {
//     return res.status(400).send("The secret does not match against the database entry!")
//   }
//   // checks if claimed is set to 0
//   const claimStatusDict = await db.get('SELECT claimed FROM gateways WHERE macAddress = ?', [macAddress])
//   const claimStatus = claimStatusDict['claimed']
//   if (claimStatus !== 0) {
//     return res.status(400).send("The device is already claimed!") 
//   } 
//   // checks if claimRequested is set to 0.
//   const claimRequestedStatusDict = await db.get('SELECT claimRequested FROM gateways WHERE macAddress = ?', [macAddress])
//   const claimRequestedStatus = claimRequestedStatusDict['claimRequested']
//   if (claimRequestedStatus !== 0) {
//     return res.status(400).send("The device is already in pairing mode!")
//   }
//   // updates claimRequested to 1.
//   await db.run("UPDATE gateways SET claimRequested = ? WHERE macAddress = ?", [1, macAddress])
//   console.log('Endpoint /Claim executed command.')
//   res.status(200).json({"Status": "OK"});
// });
// endpoint on 3010: Unclaim (device)
// app.get("/Unclaim", async(req: Request, res: Response) => {
//   const macAddress: string | undefined = req.query.macAddress as string;
//   const secret: string | undefined = req.query.secret as string;
//   // Check if not macAddress
//   if (!macAddress) {
//     return res.status(400).send('Missing parameters')
//   }
//   // Check if not secret
//   if (!secret) {
//     return res.status(400).send("Missing parameters")
//   }  
//   // checks the secret against the database entry
//   const storedSecretDict = await db.get('SELECT secret FROM gateways WHERE macAddress = ?', [macAddress])
//   const storedSecret = storedSecretDict['secret']
//   if (secret !== storedSecret) {
//     return res.status(403).send("FORBIDDEN")
//   }
//   // checks if claimed is set to 0
//   const claimStatusDict = await db.get('SELECT claimed FROM gateways WHERE macAddress = ?', [macAddress])
//   const claimStatus = claimStatusDict['claimed']
//   if (claimStatus !== 1) {
//     return res.status(409).send("The device is not claimed!") 
//   } 
//   // checks if claimRequested is set to 0.
//   const claimRequestedStatusDict = await db.get('SELECT claimRequested FROM gateways WHERE macAddress = ?', [macAddress])
//   const claimRequestedStatus = claimRequestedStatusDict['claimRequested']
//   if (claimRequestedStatus !== 0) {
//     return res.status(409).send("The device is still in pairing mode!")
//   }
//   const onboardingServer = new OnboardingServer();
//   const deleteduser = await onboardingServer.deleteUser(macAddress)
//   // updates claimed to 1.
//   await db.run("UPDATE gateways SET claimed = ? WHERE macAddress = ?", [0, macAddress])
//   console.log('Endpoint /Unclaim executed command.')
//   res.status(200).json({"Status": "OK"});
//  //TODO SEND A MESSAGES TO THE GATEWAY
// });
// endpoint on 3010: Wipe (user)
//   app.get("/Wipe", async(req: Request, res: Response) => {
//     const macAddress: string | undefined = req.query.macAddress as string;
//   // checks if not macAddress
//   if (!macAddress) {
//     return res.status(400).send('Missing parameters')
//   }
//   const onboardingServer = new OnboardingServer();
//   const deleteduser = await onboardingServer.deleteUser(macAddress)
//   // deletes user from REST_DB
//   await db.run("DELETE FROM gateways WHERE macAddress = ?", [macAddress])
//   res.status(200).json({"Status": "OK"});
// })
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
    // creates a new user
    async createUser(username, password) {
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
            }
            else {
                console.log(`Failed to create user: ${response.statusCode} - ${response.body}`);
            }
        }
        catch (error) {
            console.error(`Error creating user: ${error.message}`);
        }
    }
    ;
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
    // creates a queue
    async createQueue(username) {
        const vhost = '/';
        // const queue = 'onboarding queue';
        const u = `http://${RABBITMQ_HOST}:${RABBITMQ_PORT}/api/queues/${encodeURIComponent(vhost)}/${encodeURIComponent(username)}`;
        console.log(u);
        try {
            const response = await got.put(u, {
                json: {
                    durable: true, // The queue should survive server restarts
                },
                responseType: 'json',
                username: RABBITMQ_USERNAME,
                password: RABBITMQ_PASSWORD
            });
            console.log(`Queue '${username}' created successfully:`, response.body);
        }
        catch (error) {
            console.error('Failed to create queue:', error.response ? error.response.body : error.message);
        }
    }
    // Binds a queue to an exchange with a routing key (topic)
    async bindQueueToExchange(username) {
        const vhost = '/';
        const u = `http://${RABBITMQ_HOST}:${RABBITMQ_PORT}/api/bindings/${encodeURIComponent(vhost)}/e/amq.topic/q/${encodeURIComponent(username)}`;
        try {
            const response = await got.post(u, {
                json: {
                    routing_key: `TGW/${username}`,
                },
                responseType: 'json',
                username: RABBITMQ_USERNAME,
                password: RABBITMQ_PASSWORD
            });
            console.log(`Queue '${username}' bound to exchange amq.topic with routing key 'TGW/${username}'`);
        }
        catch (error) {
            console.error('Failed to bind queue to exchange:', error.response ? error.response.body : error.message);
        }
    }
    // Publish a message to the exchange
    async publishMessage(username, message) {
        const vhost = '/';
        const u = `http://${RABBITMQ_HOST}:${RABBITMQ_PORT}/api/exchanges/${encodeURIComponent(vhost)}/amq.topic/publish`;
        const rounting_key = `TGW/${username}`;
        console.log(rounting_key);
        try {
            const response = await got.post(u, {
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
            console.log(`Message published to exchange amq.topic with routing key '$TGW/{username}':`, response.body);
        }
        catch (error) {
            console.error('Failed to publish message:', error.response ? error.response.body : error.message);
        }
    }
    async deleteUser(username) {
        const url = `http://${RABBITMQ_HOST}:${RABBITMQ_PORT}/api/users`;
        try {
            const response = await got.delete(`${url}/${username}`, {
                responseType: 'json',
                username: RABBITMQ_USERNAME,
                password: RABBITMQ_PASSWORD,
            });
            if (response.statusCode === 204) {
                console.log('User deleted successfully!');
            }
            else {
                console.log(`Failed to delete user ${response.statusCode} - ${response.body}`);
            }
        }
        catch (error) {
            console.error(`Error creating user ${error.message}`);
        }
    }
    async setPermissions(user) {
        const vhost = '/';
        const url = `http://${RABBITMQ_HOST}:${RABBITMQ_PORT}/api/permissions/${encodeURIComponent(vhost)}/${user}`;
        console.log(url);
        // const permissions = {
        // configure: '.*', // No permission to configure anything
        // write: `^TGW:${user}`, // Allow writing only to the specific queue
        // read: `^TGW:${user}` // Allow reading only from the specific queue
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
            }
            else {
                console.log(`Failed to set permissions: ${response.statusCode} - ${response.body}`);
            }
        }
        catch (error) {
            console.error(`Error setting permissions: ${error.message}`);
        }
    }
    ;
}
