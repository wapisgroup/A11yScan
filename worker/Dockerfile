FROM node:20-bullseye-slim

# Install Chrome deps
RUN apt-get update && apt-get install -y \
  ca-certificates \
  fonts-liberation \
  libatk1.0-0 \
  libatk-bridge2.0-0 \
  libcups2 \
  libxkbcommon0 \
  libgbm1 \
  libasound2 \
  libx11-xcb1 \
  libxss1 \
  libnss3 \
  wget \
  unzip \
  --no-install-recommends && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json package-lock.json* ./
# Use lockfile if present, otherwise fallback to npm install
RUN if [ -f package-lock.json ]; then \
      npm ci --omit=dev --no-audit --no-fund; \
    else \
      npm install --omit=dev --no-audit --no-fund; \
    fi

COPY . .

# Increase /tmp size if needed via runtime options
ENV PORT=8080
EXPOSE 8080
CMD ["node", "worker-server.js"]