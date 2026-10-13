import random
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app.models.patient import Patient, Allergy, ChronicCondition, Medication
from app.models.visit import Visit
from app.models.user import User
from app.schemas.patient import (
    PatientCreate, PatientOut, PatientSearchResult,
    AllergyCreate, AllergyOut, ChronicConditionCreate, ChronicConditionOut,
    MedicationCreate, MedicationOut
)
from app.services.auth_service import get_current_user
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/patients", tags=["Patients"])

def generate_patient_uid(db: Session) -> str:
    current_year = datetime.now().year
    while True:
        candidate_num = random.randint(10000, 99999)
        uid = f"PAT-{current_year}-{candidate_num}"
        existing = db.query(Patient).filter(Patient.patient_uid == uid).first()
        if not existing:
            return uid

@router.get("/search", response_model=List[PatientSearchResult])
def search_patients(
    query: str = Query(..., min_length=1, description="Patient ID, mobile number, or full/partial name"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    q = query.strip()
    log_audit_event(
        db,
        action="PATIENT_SEARCH",
        user_id=current_user.id if current_user else None,
        details=f"Search query: {q}"
    )
    
    # Query database for exact ID, exact/partial phone, or partial name
    patients = db.query(Patient).filter(
        or_(
            Patient.patient_uid.ilike(f"%{q}%"),
            Patient.phone.like(f"%{q}%"),
            Patient.full_name.ilike(f"%{q}%")
        )
    ).limit(20).all()
    
    results = []
    for p in patients:
        # Get latest visit
        latest_visit = db.query(Visit).filter(Visit.patient_id == p.id).order_by(Visit.visit_date.desc()).first()
        last_visit_str = latest_visit.visit_date.strftime("%d %b %Y") if latest_visit else "First visit"
        
        # Summary of chronic conditions
        cond_names = [c.condition_name for c in p.chronic_conditions]
        cond_str = ", ".join(cond_names) if cond_names else "None recorded"
        
        results.append(PatientSearchResult(
            id=p.id,
            patient_uid=p.patient_uid,
            full_name=p.full_name,
            age=p.age,
            gender=p.gender,
            phone=p.phone,
            blood_group=p.blood_group or "Not recorded",
            last_visit_date=last_visit_str,
            chronic_conditions_summary=cond_str
        ))
        
    return results

@router.get("/check-duplicate")
def check_duplicate_patient(
    phone: str = Query(..., min_length=10),
    name: Optional[str] = None,
    db: Session = Depends(get_db)
):
    clean_phone = phone.strip()
    matches = db.query(Patient).filter(Patient.phone == clean_phone).all()
    
    name_matches = []
    if name:
        name_clean = name.strip()
        name_matches = db.query(Patient).filter(
            Patient.full_name.ilike(f"%{name_clean}%"),
            Patient.phone != clean_phone
        ).limit(5).all()
        
    return {
        "has_exact_phone_match": len(matches) > 0,
        "phone_matches": [
            {
                "id": m.id,
                "patient_uid": m.patient_uid,
                "full_name": m.full_name,
                "age": m.age,
                "gender": m.gender,
                "phone": m.phone
            } for m in matches
        ],
        "potential_name_matches": [
            {
                "id": nm.id,
                "patient_uid": nm.patient_uid,
                "full_name": nm.full_name,
                "age": nm.age,
                "gender": nm.gender,
                "phone": nm.phone
            } for nm in name_matches
        ]
    }

@router.post("/", response_model=PatientOut)
def register_patient(
    patient_in: PatientCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    uid = generate_patient_uid(db)
    
    new_patient = Patient(
        patient_uid=uid,
        full_name=patient_in.full_name,
        dob=patient_in.dob,
        age=patient_in.age,
        gender=patient_in.gender,
        blood_group=patient_in.blood_group or "Not recorded",
        phone=patient_in.phone,
        email=patient_in.email,
        emergency_contact_name=patient_in.emergency_contact_name,
        emergency_contact_phone=patient_in.emergency_contact_phone,
        address=patient_in.address,
        consent_agreed=patient_in.consent_agreed
    )
    db.add(new_patient)
    db.flush()  # gets new_patient.id
    
    # Add initial allergies if provided
    for a in patient_in.allergies or []:
        db.add(Allergy(
            patient_id=new_patient.id,
            allergen=a.allergen,
            reaction=a.reaction,
            severity=a.severity,
            identified_date=a.identified_date
        ))
        
    # Add chronic conditions if provided
    for c in patient_in.chronic_conditions or []:
        db.add(ChronicCondition(
            patient_id=new_patient.id,
            condition_name=c.condition_name,
            icd10_code=c.icd10_code,
            diagnosed_date=c.diagnosed_date,
            status=c.status
        ))
        
    # Add medications if provided
    for m in patient_in.medications or []:
        db.add(Medication(
            patient_id=new_patient.id,
            medicine_name=m.medicine_name,
            dosage=m.dosage,
            frequency=m.frequency,
            start_date=m.start_date,
            end_date=m.end_date,
            prescribing_doctor=m.prescribing_doctor,
            is_active=m.is_active
        ))
        
    db.commit()
    db.refresh(new_patient)
    
    log_audit_event(
        db,
        action="PATIENT_REGISTERED",
        user_id=current_user.id if current_user else None,
        patient_id=new_patient.id,
        details=f"Registered patient {new_patient.full_name} ({new_patient.patient_uid})"
    )
    
    return new_patient

@router.get("/{id}", response_model=PatientOut)
def get_patient_profile(
    id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    patient = db.query(Patient).filter(Patient.id == id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient record not found")
        
    log_audit_event(
        db,
        action="RECORD_RETRIEVED",
        user_id=current_user.id if current_user else None,
        patient_id=patient.id,
        details=f"Retrieved profile for {patient.patient_uid}"
    )
    return patient

@router.post("/{id}/allergies", response_model=AllergyOut)
def add_patient_allergy(id: int, allergy_in: AllergyCreate, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    new_allergy = Allergy(
        patient_id=id,
        allergen=allergy_in.allergen,
        reaction=allergy_in.reaction,
        severity=allergy_in.severity,
        identified_date=allergy_in.identified_date
    )
    db.add(new_allergy)
    db.commit()
    db.refresh(new_allergy)
    return new_allergy

@router.post("/{id}/medications", response_model=MedicationOut)
def add_patient_medication(id: int, med_in: MedicationCreate, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    new_med = Medication(
        patient_id=id,
        medicine_name=med_in.medicine_name,
        dosage=med_in.dosage,
        frequency=med_in.frequency,
        start_date=med_in.start_date,
        end_date=med_in.end_date,
        prescribing_doctor=med_in.prescribing_doctor,
        is_active=med_in.is_active
    )
    db.add(new_med)
    db.commit()
    db.refresh(new_med)
    return new_med
