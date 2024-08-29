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
console.log('setting up the express server, with updated build!');
//endpoint 3010: registers new users in the .sqlite database
app.get('/register', async (req, res) => {
    console.log('received request!');
    const macAddress = req.query.macAddress;
    if (!macAddress) {
        return res.status(400).json({ error: 'Missing parameter' });
    }
    const computedSecret = macAddress + 'abcd';
    // register in database
    try {
        const query = `INSERT INTO gateways (macAddress, secret) VALUES ($1, $2)`;
        const values = [macAddress, computedSecret];
        await db.query(query, values);
        res.status(201).json({ message: `Gateway ${macAddress} added successfully!`, computedSecret });
    }
    catch (err) {
        console.error('Error inserting gateway:', err);
        res.status(500).json({ error: `Failed to add gateway: ${macAddress} ` });
    }
});
// endpoint on 3010: getCredentials
// Called by the gateway when claimRequested status is set to 0.
app.get('/getCredentials', async (req, res) => {
    const macAddress = req.query.macAddress;
    const secret = req.query.secret;
    // Check if not macAddress
    if (!macAddress) {
        return res.status(400).json({ error: 'Missing parameter' });
    }
    // Check if not secret
    if (!secret) {
        return res.status(400).send("Missing parameters");
    }
    // checks the secret against the database entry
    const queryResult = await db.query('SELECT secret, claimRequested, claimed FROM gateways WHERE macAddress = $1', [macAddress]);
    const { secret: storedSecret, claimRequested: claimRequestedStatus, claimed: claimStatus } = queryResult.rows?.[0] ?? {};
    if (secret !== storedSecret) {
        return res.status(400).send("The secret does not match against the database entry");
    }
    // checks if claimed is false
    if (claimStatus !== false) {
        return res.status(400).send("The device is already claimed!");
    }
    // checks if claimRequested is false
    if (claimRequestedStatus !== true) {
        return res.status(400).send("The device is not in pairing mode!");
    }
    // creates new mqtt users
    const mqttCredentials = { username: macAddress, password: macAddress + '1234' };
    const onboardingServer = new OnboardingServer();
    const createdUser = await onboardingServer.createUser(mqttCredentials.username, mqttCredentials.password);
    const setPermissions = await onboardingServer.setPermissions(mqttCredentials.username);
    // Creates a new exchange
    // const newExchange = await onboardingServer.createExchange(macAddress);
    const newBinding = await onboardingServer.createQueue(macAddress);
    const newQueue = await onboardingServer.bindQueueToExchange(macAddress);
    const message = await onboardingServer.publishMessage(macAddress, 'AK');
    // updates claimRequested to false and claimed to true.
    await db.query("UPDATE gateways SET claimRequested = false, claimed = true WHERE macAddress = $1", [macAddress]);
    res.status(200).json({ mqttCredentials });
});
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
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
                    routing_key: `TGW:${username}`,
                },
                responseType: 'json',
                username: RABBITMQ_USERNAME,
                password: RABBITMQ_PASSWORD
            });
            console.log(`Queue '${username}' bound to exchange amq.topic with routing key 'TGW:${username}'`);
        }
        catch (error) {
            console.error('Failed to bind queue to exchange:', error.response ? error.response.body : error.message);
        }
    }
    // Publish a message to the exchange
    async publishMessage(username, message) {
        const vhost = '/';
        const u = `http://${RABBITMQ_HOST}:${RABBITMQ_PORT}/api/exchanges/${encodeURIComponent(vhost)}/amq.topic/publish`;
        const rounting_key = `TGW:${username}`;
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
            console.log(`Message published to exchange amq.topic with routing key '$TGW:{username}':`, response.body);
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
