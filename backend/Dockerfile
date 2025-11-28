FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy prisma schema
COPY prisma ./prisma/

# Generate Prisma client
RUN npx prisma generate

# Copy application code
COPY src ./src/

# Expose port
EXPOSE 3001

# Start command
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
