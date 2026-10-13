from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Date
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    patient_uid = Column(String(50), unique=True, index=True, nullable=False)  # e.g. PAT-2026-00124
    full_name = Column(String(100), index=True, nullable=False)
    dob = Column(Date, nullable=True)
    age = Column(Integer, nullable=True)
    gender = Column(String(20), nullable=False)
    blood_group = Column(String(10), nullable=True, default="Not recorded")
    phone = Column(String(20), index=True, nullable=False)
    email = Column(String(100), nullable=True)
    emergency_contact_name = Column(String(100), nullable=True)
    emergency_contact_phone = Column(String(20), nullable=True)
    address = Column(Text, nullable=True)
    consent_agreed = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    allergies = relationship("Allergy", back_populates="patient", cascade="all, delete-orphan")
    chronic_conditions = relationship("ChronicCondition", back_populates="patient", cascade="all, delete-orphan")
    medications = relationship("Medication", back_populates="patient", cascade="all, delete-orphan")
    visits = relationship("Visit", back_populates="patient", cascade="all, delete-orphan")
    documents = relationship("MedicalDocument", back_populates="patient", cascade="all, delete-orphan")
    clinical_summaries = relationship("ClinicalSummary", back_populates="patient", cascade="all, delete-orphan")

class Allergy(Base):
    __tablename__ = "allergies"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    allergen = Column(String(100), nullable=False)
    reaction = Column(String(200), nullable=True)
    severity = Column(String(30), default="Moderate")  # Mild, Moderate, Severe
    identified_date = Column(String(50), nullable=True)
    verified_by_doctor = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient", back_populates="allergies")

class ChronicCondition(Base):
    __tablename__ = "chronic_conditions"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    condition_name = Column(String(150), nullable=False)
    icd10_code = Column(String(30), nullable=True)
    diagnosed_date = Column(String(50), nullable=True)
    status = Column(String(30), default="Active")  # Active, Inactive, Resolved
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient", back_populates="chronic_conditions")

class Medication(Base):
    __tablename__ = "medications"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    medicine_name = Column(String(150), nullable=False)
    dosage = Column(String(50), nullable=False)
    frequency = Column(String(50), default="Once daily")
    start_date = Column(String(50), nullable=True)
    end_date = Column(String(50), nullable=True)
    prescribing_doctor = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient", back_populates="medications")
