from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.clinical_summary import ClinicalSummary
from app.models.visit import Visit
from app.models.patient import Patient
from app.models.user import User
from app.schemas.summary import ClinicalSummaryOut, ClinicalSummaryVerify
from app.services.auth_service import get_current_user, require_authenticated_user
from app.services.audit_service import log_audit_event
from app.services.ai_summary_service import generate_ai_clinical_summary

router = APIRouter(prefix="/summaries", tags=["Clinical Summaries & AI"])

@router.post("/generate/{visit_id}", response_model=ClinicalSummaryOut)
def generate_summary_for_visit(
    visit_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    visit = db.query(Visit).filter(Visit.id == visit_id).first()
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")
        
    patient = visit.patient
    intake = visit.intake
    if not intake:
        raise HTTPException(status_code=400, detail="Cannot generate clinical summary before clinical intake is recorded")
        
    patient_dict = {
        "full_name": patient.full_name,
        "age": patient.age,
        "gender": patient.gender,
        "blood_group": patient.blood_group,
        "chronic_conditions": [{"condition_name": c.condition_name, "status": c.status} for c in patient.chronic_conditions],
        "medications": [{"medicine_name": m.medicine_name, "dosage": m.dosage, "frequency": m.frequency, "is_active": m.is_active} for m in patient.medications],
        "allergies": [{"allergen": a.allergen, "severity": a.severity} for a in patient.allergies]
    }
    intake_dict = {
        "chief_complaint": intake.chief_complaint,
        "symptom_onset": intake.symptom_onset,
        "symptom_duration": intake.symptom_duration,
        "severity": intake.severity,
        "associated_symptoms": intake.associated_symptoms,
        "changes_since_last_visit": intake.changes_since_last_visit,
        "recently_taken_meds": intake.recently_taken_meds,
        "newly_reported_allergies": intake.newly_reported_allergies,
        "department": visit.department
    }
    docs_list = []
    for doc in patient.documents:
        docs_list.append({
            "doc_type": doc.doc_type,
            "extracted_fields": [{"field_name": ef.field_name, "extracted_value": (ef.corrected_value or ef.extracted_value)} for ef in doc.extracted_fields]
        })
        
    summary_data = generate_ai_clinical_summary(patient_dict, intake_dict, docs_list)
    
    summary = db.query(ClinicalSummary).filter(ClinicalSummary.visit_id == visit.id).first()
    if not summary:
        summary = ClinicalSummary(
            visit_id=visit.id,
            patient_id=patient.id
        )
        db.add(summary)
        
    summary.chief_complaint = summary_data.get("chief_complaint")
    summary.hpi = summary_data.get("hpi")
    summary.past_medical_history = summary_data.get("past_medical_history")
    summary.current_medications = summary_data.get("current_medications")
    summary.allergies = summary_data.get("allergies")
    summary.key_findings_from_docs = summary_data.get("key_findings_from_docs")
    summary.missing_clinical_info = summary_data.get("missing_clinical_info")
    summary.follow_up_recommendations = summary_data.get("follow_up_recommendations")
    summary.ai_model_used = summary_data.get("ai_model_used", "MediKiosk Clinical Engine")
    
    db.commit()
    db.refresh(summary)
    
    log_audit_event(
        db,
        action="SUMMARY_GENERATED",
        user_id=current_user.id if current_user else None,
        patient_id=patient.id,
        details=f"Clinical summary generated for visit {visit.visit_token} using {summary.ai_model_used}"
    )
    return summary

@router.get("/visit/{visit_id}", response_model=Optional[ClinicalSummaryOut])
def get_summary_by_visit(visit_id: int, db: Session = Depends(get_db)):
    summary = db.query(ClinicalSummary).filter(ClinicalSummary.visit_id == visit_id).first()
    return summary

@router.post("/{id}/verify", response_model=ClinicalSummaryOut)
def verify_clinical_summary(
    id: int,
    verify_in: ClinicalSummaryVerify,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated_user)
):
    summary = db.query(ClinicalSummary).filter(ClinicalSummary.id == id).first()
    if not summary:
        raise HTTPException(status_code=404, detail="Summary not found")
        
    summary.is_doctor_verified = True
    summary.verified_by_doctor_id = current_user.id
    summary.verified_at = datetime.utcnow()
    summary.doctor_notes = verify_in.doctor_notes
    
    if verify_in.chief_complaint:
        summary.chief_complaint = verify_in.chief_complaint
    if verify_in.hpi:
        summary.hpi = verify_in.hpi
    if verify_in.past_medical_history:
        summary.past_medical_history = verify_in.past_medical_history
    if verify_in.current_medications:
        summary.current_medications = verify_in.current_medications
    if verify_in.allergies:
        summary.allergies = verify_in.allergies
        
    # Also update associated visit status to 'with_doctor' or 'completed'
    visit = summary.visit
    if visit and visit.status == "awaiting_review":
        visit.status = "with_doctor"
        
    db.commit()
    db.refresh(summary)
    
    log_audit_event(
        db,
        action="SUMMARY_VERIFIED",
        user_id=current_user.id,
        patient_id=summary.patient_id,
        details=f"Summary #{summary.id} verified by Dr. {current_user.full_name}"
    )
    return summary
