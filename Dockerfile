# Multi-stage Docker build for Payoova 2.0

# Stage 1: Build frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy package files
COPY package.json package-lock.json ./
COPY pnpm-lock.yaml ./

# Install dependencies (use pnpm if available, fallback to npm)
RUN npm install -g pnpm@latest || npm install -g npm@latest
RUN pnpm install --frozen-lockfile || npm ci

# Copy source code
COPY src/ ./src/
COPY public/ ./public/
COPY index.html ./
COPY vite.config.js ./
COPY tailwind.config.js ./
COPY components.json ./
COPY jsconfig.json ./

# Build frontend
RUN pnpm run build || npm run build

# Stage 2: Setup Python backend
FROM python:3.11-slim AS backend

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV FLASK_APP=src/main.py
ENV NODE_ENV=production

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libffi-dev \
    libssl-dev \
    redis-server \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy backend requirements and install Python dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code
COPY backend/ ./

# Copy built frontend files
COPY --from=frontend-builder /app/frontend/dist ./src/static/

# Create necessary directories
RUN mkdir -p src/database logs

# Create non-root user for security
RUN adduser --disabled-password --gecos '' appuser && \
    chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/api/health || exit 1

# Start command
CMD ["python", "src/main.py"]
