# syntax=docker/dockerfile:1
FROM node:20-slim
WORKDIR /srv/app

# Copy only service code (libs are external at runtime; we vendor build output)
COPY package.json tsconfig.json ./
COPY src ./src

RUN npm ci --omit=dev || npm install --omit=dev && \
    npm run build && \
    rm -rf src

ENV PORT=8080
EXPOSE 8080
CMD ["node","dist/index.js"]

