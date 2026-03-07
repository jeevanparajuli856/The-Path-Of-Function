"""
Audit Log and Research Configuration Models
System auditing and research settings
"""

from sqlalchemy import Column, Integer, String, DateTime, Text, JSON
from datetime import datetime

from app.core.database import Base


class AuditLog(Base):
    """
    Audit logs table
    Tracks administrative actions for security
    """
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    admin_email = Column(String(255), nullable=True, index=True)
    action = Column(String(100), nullable=False)
    resource_type = Column(String(50), nullable=True)
    resource_id = Column(Integer, nullable=True)
    details = Column(JSON, nullable=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    def __repr__(self):
        return f"<AuditLog(id={self.id}, action='{self.action}', user='{self.admin_email}')>"


class ResearchConfig(Base):
    """
    Research configurations table
    Stores runtime configuration for research parameters
    """
    __tablename__ = "research_configs"
    
    id = Column(Integer, primary_key=True, index=True)
    config_key = Column(String(100), unique=True, nullable=False, index=True)
    config_value = Column(JSON, nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    def __repr__(self):
        return f"<ResearchConfig(key='{self.config_key}', value={self.config_value})>"


class AIInteraction(Base):
    """
    AI interactions table (Phase 2/3)
    Placeholder for future AI/RAG integration
    """
    __tablename__ = "ai_interactions"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, nullable=True, index=True)
    interaction_type = Column(String(50), nullable=True)
    user_input = Column(Text, nullable=True)
    ai_response = Column(Text, nullable=True)
    model_used = Column(String(100), nullable=True)
    metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    def __repr__(self):
        return f"<AIInteraction(id={self.id}, type='{self.interaction_type}')>"
