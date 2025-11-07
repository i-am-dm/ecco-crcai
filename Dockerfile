# syntax=docker/dockerfile:1

# Stage 1: Build backend services and frontend
FROM node:20-slim AS builder

WORKDIR /srv/app

# Copy workspace files
ENV VITE_API_URL=/api
COPY package.json pnpm-workspace.yaml ./
COPY libs ./libs
COPY services ./services
COPY apps ./apps

# Install dependencies and build
RUN corepack enable && \
    corepack prepare pnpm@9.12.1 --activate && \
    npm i -g patch-package && \
    pnpm install --ignore-scripts && \
    pnpm rebuild esbuild && \
    pnpm -r --workspace-concurrency=1 \
      --filter ./libs/ts \
      --filter ./services/api-edge \
      --filter ./apps/ui \
      build

# Stage 2: Production runtime with nginx
FROM nginx:alpine

# Install Node.js for running api-edge
RUN apk add --no-cache nodejs npm supervisor

WORKDIR /srv/app

# Copy workspace configuration
COPY --from=builder /srv/app/package.json /srv/app/pnpm-workspace.yaml ./

# Copy built backend
COPY --from=builder /srv/app/services/api-edge/dist /srv/app/services/api-edge/dist
COPY --from=builder /srv/app/services/api-edge/package.json /srv/app/services/api-edge/
COPY --from=builder /srv/app/libs/ts/dist /srv/app/libs/ts/dist
COPY --from=builder /srv/app/libs/ts/package.json /srv/app/libs/ts/
COPY --from=builder /srv/app/node_modules /srv/app/node_modules
COPY --from=builder /srv/app/services/api-edge/node_modules /srv/app/services/api-edge/node_modules

# Copy built frontend to nginx html directory
COPY --from=builder /srv/app/apps/ui/dist /usr/share/nginx/html

# Copy nginx configuration
COPY infra/nginx.conf /etc/nginx/conf.d/default.conf

# Copy supervisor configuration to run both nginx and api-edge
COPY infra/supervisord.conf /etc/supervisord.conf

# Expose port 8080 (Cloud Run default)
EXPOSE 8080

# Run supervisor to manage nginx and api-edge
CMD ["supervisord", "-c", "/etc/supervisord.conf"]
