"""
Admin API Routes
Authentication, code generation, and analytics export
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List
from datetime import datetime, timedelta
import logging

from app.core.database import get_db
from app.core.security import (
    create_access_token,
    hash_password,
    verify_password,
)
from app.middleware.auth import require_admin, get_current_admin_user
from app.models.admin import AdminUser
from app.models.code import AccessCode, CodeBatch
from app.models.session import GameSession
from app.models.event import EventLog, QuizAttempt
from app.schemas.admin import LoginRequest, TokenResponse, CodeGenerationRequest, DashboardSummary

logger = logging.getLogger(__name__)

router = APIRouter()


# ============================================================================
# AUTHENTICATION
# ============================================================================

@router.post("/login", response_model=TokenResponse)
async def admin_login(
    login_data: LoginRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Admin login endpoint
    
    Request:
        {
            "email": "admin@example.com",
            "password": "secure_password"
        }
    
    Response:
        {
            "access_token": "eyJ...",
            "token_type": "bearer",
            "expires_in": 86400
        }
    """
    email = login_data.email
    password = login_data.password
    
    # Query admin user
    result = await db.execute(
        select(AdminUser).where(AdminUser.email == email)
    )
    admin = result.scalar_one_or_none()
    
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    if not verify_password(password, admin.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    if not admin.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive"
        )
    
    # Create access token
    token = create_access_token(
        data={"sub": email, "role": "admin", "id": admin.id}
    )
    
    logger.info(f"Admin login: {email}")
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "expires_in": 86400  # 24 hours
    }


@router.post("/logout")
async def admin_logout(
    current_user: dict = Depends(require_admin)
):
    """
    Admin logout (client should discard token)
    """
    logger.info(f"Admin logout: {current_user['sub']}")
    return {"message": "Logged out successfully"}


# ============================================================================
# CODE GENERATION
# ============================================================================

@router.post("/generate-codes", response_model=dict)
async def generate_access_codes(
    request: CodeGenerationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    """
    Generate a batch of access codes
    
    Request:
        {
            "batch_name": "Spring 2024 - Section A",
            "num_codes": 30,
            "treatment_group": "control",
            "expires_at": "2024-12-31T23:59:59Z"
        }
    
    Response:
        {
            "batch_id": 1,
            "codes_generated": 30,
            "codes": ["A3H9K2", "D4F7M3", ...]
        }
    """
    if request.num_codes < 1 or request.num_codes > 1000:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Number of codes must be between 1 and 1000"
        )
    
    # Create batch
    batch = CodeBatch(
        batch_name=request.batch_name,
        created_by_admin_id=current_user["id"],
        treatment_group=request.treatment_group,
        notes=request.notes
    )
    db.add(batch)
    await db.flush()
    
    # Generate codes using database function
    codes = []
    for _ in range(request.num_codes):
        code_result = await db.execute(
            select(func.generate_access_code())
        )
        code_value = code_result.scalar()
        
        access_code = AccessCode(
            code=code_value,
            batch_id=batch.id,
            treatment_group=request.treatment_group,
            expires_at=request.expires_at
        )
        codes.append(access_code)
    
    db.add_all(codes)
    await db.commit()
    
    logger.info(
        f"Generated {request.num_codes} codes in batch '{request.batch_name}' "
        f"by {current_user['sub']}"
    )
    
    return {
        "batch_id": batch.id,
        "codes_generated": request.num_codes,
        "codes": [c.code for c in codes],
        "batch_name": batch.batch_name,
        "treatment_group": batch.treatment_group
    }


