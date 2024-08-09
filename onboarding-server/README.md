1. Build and Run the Application
   Finally, follow these steps to build and run the application:

Build the Docker Image:
docker-compose build

Run the Docker Container:
docker-compose up

2. Test the Endpoint
   You can test the getCredentials endpoint by opening a web browser or using a tool like curl or Postman:

curl "http://localhost:3000/getCredentials?param=HelloWorld"

This should return the following response:
HelloWorld
