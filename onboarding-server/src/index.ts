import express, { Request, Response } from 'express';

const app = express();
const port = 3000;

// Middleware to parse JSON
app.use(express.json());

app.get('/getCredentials', (req: Request, res: Response) => {
  const macAddress: string | undefined = req.query.macAddress as string;
  if (!macAddress) {
    return res.status(400).send('Missing parameter');
  }

  const computedCredentials = { username: macAddress, password: macAddress+'1234' };

  res.send(computedCredentials);
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// example call: http://localhost:3010/getCredentials?param=erik134