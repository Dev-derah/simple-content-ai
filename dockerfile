FROM mcr.microsoft.com/playwright:v1.38.1-jammy

# Install system dependencies
RUN apt-get update && \
    apt-get install -y ffmpeg && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 1. Copy package files FIRST for layer caching
COPY package*.json ./


# 2. Install PRODUCTION dependencies only (more secure)
RUN npm ci --only=production --no-optional

# 3. Install Playwright browsers
RUN npx playwright install --with-deps

# 4. Copy the REST of your files AFTER npm install
COPY . .

# Environment variables
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
ENV NODE_ENV=production
EXPOSE 3000

CMD ["npm", "start"]
