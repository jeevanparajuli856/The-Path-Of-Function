"""
Path of Function - FastAPI Backend
Main application entry point for research data collection API

Run locally: uvicorn app.main:app --reload --port 8000
Run production: gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker
"""

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from contextlib import asynccontextmanager
import time
import logging

from app.core.config import get_settings
from app.core.database import init_db, close_db
from app.api import admin, student, game
from app.middleware.rate_limit import RateLimitMiddleware
from app.middleware.auth import AuthMiddleware

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

settings = get_settings()


# Lifespan context manager for startup/shutdown events
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan: handles startup and shutdown events
    """
    # Startup
    logger.info("🚀 Starting Path of Function Backend API")
    logger.info(f"📊 Environment: {settings.ENVIRONMENT}")
    logger.info(f"🔗 Database: {settings.DATABASE_URL[:20]}...")
    
    # Initialize database connection pool
    await init_db()
    logger.info("✅ Database connection initialized")
    
    yield
    
    # Shutdown
    logger.info("🛑 Shutting down Path of Function Backend API")
    await close_db()
    logger.info("✅ Database connection closed")


# Initialize FastAPI app
app = FastAPI(
    title="Path of Function - Research API",
    description="Backend API for educational VN research data collection",
    version="1.0.0",
    docs_url="/docs" if settings.ENVIRONMENT == "development" else None,
    redoc_url="/redoc" if settings.ENVIRONMENT == "development" else None,
    lifespan=lifespan
)


# ============================================================================
# MIDDLEWARE
# ============================================================================

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate limiting (protect against abuse)
app.add_middleware(RateLimitMiddleware)

# Request logging
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all incoming requests with timing"""
    start_time = time.time()
    
    # Log request
    logger.info(f"➡️  {request.method} {request.url.path}")
    
    response = await call_next(request)
    
    # Log response with duration
    duration = time.time() - start_time
    logger.info(
        f"⬅️  {request.method} {request.url.path} "
        f"- Status: {response.status_code} - Duration: {duration:.3f}s"
    )
    
    return response


# ============================================================================
# EXCEPTION HANDLERS
# ============================================================================

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """
    Handle validation errors with user-friendly messages
    """
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": "Validation Error",
            "message": "The request data is invalid",
            "details": exc.errors()
        }
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Catch-all exception handler for unexpected errors
    """
    logger.error(f"❌ Unhandled exception: {exc}", exc_info=True)
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal Server Error",
            "message": "An unexpected error occurred. Please try again later.",
            "request_id": str(time.time())  # Simple request ID for debugging
        }
    )


# ============================================================================
# ROUTES
# ============================================================================

# Health check endpoint
@app.get("/health", tags=["System"])
async def health_check():
    """
    Health check endpoint for monitoring
    """
    return {
        "status": "healthy",
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT,
        "database": "connected"  # TODO: Add actual DB health check
    }


@app.get("/", tags=["System"])
async def root():
    """
    Root endpoint - API information
    """
    return {
        "name": "Path of Function - Research API",
        "version": "1.0.0",
        "documentation": "/docs" if settings.ENVIRONMENT == "development" else None,
        "status": "operational"
    }


# Include API routers
app.include_router(
    admin.router,
    prefix="/api/admin",
    tags=["Admin"]
)

app.include_router(
    student.router,
    prefix="/api/student",
    tags=["Student"]
)

app.include_router(
    game.router,
    prefix="/api/game",
    tags=["Game"]
)


# ============================================================================
# DEVELOPMENT UTILITIES
# ============================================================================

if settings.ENVIRONMENT == "development":
    @app.get("/debug/routes", tags=["Debug"])
    async def debug_routes():
        """
        List all available routes (development only)
        """
        routes = []
        for route in app.routes:
            if hasattr(route, "methods"):
                routes.append({
                    "path": route.path,
                    "methods": list(route.methods),
                    "name": route.name
                })
        return routes


# ============================================================================
# STARTUP MESSAGE
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    
    logger.info("=" * 80)
    logger.info("🎮 Path of Function - Research Data Collection API")
    logger.info("=" * 80)
    logger.info(f"📍 Server: http://localhost:{settings.PORT}")
    logger.info(f"📚 Docs: http://localhost:{settings.PORT}/docs")
    logger.info(f"🔧 Environment: {settings.ENVIRONMENT}")
    logger.info("=" * 80)
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=settings.PORT,
        reload=settings.ENVIRONMENT == "development",
        log_level="info"
    )
