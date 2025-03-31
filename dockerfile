FROM mcr.microsoft.com/playwright:v1.38.1-jammy

# 1. Install system dependencies (including proper FFmpeg and cookie support)
RUN apt-get update && \
    apt-get install -y \
    ffmpeg \
    libx264-dev \
    libx265-dev \
    libvpx-dev \
    libopus-dev \
    libgconf-2-4 \
    && rm -rf /var/lib/apt/lists/*

# 2. Verify critical installations
RUN ffmpeg -version && \
    echo "Playwright browsers:" && ls /ms-playwright

WORKDIR /app

# 3. Copy package files first for caching
COPY package*.json ./

# 4. Install npm dependencies
RUN npm ci --only=production --no-optional


# 5. Install Playwright browsers
RUN npx playwright install --with-deps

# 6. Create directory for YouTube cookies (will be mounted by Render)
RUN mkdir -p /etc/secrets && \
    chmod 755 /etc/secrets

# 7. Copy application code
COPY . .

# 8. Environment variables
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
ENV NODE_ENV=production
ENV FFMPEG_PATH=/usr/bin/ffmpeg
ENV YOUTUBE_COOKIES_FILE=/etc/secrets/youtube_cookies 

EXPOSE 3000

CMD ["npm", "start"]
