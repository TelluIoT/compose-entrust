# Use the official Node.js 20 image as the base image
FROM node:18-alpine

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application files
COPY . .

# # Build the TypeScript code
RUN npm run build

# Expose the application port
EXPOSE 3015

# Start the server
CMD ["node", "dist/index.js"]