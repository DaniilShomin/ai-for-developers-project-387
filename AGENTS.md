отвечай на русском

## Git Workflow

- Commit after each task completion
- Commit message format: `feat: <description>` or `fix: <description>`
- Never commit node_modules/, .next/, tsp-output/, vendor/, .env
- Run linter/tests before committing

## Project Architecture

Full-stack booking application (Cal.com-inspired):

- **backend/**: FastAPI + SQLAlchemy + SQLite (bookings.db)
- **frontend/**: React + Vite + TypeScript + Mantine v7 + React Router v7
- **typespec/**: TypeSpec → OpenAPI spec generation
- **openapi/**: Generated OpenAPI YAML (not `docs/`)

## Development Commands (Makefile)

```bash
make install          # Install all deps (backend + frontend + Playwright)
make dev              # Run backend (:8000) + frontend (:3000) together
make dev-backend      # FastAPI on :8000 with reload
make dev-frontend     # Vite dev server on :3000
make build            # Production build (frontend/dist)
make lint             # ruff check backend/
make format           # ruff format backend/
make test-backend     # pytest in backend/
make test-frontend    # Playwright E2E tests in frontend/
make clean            # Remove cache files
```

## Frontend-specific

```bash
cd frontend
npm run dev           # Port 3000, /api proxied to :8000
npm run build       # Output to dist/
npm run test:e2e    # Playwright tests (headed: --headed, UI: --ui)
```

- **Proxy config**: `vite.config.ts` routes `/api` → `http://localhost:8000`
- **Path alias**: `@/` maps to `src/` (configured in vite.config.ts and tsconfig.json)
- **Mocking**: MSW enabled in development mode (`VITE_ENABLE_MSW` in vite.config.ts)

## Backend-specific

```bash
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

- **Entry**: `app/main.py` creates FastAPI app, includes routers from `app/routers/`
- **Database**: SQLite at `bookings.db`, SQLAlchemy models in `app/models.py`
- **API prefix**: All routes mounted at `/api/v1` (configured in `app/config.py`)
- **CORS**: Enabled for all origins via `ALLOWED_ORIGINS=*` in settings
- **Linter**: ruff only (no mypy configured)

## TypeSpec / OpenAPI

```bash
cd typespec
npm install
npx tsp compile .     # Generates ../openapi/openapi.yaml
```

- **Config**: `tspconfig.yaml` emits to `../openapi/openapi.yaml`
- **Models**: `models.tsp` (Owner, Booker, TimeSlot, Booking)
- **Routes**: `main.tsp`

## Mock API (Prism)

```bash
# From repo root
npm install
npx prism mock openapi/openapi.yaml -p 8000      # Mock server
npx prism proxy openapi/openapi.yaml http://localhost:8000 --port 8080  # Proxy + validation
```

- Note: Root package.json has outdated paths referencing `docs/openapi.yaml` — use `openapi/openapi.yaml`

## Important Constraints

- SQLite: `check_same_thread=False` required for FastAPI async (see `app/database.py`)
- API routes: Use `/api/v1/` prefix (not root `/`)
- Frontend builds to `frontend/dist/` (Vite default)
- Python linting: ruff only, no pyproject.toml

## Docker Deployment

```bash
# Production deployment
docker-compose up -d              # Start all services
docker-compose down               # Stop services
docker-compose down -v            # Stop + remove volume (⚠️ deletes DB)
docker-compose logs -f            # View logs
docker-compose ps               # Check status
```

- **Frontend**: http://localhost:8080 (nginx serving built React app)
- **Backend API**: http://localhost:8000 (FastAPI + uvicorn)
- **Database**: SQLite in Docker volume `booking-data` (persistent)
- **API routing**: `/api/*` proxied from nginx → backend

### Docker Structure

- `docker-compose.yml` - Production orchestration
- `backend/Dockerfile` - Python 3.11 slim, multistage build
- `frontend/Dockerfile` - Node 20 build → nginx:alpine
- `frontend/nginx.conf` - gzip, /api proxy, SPA routing
- `.env.docker` - Configuration template

### Environment Variables

Copy `.env.docker` to `.env` and customize:
- `ALLOWED_ORIGINS` - CORS origins (default: `*`)
- `DATABASE_URL` - SQLite path (default: `sqlite:///./bookings.db` for local, `/app/data/bookings.db` for Docker)
- `VITE_BACKEND_URL` - Frontend API proxy target

## Testing

- Backend: `cd backend && python3 -m pytest -v`
- Frontend E2E: `cd frontend && npm run test:e2e` (requires `npx playwright install chromium`)
- E2E options: `--headed` (visible browser), `--ui` (interactive UI), `--debug`

## Philosophy

Решай причину а не следствие
