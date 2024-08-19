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
app.get('/register', async (req, res) => {
    const macAddress = req.query.macAddress;
    if (!macAddress) {
        return res.status(400).json({ error: 'Missing parameter' });
    }
    const computedSecret = macAddress + 'abcd';
    // register in database
    try {
        await db.run(`INSERT INTO gateways (macAddress, secret, claimRequested, claimed) VALUES (?, ?, ?, ?)`, [macAddress, computedSecret, 0, 0]);
    }
    catch (err) {
        console.error('Error inserting gateway:', err);
        res.status(500).json({ error: 'Failed to add gateway.' });
    }
    res.status(201).json({ message: 'Gateway added successfully!', computedSecret });
});
app.get('/getCredentials', async (req, res) => {
    const macAddress = req.query.macAddress;
    if (!macAddress) {
        return res.status(400).json({ error: 'Missing parameter' });
    }
    const mqttCredentials = { username: macAddress, password: macAddress + '1234' };
    const onboardingServer = new OnboardingServer();
    const createdUser = await onboardingServer.createUser(mqttCredentials.username, mqttCredentials.password);
    const setPermissions = await onboardingServer.setPermissions(mqttCredentials.username);
    res.status(200).json({ mqttCredentials });
});
app.get("/Claim", async (req, res) => {
    const macAddress = req.query.macAddress;
    if (!macAddress) {
        return res.status(400).send('Missing parameterss');
        // TODO: Add an autorization
        // If authorized: claim device
        // Else: Reject
    }
    console.log('Endpoint /Claim executed command.');
});
app.get("/Unclaim", async (req, res) => {
    const macAddress = req.query.macAddress;
    if (!macAddress) {
        return res.status(400).send('Missing parameterss');
        // TODO: Add an autorization
        // If authorized: claim device
        // Else: Reject
    }
    // Todo: Check if device was claimed
    // If claimed: unclaim
    // Else: Reject
    console.log('Endpoint /Unclaim executed command.');
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
    async createUser(username, password) {
        console.log(RABBITMQ_HOST, RABBITMQ_PORT);
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
    async setPermissions(user) {
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
