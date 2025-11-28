FROM node:20-alpine

WORKDIR /app

# Install OpenSSL for Prisma compatibility on Alpine
RUN apk add --no-cache openssl

# Install dependencies
COPY backend/package*.json ./
RUN npm install --omit=dev

# Copy prisma schema
COPY backend/prisma ./prisma/

# Generate Prisma client
RUN npx prisma generate

# Copy application code
COPY backend/src ./src/

# Expose port
EXPOSE 3001

# Start command
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
