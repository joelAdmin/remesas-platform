FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN rm -f package-lock.json && rm -rf node_modules && npm install
COPY . .
RUN npx vite build
