# Lattice backend: Fastify + SQLite + persistent simulator
FROM node:24-alpine

WORKDIR /app

# Install dependencies first for better layer caching.
COPY package.json package-lock.json ./
COPY packages ./packages
COPY apps ./apps

RUN npm ci --workspaces --if-present

# Build contracts then API.
RUN npm run build --workspace @lattice/contracts
RUN npm run build --workspace @lattice/api

# Ensure schema.sql is available to the compiled module.
RUN mkdir -p /app/apps/api/dist/db && cp /app/apps/api/src/db/schema.sql /app/apps/api/dist/db/schema.sql

ENV NODE_ENV=production
ENV PORT=4000
ENV HOST=0.0.0.0
ENV DATABASE_PATH=/data/lattice.db

# Persistent volume for SQLite.
VOLUME ["/data"]

EXPOSE 4000

# Auto-restart is handled by the container orchestrator (restart policy).
CMD ["node", "apps/api/dist/server.js"]