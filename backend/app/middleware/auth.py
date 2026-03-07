"""
Authentication middleware and dependencies for protected routes
"""

from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
import logging

from app.core.security import verify_access_token, AuthenticationError
from app.core.database import get_db
# Note: Import models after they're created
# from app.models.admin import AdminUser

logger = logging.getLogger(__name__)

# HTTP Bearer token scheme for Swagger UI
security = HTTPBearer(auto_error=False)


# ============================================================================
# AUTHENTICATION DEPENDENCIES
# ============================================================================

async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Optional[dict]:
    """
    Extract user info from JWT token if present (optional authentication)
    
    Returns:
        User info dict if token is valid, None if no token provided
    
    Usage:
        @router.get("/endpoint")
        async def endpoint(user: Optional[dict] = Depends(get_current_user_optional)):
            if user:
                # Authenticated behavior
            else:
                # Anonymous behavior
    """
    if credentials is None:
        return None
    
    try:
        token = credentials.credentials
        payload = verify_access_token(token)
        return payload
    except HTTPException:
        return None


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """
    Extract user info from JWT token (required authentication)
    
    Returns:
        User info dict from token payload
    
    Raises:
        HTTPException: If token is missing or invalid
    
    Usage:
        @router.get("/protected")
        async def protected(user: dict = Depends(get_current_user)):
            user_email = user["sub"]
            user_role = user.get("role")
    """
    if credentials is None:
        raise AuthenticationError("Missing authentication token")
    
    try:
        token = credentials.credentials
        payload = verify_access_token(token)
        return payload
    except HTTPException as e:
        logger.warning(f"Invalid token: {e.detail}")
        raise


async def require_admin(
    user: dict = Depends(get_current_user)
) -> dict:
    """
    Require admin role for access
    
    Returns:
        User info dict
    
    Raises:
        HTTPException: If user is not an admin
    
    Usage:
        @router.get("/admin-only")
        async def admin_endpoint(user: dict = Depends(require_admin)):
            # Only admins can access this
    """
    if user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    return user


# ============================================================================
# DATABASE USER VERIFICATION
# ============================================================================

async def get_current_admin_user(
    user: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Get current admin user from database (with verification)
    
    Returns:
        AdminUser model instance
    
    Raises:
        HTTPException: If admin user not found or inactive
    
    Usage:
        @router.get("/admin/profile")
        async def get_profile(admin: AdminUser = Depends(get_current_admin_user)):
            return {"email": admin.email, "name": admin.name}
    """
    # TODO: Uncomment after creating AdminUser model
    """
    email = user.get("sub")
    
    result = await db.execute(
        select(AdminUser).where(AdminUser.email == email)
    )
    admin = result.scalar_one_or_none()
    
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Admin user not found"
        )
    
    if not admin.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin account is inactive"
        )
    
    return admin
    """
    # Placeholder return
    return user


# ============================================================================
# SESSION TOKEN VALIDATION (For Game API)
# ============================================================================

async def verify_session_token(
    request: Request,
    db: AsyncSession = Depends(get_db)
) -> dict:
    """
    Verify game session token from request body or header
    
    Returns:
        Session info dict with session_id and code
    
    Raises:
        HTTPException: If session token is invalid or expired
    
    Usage:
        @router.post("/game/event")
        async def log_event(
            event_data: dict,
            session: dict = Depends(verify_session_token)
        ):
            session_id = session["session_id"]
    """
    # Try to get token from Authorization header
    auth_header = request.headers.get("Authorization")
    token = None
    
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header[7:]
    
    # Try to get from request body (for Ren'Py compatibility)
    if not token:
        body = await request.body()
        if body:
            import json
            try:
                data = json.loads(body)
                token = data.get("session_token")
            except json.JSONDecodeError:
                pass
    
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session token required"
        )
    
    # TODO: Verify token against database after creating GameSession model
    """
    result = await db.execute(
        select(GameSession).where(
            GameSession.session_token == token,
            GameSession.ended_at.is_(None)  # Active sessions only
        )
    )
    session = result.scalar_one_or_none()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session token"
        )
    
    return {
        "session_id": session.id,
        "code": session.code_id,
        "treatment_group": session.treatment_group
    }
    """
    # Placeholder return
    return {"session_id": 1, "code": "TEST123", "token": token}


# ============================================================================
# MIDDLEWARE CLASS (Alternative to Dependencies)
# ============================================================================

class AuthMiddleware:
    """
    Optional: Middleware for blanket authentication
    Currently not used - using route-level dependencies instead
    """
    
    def __init__(self, app):
        self.app = app
    
    async def __call__(self, scope, receive, send):
        """
        Process request through middleware
        """
        # This would add authentication to ALL routes
        # We use dependencies instead for more granular control
        await self.app(scope, receive, send)


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def extract_token_from_header(authorization: str) -> Optional[str]:
    """
    Extract JWT token from Authorization header
    
    Args:
        authorization: Authorization header value
    
    Returns:
        Token string or None
    """
    if not authorization:
        return None
    
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None
    
    return parts[1]


# ============================================================================
# EXAMPLE USAGE
# ============================================================================
"""
# Public endpoint (no authentication):
@router.get("/public")
async def public_endpoint():
    return {"message": "Anyone can access this"}

# Optional authentication:
@router.get("/maybe-protected")
async def optional_auth(user: Optional[dict] = Depends(get_current_user_optional)):
    if user:
        return {"message": f"Hello {user['sub']}"}
    return {"message": "Hello anonymous"}

# Required authentication:
@router.get("/protected")
async def protected(user: dict = Depends(get_current_user)):
    return {"user": user["sub"]}

# Admin only:
@router.get("/admin-only")
async def admin_only(user: dict = Depends(require_admin)):
    return {"admin": user["sub"]}

# Game session verification:
@router.post("/game/event")
async def log_event(
    event: dict,
    session: dict = Depends(verify_session_token)
):
    return {"session_id": session["session_id"]}
"""
