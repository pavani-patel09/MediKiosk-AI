import os
import sys
from datetime import datetime, date, timedelta

# Add backend directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, Base, engine
from app.models.user import User
from app.models.patient import Patient, Allergy, ChronicCondition, Medication
from app.models.visit import Visit, IntakeRecord
from app.models.document import MedicalDocument, ExtractedField
from app.models.clinical_summary import ClinicalSummary
from app.services.auth_service import get_password_hash
from app.services.ai_summary_service import generate_rule_based_clinical_summary

def seed():
    print("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    # Check if already seeded
    if db.query(User).first():
        print("Database already contains data. Skipping re-seed.")
        db.close()
        return

    print("Seeding Users...")
    doctor = User(
        username="doc_sharma",
        email="dr.sharma@medikiosk.hospital",
        hashed_password=get_password_hash("DoctorPassword123!"),
        full_name="Dr. A. Sharma",
        role="doctor",
        department="General Medicine",
        license_no="MCI-2018-99420"
    )
    staff = User(
        username="staff_meena",
        email="meena.rao@medikiosk.hospital",
        hashed_password=get_password_hash("StaffPassword123!"),
        full_name="Meena Rao",
        role="staff",
        department="Triage & Registration",
        license_no="STF-0091"
    )
    admin = User(
        username="admin",
        email="admin@medikiosk.hospital",
        hashed_password=get_password_hash("AdminPassword123!"),
        full_name="Administrator",
        role="admin",
        department="Hospital Administration"
    )
    patient_user = User(
        username="patient_sunita",
        email="sunita.devi@example.com",
        hashed_password=get_password_hash("PatientPassword123!"),
        full_name="Sunita Devi",
        role="patient",
        department="Patient Portal"
    )
    db.add_all([doctor, staff, admin, patient_user])
    db.commit()

    print("Seeding Patients and Clinical Records...")
    
    # Patient 1: Sunita Devi
    p1 = Patient(
        patient_uid="PAT-2026-00124",
        full_name="Sunita Devi",
        dob=date(1972, 4, 15),
        age=54,
        gender="Female",
        blood_group="B+",
        phone="9876543210",
        email="sunita.devi54@example.com",
        emergency_contact_name="Ramesh Kumar (Husband)",
        emergency_contact_phone="9876543211",
        address="House 42, Green Park Colony, Hyderabad, Telangana",
        consent_agreed=True
    )
    db.add(p1)
    db.flush()

    db.add(ChronicCondition(patient_id=p1.id, condition_name="Essential Hypertension", icd10_code="I10", diagnosed_date="14 Mar 2024", status="Active"))
    db.add(ChronicCondition(patient_id=p1.id, condition_name="Cholecystectomy (Gallbladder removal)", icd10_code="Z98.890", diagnosed_date="21 Nov 2023", status="Resolved"))
    db.add(Medication(patient_id=p1.id, medicine_name="Amlodipine", dosage="5mg", frequency="Once daily (morning)", start_date="14 Mar 2024", prescribing_doctor="Dr. R. Verma", is_active=True))
    db.add(Allergy(patient_id=p1.id, allergen="No known drug allergies", severity="None", verified_by_doctor=True))

    # Add sample medical document for Sunita
    doc1 = MedicalDocument(
        patient_id=p1.id,
        doc_type="prescription",
        original_filename="prescription_city_hospital_mar2025.pdf",
        file_path="uploads/demo_prescription.pdf",
        file_size_bytes=104520,
        ocr_status="verified",
        is_verified=True,
        raw_extracted_text="City Govt. Hospital. OPD Dept. Patient: Sunita Devi. Age: 53/F. Date: 14 Mar 2025. Dr. R. Verma, MD. Diagnosis: Essential Hypertension. Rx: Tab. Amlodipine 5mg OD x 3 months. Adv: Low salt diet, monitor BP weekly."
    )
    db.add(doc1)
    db.flush()
    db.add(ExtractedField(document_id=doc1.id, field_name="Document Type", extracted_value="Prescription", confidence=0.98, is_verified=True))
    db.add(ExtractedField(document_id=doc1.id, field_name="Date", extracted_value="14 Mar 2025", confidence=0.96, is_verified=True))
    db.add(ExtractedField(document_id=doc1.id, field_name="Doctor", extracted_value="Dr. R. Verma", confidence=0.94, is_verified=True))
    db.add(ExtractedField(document_id=doc1.id, field_name="Hospital / Facility", extracted_value="City Govt. Hospital", confidence=0.95, is_verified=True))
    db.add(ExtractedField(document_id=doc1.id, field_name="Diagnosis", extracted_value="Essential Hypertension", confidence=0.93, is_verified=True))
    db.add(ExtractedField(document_id=doc1.id, field_name="Medicines & Dosages", extracted_value="Amlodipine 5mg OD", confidence=0.92, is_verified=True))

    # Visit today for Sunita (Red flag screened)
    v1 = Visit(
        patient_id=p1.id,
        visit_token="A-108",
        department="General Medicine",
        doctor_id=doctor.id,
        visit_date=datetime.utcnow() - timedelta(minutes=45),
        status="awaiting_review",
        priority="red_flag",
        is_red_flag=True,
        red_flag_reason="Red flag detected: Chest discomfort reported with onset yesterday. Priority clinical review."
    )
    db.add(v1)
    db.flush()

    intake1 = IntakeRecord(
        visit_id=v1.id,
        patient_id=p1.id,
        chief_complaint="Chest discomfort and tightness since yesterday",
        symptom_onset="Yesterday evening",
        symptom_duration="18 hours",
        severity="Severe",
        associated_symptoms="Mild breathlessness on climbing stairs, sweating",
        changes_since_last_visit="Blood pressure was 142/90 last week at local pharmacy",
        recently_taken_meds="Amlodipine 5mg taken this morning",
        newly_reported_allergies="None",
        language_used="hi"
    )
    db.add(intake1)
    db.flush()

    # Clinical summary for Sunita
    summary_data_p1 = generate_rule_based_clinical_summary(
        patient_data={"full_name": p1.full_name, "age": p1.age, "gender": p1.gender, "chronic_conditions": [{"condition_name": "Essential Hypertension", "status": "Active"}], "medications": [{"medicine_name": "Amlodipine", "dosage": "5mg", "frequency": "Once daily"}], "allergies": []},
        intake_data={"chief_complaint": intake1.chief_complaint, "symptom_onset": intake1.symptom_onset, "symptom_duration": intake1.symptom_duration, "severity": intake1.severity, "associated_symptoms": intake1.associated_symptoms, "changes_since_last_visit": intake1.changes_since_last_visit, "recently_taken_meds": intake1.recently_taken_meds},
        documents_data=[{"doc_type": "prescription", "extracted_fields": [{"field_name": "Diagnosis", "extracted_value": "Essential Hypertension"}, {"field_name": "Medicines & Dosages", "extracted_value": "Amlodipine 5mg OD"}]}]
    )
    db.add(ClinicalSummary(
        visit_id=v1.id,
        patient_id=p1.id,
        chief_complaint=summary_data_p1["chief_complaint"],
        hpi=summary_data_p1["hpi"],
        past_medical_history=summary_data_p1["past_medical_history"],
        current_medications=summary_data_p1["current_medications"],
        allergies=summary_data_p1["allergies"],
        key_findings_from_docs=summary_data_p1["key_findings_from_docs"],
        missing_clinical_info="Urgent ECG and cardiac enzymes (Troponin I) indicated given chest discomfort and hypertension history.",
        follow_up_recommendations="Immediate medical evaluation by Dr. Sharma. Continuous vitals monitoring.",
        ai_model_used="MediKiosk Clinical Rule Engine v2.0",
        is_doctor_verified=False
    ))

    # Patient 2: Ramesh Nair
    p2 = Patient(
        patient_uid="PAT-2026-00127",
        full_name="Ramesh Nair",
        dob=date(1965, 8, 20),
        age=61,
        gender="Male",
        blood_group="B-",
        phone="9845123456",
        email="ramesh.nair@example.com",
        emergency_contact_name="Deepa Nair (Daughter)",
        emergency_contact_phone="9845123459",
        address="Flat 204, Krishna Enclave, Bengaluru, Karnataka",
        consent_agreed=True
    )
    db.add(p2)
    db.flush()
    db.add(ChronicCondition(patient_id=p2.id, condition_name="Type 2 Diabetes Mellitus", icd10_code="E11.9", diagnosed_date="2018", status="Active"))
    db.add(ChronicCondition(patient_id=p2.id, condition_name="Hypertension", icd10_code="I10", diagnosed_date="2020", status="Active"))
    db.add(Medication(patient_id=p2.id, medicine_name="Metformin", dosage="500mg", frequency="Twice daily after meals", start_date="2018", is_active=True))
    db.add(Medication(patient_id=p2.id, medicine_name="Telmisartan", dosage="40mg", frequency="Once daily", start_date="2020", is_active=True))
    db.add(Allergy(patient_id=p2.id, allergen="Penicillin", reaction="Maculopapular rash and facial swelling", severity="Severe", verified_by_doctor=True))

    v2 = Visit(
        patient_id=p2.id,
        visit_token="A-114",
        department="General Medicine",
        doctor_id=doctor.id,
        visit_date=datetime.utcnow() - timedelta(hours=1, minutes=10),
        status="awaiting_review",
        priority="attention",
        is_red_flag=False,
        red_flag_reason="Needs review: Known diabetic presenting with elevated fasting blood sugar"
    )
    db.add(v2)
    db.flush()
    db.add(IntakeRecord(
        visit_id=v2.id,
        patient_id=p2.id,
        chief_complaint="Follow-up diabetes review and mild tingling in toes",
        symptom_onset="Gradual over 2 months",
        symptom_duration="8 weeks",
        severity="Moderate",
        associated_symptoms="Increased thirst and mild peripheral tingling sensation",
        changes_since_last_visit="HbA1c test completed last month (7.8%)",
        recently_taken_meds="Metformin 500mg BD and Telmisartan 40mg OD",
        language_used="en"
    ))

    # Patient 3: Anitha K.
    p3 = Patient(
        patient_uid="PAT-2026-00125",
        full_name="Anitha K.",
        age=21,
        gender="Female",
        blood_group="O+",
        phone="9123456780",
        address="Warangal, Telangana",
        consent_agreed=True
    )
    db.add(p3)
    db.flush()
    db.add(Allergy(patient_id=p3.id, allergen="None reported", severity="None", verified_by_doctor=True))
    v3 = Visit(
        patient_id=p3.id,
        visit_token="Y-204",
        department="Ayurveda",
        visit_date=datetime.utcnow() - timedelta(hours=2),
        status="in_kiosk",
        priority="monitor"
    )
    db.add(v3)
    db.flush()
    db.add(IntakeRecord(
        visit_id=v3.id,
        patient_id=p3.id,
        chief_complaint="Recurrent bloating, acidity, and irregular digestion",
        symptom_duration="3 weeks",
        severity="Moderate",
        associated_symptoms="Lethargy after heavy meals",
        recently_taken_meds="Over the counter antacid occasionally",
        language_used="te"
    ))

    # Patient 4: Kiran Shetty
    p4 = Patient(
        patient_uid="PAT-2026-00126",
        full_name="Kiran Shetty",
        age=19,
        gender="Male",
        blood_group="A+",
        phone="9988776655",
        address="Kukatpally, Hyderabad",
        consent_agreed=True
    )
    db.add(p4)
    db.flush()
    v4 = Visit(
        patient_id=p4.id,
        visit_token="A-101",
        department="General Medicine",
        visit_date=datetime.utcnow() - timedelta(hours=3),
        status="completed",
        priority="routine"
    )
    db.add(v4)
    db.flush()
    db.add(IntakeRecord(
        visit_id=v4.id,
        patient_id=p4.id,
        chief_complaint="Fever and runny nose for 2 days",
        symptom_onset="2 days ago",
        symptom_duration="48 hours",
        severity="Mild",
        associated_symptoms="Mild body ache, sore throat",
        recently_taken_meds="Paracetamol 650mg once yesterday",
        language_used="en"
    ))

    # Patient 5: Lakshmi Bai
    p5 = Patient(
        patient_uid="PAT-2026-00128",
        full_name="Lakshmi Bai",
        age=68,
        gender="Female",
        blood_group="AB+",
        phone="9765432109",
        address="Secunderabad, Telangana",
        consent_agreed=True
    )
    db.add(p5)
    db.flush()
    db.add(ChronicCondition(patient_id=p5.id, condition_name="Osteoarthritis of bilateral knees", diagnosed_date="2021", status="Active"))
    v5 = Visit(
        patient_id=p5.id,
        visit_token="Y-209",
        department="Ayurveda",
        visit_date=datetime.utcnow() - timedelta(hours=3, minutes=30),
        status="with_doctor",
        priority="monitor"
    )
    db.add(v5)

    # Patient 6: Arjun Verma
    p6 = Patient(
        patient_uid="PAT-2026-00129",
        full_name="Arjun Verma",
        age=8,
        gender="Male",
        blood_group="O-",
        phone="9654321098",
        emergency_contact_name="Sanjay Verma (Father)",
        emergency_contact_phone="9654321098",
        address="Banjara Hills, Hyderabad",
        consent_agreed=True
    )
    db.add(p6)
    db.flush()
    v6 = Visit(
        patient_id=p6.id,
        visit_token="P-302",
        department="Paediatrics",
        visit_date=datetime.utcnow() - timedelta(hours=4),
        status="completed",
        priority="routine"
    )
    db.add(v6)

    db.commit()
    db.close()
    print("Database seeding completed successfully!")

if __name__ == "__main__":
    seed()
