"""
Admin User Model
Represents administrative users who can manage codes and view analytics
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime

from app.core.database import Base


class AdminUser(Base):
    """
    Administrative users table
    Stores credentials and metadata for admin access
    """
    __tablename__ = "admin_users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(Text, nullable=False)
    name = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    last_login_at = Column(DateTime, nullable=True)
    
    # Relationships
    code_batches = relationship("CodeBatch", back_populates="created_by_admin")
    
    def __repr__(self):
        return f"<AdminUser(id={self.id}, email='{self.email}', name='{self.name}')>"
