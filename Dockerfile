FROM node:20-alpine AS builder

WORKDIR /app

# Copy package manifests
COPY package.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install dependencies
RUN npm --prefix server install
RUN npm --prefix client install

# Copy all source files
COPY server ./server
COPY client ./client

# Build backend and frontend
RUN npm --prefix server run build
RUN npm --prefix client run build

# Runtime Stage
FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production

# Copy built artifacts and production dependencies
COPY --from=builder /app/package.json ./
COPY --from=builder /app/server/package.json ./server/
COPY --from=builder /app/server/node_modules ./server/node_modules
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/seed-files ./server/seed-files
COPY --from=builder /app/client/dist ./client/dist

# Expose default port (Render will inject its own PORT at runtime)
EXPOSE 8001

# Start unified production server
CMD ["node", "server/dist/index.js"]
