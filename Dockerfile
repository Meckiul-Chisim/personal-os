# Personal OS: one container serves the built web app and the API.
# Build:  docker build -t personal-os .
# Run:    docker run -p 3001:3001 -v personal-os-data:/data --env-file .env personal-os

# ---- 1. Build the web app ----
FROM node:22-bookworm-slim AS build
WORKDIR /app
# Compilers are only a fallback in case better-sqlite3 has no prebuilt binary.
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- 2. Production dependencies only ----
FROM node:22-bookworm-slim AS deps
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ---- 3. Runtime image ----
FROM node:22-bookworm-slim
ENV NODE_ENV=production \
    PORT=3001 \
    DATABASE_PATH=/data/push.sqlite
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./
COPY server ./server
# /data holds the database and its backups. Mount a persistent volume here.
RUN mkdir -p /data && chown node:node /data
USER node
VOLUME ["/data"]
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s \
  CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server/push-server.js"]
