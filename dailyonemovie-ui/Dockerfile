# Use Node.js base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json first (for caching)
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy all project files
COPY . .

# Expose Vite dev port (5173) or preview port (4173)
EXPOSE 5173

# Default command: run Vite dev server
CMD ["npm", "run", "dev", "--", "--host"]
