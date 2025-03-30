FROM mcr.microsoft.com/playwright:v1.38.1-jammy

# 1. Install system dependencies (including proper FFmpeg)
RUN apt-get update && \
    apt-get install -y \
    ffmpeg \
    libx264-dev \
    libx265-dev \
    libvpx-dev \
    libopus-dev \
    && rm -rf /var/lib/apt/lists/*

# 2. Verify FFmpeg installation
RUN ffmpeg -version

WORKDIR /app

# 3. Copy package files first for caching
COPY package*.json ./

# 4. Install npm dependencies
RUN npm ci --only=production --no-optional

# 5. Install Playwright browsers
RUN npx playwright install --with-deps

# 6. Copy application code
COPY . .

# 7. Environment variables
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
ENV NODE_ENV=production
ENV FFMPEG_PATH=/usr/bin/ffmpeg  # Explicit path to FFmpeg

EXPOSE 3000

CMD ["npm", "start"]
