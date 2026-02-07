# Backend for Email Scheduler (Railway, Render, Fly.io)
FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Copy prisma and generate client
COPY prisma ./prisma
RUN npx prisma generate

# Copy source and build
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Production image
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/package.json ./
COPY --from=base /app/dist ./dist
COPY --from=base /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=base /app/prisma ./prisma
EXPOSE 4000
CMD ["node", "dist/index.js"]
