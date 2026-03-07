"""
Student API Schemas
Request and response models for student endpoints
"""

from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


# ============================================================================
# CODE VALIDATION
# ============================================================================

class ValidateCodeRequest(BaseModel):
    """Request to validate an access code"""
    code: str = Field(..., min_length=6, max_length=10)


class ValidateCodeResponse(BaseModel):
    """Response after code validation"""
    valid: bool
    code: Optional[str] = None
    can_start: bool = False
    can_resume: bool = False
    treatment_group: Optional[str] = None
    last_session_id: Optional[int] = None
    message: str


# ============================================================================
# SESSION MANAGEMENT
# ============================================================================

class StartSessionRequest(BaseModel):
    """Request to start a new game session"""
    code: str = Field(..., min_length=6, max_length=10)


class SessionResponse(BaseModel):
    """Response with session information"""
    session_token: str
    session_id: int
    treatment_group: Optional[str]
    game_url: str
    expires_in: int  # seconds


class ResumeSessionRequest(BaseModel):
    """Request to resume an existing session"""
    code: str = Field(..., min_length=6, max_length=10)


class SessionProgress(BaseModel):
    """Current session progress"""
    current_scene: Optional[str]
    checkpoints_passed: int
    quizzes_completed: int
    time_played_minutes: float
    last_event_at: datetime


class ResumeSessionResponse(BaseModel):
    """Response when resuming a session"""
    session_token: str
    session_id: int
    treatment_group: Optional[str]
    game_url: str
    progress: SessionProgress


# ============================================================================
# SESSION STATUS
# ============================================================================

class SessionStatusResponse(BaseModel):
    """Current status of a game session"""
    session_id: int
    status: str  # active, completed, abandoned
    progress: SessionProgress
    started_at: datetime
    ended_at: Optional[datetime]
