"""
Game API Routes
Event logging, checkpoint verification, session management from Ren'Py
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
from typing import Dict, Any
import logging
import json

from app.core.database import get_db
from app.middleware.auth import verify_session_token
from app.models.session import GameSession
from app.models.event import EventLog, QuizAttempt, CheckpointVerification
from app.schemas.game import EventRequest, CheckpointRequest, SessionEndRequest

logger = logging.getLogger(__name__)

router = APIRouter()


# ============================================================================
# EVENT LOGGING
# ============================================================================

@router.post("/event")
async def log_game_event(
    event: EventRequest,
    session: dict = Depends(verify_session_token),
    db: AsyncSession = Depends(get_db)
):
    """
    Log a game event from Ren'Py
    """
    session_id = session["session_id"]
    
    # Validate event type
    valid_event_types = [
        "session_start", "scene_enter", "scene_exit", "choice_made",
        "quiz_start", "quiz_result", "assessment_start", "assessment_submit",
        "assessment_result", "checkpoint_attempt", "checkpoint_pass",
        "checkpoint_fail", "help_requested", "error_occurred",
        "timer_update", "session_end"
    ]
    
    if event.event_type not in valid_event_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid event type: {event.event_type}"
        )
    
    # Create event log entry
    event_log = EventLog(
        session_id=session_id,
        event_type=event.event_type,
        event_data=event.event_data or {},
        created_at=datetime.now()
    )
    
    db.add(event_log)
    
    # Special handling for quiz results
    if event.event_type == "quiz_result" and event.event_data:
        quiz_attempt = QuizAttempt(
            session_id=session_id,
            quiz_id=event.event_data.get("quiz_id"),
            answer_given=event.event_data.get("answer"),
            is_correct=event.event_data.get("correct", False),
            attempts_count=event.event_data.get("attempt_number", 1),
            time_spent_seconds=event.event_data.get("time_spent")
        )
        db.add(quiz_attempt)
    
    await db.commit()
    await db.refresh(event_log)
    
    logger.info(
        f"Event logged: session={session_id}, type={event.event_type}, "
        f"event_id={event_log.id}"
    )
    
    return {
        "success": True,
        "event_id": event_log.id,
        "session_id": session_id
    }


@router.post("/events/batch")
async def log_game_events_batch(
    # events: List[EventRequest],  # TODO: Use schema
    events: list,
    session: dict = Depends(verify_session_token),
    db: AsyncSession = Depends(get_db)
):
    """
    Log multiple game events in a single request (for offline buffering)
    
    Request:
        {
            "session_token": "abc123...",
            "events": [
                {"event_type": "scene_enter", "event_data": {...}},
                {"event_type": "choice_made", "event_data": {...}}
            ]
        }
    
    Response:
        {
            "success": true,
            "events_logged": 2,
            "session_id": 42
        }
    """
    session_id = session["session_id"]
    events_list = events.get("events", [])
    
    if len(events_list) > 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum 100 events per batch"
        )
    
    # TODO: Batch insert after models
    """
    event_logs = []
    for event in events_list:
        event_log = EventLog(
            session_id=session_id,
            event_type=event["event_type"],
            event_data=event.get("event_data", {}),
            created_at=datetime.now()
        )
        event_logs.append(event_log)
    
    db.add_all(event_logs)
    await db.commit()
    
    logger.info(f"Batch logged: session={session_id}, count={len(events_list)}")
    
    return {
        "success": True,
        "events_logged": len(events_list),
        "session_id": session_id
    }
    """
    
    # Placeholder response
    logger.info(f"Batch event log: session={session_id}, count={len(events_list)}")
    
    return {
        "success": True,
        "events_logged": len(events_list),
        "session_id": session_id
    }


# ============================================================================
# CHECKPOINT VERIFICATION
# ============================================================================

@router.post("/checkpoint")
async def verify_checkpoint(
    request: CheckpointRequest,
    session: dict = Depends(verify_session_token),
    db: AsyncSession = Depends(get_db)
):
    """
    Verify a checkpoint code entered by student
    """
    checkpoint_number = request.checkpoint_number
    code_entered = request.code_entered.strip().upper()
    session_id = session["session_id"]
    
    # Define correct checkpoint codes (from EVENT_TAXONOMY.md)
    CHECKPOINT_CODES = {
        1: "FUNC123",  # After teaching1
        2: "FUNC456"   # After teaching2
    }
    
    if checkpoint_number not in CHECKPOINT_CODES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid checkpoint number"
        )
    
    # Check if code is correct
    is_correct = code_entered == CHECKPOINT_CODES[checkpoint_number]
    
    # Get current attempts count
    attempts_result = await db.execute(
        select(func.count(CheckpointVerification.id))
        .where(
            CheckpointVerification.session_id == session_id,
            CheckpointVerification.checkpoint_number == checkpoint_number
        )
    )
    attempts_count = attempts_result.scalar() + 1
    
    # Create verification record
    verification = CheckpointVerification(
        session_id=session_id,
        checkpoint_number=checkpoint_number,
        code_entered=code_entered,
        is_correct=is_correct,
        attempt_number=attempts_count,
        verified_at=datetime.now() if is_correct else None
    )
    
    db.add(verification)
    
    # Update session checkpoint timestamp if correct
    if is_correct:
        session_result = await db.execute(
            select(GameSession).where(GameSession.id == session_id)
        )
        game_session = session_result.scalar_one()
        
        if checkpoint_number == 1:
            game_session.checkpoint_1_verified_at = datetime.now()
        elif checkpoint_number == 2:
            game_session.checkpoint_2_verified_at = datetime.now()
    
    await db.commit()
    
    logger.info(
        f"Checkpoint attempt: session={session_id}, checkpoint={checkpoint_number}, "
        f"correct={is_correct}, attempts={attempts_count}"
    )
    
    if is_correct:
        return {
            "verified": True,
            "checkpoint": checkpoint_number,
            "message": "Checkpoint verified! Continue to next section.",
            "attempts_used": attempts_count
        }
    else:
        return {
            "verified": False,
            "checkpoint": checkpoint_number,
            "message": "Incorrect code. Try again.",
            "attempts_remaining": max(0, 3 - attempts_count)
        }


# ============================================================================
# SESSION MANAGEMENT
# ============================================================================

@router.post("/session-end")
async def end_game_session(
    # request: SessionEndRequest,  # TODO: Use schema
    request: dict,
    session: dict = Depends(verify_session_token),
    db: AsyncSession = Depends(get_db)
):
    """
    End the game session and mark it as complete
    
    Request:
        {
            "session_token": "abc123...",
            "completion_status": "completed",
            "final_data": {
                "total_time_minutes": 45.5,
                "scenes_completed": 7
            }
        }
    
    Response:
        {
            "success": true,
            "session_id": 42,
            "completion_status": "completed",
            "summary": {
                "duration_minutes": 45.5,
                "events_logged": 150,
                "quizzes_completed": 6,
                "checkpoints_passed": 2
            }
        }
    """
    session_id = session["session_id"]
    completion_status = request.get("completion_status", "completed")
    final_data = request.get("final_data", {})
    
    # TODO: Update session and generate summary
    """
    result = await db.execute(
        select(GameSession).where(GameSession.id == session_id)
    )
    game_session = result.scalar_one_or_none()
    
    if not game_session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    if game_session.ended_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Session already ended"
        )
    
    # Update session
    game_session.ended_at = datetime.now()
    game_session.completion_status = completion_status
    game_session.final_data = final_data
    
    # Calculate duration
    duration = (game_session.ended_at - game_session.started_at).total_seconds() / 60
    game_session.duration_minutes = duration
    
    # Get summary stats
    summary_result = await db.execute(
        select(func.get_session_progress(session_id))
    )
    summary = summary_result.scalar()
    
    await db.commit()
    
    logger.info(
        f"Session ended: session={session_id}, status={completion_status}, "
        f"duration={duration:.1f}min"
    )
    
    return {
        "success": True,
        "session_id": session_id,
        "completion_status": completion_status,
        "summary": summary
    }
    """
    
    # Placeholder response
    logger.info(f"Session end: session={session_id}, status={completion_status}")
    
    return {
        "success": True,
        "session_id": session_id,
        "completion_status": completion_status,
        "summary": {
            "duration_minutes": 45.5,
            "events_logged": 150,
            "quizzes_completed": 6,
            "checkpoints_passed": 2
        }
    }


@router.get("/session/progress")
async def get_session_progress(
    session: dict = Depends(verify_session_token),
    db: AsyncSession = Depends(get_db)
):
    """
    Get current session progress (for resume functionality)
    
    Response:
        {
            "session_id": 42,
            "current_scene": "teachingfirst",
            "checkpoints_passed": 0,
            "quizzes_completed": 2,
            "time_played_minutes": 15.5,
            "last_event_at": "2024-01-15T10:45:00Z"
        }
    """
    session_id = session["session_id"]
    
    # TODO: Query progress using database function
    """
    progress_result = await db.execute(
        select(func.get_session_progress(session_id))
    )
    progress = progress_result.scalar()
    
    return progress
    """
    
    # Placeholder response
    return {
        "session_id": session_id,
        "current_scene": "teachingfirst",
        "checkpoints_passed": 0,
        "quizzes_completed": 2,
        "time_played_minutes": 15.5,
        "last_event_at": datetime.now().isoformat()
    }


# ============================================================================
# HEALTH CHECK
# ============================================================================

@router.get("/health")
async def game_health():
    """
    Health check for game API endpoints
    """
    return {
        "status": "healthy",
        "service": "game-api",
        "timestamp": datetime.now().isoformat()
    }
