"""
Chat Models
Database schema for chat interactions and research data collection
"""

from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Integer, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.core.database import Base


class ChatLog(Base):
    """
    Chat interactions table
    Stores all student-chatbot conversations for research analysis and audit trail
    """
    __tablename__ = "chat_logs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    session_id = Column(UUID(as_uuid=True), ForeignKey("game_sessions.id"), nullable=False, index=True)
    student_id = Column(String(255), nullable=True, index=True)
    access_code = Column(String(50), nullable=True, index=True)
    
    # Student's input
    user_message = Column(Text, nullable=False)
    
    # AI Response
    assistant_response = Column(Text, nullable=False)
    
    # Game context at time of query
    game_scene_id = Column(String(100), nullable=True, index=True)
    game_topic_id = Column(String(100), nullable=True, index=True)
    learning_objective = Column(Text, nullable=True)
    player_state = Column(JSON, nullable=True)  # Player choices, variables, etc
    help_policy = Column(String(50), nullable=True)  # 'full', 'hint', 'restricted', 'default'
    
    # Response metadata
    citations = Column(JSON, nullable=True)  # List of {source_type, source_id, relevance_score, excerpt}
    guardrail_mode = Column(String(50), nullable=False, default="none")  # 'none', 'hint', 'spoiler', 'out_of_scope'
    response_tokens = Column(Integer, nullable=True)  # Token count for cost tracking
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    # Relationships
    session = relationship("GameSession", back_populates="chat_logs")
    
    def __repr__(self):
        return f"<ChatLog(id={self.id}, session={self.session_id}, scene={self.game_scene_id})>"
