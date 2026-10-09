# Multi-stage Dockerfile for React + Vite Frontend
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json ./
COPY client/package.json ./client/

RUN npm install --workspace=client

COPY client/tsconfig.json ./client/
COPY client/tsconfig.node.json ./client/
COPY client/vite.config.ts ./client/
COPY client/tailwind.config.js ./client/
COPY client/postcss.config.js ./client/
COPY client/index.html ./client/
COPY client/src ./client/src

RUN npm run build --workspace=client

# Nginx Runner stage
FROM nginx:alpine AS runner

COPY --from=builder /app/client/dist /usr/share/nginx/html
COPY client/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
