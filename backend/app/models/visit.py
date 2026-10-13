from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Visit(Base):
    __tablename__ = "visits"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    visit_token = Column(String(20), unique=True, index=True, nullable=False)  # e.g. A-108
    department = Column(String(50), default="General Medicine")
    doctor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    visit_date = Column(DateTime, default=datetime.utcnow)
    status = Column(String(30), default="in_kiosk")  # registered, in_kiosk, awaiting_review, with_doctor, completed
    priority = Column(String(20), default="routine")  # routine, monitor, attention, red_flag
    is_red_flag = Column(Boolean, default=False)
    red_flag_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    patient = relationship("Patient", back_populates="visits")
    doctor = relationship("User", foreign_keys=[doctor_id])
    intake = relationship("IntakeRecord", back_populates="visit", uselist=False, cascade="all, delete-orphan")
    documents = relationship("MedicalDocument", back_populates="visit")
    clinical_summary = relationship("ClinicalSummary", back_populates="visit", uselist=False)

class IntakeRecord(Base):
    __tablename__ = "intake_records"

    id = Column(Integer, primary_key=True, index=True)
    visit_id = Column(Integer, ForeignKey("visits.id"), nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    chief_complaint = Column(Text, nullable=False)
    symptom_onset = Column(String(100), nullable=True)
    symptom_duration = Column(String(100), nullable=True)
    severity = Column(String(30), default="Moderate")  # Mild, Moderate, Severe
    associated_symptoms = Column(Text, nullable=True)
    changes_since_last_visit = Column(Text, nullable=True)
    recently_taken_meds = Column(Text, nullable=True)
    newly_reported_allergies = Column(Text, nullable=True)
    language_used = Column(String(10), default="en")  # en, hi, te
    submitted_at = Column(DateTime, default=datetime.utcnow)

    visit = relationship("Visit", back_populates="intake")
