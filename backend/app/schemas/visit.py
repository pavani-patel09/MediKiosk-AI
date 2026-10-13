from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class IntakeCreate(BaseModel):
    patient_id: int
    visit_id: Optional[int] = None
    department: str = "General Medicine"
    chief_complaint: str
    symptom_onset: Optional[str] = None
    symptom_duration: Optional[str] = None
    severity: str = "Moderate"
    associated_symptoms: Optional[str] = None
    changes_since_last_visit: Optional[str] = None
    recently_taken_meds: Optional[str] = None
    newly_reported_allergies: Optional[str] = None
    language_used: str = "en"

class IntakeOut(BaseModel):
    id: int
    visit_id: int
    patient_id: int
    chief_complaint: str
    symptom_onset: Optional[str] = None
    symptom_duration: Optional[str] = None
    severity: str
    associated_symptoms: Optional[str] = None
    changes_since_last_visit: Optional[str] = None
    recently_taken_meds: Optional[str] = None
    newly_reported_allergies: Optional[str] = None
    language_used: str
    submitted_at: datetime

    class Config:
        from_attributes = True

class VisitCreate(BaseModel):
    patient_id: int
    department: str = "General Medicine"
    priority: Optional[str] = "routine"

class VisitOut(BaseModel):
    id: int
    patient_id: int
    visit_token: str
    department: str
    doctor_id: Optional[int] = None
    visit_date: datetime
    status: str
    priority: str
    is_red_flag: bool
    red_flag_reason: Optional[str] = None
    created_at: datetime
    intake: Optional[IntakeOut] = None

    class Config:
        from_attributes = True

class VisitStatusUpdate(BaseModel):
    status: str
    doctor_id: Optional[int] = None
    priority: Optional[str] = None
