"""
Chat API Schemas
Request and response models for Vertex AI chatbot integration
"""

from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, Dict, Any, List


# ============================================================================
# GAME CONTEXT DATA
# ============================================================================

class ChatContextData(BaseModel):
    """
    Game context provided with chat request
    Used to ground RAG responses and track learning progression
    """
    scene_id: Optional[str] = Field(None, description="Current scene ID in game")
    topic_id: Optional[str] = Field(None, description="Current topic/concept being taught")
    learning_objective: Optional[str] = Field(None, description="What student is supposed to learn")
    player_state: Optional[Dict[str, Any]] = Field(None, description="Player state (choices made, variables, etc)")
    help_policy: Optional[str] = Field("default", description="Help level: 'full', 'hint', 'restricted', 'default'")


# ============================================================================
# CHAT MESSAGE
# ============================================================================

class ChatMessageRequest(BaseModel):
    """Request to generate a chat response"""
    session_token: str = Field(..., description="Session authentication token")
    user_message: str = Field(..., min_length=1, max_length=2000, description="Student's question or prompt")
    game_context: Optional[ChatContextData] = Field(None, description="Current game state context")
    
    class Config:
        json_schema_extra = {
            "example": {
                "session_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
                "user_message": "What does a function do in programming?",
                "game_context": {
                    "scene_id": "scene_001_intro",
                    "topic_id": "function_basics",
                    "learning_objective": "Understand what functions are and why they're useful",
                    "player_state": {"level": 1, "completed_scenes": ["scene_intro"]},
                    "help_policy": "hint"
                }
            }
        }


class CitationSource(BaseModel):
    """Citation source for RAG response"""
    source_type: str = Field(..., description="'scene', 'glossary', 'example', 'quiz', 'guideline'")
    source_id: str = Field(..., description="ID of scene or content item")
    relevance_score: Optional[float] = Field(None, description="0-1 confidence score")
    excerpt: Optional[str] = Field(None, description="Quoted text from source")


class ChatMessageResponse(BaseModel):
    """Response with AI-generated answer"""
    success: bool
    response: str = Field(..., description="Vertex AI generated answer")
    citations: List[CitationSource] = Field(default=[], description="Sources used for RAG grounding")
    guardrail_applied: bool = Field(..., description="Whether content filters/spoiler guards were applied")
    guardrail_mode: str = Field(..., description="Type of guardrail: 'none', 'hint', 'spoiler', 'out_of_scope'")
    help_remaining: Optional[int] = Field(None, description="Help requests remaining if capped by policy")
    chat_log_id: str = Field(..., description="Database ID of logged interaction")
    message_id: str = Field(..., description="Unique message ID for tracking")
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "response": "A function is a reusable block of code that performs a specific task. In the game, you can think of functions like the helper characters - when you call a function (ask a helper), it does some work and returns a result. This is exactly what the function in our game does!",
                "citations": [
                    {
                        "source_type": "scene",
                        "source_id": "scene_001_intro",
                        "relevance_score": 0.95,
                        "excerpt": "Functions are the foundation of programming..."
                    }
                ],
                "guardrail_applied": False,
                "guardrail_mode": "none",
                "help_remaining": 9,
                "chat_log_id": "550e8400-e29b-41d4-a716-446655440000",
                "message_id": "msg_550e8400-e29b-41d4-a716-446655440001"
            }
        }


# ============================================================================
# CHAT HISTORY
# ============================================================================

class ChatHistoryItem(BaseModel):
    """Single item in chat history"""
    id: str
    timestamp: str
    user_message: str
    assistant_response: str
    scene_id: Optional[str] = None
    topic_id: Optional[str] = None
    guardrail_applied: bool
    guardrail_mode: str
    citations: List[CitationSource] = []


class ChatHistoryResponse(BaseModel):
    """Response containing chat history"""
    success: bool
    session_id: str
    messages: List[ChatHistoryItem]
    total_count: int


# ============================================================================
# RESEARCH DATA EXPORT
# ============================================================================

class ChatExportItem(BaseModel):
    """Full chat data for research export"""
    id: str
    timestamp: str
    user_message: str
    assistant_response: str
    game_context: Dict[str, Any]
    response_metadata: Dict[str, Any]


class ChatExportResponse(BaseModel):
    """Full research export of chat interactions"""
    session_id: str
    chat_count: int
    messages: List[ChatExportItem]
    export_timestamp: str
