# Multi-stage Dockerfile for Booking Application (CI/CD ready)
# Builds unified container with FastAPI backend + React frontend

# Stage 1: Build frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./
RUN npm ci --silent

# Copy frontend source
COPY frontend/ ./
RUN npm run build

# Stage 2: Production image with Python + nginx
FROM python:3.11-slim-bookworm

# Install nginx and curl (for healthcheck)
RUN apt-get update && apt-get install -y --no-install-recommends \
    nginx \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Set working directory
WORKDIR /app

# Copy Python requirements and install dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application
COPY backend/app/ ./app/

# Copy built frontend from builder stage
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html

# Create data directory for SQLite
RUN mkdir -p /app/data && chmod 777 /app/data

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Remove default nginx site
RUN rm -f /etc/nginx/sites-enabled/default

# Copy entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Expose dynamic port (default 80, configurable via PORT env var)
EXPOSE 80

# Healthcheck endpoint (direct backend access on port 8000)
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Start both services
CMD ["/entrypoint.sh"]
