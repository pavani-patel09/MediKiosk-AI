from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.patient import Patient
from app.schemas.summary import TimelineEvent

router = APIRouter(prefix="/timeline", tags=["Medical Timeline"])

@router.get("/{patient_id}", response_model=List[TimelineEvent])
def get_patient_timeline(patient_id: int, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    events = []
    
    # 1. Chronic Conditions
    for c in patient.chronic_conditions:
        date_str = c.diagnosed_date or (c.created_at.strftime("%d %b %Y") if c.created_at else "Historical")
        events.append(TimelineEvent(
            id=f"cond-{c.id}",
            date=date_str,
            category="diagnosis",
            title=f"Diagnosis: {c.condition_name}",
            description=f"Status: {c.status}. ICD: {c.icd10_code or 'N/A'}",
            source_type="chronic_condition",
            source_id=c.id,
            is_current_visit=False,
            verified=True
        ))
        
    # 2. Medications
    for m in patient.medications:
        date_str = m.start_date or (m.created_at.strftime("%d %b %Y") if m.created_at else "Ongoing")
        events.append(TimelineEvent(
            id=f"med-{m.id}",
            date=date_str,
            category="medication",
            title=f"Medication: {m.medicine_name}",
            description=f"{m.dosage}, {m.frequency}. Prescribed by: {m.prescribing_doctor or 'Not recorded'}",
            source_type="medication",
            source_id=m.id,
            is_current_visit=False,
            verified=True
        ))
        
    # 3. Documents & Extracted Reports
    for d in patient.documents:
        fields = {f.field_name: (f.corrected_value or f.extracted_value) for f in d.extracted_fields}
        date_str = fields.get("Date") or d.created_at.strftime("%d %b %Y")
        
        detail_lines = []
        if fields.get("Hospital / Facility"):
            detail_lines.append(f"Facility: {fields.get('Hospital / Facility')}")
        if fields.get("Doctor"):
            detail_lines.append(f"Doctor: {fields.get('Doctor')}")
        if fields.get("Diagnosis") and fields.get("Diagnosis") != "Not recorded":
            detail_lines.append(f"Diagnosis: {fields.get('Diagnosis')}")
        if fields.get("Medicines & Dosages") and fields.get("Medicines & Dosages") != "Not recorded":
            detail_lines.append(f"Medicines: {fields.get('Medicines & Dosages')}")
        if fields.get("Lab Test & Result") and fields.get("Lab Test & Result") != "Not recorded":
            detail_lines.append(f"Lab Result: {fields.get('Lab Test & Result')}")
            
        desc = " | ".join(detail_lines) if detail_lines else f"Uploaded {d.original_filename}"
        
        events.append(TimelineEvent(
            id=f"doc-{d.id}",
            date=date_str,
            category="lab" if "lab" in d.doc_type.lower() else "document",
            title=f"{d.doc_type.replace('_', ' ').title()}: {d.original_filename}",
            description=desc,
            source_type="medical_document",
            source_id=d.id,
            is_current_visit=False,
            verified=d.is_verified
        ))
        
    # 4. Visits and Clinical Intakes
    for v in patient.visits:
        date_str = v.visit_date.strftime("%d %b %Y")
        is_today = (v.visit_date.date() == datetime.utcnow().date())
        intake = v.intake
        
        desc = f"Token: {v.visit_token} ({v.department}). Status: {v.status}."
        if intake:
            desc += f" Complaint: {intake.chief_complaint} ({intake.severity}). Duration: {intake.symptom_duration or 'N/A'}."
        if v.is_red_flag:
            desc += f" [SCREENING FLAG: {v.red_flag_reason}]"
            
        events.append(TimelineEvent(
            id=f"visit-{v.id}",
            date=date_str if not is_today else "Today's Visit",
            category="visit",
            title=f"Clinical Consultation ({v.department})",
            description=desc,
            source_type="visit",
            source_id=v.id,
            is_current_visit=is_today,
            verified=(v.status == "completed")
        ))
        
    # Sort events: Today's visits first, then descending chronological order
    def event_sort_key(ev: TimelineEvent):
        if ev.is_current_visit:
            return 99999999
        # Try parse date
        try:
            # Common formats
            for fmt in ("%d %b %Y", "%d/%m/%Y", "%Y-%m-%d"):
                try:
                    dt = datetime.strptime(ev.date, fmt)
                    return int(dt.timestamp())
                except ValueError:
                    continue
        except Exception:
            pass
        return 0

    events.sort(key=event_sort_key, reverse=True)
    return events
