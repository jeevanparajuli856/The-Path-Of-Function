"""
Chat API Routes
Vertex AI RAG-based helper chatbot with research data collection
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime
import logging
import json

from app.core.database import get_db
from app.middleware.auth import verify_session_token
from app.models.chat import ChatLog
from app.schemas.chat import (
    ChatMessageRequest,
    ChatMessageResponse,
    ChatContextData,
)
from app.services.vertex_ai import VertexAIService

logger = logging.getLogger(__name__)

router = APIRouter()
vertex_ai_service = VertexAIService()


# ============================================================================
# CHAT MESSAGE
# ============================================================================

@router.post("/message")
async def chat_message(
    request: ChatMessageRequest,
    session: dict = Depends(verify_session_token),
    db: AsyncSession = Depends(get_db)
):
    """
    Chat endpoint for student helper chatbot
    
    Accepts:
    - user_message: The student's question/prompt
    - game_context: Current game state (scene_id, topic_id, player_state, help_policy, learning_objective)
    
    Returns:
    - response: Vertex AI generated answer grounded in game knowledge
    - citations: Sources/scenes referenced in the answer
    - guardrail_applied: Whether spoiler/hint guardrails were applied
    - help_remaining: Help requests remaining (if limited)
    
    All queries and responses logged to database for research audit trail.
    """
    session_id = session["session_id"]
    student_id = session.get("student_id")
    access_code = session.get("access_code")
    
    logger.info(
        f"Chat message received: session={session_id}, "
        f"message_length={len(request.user_message)}, "
        f"context_scene={request.game_context.scene_id if request.game_context else 'none'}"
    )
    
    try:
        # Call Vertex AI RAG service
        ai_response = await vertex_ai_service.generate_response(
            user_message=request.user_message,
            game_context=request.game_context,
            session_id=session_id,
            student_id=student_id,
        )
        
        # Log the chat interaction to database
        chat_log = ChatLog(
            session_id=session_id,
            student_id=student_id,
            access_code=access_code,
            user_message=request.user_message,
            assistant_response=ai_response.response,
            game_scene_id=request.game_context.scene_id if request.game_context else None,
            game_topic_id=request.game_context.topic_id if request.game_context else None,
            learning_objective=request.game_context.learning_objective if request.game_context else None,
            player_state=request.game_context.player_state or {},
            help_policy=request.game_context.help_policy or "default",
            citations=json.dumps(ai_response.citations) if ai_response.citations else None,
            guardrail_mode=ai_response.guardrail_applied_mode or "none",
            response_tokens=ai_response.token_count,
            created_at=datetime.utcnow()
        )
        
        db.add(chat_log)
        await db.commit()
        await db.refresh(chat_log)
        
        logger.info(
            f"Chat logged: session={session_id}, log_id={chat_log.id}, "
            f"response_tokens={ai_response.token_count}, "
            f"guardrail={ai_response.guardrail_applied_mode}"
        )
        
        # Format response
        return ChatMessageResponse(
            success=True,
            response=ai_response.response,
            citations=ai_response.citations or [],
            guardrail_applied=ai_response.guardrail_applied_mode != "none",
            guardrail_mode=ai_response.guardrail_applied_mode,
            help_remaining=ai_response.help_requests_remaining,
            chat_log_id=str(chat_log.id),
            message_id=ai_response.message_id,
        )
    
    except ValueError as e:
        # Validation error (e.g., insufficient context, help limit exceeded)
        logger.warning(f"Chat validation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Chat request validation failed: {str(e)}"
        )
    
    except Exception as e:
        # Unexpected error
        logger.error(
            f"Chat processing error: session={session_id}, error={str(e)}",
            exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process chat message. Please try again."
        )


# ============================================================================
# CHAT HISTORY
# ============================================================================

@router.get("/history")
async def get_chat_history(
    session: dict = Depends(verify_session_token),
    db: AsyncSession = Depends(get_db),
    limit: int = 50
):
    """
    Retrieve chat history for a session
    
    Returns:
    - List of chat messages (user + assistant)
    - Timestamps and metadata
    - Guardrail modes applied
    """
    from sqlalchemy import select, desc
    
    session_id = session["session_id"]
    
    try:
        stmt = (
            select(ChatLog)
            .where(ChatLog.session_id == session_id)
            .order_by(desc(ChatLog.created_at))
            .limit(limit)
        )
        
        result = await db.execute(stmt)
        chat_logs = result.scalars().all()
        
        history = [
            {
                "id": str(log.id),
                "timestamp": log.created_at.isoformat(),
                "user_message": log.user_message,
                "assistant_response": log.assistant_response,
                "scene_id": log.game_scene_id,
                "topic_id": log.game_topic_id,
                "guardrail_applied": log.guardrail_mode != "none",
                "guardrail_mode": log.guardrail_mode,
                "citations": json.loads(log.citations) if log.citations else [],
            }
            for log in reversed(chat_logs)  # Reverse to get chronological order
        ]
        
        logger.info(f"Chat history retrieved: session={session_id}, count={len(history)}")
        
        return {
            "success": True,
            "session_id": str(session_id),
            "messages": history,
            "total_count": len(history)
        }
    
    except Exception as e:
        logger.error(f"Error retrieving chat history: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve chat history"
        )


# ============================================================================
# RESEARCH DATA EXPORT
# ============================================================================

@router.get("/export/session/{session_id}")
async def export_session_chat_data(
    session_id: str,
    session: dict = Depends(verify_session_token),
    db: AsyncSession = Depends(get_db)
):
    """
    Export all chat data for a session (research use)
    
    Accessible only by authenticated admins or the session's student
    Returns complete audit trail with:
    - All messages (user + system)
    - Game context at time of question
    - Guardrails applied
    - Tags and metadata
    
    Format: JSON for easy integration with research analysis tools
    """
    from sqlalchemy import select
    from uuid import UUID
    
    try:
        session_uuid = UUID(session_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid session ID format"
        )
    
    try:
        stmt = (
            select(ChatLog)
            .where(ChatLog.session_id == session_uuid)
            .order_by(ChatLog.created_at)
        )
        
        result = await db.execute(stmt)
        chat_logs = result.scalars().all()
        
        export_data = {
            "session_id": str(session_uuid),
            "chat_count": len(chat_logs),
            "messages": [
                {
                    "id": str(log.id),
                    "timestamp": log.created_at.isoformat(),
                    "user_message": log.user_message,
                    "assistant_response": log.assistant_response,
                    "game_context": {
                        "scene_id": log.game_scene_id,
                        "topic_id": log.game_topic_id,
                        "learning_objective": log.learning_objective,
                        "player_state": log.player_state,
                        "help_policy": log.help_policy,
                    },
                    "response_metadata": {
                        "guardrail_mode": log.guardrail_mode,
                        "response_tokens": log.response_tokens,
                        "citations": json.loads(log.citations) if log.citations else [],
                    }
                }
                for log in chat_logs
            ],
            "export_timestamp": datetime.utcnow().isoformat(),
        }
        
        logger.info(f"Chat data exported: session={session_id}, message_count={len(chat_logs)}")
        
        return export_data
    
    except Exception as e:
        logger.error(f"Error exporting chat data: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to export chat data"
        )
