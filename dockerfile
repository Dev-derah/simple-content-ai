# Use official Playwright image
FROM mcr.microsoft.com/playwright:v1.38.1-jammy

# Install system dependencies
RUN apt-get update && \
    apt-get install -y ffmpeg && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies with retries and GitHub token support
ARG GITHUB_TOKEN=""
RUN if [ -n "$GITHUB_TOKEN" ]; then \
      echo "//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}" > .npmrc && \
      npm config set @your-org:registry=https://npm.pkg.github.com; \
    fi && \
    npm install --production --fetch-retries=5 --fetch-retry-mintimeout=20000 && \
    rm -f .npmrc 2>/dev/null || true

# Copy source code
COPY . .

# Environment variables
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
ENV NODE_ENV=production
EXPOSE 3000


CMD ["npm", "start"]
