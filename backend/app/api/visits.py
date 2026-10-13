import random
import re
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.visit import Visit, IntakeRecord
from app.models.patient import Patient
from app.models.clinical_summary import ClinicalSummary
from app.models.user import User
from app.schemas.visit import VisitCreate, VisitOut, VisitStatusUpdate, IntakeCreate, IntakeOut
from app.services.auth_service import get_current_user
from app.services.audit_service import log_audit_event
from app.services.ai_summary_service import generate_ai_clinical_summary

router = APIRouter(prefix="/visits", tags=["Visits & Intake"])

RED_FLAG_PATTERNS = [
    r"\bchest\s+(?:pain|pressure|discomfort|tightness)\b",
    r"\b(?:shortness\s+of\s+breath|difficulty\s+breathing|breathless|gasping)\b",
    r"\b(?:fainting|syncope|unconscious|blackout)\b",
    r"\b(?:paralysis|stroke|facial\s+droop|slurred\s+speech)\b",
    r"\b(?:hemoptysis|coughing\s+blood|vomiting\s+blood)\b",
    r"\b(?:severe\s+headache|thunderclap|worst\s+headache)\b"
]

def generate_visit_token(db: Session, department: str = "General Medicine") -> str:
    prefix = "A"
    if "surg" in department.lower():
        prefix = "S"
    elif "paed" in department.lower():
        prefix = "P"
    elif "ayush" in department.lower() or "ayur" in department.lower():
        prefix = "Y"
        
    for _ in range(100):
        num = random.randint(100, 999)
        token = f"{prefix}-{num}"
        existing = db.query(Visit).filter(Visit.visit_token == token).first()
        if not existing:
            return token
    return f"{prefix}-{random.randint(1000, 9999)}"

def evaluate_red_flags(complaint: str, associated: Optional[str] = None, severity: str = "Moderate") -> tuple[bool, str, str]:
    full_text = f"{complaint} {associated or ''}".lower()
    for pattern in RED_FLAG_PATTERNS:
        if re.search(pattern, full_text):
            return True, "red_flag", "Red flag detected from reported symptoms. Prioritized for clinical safety."
    
    if severity == "Severe":
        return False, "attention", "Reported symptom severity marked as severe. Needs prompt doctor evaluation."
        
    return False, "routine", "Standard screening profile."

