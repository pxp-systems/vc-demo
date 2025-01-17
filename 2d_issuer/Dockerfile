# Start with a base Node.js image
FROM node:16-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy the package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application files into the container
COPY . .

# Expose the desired port (e.g., 3000 if you’re using Express)
EXPOSE 3020

# Command to start the Node.js app
CMD ["node", "issuer.js"]
