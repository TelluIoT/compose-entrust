import express, { Request, Response } from 'express';

const app = express();
const port = 3000;

// Middleware to parse JSON
app.use(express.json());

app.get('/getCredentials', (req: Request, res: Response) => {
  const param: string | undefined = req.query.param as string;
  if (!param) {
    return res.status(400).send('Missing parameter');
  }
  res.send(param);
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// example call: http://localhost:3010/getCredentials?param=erik134