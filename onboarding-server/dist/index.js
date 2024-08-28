import express from 'express';
import { initDB } from './db.js';
// import { initDB } from './db.js';
const RABBITMQ_HOST = process.env.RABBITMQ_HOST || 'rabbitmq';
const RABBITMQ_PORT = process.env.RABBITMQ_PORT || '15672';
const RABBITMQ_USERNAME = process.env.RABBITMQ_USER || 'guest';
const RABBITMQ_PASSWORD = process.env.RABBITMQ_PASS || 'guest';
// onboarding server
const app = express();
const port = 3015;
const client = await initDB();
// Middleware to parse JSON
app.use(express.json());
console.log('setting up the express server');
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
        await client.query(query, values);
    }
    catch (err) {
        console.error('Error inserting gateway:', err);
        res.status(500).json({ error: 'Failed to add gateway.' });
    }
    res.status(201).json({ message: 'Gateway added successfully!', computedSecret });
});
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
