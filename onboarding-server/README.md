1. Build the javascript code in the folder (from a terminal inside onboarding-server folder)
npm run build

2. Build and Run the Application
Build the Docker Image:
docker-compose build

Run the Docker Container:
docker-compose up -d

3. Test the Endpoint
   You can test the getCredentials endpoint by opening a web browser or using a tool like curl or Postman:

curl "http://localhost:3010/getCredentials?param=HelloWorld"

This should return the following response:
HelloWorld1234
