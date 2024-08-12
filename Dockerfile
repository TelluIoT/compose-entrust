# Use the official Python image from the Docker Hub
FROM python:3.11-slim

# Set the working directory
WORKDIR /app

# Copy the requirements files into the container
COPY app/requirements.txt /app/requirements.txt
COPY client/requirements.txt /client/requirements.txt

# Install dependencies for the python-app
RUN pip install --no-cache-dir -r /app/requirements.txt

# Install dependencies for the mqtt-client
RUN pip install --no-cache-dir -r /client/requirements.txt

# Copy the rest of the application files into the container
COPY app/ /app/
COPY client/ /client/

# Default command (can be overridden by Docker Compose command)
CMD ["/bin/bash"]