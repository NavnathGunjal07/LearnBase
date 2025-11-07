# Build stage
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

CMD npx prisma generate && npm run dev

# # Production stage
# FROM node:18-alpine

# WORKDIR /app

# # Copy package files
# COPY package*.json ./
# COPY prisma ./prisma/

# # Install only production dependencies
# RUN npm ci --only=production

# # Copy built files from build stage
# COPY --from=build /app/dist ./dist

# # Expose the port the app runs on
# EXPOSE 3000

# # Command to run the application
# CMD ["npm", "run", "prisma:generate"] && ["npm", "start"]
