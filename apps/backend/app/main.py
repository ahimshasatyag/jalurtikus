from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.router import api_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Real-Time Traffic-Aware Route Recommendation System",
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Middleware (PRD 15.4)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else [settings.CORS_ORIGINS],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root level health checks
@app.get("/", tags=["Root"])
async def root():
    return {
        "success": True,
        "message": f"Welcome to {settings.PROJECT_NAME} v{settings.VERSION}",
        "docs_url": "/docs",
        "api_v1_prefix": "/api/v1"
    }


@app.get("/health", tags=["Root"])
async def health():
    return {
        "status": "healthy",
        "service": "jalurtikus-backend",
        "version": settings.VERSION
    }


# Include API v1 Router
app.include_router(api_router)
