# Use official Playwright image instead of node:18
FROM mcr.microsoft.com/playwright:v1.38.1-jammy

# Install system dependencies
RUN apt-get update && \
    apt-get install -y ffmpeg && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Set required environment variables
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
ENV NODE_ENV=production

# Expose port
EXPOSE 3000

CMD ["npm", "start"]