from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class ClinicalSummaryOut(BaseModel):
    id: int
    visit_id: int
    patient_id: int
    chief_complaint: Optional[str] = None
    hpi: Optional[str] = None
    past_medical_history: Optional[str] = None
    current_medications: Optional[str] = None
    allergies: Optional[str] = None
    key_findings_from_docs: Optional[str] = None
    missing_clinical_info: Optional[str] = None
    follow_up_recommendations: Optional[str] = None
    ai_model_used: str
    is_doctor_verified: bool
    doctor_notes: Optional[str] = None
    verified_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ClinicalSummaryVerify(BaseModel):
    doctor_notes: Optional[str] = None
    chief_complaint: Optional[str] = None
    hpi: Optional[str] = None
    past_medical_history: Optional[str] = None
    current_medications: Optional[str] = None
    allergies: Optional[str] = None
    is_doctor_verified: bool = True

class TimelineEvent(BaseModel):
    id: str
    date: str
    category: str  # visit, diagnosis, medication, lab, document
    title: str
    description: str
    source_type: str
    source_id: Optional[int] = None
    is_current_visit: bool = False
    verified: bool = False
