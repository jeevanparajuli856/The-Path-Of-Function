"""
Event Logging Models
Tracks all game events, quiz attempts, and checkpoint verifications
"""

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Text, Float, JSON
from sqlalchemy.orm import relationship
from datetime import datetime

from app.core.database import Base


class EventLog(Base):
    """
    Event logs table
    Stores all game events in chronological order
    """
    __tablename__ = "event_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("game_sessions.id"), nullable=False, index=True)
    event_type = Column(String(50), nullable=False, index=True)
    event_data = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    # Relationships
    session = relationship("GameSession", back_populates="events")
    
    def __repr__(self):
        return f"<EventLog(id={self.id}, type='{self.event_type}', session={self.session_id})>"


class QuizAttempt(Base):
    """
    Quiz attempts table
    Structured storage for quiz performance
    """
    __tablename__ = "quiz_attempts"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("game_sessions.id"), nullable=False, index=True)
    quiz_id = Column(String(50), nullable=False, index=True)
    answer_given = Column(Text, nullable=True)
    is_correct = Column(Boolean, nullable=False)
    attempts_count = Column(Integer, default=1, nullable=False)
    time_spent_seconds = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    session = relationship("GameSession", back_populates="quiz_attempts")
    
    def __repr__(self):
        return f"<QuizAttempt(id={self.id}, quiz='{self.quiz_id}', correct={self.is_correct})>"


class CheckpointVerification(Base):
    """
    Checkpoint verifications table
    Tracks checkpoint code verification attempts
    """
    __tablename__ = "checkpoint_verifications"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("game_sessions.id"), nullable=False, index=True)
    checkpoint_number = Column(Integer, nullable=False)
    code_entered = Column(String(50), nullable=False)
    is_correct = Column(Boolean, nullable=False)
    attempt_number = Column(Integer, default=1, nullable=False)
    verified_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    session = relationship("GameSession", back_populates="checkpoint_verifications")
    
    def __repr__(self):
        return f"<CheckpointVerification(id={self.id}, checkpoint={self.checkpoint_number}, correct={self.is_correct})>"
