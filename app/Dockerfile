# ========================================================
# Production Dockerfile for Portfolio Application
# Hardened: Non-root execution (USER node, UID 1000)
# ========================================================

FROM node:22-alpine

# Set working directory
WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Copy package descriptors
COPY package.json package-lock.json ./

# Install production dependencies only with clean cache
RUN npm ci --omit=dev && npm cache clean --force

# Copy application source code and views
COPY src/ ./src/
COPY views/ ./views/
COPY public/ ./public/

# Prepare logs directory with proper ownership for non-root user 'node'
RUN mkdir -p /app/logs && chown -R node:node /app

# Enforce Non-root user (UID 1000, GID 1000)
USER node

# Expose internal application port
EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/health || exit 1

# Launch application
CMD ["node", "src/server.js"]
