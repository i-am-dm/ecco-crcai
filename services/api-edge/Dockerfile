FROM gcr.io/distroless/nodejs20-debian12
WORKDIR /app
COPY dist/ ./dist/
COPY package.json ./package.json
ENV PORT=8080
CMD ["dist/index.js"]

