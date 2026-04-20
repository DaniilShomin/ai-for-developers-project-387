from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import init_db
from app.seed import seed_data
from app.routers import bookings, event_types, owners, timeslots
from app.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database on startup
    init_db()
    # Fill with test data if empty
    seed_data()
    yield


app = FastAPI(
    lifespan=lifespan,
    title=settings.api_title,
    description=settings.api_description,
    version=settings.api_version,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers with API prefix
app.include_router(owners.router, prefix=settings.api_prefix)
app.include_router(event_types.router, prefix=settings.api_prefix)
app.include_router(bookings.router, prefix=settings.api_prefix)
app.include_router(timeslots.router, prefix=settings.api_prefix)


@app.get("/")
def root():
    return {"message": settings.api_title, "docs": "/docs"}


@app.get("/health")
def health_check():
    return {"status": "ok", "version": settings.api_version}
