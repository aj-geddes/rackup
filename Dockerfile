# Build stage for frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Install frontend dependencies
COPY frontend/package*.json ./
RUN npm install

# Copy frontend source and build
COPY frontend/ ./
RUN npm run build

# Production stage - use slim (Debian) instead of Alpine for Prisma compatibility
FROM node:20-slim

WORKDIR /app

# Install OpenSSL for Prisma (required on Debian slim)
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# Install backend dependencies (include dev for prisma CLI used in DB init)
COPY backend/package*.json ./
RUN npm install

# Copy prisma schema and seed
COPY backend/prisma ./prisma/

# Generate Prisma client
RUN npx prisma generate

# Copy backend application code
COPY backend/src ./src/

# Copy built frontend from builder stage
COPY --from=frontend-builder /app/frontend/dist ./public/

# Expose port
EXPOSE 3001

# Start command - app handles DB initialization internally
CMD ["npm", "start"]
