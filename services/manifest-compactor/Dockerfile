# syntax=docker/dockerfile:1
FROM node:20-slim
WORKDIR /srv/app

COPY package.json tsconfig.json ./
COPY src ./src

RUN npm ci --omit=dev || npm install --omit=dev && \
    npm run build && \
    rm -rf src

CMD ["node","dist/index.js"]

