"""
Configuration management using Pydantic Settings
Environment variables are loaded from .env file or system environment
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
from typing import List
import secrets


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables
    
    Environment Variables Required:
    - DATABASE_URL: PostgreSQL connection string (Supabase)
    - JWT_SECRET_KEY: Secret key for JWT token signing (generate with secrets.token_urlsafe(32))
    - ADMIN_EMAIL: Initial admin email for setup
    - ADMIN_PASSWORD: Initial admin password (hashed on first use)
    
    Optional:
    - ENVIRONMENT: "development" | "production" | "staging" (default: development)
    - CORS_ORIGINS: Comma-separated list of allowed origins
    - PORT: API server port (default: 8000)
    - SESSION_TIMEOUT_DAYS: Days before session expires (default: 7)
    - RATE_LIMIT_PER_MINUTE: Max requests per minute per IP (default: 60)
    """
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )
    
    # ========================================================================
    # CORE SETTINGS
    # ========================================================================
    
    ENVIRONMENT: str = "development"
    PORT: int = 8000
    API_PREFIX: str = "/api"
    PROJECT_NAME: str = "Path of Function Research API"
    VERSION: str = "1.0.0"
    
    # ========================================================================
    # DATABASE
    # ========================================================================
    
    DATABASE_URL: str
    DATABASE_POOL_SIZE: int = 20
    DATABASE_MAX_OVERFLOW: int = 10
    DATABASE_POOL_TIMEOUT: int = 30
    DATABASE_POOL_RECYCLE: int = 3600
    
    # Supabase Configuration (optional - for direct API access)
    SUPABASE_URL: str | None = None
    SUPABASE_KEY: str | None = None
    
    # ========================================================================
    # SECURITY
    # ========================================================================
    
    # JWT Token Configuration
    JWT_SECRET_KEY: str = secrets.token_urlsafe(32)  # Override in .env!
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    
    # Password Hashing
    PASSWORD_HASH_SCHEME: str = "bcrypt"
    PASSWORD_MIN_LENGTH: int = 8
    
    # Session Management
    SESSION_TIMEOUT_DAYS: int = 7
    SESSION_TOKEN_LENGTH: int = 32
    
    # Access Code Generation
    ACCESS_CODE_LENGTH: int = 6
    ACCESS_CODE_CHARS: str = "ACDEFGHJKLMNPQRTUVWXY349"  # High-readability chars
    
    # ========================================================================
    # CORS (Cross-Origin Resource Sharing)
    # ========================================================================
    
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000"
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS_ORIGINS from comma-separated string"""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
    
    # ========================================================================
    # RATE LIMITING
    # ========================================================================
    
    RATE_LIMIT_PER_MINUTE: int = 60
    RATE_LIMIT_BURST: int = 10  # Allow short bursts above limit
    
    # ========================================================================
    # ADMIN CONFIGURATION
    # ========================================================================
    
    ADMIN_EMAIL: str = "admin@example.com"  # Override in .env
    ADMIN_PASSWORD: str = "changeme123"  # Override in .env
    ADMIN_NAME: str = "System Admin"
    
    # ========================================================================
    # RESEARCH CONFIGURATION
    # ========================================================================
    
    # Checkpoint verification
    CHECKPOINT_1_REQUIRED: bool = True
    CHECKPOINT_2_REQUIRED: bool = True
    
    # Event logging
    LOG_DETAILED_EVENTS: bool = True
    LOG_TIMING_DATA: bool = True
    LOG_CHOICE_DATA: bool = True
    
    # Session management
    ALLOW_SESSION_RESUME: bool = True
    MAX_RESUME_ATTEMPTS: int = 3
    
    # Data export
    EXPORT_BATCH_SIZE: int = 1000
    EXPORT_MAX_ROWS: int = 50000
    
    # ========================================================================
    # LOGGING
    # ========================================================================
    
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    LOG_TO_FILE: bool = False
    LOG_FILE_PATH: str = "logs/api.log"
    
    # ========================================================================
    # EXTERNAL SERVICES (Future Phases)
    # ========================================================================
    
    # Vertex AI (Phase 2)
    GOOGLE_CLOUD_PROJECT: str | None = None
    VERTEX_AI_LOCATION: str = "us-central1"
    VERTEX_AI_MODEL: str = "gemini-1.5-pro"
    
    # Email notifications (Optional)
    SMTP_HOST: str | None = None
    SMTP_PORT: int = 587
    SMTP_USER: str | None = None
    SMTP_PASSWORD: str | None = None
    SMTP_FROM_EMAIL: str | None = None
    
    # ========================================================================
    # MONITORING & OBSERVABILITY
    # ========================================================================
    
    ENABLE_METRICS: bool = False
    ENABLE_TRACING: bool = False
    SENTRY_DSN: str | None = None
    
    # ========================================================================
    # FEATURE FLAGS
    # ========================================================================
    
    ENABLE_AI_FEATURES: bool = False  # Phase 2/3 only
    ENABLE_SURVEY_LINKING: bool = True
    ENABLE_ANALYTICS_EXPORT: bool = True
    ENABLE_CODE_BATCH_GENERATION: bool = True
    
    # ========================================================================
    # VALIDATION
    # ========================================================================
    
    def validate_security_settings(self) -> None:
        """
        Validate security settings on startup
        """
        if self.ENVIRONMENT == "production":
            if self.JWT_SECRET_KEY == secrets.token_urlsafe(32):
                raise ValueError(
                    "⚠️  JWT_SECRET_KEY must be set in production! "
                    "Generate with: python -c 'import secrets; print(secrets.token_urlsafe(32))'"
                )
            
            if self.ADMIN_PASSWORD == "changeme123":
                raise ValueError(
                    "⚠️  ADMIN_PASSWORD must be changed in production!"
                )
            
            if "localhost" in str(self.CORS_ORIGINS):
                raise ValueError(
                    "⚠️  CORS_ORIGINS contains localhost in production!"
                )
        
        if len(self.JWT_SECRET_KEY) < 32:
            raise ValueError(
                "⚠️  JWT_SECRET_KEY must be at least 32 characters long"
            )
    
    # ========================================================================
    # DATABASE URL HELPERS
    # ========================================================================
    
    @property
    def async_database_url(self) -> str:
        """
        Convert sync database URL to async (postgresql -> postgresql+asyncpg)
        """
        if self.DATABASE_URL.startswith("postgresql://"):
            return self.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")
        elif self.DATABASE_URL.startswith("postgres://"):
            return self.DATABASE_URL.replace("postgres://", "postgresql+asyncpg://")
        return self.DATABASE_URL
    
    @property
    def database_url_safe(self) -> str:
        """
        Database URL with password masked for logging
        """
        if "@" in self.DATABASE_URL:
            parts = self.DATABASE_URL.split("@")
            creds = parts[0].split(":")
            return f"{creds[0]}:****@{parts[1]}"
        return self.DATABASE_URL


@lru_cache()
def get_settings() -> Settings:
    """
    Get cached settings instance
    Use @lru_cache to ensure singleton pattern
    """
    settings = Settings()
    
    # Validate security settings on startup
    if settings.ENVIRONMENT == "production":
        settings.validate_security_settings()
    
    return settings


# ============================================================================
# EXAMPLE .env FILE TEMPLATE
# ============================================================================
"""
# Copy this to .env and fill in your values

# Environment
ENVIRONMENT=development
PORT=8000

# Database (Supabase PostgreSQL)
DATABASE_URL=postgresql://postgres:[PASSWORD]@[PROJECT_ID].supabase.co:5432/postgres

# Security (REQUIRED - Generate new values!)
JWT_SECRET_KEY=<generate with: python -c 'import secrets; print(secrets.token_urlsafe(32))'>
ADMIN_EMAIL=your-email@example.com
ADMIN_PASSWORD=secure-password-here

# CORS (Add your Vercel domain in production)
CORS_ORIGINS=http://localhost:3000,https://your-app.vercel.app

# Research Settings
SESSION_TIMEOUT_DAYS=7
ALLOW_SESSION_RESUME=true

# Optional: Rate Limiting
RATE_LIMIT_PER_MINUTE=60

# Optional: Logging
LOG_LEVEL=INFO
LOG_TO_FILE=false
"""
