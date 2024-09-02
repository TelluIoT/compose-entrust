## Run locally

Navigate into folder ./onboarding-server

## altenative 1: run with node js

1. Build the javascript code in the folder (from a terminal inside onboarding-server folder) and start server

   ```
   npm run build-and-start
   ```

2. Test the endpoint:
   http://localhost:3015/register?macAddress=HelloWorld

## alternative 2: Run as part of docker-compose

Build the Docker Image:

```
docker-compose build
```

Run the Docker Container:

```
docker-compose up -d
```

3. Test the Endpoint
   You can test the getCredentials endpoint by opening a web browser or using a tool like curl or Postman:

curl ""

This should return the following response:
HelloWorld1234

## Deployment instructions
