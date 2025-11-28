FROM node:20-alpine

WORKDIR /app

# Install OpenSSL for Prisma compatibility on Alpine
RUN apk add --no-cache openssl

# Install dependencies (include dev for prisma CLI)
COPY package*.json ./
RUN npm install

# Copy prisma schema and seed
COPY prisma ./prisma/

# Generate Prisma client
RUN npx prisma generate

# Copy application code
COPY src ./src/

# Expose port
EXPOSE 3001

# Start command - app handles DB initialization internally
CMD ["npm", "start"]
