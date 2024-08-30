import test from 'ava';
import got from 'got';
import startServer from '../dist/index.js'


let server;

test.before(async () => {
  server = await startServer(3015); // Start the server before tests run
});

test.after(() => {
  if (server) {
    server.close(); // Close the server after tests to free up the port
  }
});

test('foo', t => {


	t.pass();
});