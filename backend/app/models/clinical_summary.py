from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class ClinicalSummary(Base):
    __tablename__ = "clinical_summaries"

    id = Column(Integer, primary_key=True, index=True)
    visit_id = Column(Integer, ForeignKey("visits.id"), nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    
    # Structured Clinical Summary Fields
    chief_complaint = Column(Text, nullable=True)
    hpi = Column(Text, nullable=True)
    past_medical_history = Column(Text, nullable=True)
    current_medications = Column(Text, nullable=True)
    allergies = Column(Text, nullable=True)
    key_findings_from_docs = Column(Text, nullable=True)
    missing_clinical_info = Column(Text, nullable=True)
    follow_up_recommendations = Column(Text, nullable=True)
    ai_model_used = Column(String(50), default="Clinical-Rule-Engine-v2")
    
    # Doctor Review & Verification
    is_doctor_verified = Column(Boolean, default=False)
    verified_by_doctor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    doctor_notes = Column(Text, nullable=True)
    verified_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    visit = relationship("Visit", back_populates="clinical_summary")
    patient = relationship("Patient", back_populates="clinical_summaries")
    verified_by_doctor = relationship("User", foreign_keys=[verified_by_doctor_id])
