"""
Admin API Schemas
Request and response models for admin endpoints
"""

from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import List, Optional


# ============================================================================
# AUTHENTICATION
# ============================================================================

class LoginRequest(BaseModel):
    """Admin login request"""
    email: EmailStr
    password: str = Field(..., min_length=8)


class TokenResponse(BaseModel):
    """JWT token response"""
    access_token: str
    token_type: str = "bearer"
    expires_in: int


# ============================================================================
# CODE GENERATION
# ============================================================================

class CodeGenerationRequest(BaseModel):
    """Request to generate access codes"""
    batch_name: str = Field(..., min_length=1, max_length=255)
    num_codes: int = Field(..., ge=1, le=1000)
    treatment_group: Optional[str] = Field(None, max_length=50)
    notes: Optional[str] = None
    expires_at: Optional[datetime] = None


class CodeGenerationResponse(BaseModel):
    """Response after generating codes"""
    batch_id: int
    codes_generated: int
    codes: List[str]
    batch_name: str
    treatment_group: Optional[str]


# ============================================================================
# CODE BATCH
# ============================================================================

class CodeBatchInfo(BaseModel):
    """Information about a code batch"""
    batch_id: int
    batch_name: str
    total_codes: int
    used_codes: int
    treatment_group: Optional[str]
    created_at: datetime
    created_by: str


class CodeBatchListResponse(BaseModel):
    """List of code batches"""
    batches: List[CodeBatchInfo]
    total: int


# ============================================================================
# ANALYTICS
# ============================================================================

class DashboardSummary(BaseModel):
    """Dashboard summary statistics"""
    total_codes: int
    used_codes: int
    active_sessions: int
    completed_sessions: int
    avg_completion_time_minutes: float
    quiz_avg_score: float
    last_updated: datetime


class TreatmentGroupStats(BaseModel):
    """Statistics for a treatment group"""
    completion_rate: float
    avg_quiz_score: float
    avg_time_minutes: float
    total_sessions: int


class TreatmentComparisonResponse(BaseModel):
    """Comparison across treatment groups"""
    groups: dict[str, TreatmentGroupStats]


# ============================================================================
# EXPORT
# ============================================================================

class ExportRequest(BaseModel):
    """Request for data export"""
    format: str = Field("csv", pattern="^(csv|json)$")
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    treatment_group: Optional[str] = None
    batch_id: Optional[int] = None
