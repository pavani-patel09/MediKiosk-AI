import os
import shutil
import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.document import MedicalDocument, ExtractedField
from app.models.patient import Patient
from app.models.user import User
from app.schemas.document import MedicalDocumentOut, DocumentVerifyRequest
from app.services.auth_service import get_current_user
from app.services.ocr_service import process_medical_document
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/documents", tags=["Medical Documents & OCR"])

ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png", ".webp"}

@router.post("/upload", response_model=MedicalDocumentOut)
async def upload_document(
    patient_id: int = Form(...),
    doc_type: str = Form("prescription"),
    visit_id: Optional[int] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format. Supported formats: {', '.join(ALLOWED_EXTENSIONS)}"
        )
        
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    unique_filename = f"{uuid.uuid4().hex}_{file.filename}"
    saved_file_path = os.path.join(settings.UPLOAD_DIR, unique_filename)
    
    file_bytes = await file.read()
    file_size = len(file_bytes)
    if file_size > settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail=f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_MB}MB"
        )
        
    with open(saved_file_path, "wb") as f:
        f.write(file_bytes)
        
    # Run real OCR / PDF extraction
    raw_text, extracted_fields_data = process_medical_document(
        saved_file_path,
        file.filename,
        doc_type_hint=doc_type
    )
    
    # Save document record
    doc_record = MedicalDocument(
        patient_id=patient.id,
        visit_id=visit_id,
        doc_type=doc_type,
        original_filename=file.filename,
        file_path=saved_file_path,
        file_size_bytes=file_size,
        raw_extracted_text=raw_text,
        ocr_status="processed"
    )
    db.add(doc_record)
    db.flush()
    
    # Save extracted fields
    for field in extracted_fields_data:
        ef = ExtractedField(
            document_id=doc_record.id,
            field_name=field["field_name"],
            extracted_value=field["extracted_value"],
            confidence=field["confidence"],
            is_verified=False
        )
        db.add(ef)
        
    db.commit()
    db.refresh(doc_record)
    
    log_audit_event(
        db,
        action="DOCUMENT_UPLOADED_OCR",
        user_id=current_user.id if current_user else None,
        patient_id=patient.id,
        details=f"Uploaded {file.filename} ({doc_type}), {len(extracted_fields_data)} fields extracted"
    )
    
    return doc_record

@router.post("/verify")
def verify_extracted_fields(
    verify_req: DocumentVerifyRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    doc = db.query(MedicalDocument).filter(MedicalDocument.id == verify_req.document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    for item in verify_req.fields:
        field = db.query(ExtractedField).filter(
            ExtractedField.document_id == doc.id,
            ExtractedField.field_name == item.field_name
        ).first()
        if field:
            field.corrected_value = item.corrected_value
            field.is_verified = True
            if current_user:
                field.verified_by_user_id = current_user.id
                
    doc.is_verified = True
    doc.ocr_status = "verified"
    db.commit()
    
    log_audit_event(
        db,
        action="DOCUMENT_FIELDS_VERIFIED",
        user_id=current_user.id if current_user else None,
        patient_id=doc.patient_id,
        details=f"Verified fields for document #{doc.id}"
    )
    return {"message": "Document fields verified and updated successfully"}

@router.get("/patient/{patient_id}", response_model=List[MedicalDocumentOut])
def get_patient_documents(patient_id: int, db: Session = Depends(get_db)):
    docs = db.query(MedicalDocument).filter(MedicalDocument.patient_id == patient_id).order_by(MedicalDocument.created_at.desc()).all()
    return docs
