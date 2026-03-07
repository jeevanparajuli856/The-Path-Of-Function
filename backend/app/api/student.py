"""
Student API Routes
Code validation and session management
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timedelta
import logging

from app.core.database import get_db
from app.core.security import generate_session_token, validate_code_format
# TODO: Import models and schemas after creation
# from app.models.code import AccessCode
# from app.models.session import GameSession
# from app.schemas.student import ValidateCodeRequest, SessionResponse

logger = logging.getLogger(__name__)

router = APIRouter()


# ============================================================================
# CODE VALIDATION
# ============================================================================

@router.post("/validate-code", response_model=dict)
async def validate_access_code(
    # request: ValidateCodeRequest,  # TODO: Use schema
    request: dict,
    db: AsyncSession = Depends(get_db)
):
    """
    Validate an access code and check if it can be used
    
    Request:
        {
            "code": "A3H9K2"
        }
    
    Response (valid):
        {
            "valid": true,
            "code": "A3H9K2",
            "can_start": true,
            "treatment_group": "control",
            "message": "Code is valid. You can start the game."
        }
    
    Response (already used):
        {
            "valid": true,
            "code": "A3H9K2",
            "can_start": false,
            "can_resume": true,
            "message": "Code already used. You can resume your previous session.",
            "last_session_id": 123
        }
    
    Response (invalid):
        {
            "valid": false,
            "message": "Invalid access code"
        }
    """
    code = request.get("code", "").strip().upper()
    
    # Validate format
    if not validate_code_format(code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid code format"
        )
    
    # TODO: Query database after creating models
    """
    result = await db.execute(
        select(AccessCode).where(AccessCode.code == code)
    )
    access_code = result.scalar_one_or_none()
    
    if not access_code:
        return {
            "valid": False,
            "message": "Invalid access code"
        }
    
    if not access_code.is_active:
        return {
            "valid": False,
            "message": "This code has been deactivated"
        }
    
    if access_code.expires_at and access_code.expires_at < datetime.now():
        return {
            "valid": False,
            "message": "This code has expired"
        }
    
    # Check if code already used
    if access_code.used_at:
        # Check for existing sessions
        session_result = await db.execute(
            select(GameSession)
            .where(GameSession.code_id == access_code.id)
            .order_by(GameSession.created_at.desc())
        )
        last_session = session_result.scalar_one_or_none()
        
        # Check if can resume
        can_resume = False
        if last_session and not last_session.ended_at:
            # Use database function to check resume eligibility
            resume_check = await db.execute(
                select(func.can_resume_session(code))
            )
            can_resume = resume_check.scalar()
        
        return {
            "valid": True,
            "code": code,
            "can_start": False,
            "can_resume": can_resume,
            "treatment_group": access_code.treatment_group,
            "last_session_id": last_session.id if last_session else None,
            "message": (
                "Code already used. You can resume your previous session."
                if can_resume
                else "Code already used and session window expired."
            )
        }
    
    # Code is valid and unused
    return {
        "valid": True,
        "code": code,
        "can_start": True,
        "treatment_group": access_code.treatment_group,
        "message": "Code is valid. You can start the game."
    }
    """
    
    # Placeholder response
    logger.info(f"Code validation requested: {code}")
    return {
        "valid": True,
        "code": code,
        "can_start": True,
        "treatment_group": "control",
        "message": "Code is valid. You can start the game."
    }


# ============================================================================
# SESSION MANAGEMENT
# ============================================================================

@router.post("/start-session", response_model=dict)
async def start_game_session(
    # request: StartSessionRequest,  # TODO: Use schema
    request: dict,
    db: AsyncSession = Depends(get_db)
):
    """
    Start a new game session with a validated code
    
    Request:
        {
            "code": "A3H9K2"
        }
    
    Response:
        {
            "session_token": "abc123...",
            "session_id": 42,
            "treatment_group": "control",
            "game_url": "https://your-vercel-app.com/game?token=abc123...",
            "expires_in": 604800
        }
    """
    code = request.get("code", "").strip().upper()
    
    # TODO: Implement session creation after models
    """
    # Verify code exists and is unused
    result = await db.execute(
        select(AccessCode).where(
            AccessCode.code == code,
            AccessCode.is_active == True,
            AccessCode.used_at.is_(None)
        )
    )
    access_code = result.scalar_one_or_none()
    
    if not access_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Code is invalid or already used"
        )
    
    # Mark code as used
    access_code.used_at = datetime.now()
    
    # Create new session
    session_token = generate_session_token()
    session = GameSession(
        session_token=session_token,
        code_id=access_code.id,
        treatment_group=access_code.treatment_group,
        started_at=datetime.now()
    )
    
    db.add(session)
    await db.commit()
    await db.refresh(session)
    
    logger.info(f"New session started: code={code}, session_id={session.id}")
    
    return {
        "session_token": session_token,
        "session_id": session.id,
        "treatment_group": session.treatment_group,
        "game_url": f"https://your-vercel-app.com/game?token={session_token}",
        "expires_in": 604800  # 7 days in seconds
    }
    """
    
    # Placeholder response
    session_token = generate_session_token()
    logger.info(f"Session start requested: code={code}")
    
    return {
        "session_token": session_token,
        "session_id": 1,
        "treatment_group": "control",
        "game_url": f"https://your-vercel-app.com/game?token={session_token}",
        "expires_in": 604800
    }


@router.post("/resume-session", response_model=dict)
async def resume_game_session(
    # request: ResumeSessionRequest,  # TODO: Use schema
    request: dict,
    db: AsyncSession = Depends(get_db)
):
    """
    Resume an existing game session
    
    Request:
        {
            "code": "A3H9K2"
        }
    
    Response:
        {
            "session_token": "abc123...",
            "session_id": 42,
            "treatment_group": "control",
            "game_url": "https://your-vercel-app.com/game?token=abc123...",
            "progress": {
                "current_scene": "teachingfirst",
                "checkpoints_passed": 0,
                "time_played_minutes": 15.5
            }
        }
    """
    code = request.get("code", "").strip().upper()
    
    # TODO: Implement resume logic after models
    """
    # Verify code and find existing session
    result = await db.execute(
        select(AccessCode).where(AccessCode.code == code)
    )
    access_code = result.scalar_one_or_none()
    
    if not access_code:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Code not found"
        )
    
    # Check if can resume (using database function)
    can_resume_result = await db.execute(
        select(func.can_resume_session(code))
    )
    can_resume = can_resume_result.scalar()
    
    if not can_resume:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Session cannot be resumed (expired or not started)"
        )
    
    # Get most recent active session
    session_result = await db.execute(
        select(GameSession)
        .where(
            GameSession.code_id == access_code.id,
            GameSession.ended_at.is_(None)
        )
        .order_by(GameSession.created_at.desc())
    )
    session = session_result.scalar_one_or_none()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active session found for this code"
        )
    
    # Get progress using database function
    progress_result = await db.execute(
        select(func.get_session_progress(session.id))
    )
    progress = progress_result.scalar()
    
    logger.info(f"Session resumed: code={code}, session_id={session.id}")
    
    return {
        "session_token": session.session_token,
        "session_id": session.id,
        "treatment_group": session.treatment_group,
        "game_url": f"https://your-vercel-app.com/game?token={session.session_token}",
        "progress": progress
    }
    """
    
    # Placeholder response
    logger.info(f"Session resume requested: code={code}")
    
    return {
        "session_token": "existing_token_123",
        "session_id": 1,
        "treatment_group": "control",
        "game_url": "https://your-vercel-app.com/game?token=existing_token_123",
        "progress": {
            "current_scene": "teachingfirst",
            "checkpoints_passed": 0,
            "time_played_minutes": 15.5
        }
    }


# ============================================================================
# SESSION STATUS
# ============================================================================

@router.get("/session/{session_id}/status")
async def get_session_status(
    session_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Get current status of a game session
    
    Response:
        {
            "session_id": 42,
            "status": "active",
            "progress": {
                "current_scene": "teachingfirst",
                "checkpoints_passed": 0,
                "total_events": 25,
                "time_played_minutes": 15.5
            }
        }
    """
    # TODO: Implement after models
    """
    result = await db.execute(
        select(GameSession).where(GameSession.id == session_id)
    )
    session = result.scalar_one_or_none()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    # Get progress
    progress_result = await db.execute(
        select(func.get_session_progress(session_id))
    )
    progress = progress_result.scalar()
    
    return {
        "session_id": session_id,
        "status": "completed" if session.ended_at else "active",
        "progress": progress
    }
    """
    
    # Placeholder response
    return {
        "session_id": session_id,
        "status": "active",
        "progress": {
            "current_scene": "teachingfirst",
            "checkpoints_passed": 0,
            "total_events": 25,
            "time_played_minutes": 15.5
        }
    }


# ============================================================================
# HEALTH CHECK
# ============================================================================

@router.get("/health")
async def student_health():
    """
    Health check for student-facing endpoints
    """
    return {
        "status": "healthy",
        "service": "student-api",
        "timestamp": datetime.now().isoformat()
    }
