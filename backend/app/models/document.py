from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class MedicalDocument(Base):
    __tablename__ = "medical_documents"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    visit_id = Column(Integer, ForeignKey("visits.id"), nullable=True)
    doc_type = Column(String(50), default="prescription")  # prescription, lab_report, discharge_summary, imaging, other
    original_filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size_bytes = Column(Integer, default=0)
    raw_extracted_text = Column(Text, nullable=True)
    ocr_status = Column(String(30), default="processed")  # pending, processed, verified, failed
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    patient = relationship("Patient", back_populates="documents")
    visit = relationship("Visit", back_populates="documents")
    extracted_fields = relationship("ExtractedField", back_populates="document", cascade="all, delete-orphan")

class ExtractedField(Base):
    __tablename__ = "extracted_fields"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("medical_documents.id"), nullable=False)
    field_name = Column(String(100), nullable=False)  # e.g., 'Hospital', 'Doctor', 'Date', 'Diagnosis', 'Medicines'
    extracted_value = Column(Text, nullable=True)
    confidence = Column(Float, default=0.92)
    is_verified = Column(Boolean, default=False)
    corrected_value = Column(Text, nullable=True)
    verified_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    document = relationship("MedicalDocument", back_populates="extracted_fields")
