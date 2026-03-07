"""
Access Code and Code Batch Models
Manages student access codes and batch organization
"""

from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.core.database import Base


class CodeBatch(Base):
    """
    Code batches table
    Groups access codes for organizational purposes
    """
    __tablename__ = "code_batches"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    batch_name = Column(String(255), nullable=False)
    created_by_admin_id = Column(UUID(as_uuid=True), ForeignKey("admin_users.id"), nullable=False)
    treatment_group = Column(String(50), nullable=True, index=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    created_by_admin = relationship("AdminUser", back_populates="code_batches")
    codes = relationship("AccessCode", back_populates="batch")
    
    def __repr__(self):
        return f"<CodeBatch(id={self.id}, name='{self.batch_name}', codes={len(self.codes)})>"


class AccessCode(Base):
    """
    Access codes table
    Individual codes assigned to students
    """
    __tablename__ = "access_codes"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    code = Column(String(10), unique=True, nullable=False, index=True)
    batch_id = Column(UUID(as_uuid=True), ForeignKey("code_batches.id"), nullable=False)
    treatment_group = Column(String(50), nullable=True, index=True)
    is_active = Column(Boolean, default=True, nullable=False)
    used_at = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    batch = relationship("CodeBatch", back_populates="codes")
    sessions = relationship("GameSession", back_populates="code")
    
    def __repr__(self):
        return f"<AccessCode(id={self.id}, code='{self.code}', used={'Yes' if self.used_at else 'No'})>"
