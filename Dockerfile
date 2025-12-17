# ===== 1) Builder =====
FROM node:20-bullseye AS builder
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.12.3 --activate

# Copy manifest
COPY package.json pnpm-lock.yaml* ./

# Install deps
RUN pnpm install --frozen-lockfile

# Copy source
COPY . .

# Build (standalone)
RUN pnpm build

# ===== 2) Runner =====
FROM node:20-bullseye AS runner
WORKDIR /app
ENV NODE_ENV=production

# Install Chromium deps + chromium
RUN apt-get update && apt-get install -y \
  chromium \
  ca-certificates \
  fonts-liberation \
  libasound2 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libcups2 \
  libdrm2 \
  libgbm1 \
  libgtk-3-0 \
  libnspr4 \
  libnss3 \
  libx11-xcb1 \
  libxcomposite1 \
  libxdamage1 \
  libxfixes3 \
  libxrandr2 \
  libxshmfence1 \
  libxss1 \
  libxtst6 \
  xdg-utils \
  --no-install-recommends && rm -rf /var/lib/apt/lists/*

# Puppeteer executable path (chromium)
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Copy standalone output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Render uses PORT
ENV PORT=3000
EXPOSE 3000

CMD ["node", "server.js"]
