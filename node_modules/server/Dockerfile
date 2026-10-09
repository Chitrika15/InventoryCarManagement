# Multi-stage Dockerfile for Node.js 20 Backend
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root workspace and server manifests
COPY package.json ./
COPY server/package.json ./server/

RUN npm install --workspace=server

COPY server/tsconfig.json ./server/
COPY server/src ./server/src

RUN npm run build --workspace=server

# Production Runner stage
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY package.json ./
COPY server/package.json ./server/

RUN npm install --workspace=server --omit=dev

COPY --from=builder /app/server/dist ./server/dist
COPY server/src/seed ./server/src/seed

EXPOSE 5000

CMD ["node", "server/dist/server.js"]
