# Use Node.js LTS version
FROM node:20-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy app source
COPY . .

# Create directory for reports
RUN mkdir -p reports

# Expose port
EXPOSE 8080

# Start the application
CMD ["npm", "start"] 