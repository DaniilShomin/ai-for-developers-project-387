# Production Dockerfile for FastAPI Backend
FROM python:3.11-slim AS builder

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Production stage
FROM python:3.11-slim

# Install curl for healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy installed packages from builder
COPY --from=builder /root/.local /root/.local

# Ensure scripts in .local are usable
ENV PATH=/root/.local/bin:$PATH

# Copy application code
COPY app/ ./app/

# Create data directory for SQLite with proper permissions
RUN mkdir -p /app/data && chmod 777 /app/data

# Expose port
EXPOSE 8000

# Create entrypoint script
RUN echo '#!/bin/sh\nmkdir -p /app/data\nchmod 777 /app/data\nexec uvicorn app.main:app --host 0.0.0.0 --port 8000' > /entrypoint.sh && chmod +x /entrypoint.sh

# Run with entrypoint
CMD ["/entrypoint.sh"]