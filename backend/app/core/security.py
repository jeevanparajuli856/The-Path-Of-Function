"""
Security utilities: JWT tokens, password hashing, authentication
"""

from datetime import datetime, timedelta, timezone
from typing import Any, Dict
import secrets
import string

from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status

from app.core.config import get_settings

settings = get_settings()

# ============================================================================
# PASSWORD HASHING
# ============================================================================

# Configure bcrypt password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """
    Hash a plain text password using bcrypt
    
    Args:
        password: Plain text password
    
    Returns:
        Hashed password string
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain text password against a hashed password
    
    Args:
        plain_password: Plain text password from user
        hashed_password: Stored hashed password
    
    Returns:
        True if password matches, False otherwise
    """
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        return False


def validate_password_strength(password: str) -> tuple[bool, str]:
    """
    Validate password meets security requirements
    
    Args:
        password: Plain text password to validate
    
    Returns:
        Tuple of (is_valid, error_message)
    """
    if len(password) < settings.PASSWORD_MIN_LENGTH:
        return False, f"Password must be at least {settings.PASSWORD_MIN_LENGTH} characters long"
    
    if not any(c.isupper() for c in password):
        return False, "Password must contain at least one uppercase letter"
    
    if not any(c.islower() for c in password):
        return False, "Password must contain at least one lowercase letter"
    
    if not any(c.isdigit() for c in password):
        return False, "Password must contain at least one digit"
    
    return True, ""


# ============================================================================
# JWT TOKEN MANAGEMENT
# ============================================================================

def create_access_token(
    data: Dict[str, Any],
    expires_delta: timedelta | None = None
) -> str:
    """
    Create a JWT access token
    
    Args:
        data: Dictionary of claims to encode in token
        expires_delta: Optional custom expiration time
    
    Returns:
        Encoded JWT token string
    
    Example:
        token = create_access_token({"sub": "admin@example.com", "role": "admin"})
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES
        )
    
    to_encode.update({
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "type": "access"
    })
    
    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )
    
    return encoded_jwt


def create_refresh_token(data: Dict[str, Any]) -> str:
    """
    Create a JWT refresh token (longer expiration)
    
    Args:
        data: Dictionary of claims to encode in token
    
    Returns:
        Encoded JWT refresh token string
    """
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(
        days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS
    )
    
    to_encode.update({
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "type": "refresh"
    })
    
    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )
    
    return encoded_jwt


def decode_token(token: str) -> Dict[str, Any]:
    """
    Decode and verify a JWT token
    
    Args:
        token: JWT token string
    
    Returns:
        Dictionary of decoded claims
    
    Raises:
        HTTPException: If token is invalid or expired
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"}
        ) from e


def verify_access_token(token: str) -> Dict[str, Any]:
    """
    Verify an access token and return payload
    
    Args:
        token: JWT token string
    
    Returns:
        Dictionary of decoded claims
    
    Raises:
        HTTPException: If token is invalid, expired, or wrong type
    """
    payload = decode_token(token)
    
    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type"
        )
    
    return payload


def verify_refresh_token(token: str) -> Dict[str, Any]:
    """
    Verify a refresh token and return payload
    
    Args:
        token: JWT refresh token string
    
    Returns:
        Dictionary of decoded claims
    
    Raises:
        HTTPException: If token is invalid, expired, or wrong type
    """
    payload = decode_token(token)
    
    if payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type"
        )
    
    return payload


# ============================================================================
# SESSION TOKEN GENERATION
# ============================================================================

def generate_session_token() -> str:
    """
    Generate a secure random session token for game sessions
    
    Returns:
        URL-safe random token string
    """
    return secrets.token_urlsafe(settings.SESSION_TOKEN_LENGTH)


def generate_access_code() -> str:
    """
    Generate a high-readability access code for students
    Uses characters that are easy to read and distinguish
    
    Returns:
        Random access code (e.g., "A4H3K9")
    
    Note: Matches the PostgreSQL function generate_access_code()
    """
    chars = settings.ACCESS_CODE_CHARS
    return ''.join(secrets.choice(chars) for _ in range(settings.ACCESS_CODE_LENGTH))


# ============================================================================
# API KEY GENERATION (Future: For external integrations)
# ============================================================================

def generate_api_key(prefix: str = "pf") -> str:
    """
    Generate an API key for external service integrations
    
    Args:
        prefix: Prefix to identify key type (default: "pf" = Path of Function)
    
    Returns:
        API key string (e.g., "pf_abc123xyz...")
    """
    random_part = secrets.token_urlsafe(32)
    return f"{prefix}_{random_part}"


# ============================================================================
# RATE LIMITING HELPERS
# ============================================================================

def hash_ip_address(ip_address: str) -> str:
    """
    Hash an IP address for privacy-preserving rate limiting
    
    Args:
        ip_address: Client IP address
    
    Returns:
        Hashed IP address string
    """
    # Use a simple hash to anonymize IP while allowing rate limiting
    import hashlib
    salt = settings.JWT_SECRET_KEY[:16]  # Use part of secret as salt
    combined = f"{salt}{ip_address}".encode()
    return hashlib.sha256(combined).hexdigest()[:16]


# ============================================================================
# SECURITY VALIDATORS
# ============================================================================

def validate_code_format(code: str) -> bool:
    """
    Validate that an access code matches expected format
    
    Args:
        code: Access code to validate
    
    Returns:
        True if valid format, False otherwise
    """
    if len(code) != settings.ACCESS_CODE_LENGTH:
        return False
    
    return all(c in settings.ACCESS_CODE_CHARS for c in code.upper())


def validate_session_token_format(token: str) -> bool:
    """
    Validate that a session token matches expected format
    
    Args:
        token: Session token to validate
    
    Returns:
        True if valid format, False otherwise
    """
    # URL-safe base64 tokens should only contain these characters
    valid_chars = set(string.ascii_letters + string.digits + '-_')
    return all(c in valid_chars for c in token)


# ============================================================================
# AUTHENTICATION EXCEPTIONS
# ============================================================================

class AuthenticationError(HTTPException):
    """Custom exception for authentication failures"""
    
    def __init__(self, detail: str = "Authentication failed"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"}
        )


class AuthorizationError(HTTPException):
    """Custom exception for authorization failures"""
    
    def __init__(self, detail: str = "Insufficient permissions"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail
        )


# ============================================================================
# EXAMPLE USAGE
# ============================================================================
"""
# Hashing passwords:
hashed = hash_password("user_password_123")
is_valid = verify_password("user_password_123", hashed)

# Creating tokens:
token = create_access_token({"sub": "admin@example.com", "role": "admin"})
refresh = create_refresh_token({"sub": "admin@example.com"})

# Verifying tokens:
try:
    payload = verify_access_token(token)
    user_email = payload["sub"]
    user_role = payload["role"]
except HTTPException as e:
    # Token invalid or expired
    pass

# Generating codes:
access_code = generate_access_code()  # "A4H3K9"
session_token = generate_session_token()  # "abc123..."
"""
