"""
SQLAlchemy ORM Models
Maps Python classes to PostgreSQL database tables
"""

from app.core.database import Base

# Import all models to register them with SQLAlchemy
from app.models.admin import AdminUser
from app.models.code import AccessCode, CodeBatch
from app.models.session import GameSession
from app.models.event import EventLog, QuizAttempt, CheckpointVerification
from app.models.system import AuditLog, ResearchConfig, AIInteraction

__all__ = [
    "Base",
    "AdminUser",
    "AccessCode",
    "CodeBatch",
    "GameSession",
    "EventLog",
    "QuizAttempt",
    "CheckpointVerification",
    "AuditLog",
    "ResearchConfig",
    "AIInteraction",
]
