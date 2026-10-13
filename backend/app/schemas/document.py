from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class ExtractedFieldOut(BaseModel):
    id: int
    field_name: str
    extracted_value: Optional[str] = None
    confidence: float
    is_verified: bool
    corrected_value: Optional[str] = None

    class Config:
        from_attributes = True

class ExtractedFieldUpdate(BaseModel):
    field_name: str
    corrected_value: str
    is_verified: bool = True

class MedicalDocumentOut(BaseModel):
    id: int
    patient_id: int
    visit_id: Optional[int] = None
    doc_type: str
    original_filename: str
    file_path: str
    file_size_bytes: int
    ocr_status: str
    is_verified: bool
    created_at: datetime
    extracted_fields: List[ExtractedFieldOut] = []

    class Config:
        from_attributes = True

class DocumentVerifyRequest(BaseModel):
    document_id: int
    fields: List[ExtractedFieldUpdate]