@router.post("/", response_model=VisitOut)
def create_visit(visit_in: VisitCreate, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == visit_in.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    token = generate_visit_token(db, visit_in.department)
    new_visit = Visit(
        patient_id=patient.id,
        visit_token=token,
        department=visit_in.department,
        status="in_kiosk",
        priority=visit_in.priority or "routine"
    )
    db.add(new_visit)
    db.commit()
    db.refresh(new_visit)
    return new_visit

@router.post("/intake", response_model=VisitOut)
def submit_clinical_intake(
    intake_in: IntakeCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    patient = db.query(Patient).filter(Patient.id == intake_in.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    visit = None
    if intake_in.visit_id:
        visit = db.query(Visit).filter(Visit.id == intake_in.visit_id).first()
        
    if not visit:
        token = generate_visit_token(db, intake_in.department)
        visit = Visit(
            patient_id=patient.id,
            visit_token=token,
            department=intake_in.department,
            status="in_kiosk"
        )
        db.add(visit)
        db.flush()
        
    # Evaluate red-flag criteria
    is_rf, priority_val, rf_reason = evaluate_red_flags(
        intake_in.chief_complaint,
        intake_in.associated_symptoms,
        intake_in.severity
    )
    visit.is_red_flag = is_rf
    visit.priority = priority_val
    visit.red_flag_reason = rf_reason
    visit.status = "awaiting_review"
    
    # Save intake record
    intake = IntakeRecord(
        visit_id=visit.id,
        patient_id=patient.id,
        chief_complaint=intake_in.chief_complaint,
        symptom_onset=intake_in.symptom_onset,
        symptom_duration=intake_in.symptom_duration,
        severity=intake_in.severity,
        associated_symptoms=intake_in.associated_symptoms,
        changes_since_last_visit=intake_in.changes_since_last_visit,
        recently_taken_meds=intake_in.recently_taken_meds,
        newly_reported_allergies=intake_in.newly_reported_allergies,
        language_used=intake_in.language_used
    )
    db.add(intake)
    db.flush()
    
    # Auto-generate draft Clinical Summary
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
        "chief_complaint": intake_in.chief_complaint,
        "symptom_onset": intake_in.symptom_onset,
        "symptom_duration": intake_in.symptom_duration,
        "severity": intake_in.severity,
        "associated_symptoms": intake_in.associated_symptoms,
        "changes_since_last_visit": intake_in.changes_since_last_visit,
        "recently_taken_meds": intake_in.recently_taken_meds,
        "newly_reported_allergies": intake_in.newly_reported_allergies,
        "department": visit.department
    }
    docs_list = []
    for doc in patient.documents:
        docs_list.append({
            "doc_type": doc.doc_type,
            "extracted_fields": [{"field_name": ef.field_name, "extracted_value": ef.extracted_value} for ef in doc.extracted_fields]
        })
        
    summary_data = generate_ai_clinical_summary(patient_dict, intake_dict, docs_list)
    
    clinical_summary = ClinicalSummary(
        visit_id=visit.id,
        patient_id=patient.id,
        chief_complaint=summary_data.get("chief_complaint"),
        hpi=summary_data.get("hpi"),
        past_medical_history=summary_data.get("past_medical_history"),
        current_medications=summary_data.get("current_medications"),
        allergies=summary_data.get("allergies"),
        key_findings_from_docs=summary_data.get("key_findings_from_docs"),
        missing_clinical_info=summary_data.get("missing_clinical_info"),
        follow_up_recommendations=summary_data.get("follow_up_recommendations"),
        ai_model_used=summary_data.get("ai_model_used", "Clinical Rule Engine")
    )
    db.add(clinical_summary)
    
    db.commit()
    db.refresh(visit)
    
    log_audit_event(
        db,
        action="INTAKE_SUBMITTED",
        user_id=current_user.id if current_user else None,
        patient_id=patient.id,
        details=f"Intake submitted for token {visit.visit_token}, priority {visit.priority}"
    )
    
    return visit

@router.get("/queue")
def get_visits_queue(
    department: Optional[str] = None,
    priority: Optional[str] = None,
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Visit)
    if department and department != "all":
        query = query.filter(Visit.department == department)
    if priority and priority != "all":
        query = query.filter(Visit.priority == priority)
    if status_filter and status_filter != "all":
        query = query.filter(Visit.status == status_filter)
        
    visits = query.order_by(Visit.visit_date.desc()).all()
    
    output = []
    for v in visits:
        p = v.patient
        intake_info = v.intake
        summary = v.clinical_summary
        output.append({
            "id": v.id,
            "patient_id": p.id,
            "patient_uid": p.patient_uid,
            "patient_name": p.full_name,
            "age": p.age,
            "gender": p.gender,
            "blood_group": p.blood_group,
            "phone": p.phone,
            "token": v.visit_token,
            "department": v.department,
            "visit_date": v.visit_date.strftime("%d %b %Y, %I:%M %p"),
            "status": v.status,
            "priority": v.priority,
            "is_red_flag": v.is_red_flag,
            "red_flag_reason": v.red_flag_reason,
            "chief_complaint": intake_info.chief_complaint if intake_info else "Waiting for intake",
            "has_ai_summary": summary is not None,
            "is_summary_verified": summary.is_doctor_verified if summary else False
        })
    return output

@router.patch("/{id}/status")
def update_visit_status(
    id: int,
    status_update: VisitStatusUpdate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    visit = db.query(Visit).filter(Visit.id == id).first()
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")
        
    visit.status = status_update.status
    if status_update.doctor_id:
        visit.doctor_id = status_update.doctor_id
    if status_update.priority:
        visit.priority = status_update.priority
        
    db.commit()
    db.refresh(visit)
    
    log_audit_event(
        db,
        action="VISIT_STATUS_UPDATED",
        user_id=current_user.id if current_user else None,
        patient_id=visit.patient_id,
        details=f"Visit {visit.visit_token} updated to {visit.status}"
    )
    return {"message": "Status updated successfully", "visit_id": visit.id, "status": visit.status}