@router.get("/batches", response_model=List[dict])
async def list_code_batches(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    """
    List all code batches
    
    Response:
        [
            {
                "batch_id": 1,
                "batch_name": "Spring 2024 - Section A",
                "total_codes": 30,
                "used_codes": 12,
                "treatment_group": "control",
                "created_at": "2024-01-15T10:00:00Z"
            }
        ]
    """
    result = await db.execute(
        select(CodeBatch)
        .order_by(CodeBatch.created_at.desc())
    )
    batches = result.scalars().all()
    
    batch_list = []
    for batch in batches:
        # Count codes in this batch
        total_result = await db.execute(
            select(func.count(AccessCode.id))
            .where(AccessCode.batch_id == batch.id)
        )
        total_codes = total_result.scalar()
        
        # Count used codes
        used_result = await db.execute(
            select(func.count(AccessCode.id))
            .where(
                AccessCode.batch_id == batch.id,
                AccessCode.used_at.isnot(None)
            )
        )
        used_codes = used_result.scalar()
        
        batch_list.append({
            "batch_id": batch.id,
            "batch_name": batch.batch_name,
            "total_codes": total_codes,
            "used_codes": used_codes,
            "treatment_group": batch.treatment_group,
            "created_at": batch.created_at.isoformat()
        })
    
    return batch_list


# ============================================================================
# DATA EXPORT
# ============================================================================

@router.get("/export/codes")
async def export_codes(
    batch_id: int | None = None,
    format: str = "csv",
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    """
    Export access codes to CSV or JSON
    
    Query Parameters:
        - batch_id: Optional batch ID to filter
        - format: "csv" or "json"
    
    Returns:
        CSV or JSON file with code data
    """
    # TODO: Implement after creating models
    logger.info(f"Code export requested by {current_user['sub']}")
    
    return {
        "message": "Export functionality coming soon",
        "batch_id": batch_id,
        "format": format
    }


@router.get("/export/analytics")
async def export_analytics(
    start_date: str | None = None,
    end_date: str | None = None,
    treatment_group: str | None = None,
    format: str = "csv",
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    """
    Export analytics data (sessions, events, quiz results)
    
    Query Parameters:
        - start_date: ISO date string (optional)
        - end_date: ISO date string (optional)
        - treatment_group: Filter by treatment group (optional)
        - format: "csv" or "json"
    
    Returns:
        CSV or JSON file with anonymized analytics data
    """
    # TODO: Implement after creating models and views
    logger.info(f"Analytics export requested by {current_user['sub']}")
    
    return {
        "message": "Export functionality coming soon",
        "start_date": start_date,
        "end_date": end_date,
        "format": format
    }


# ============================================================================
# ANALYTICS DASHBOARD DATA
# ============================================================================

@router.get("/dashboard/summary")
async def get_dashboard_summary(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    """
    Get summary statistics for admin dashboard
    
    Response:
        {
            "total_codes": 100,
            "used_codes": 45,
            "active_sessions": 12,
            "completed_sessions": 33,
            "avg_completion_time_minutes": 42.5,
            "quiz_avg_score": 78.3
        }
    """
    # Total codes
    total_codes_result = await db.execute(
        select(func.count(AccessCode.id))
    )
    total_codes = total_codes_result.scalar() or 0
    
    # Used codes
    used_codes_result = await db.execute(
        select(func.count(AccessCode.id))
        .where(AccessCode.used_at.isnot(None))
    )
    used_codes = used_codes_result.scalar() or 0
    
    # Active sessions (not ended)
    active_sessions_result = await db.execute(
        select(func.count(GameSession.id))
        .where(GameSession.ended_at.is_(None))
    )
    active_sessions = active_sessions_result.scalar() or 0
    
    # Completed sessions
    completed_sessions_result = await db.execute(
        select(func.count(GameSession.id))
        .where(GameSession.completion_status == "completed")
    )
    completed_sessions = completed_sessions_result.scalar() or 0
    
    # Average completion time
    avg_time_result = await db.execute(
        select(func.avg(GameSession.duration_minutes))
        .where(GameSession.completion_status == "completed")
    )
    avg_completion_time = avg_time_result.scalar() or 0.0
    
    # Average quiz score
    avg_quiz_result = await db.execute(
        select(func.avg(func.cast(QuizAttempt.is_correct, 'INTEGER')) * 100)
    )
    avg_quiz_score = avg_quiz_result.scalar() or 0.0
    
    return {
        "total_codes": total_codes,
        "used_codes": used_codes,
        "active_sessions": active_sessions,
        "completed_sessions": completed_sessions,
        "avg_completion_time_minutes": round(float(avg_completion_time), 1),
        "quiz_avg_score": round(float(avg_quiz_score), 1),
        "last_updated": datetime.now().isoformat()
    }


@router.get("/dashboard/treatment-comparison")
async def get_treatment_comparison(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    """
    Compare performance metrics across treatment groups
    
    Response:
        {
            "control": {
                "completion_rate": 0.85,
                "avg_quiz_score": 75.2,
                "avg_time_minutes": 45.3
            },
            "treatment_a": { ... },
            "treatment_b": { ... }
        }
    """
    # TODO: Query treatment_group_comparison view
    
    # Placeholder response
    return {
        "control": {
            "completion_rate": 0.85,
            "avg_quiz_score": 75.2,
            "avg_time_minutes": 45.3
        },
        "treatment_a": {
            "completion_rate": 0.88,
            "avg_quiz_score": 82.1,
            "avg_time_minutes": 42.1
        }
    }


# ============================================================================
# SYSTEM MANAGEMENT
# ============================================================================

@router.get("/health")
async def admin_health_check(
    current_user: dict = Depends(require_admin)
):
    """
    System health check (admin only)
    """
    return {
        "status": "healthy",
        "admin": current_user["sub"],
        "timestamp": datetime.now().isoformat()
    }
