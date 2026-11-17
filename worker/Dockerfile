# Render worker image. Build context = repo root (the worker imports ../remotion and ../lib).
#   Railway: Root Directory "/", Dockerfile Path "worker/Dockerfile"
FROM node:22-bookworm-slim

# Libraries needed by Remotion's headless Chrome
RUN apt-get update && apt-get install -y --no-install-recommends \
      ca-certificates libnss3 libdbus-1-3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libgbm1 \
      libasound2 libxrandr2 libxkbcommon0 libxfixes3 libxcomposite1 libxdamage1 \
      libpango-1.0-0 libcairo2 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts --omit=dev
COPY worker/package.json worker/package-lock.json ./worker/
RUN npm ci --prefix worker

COPY remotion ./remotion
COPY components/Robot.tsx ./components/Robot.tsx
COPY lib/brand.ts lib/types.ts lib/agents.ts lib/schemas.ts ./lib/
COPY worker ./worker

# Download Chrome Headless Shell at build time
RUN cd worker && npx tsx -e "import('@remotion/renderer').then(r => r.ensureBrowser())"

ENV NODE_ENV=production
WORKDIR /app/worker
CMD ["npx", "tsx", "server.ts"]
