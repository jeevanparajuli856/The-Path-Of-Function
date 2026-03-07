"""
Database connection management using SQLAlchemy async
Connection pooling and session management for PostgreSQL/Supabase
"""

from sqlalchemy.ext.asyncio import (
    create_async_engine,
    AsyncSession,
    async_sessionmaker,
    AsyncEngine
)
from sqlalchemy.orm import declarative_base
from sqlalchemy.pool import NullPool, AsyncAdaptedQueuePool
from sqlalchemy import text
from typing import AsyncGenerator
import logging

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

# ============================================================================
# DATABASE ENGINE & SESSION FACTORY
# ============================================================================

# Global engine instance
engine: AsyncEngine | None = None

# Session factory
AsyncSessionLocal: async_sessionmaker[AsyncSession] | None = None

# Base class for all ORM models
Base = declarative_base()


async def init_db() -> None:
    """
    Initialize database engine and session factory
    Called during application startup
    """
    global engine, AsyncSessionLocal
    
    logger.info("🔗 Initializing database connection...")
    logger.info(f"📍 Database: {settings.database_url_safe}")
    
    # Create async engine
    engine = create_async_engine(
        settings.async_database_url,
        echo=settings.ENVIRONMENT == "development",  # Log SQL in dev
        pool_size=settings.DATABASE_POOL_SIZE,
        max_overflow=settings.DATABASE_MAX_OVERFLOW,
        pool_timeout=settings.DATABASE_POOL_TIMEOUT,
        pool_recycle=settings.DATABASE_POOL_RECYCLE,
        pool_pre_ping=True,  # Verify connections before using
        poolclass=AsyncAdaptedQueuePool,
    )
    
    # Create session factory
    AsyncSessionLocal = async_sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False,  # Don't expire objects after commit
        autocommit=False,
        autoflush=False,
    )
    
    # Test connection
    try:
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
        logger.info("✅ Database connection established successfully")
    except Exception as e:
        logger.error(f"❌ Database connection failed: {e}")
        raise


async def close_db() -> None:
    """
    Close database engine and cleanup connections
    Called during application shutdown
    """
    global engine
    
    if engine:
        logger.info("🔒 Closing database connection...")
        await engine.dispose()
        logger.info("✅ Database connection closed")


# ============================================================================
# DEPENDENCY INJECTION
# ============================================================================

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency that provides database session
    
    Usage in route handlers:
        @router.get("/example")
        async def example_route(db: AsyncSession = Depends(get_db)):
            result = await db.execute(select(User))
            return result.scalars().all()
    
    Automatically handles:
    - Session creation
    - Transaction management
    - Session cleanup (even on errors)
    """
    if AsyncSessionLocal is None:
        raise RuntimeError("Database not initialized. Call init_db() first.")
    
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()  # Auto-commit on success
        except Exception:
            await session.rollback()  # Auto-rollback on error
            raise
        finally:
            await session.close()


# ============================================================================
# DATABASE UTILITIES
# ============================================================================

async def check_database_health() -> dict:
    """
    Check database connection health
    Returns status dict with connection info
    """
    if engine is None:
        return {
            "status": "disconnected",
            "error": "Database engine not initialized"
        }
    
    try:
        async with engine.begin() as conn:
            result = await conn.execute(text("SELECT version()"))
            version = result.scalar()
            
            pool_status = engine.pool.status()
            
            return {
                "status": "connected",
                "version": version,
                "pool_size": engine.pool.size(),
                "pool_checked_in": engine.pool.checkedin(),
                "pool_checked_out": engine.pool.checkedout(),
                "pool_status": pool_status
            }
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return {
            "status": "error",
            "error": str(e)
        }


async def execute_raw_query(query: str, params: dict | None = None) -> list:
    """
    Execute raw SQL query (for complex analytics queries)
    
    Args:
        query: SQL query string
        params: Optional dict of query parameters
    
    Returns:
        List of result rows as dicts
    
    Example:
        results = await execute_raw_query(
            "SELECT * FROM game_sessions WHERE code_id = :code_id",
            {"code_id": 123}
        )
    """
    if engine is None:
        raise RuntimeError("Database not initialized")
    
    async with engine.begin() as conn:
        result = await conn.execute(text(query), params or {})
        
        # Convert to list of dicts
        columns = result.keys()
        rows = result.fetchall()
        
        return [dict(zip(columns, row)) for row in rows]


# ============================================================================
# TRANSACTION CONTEXT MANAGER
# ============================================================================

class DatabaseTransaction:
    """
    Context manager for explicit transaction management
    
    Usage:
        async with DatabaseTransaction() as db:
            user = await db.execute(select(User).where(User.id == 1))
            user.name = "New Name"
            # Transaction auto-commits on success, rolls back on error
    """
    
    def __init__(self):
        self.session: AsyncSession | None = None
    
    async def __aenter__(self) -> AsyncSession:
        if AsyncSessionLocal is None:
            raise RuntimeError("Database not initialized")
        
        self.session = AsyncSessionLocal()
        return self.session
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            if exc_type is not None:
                await self.session.rollback()
            else:
                await self.session.commit()
            await self.session.close()


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

async def insert_and_return(
    db: AsyncSession,
    model_instance,
    refresh: bool = True
) -> object:
    """
    Helper to insert a model instance and return it with generated fields
    
    Args:
        db: Database session
        model_instance: SQLAlchemy model instance
        refresh: Whether to refresh instance to get generated values
    
    Returns:
        The inserted model instance with all fields populated
    """
    db.add(model_instance)
    await db.flush()  # Flush to get generated IDs
    
    if refresh:
        await db.refresh(model_instance)
    
    return model_instance


async def bulk_insert(db: AsyncSession, model_instances: list) -> None:
    """
    Efficiently insert multiple records
    
    Args:
        db: Database session
        model_instances: List of SQLAlchemy model instances
    """
    db.add_all(model_instances)
    await db.flush()


# ============================================================================
# DATABASE INITIALIZATION SCRIPT
# ============================================================================

async def create_tables() -> None:
    """
    Create all tables defined by SQLAlchemy models
    Note: In production, use Alembic migrations instead
    """
    if engine is None:
        raise RuntimeError("Database not initialized")
    
    logger.info("📊 Creating database tables...")
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    logger.info("✅ Database tables created")


async def drop_tables() -> None:
    """
    Drop all tables (DANGEROUS - development only!)
    """
    if settings.ENVIRONMENT == "production":
        raise RuntimeError("Cannot drop tables in production!")
    
    if engine is None:
        raise RuntimeError("Database not initialized")
    
    logger.warning("⚠️  Dropping all database tables...")
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    
    logger.info("✅ Database tables dropped")


# ============================================================================
# EXAMPLE USAGE
# ============================================================================
"""
# In your FastAPI route:

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.user import User

router = APIRouter()

@router.get("/users")
async def get_users(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User))
    users = result.scalars().all()
    return users

@router.post("/users")
async def create_user(user_data: dict, db: AsyncSession = Depends(get_db)):
    new_user = User(**user_data)
    db.add(new_user)
    await db.flush()  # Get generated ID
    await db.refresh(new_user)
    return new_user
"""
