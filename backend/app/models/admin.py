"""
Admin User Model
Represents administrative users who can manage codes and view analytics
"""

from sqlalchemy import Column, String, Boolean, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.core.database import Base


class AdminUser(Base):
    """
    Administrative users table
    Stores credentials and metadata for admin access
    """
    __tablename__ = "admin_users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    email = Column(Text, unique=True, nullable=False, index=True)
    password_hash = Column(Text, nullable=False)
    full_name = Column(Text, nullable=True)
    role = Column(Text, default="researcher", nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    last_login_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    code_batches = relationship("CodeBatch", back_populates="created_by_admin")
    
    def __repr__(self):
        return f"<AdminUser(id={self.id}, email='{self.email}', name='{self.full_name}')>"
