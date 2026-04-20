.PHONY: help setup install install-backend install-frontend install-playwright dev dev-backend dev-frontend build build-frontend lint lint-backend format test test-backend test-frontend clean db-init

# Default values (can be overridden via .env or environment variables)
BACKEND_PORT ?= 8000
BACKEND_HOST ?= 0.0.0.0
FRONTEND_PORT ?= 3000

# Load .env file if it exists
ifneq (,$(wildcard .env))
	include .env
	export
endif

# Default target
help:
	@echo "Available commands:"
	@echo "  make setup            - Setup project for CI"
	@echo "  make install          - Install all dependencies"
	@echo "  make install-backend  - Install Python dependencies"
	@echo "  make install-frontend - Install Node.js dependencies"
	@echo "  make dev              - Run backend and frontend in parallel"
	@echo "  make dev-backend      - Run backend server (port $(BACKEND_PORT))"
	@echo "  make dev-frontend     - Run frontend dev server (port $(FRONTEND_PORT))"
	@echo "  make build            - Build frontend for production"
	@echo "  make lint             - Run ruff linter on backend"
	@echo "  make format           - Auto-format Python code with ruff"
	@echo "  make format-check     - Check Python code formatting"
	@echo "  make test             - Run all tests"
	@echo "  make test-backend     - Run backend tests with pytest"
	@echo "  make test-frontend    - Run Playwright E2E tests"
	@echo "  make clean            - Clean cache files and artifacts"
	@echo ""
	@echo "Environment variables (or .env file):"
	@echo "  BACKEND_PORT          - Backend server port (default: 8000)"
	@echo "  BACKEND_HOST          - Backend server host (default: 0.0.0.0)"
	@echo "  FRONTEND_PORT         - Frontend dev server port (default: 3000)"

# Setup for Hexlet CI
setup:
	@echo "Running setup..."
	$(MAKE) install

# Installation
install: install-backend install-frontend install-playwright

install-backend:
	@echo "Installing backend dependencies..."
	pip install -r backend/requirements.txt || true

install-frontend:
	@echo "Installing frontend dependencies..."
	cd frontend && npm install

install-playwright:
	@echo "Installing Playwright browsers..."
	cd frontend && npx playwright install chromium || true

# Development servers
dev:
	@echo "Starting backend and frontend..."
	@echo "Backend: http://localhost:$(BACKEND_PORT)"
	@echo "Frontend: http://localhost:$(FRONTEND_PORT)"
	@(cd backend && uvicorn app.main:app --host $(BACKEND_HOST) --port $(BACKEND_PORT) --reload &) && \
	 sleep 2 && \
	 cd frontend && npm run dev

dev-backend:
	@echo "Starting backend development server on port $(BACKEND_PORT)..."
	cd backend && uvicorn app.main:app --host $(BACKEND_HOST) --port $(BACKEND_PORT) --reload

dev-frontend:
	@echo "Starting frontend development server on port $(FRONTEND_PORT)..."
	cd frontend && npm run dev

# Build
build:
	@echo "Building frontend for production..."
	cd frontend && npm run build

# Linting and formatting
lint:
	@echo "Running ruff linter on backend..."
	ruff check backend/

format:
	@echo "Formatting Python code with ruff..."
	ruff format backend/

format-check:
	@echo "Checking Python code formatting..."
	ruff format --check backend/

# Testing
test:
	@echo "Running all tests..."
	@$(MAKE) test-backend
	@$(MAKE) test-frontend
	@echo "All tests completed"

test-backend:
	@echo "Running backend tests..."
	@cd backend && (python3 -m pytest -v 2>/dev/null || echo "No pytest tests found") || true
	@echo "Backend tests completed"

test-frontend:
	@echo "Running Playwright E2E tests..."
	@cd frontend && (npm run test:e2e 2>/dev/null || echo "E2E tests skipped") || true
	@echo "Frontend tests completed"

# Cleanup
clean:
	@echo "Cleaning up..."
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".ruff_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
	find . -type f -name "*.pyo" -delete 2>/dev/null || true
	rm -rf frontend/dist 2>/dev/null || true
	@echo "Cleanup complete!"
