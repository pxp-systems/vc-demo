FROM node:16-alpine

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy the application files
COPY . .

# Expose the port
EXPOSE 3030

# Run the app
CMD ["node", "resolver.js"]
