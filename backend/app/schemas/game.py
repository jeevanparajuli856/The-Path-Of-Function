"""
Game API Schemas
Request and response models for game event logging
"""

from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, Dict, Any, List


# ============================================================================
# EVENT LOGGING
# ============================================================================

class EventRequest(BaseModel):
    """Request to log a game event"""
    session_token: str
    event_type: str = Field(..., pattern="^(session_start|scene_enter|scene_exit|choice_made|quiz_start|quiz_result|assessment_start|assessment_submit|assessment_result|checkpoint_attempt|checkpoint_pass|checkpoint_fail|help_requested|error_occurred|timer_update|session_end)$")
    event_data: Optional[Dict[str, Any]] = None


class EventResponse(BaseModel):
    """Response after logging an event"""
    success: bool
    event_id: int
    session_id: int
    event_type: str


class BatchEventRequest(BaseModel):
    """Request to log multiple events"""
    session_token: str
    events: List[EventRequest]


class BatchEventResponse(BaseModel):
    """Response after batch logging"""
    success: bool
    events_logged: int
    session_id: int


# ============================================================================
# CHECKPOINT VERIFICATION
# ============================================================================

class CheckpointRequest(BaseModel):
    """Request to verify a checkpoint code"""
    session_token: str
    checkpoint_number: int = Field(..., ge=1, le=2)
    code_entered: str = Field(..., min_length=1, max_length=50)


class CheckpointResponse(BaseModel):
    """Response after checkpoint verification"""
    verified: bool
    checkpoint: int
    message: str
    attempts_used: Optional[int] = None
    attempts_remaining: Optional[int] = None


# ============================================================================
# SESSION END
# ============================================================================

class SessionEndRequest(BaseModel):
    """Request to end a game session"""
    session_token: str
    completion_status: str = Field("completed", pattern="^(completed|abandoned|incomplete)$")
    final_data: Optional[Dict[str, Any]] = None


class SessionSummary(BaseModel):
    """Summary of completed session"""
    duration_minutes: float
    events_logged: int
    quizzes_completed: int
    checkpoints_passed: int
    scenes_completed: int


class SessionEndResponse(BaseModel):
    """Response after ending session"""
    success: bool
    session_id: int
    completion_status: str
    summary: SessionSummary


# ============================================================================
# SESSION PROGRESS
# ============================================================================

class SessionProgressResponse(BaseModel):
    """Current session progress"""
    session_id: int
    current_scene: Optional[str]
    checkpoints_passed: int
    quizzes_completed: int
    time_played_minutes: float
    last_event_at: datetime
    total_events: int
