# Stage 1: Build dependencies
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN rm -rf node_modules
RUN npm cache clean --force
RUN npm install
COPY src src

# Stage 2: Production image
FROM node:20-alpine
WORKDIR /app
ENV NODE_PATH=/app/node_modules
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/package*.json ./
CMD ["npm", "start"]