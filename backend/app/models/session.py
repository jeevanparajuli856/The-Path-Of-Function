"""
Game Session Model
Tracks individual student gameplay sessions
"""

from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.core.database import Base


class GameSession(Base):
    """
    Game sessions table
    Tracks active and completed gameplay sessions
    """
    __tablename__ = "game_sessions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    session_token = Column(String(255), unique=True, nullable=False, index=True)
    code_id = Column(UUID(as_uuid=True), ForeignKey("access_codes.id"), nullable=False)
    treatment_group = Column(String(50), nullable=True, index=True)
    
    # Timestamps
    started_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    ended_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Progress tracking
    current_scene = Column(String(100), nullable=True)
    checkpoint_1_verified_at = Column(DateTime, nullable=True)
    checkpoint_2_verified_at = Column(DateTime, nullable=True)
    
    # Completion
    completion_status = Column(String(50), default="in_progress", nullable=False)  # in_progress, completed, abandoned
    duration_minutes = Column(Float, nullable=True)
    final_data = Column(JSON, nullable=True)
    
    # Relationships
    code = relationship("AccessCode", back_populates="sessions")
    events = relationship("EventLog", back_populates="session", cascade="all, delete-orphan")
    quiz_attempts = relationship("QuizAttempt", back_populates="session", cascade="all, delete-orphan")
    checkpoint_verifications = relationship("CheckpointVerification", back_populates="session", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<GameSession(id={self.id}, status='{self.completion_status}', duration={self.duration_minutes})>"
