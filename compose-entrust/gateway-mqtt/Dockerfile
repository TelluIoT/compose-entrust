# Use the official Python image from the Docker Hub
FROM python:3.9-slim

# Set the working directory inside the container
WORKDIR /app

# Copy the current directory contents into the container at /app
COPY . /app

# Install the required Python packages
RUN pip install --no-cache-dir pika

# Command to run your application (you can adjust this based on your script)
# For a producer (send.py):
CMD ["python", "send.py"]
# For a consumer (receive.py):
# CMD ["python", "receive.py"]
