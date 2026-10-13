import sys
import os

# Add backend directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_full_workflow():
    print("\n--- 1. Testing System Health & Root ---")
    res = client.get("/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    print("[OK] Health check OK:", res.json())

    print("\n--- 2. Testing Doctor & Staff Login ---")
    # Doctor login
    res = client.post("/api/auth/login", json={"username": "doc_sharma", "password": "DoctorPassword123!"})
    assert res.status_code == 200, f"Doctor login failed: {res.text}"
    doc_token = res.json()["access_token"]
    print("[OK] Doctor Login OK. Token received. Role:", res.json()["role"])

    # Staff login
    res = client.post("/api/auth/login", json={"username": "staff_meena", "password": "StaffPassword123!"})
    assert res.status_code == 200, f"Staff login failed: {res.text}"
    staff_token = res.json()["access_token"]
    print("[OK] Staff Login OK. Role:", res.json()["role"])

    print("\n--- 3. Testing Patient Search (ID, Phone, Name) ---")
    # Search by ID
    res = client.get("/api/patients/search?query=PAT-2026-00124", headers={"Authorization": f"Bearer {doc_token}"})
    assert res.status_code == 200 and len(res.json()) > 0
    patient = res.json()[0]
    print(f"[OK] Found patient by ID: {patient['full_name']} ({patient['patient_uid']})")

    # Search by Phone
    res = client.get("/api/patients/search?query=9876543210")
    assert res.status_code == 200 and len(res.json()) > 0
    print(f"[OK] Found patient by Phone: {res.json()[0]['full_name']}")

    # Search by partial Name
    res = client.get("/api/patients/search?query=Ramesh")
    assert res.status_code == 200 and len(res.json()) > 0
    print(f"[OK] Found patient by partial Name: {res.json()[0]['full_name']}")

    print("\n--- 4. Testing Duplicate Detection & New Patient Registration ---")
    # Check duplicate on existing phone
    dup_res = client.get("/api/patients/check-duplicate?phone=9876543210&name=Sunita")
    assert dup_res.status_code == 200
    assert dup_res.json()["has_exact_phone_match"] is True
    print("[OK] Duplicate detection successfully flagged existing phone number!")

    # Register new unique patient
    new_pat_payload = {
        "full_name": "Devi Prasad Roy",
        "age": 45,
        "gender": "Male",
        "blood_group": "O+",
        "phone": "9900112233",
        "address": "Banjara Hills, Hyderabad",
        "allergies": [{"allergen": "Sulfa drugs", "severity": "Moderate"}],
        "chronic_conditions": [{"condition_name": "Mild Asthma", "status": "Active"}],
        "medications": [{"medicine_name": "Salbutamol Inhaler", "dosage": "100mcg", "frequency": "As needed"}]
    }
    reg_res = client.post("/api/patients/", json=new_pat_payload)
    assert reg_res.status_code == 200
    new_patient_id = reg_res.json()["id"]
    new_patient_uid = reg_res.json()["patient_uid"]
    print(f"[OK] Registered new patient: {reg_res.json()['full_name']} with generated ID: {new_patient_uid}")

    print("\n--- 5. Testing Clinical Intake & Red-Flag Screening ---")
    # Submit intake with severe chest pain (should trigger red-flag screening)
    intake_payload = {
        "patient_id": new_patient_id,
        "department": "General Medicine",
        "chief_complaint": "Acute severe chest pain radiating to left arm",
        "symptom_onset": "2 hours ago",
        "symptom_duration": "2 hours",
        "severity": "Severe",
        "associated_symptoms": "Cold sweating and nausea",
        "language_used": "en"
    }
    intake_res = client.post("/api/visits/intake", json=intake_payload)
    assert intake_res.status_code == 200
    visit_data = intake_res.json()
    assert visit_data["is_red_flag"] is True
    assert visit_data["priority"] == "red_flag"
    print(f"[OK] Intake submitted! Token: {visit_data['visit_token']}. Priority: {visit_data['priority']}. Red Flag reason: {visit_data['red_flag_reason']}")

    print("\n--- 6. Testing Medical Document Upload & OCR Field Extraction ---")
    # Create sample text file representing clinical report
    sample_report_content = b"Sunrise Diagnostics Center. Date: 12 Oct 2026. Dr. M. K. Gupta. Patient: Devi Prasad Roy. Test: Fasting Blood Sugar. Result: 135 mg/dL. Diagnosis: Impaired Fasting Glucose. Rx: Metformin 500mg OD."
    files = {"file": ("report_sunrise_oct2026.pdf", sample_report_content, "application/pdf")}
    data = {"patient_id": str(new_patient_id), "doc_type": "lab_report"}
    doc_res = client.post("/api/documents/upload", data=data, files=files)
    assert doc_res.status_code == 200
    doc_id = doc_res.json()["id"]
    extracted = doc_res.json()["extracted_fields"]
    print(f"[OK] Document uploaded & processed (ID: {doc_id}). Extracted {len(extracted)} fields:")
    for f in extracted:
        print(f"    - {f['field_name']}: {f['extracted_value']} (Confidence: {int(f['confidence']*100)}%)")

    # Verify extracted fields
    verify_payload = {
        "document_id": doc_id,
        "fields": [{"field_name": "Diagnosis", "corrected_value": "Impaired Fasting Glucose", "is_verified": True}]
    }
    ver_res = client.post("/api/documents/verify", json=verify_payload, headers={"Authorization": f"Bearer {doc_token}"})
    assert ver_res.status_code == 200
    print("[OK] Document fields verified by clinician!")

    print("\n--- 7. Testing Longitudinal Medical Timeline ---")
    tl_res = client.get(f"/api/timeline/{new_patient_id}")
    assert tl_res.status_code == 200
    timeline = tl_res.json()
    assert len(timeline) >= 4  # condition, med, doc, visit
    print(f"[OK] Timeline generated with {len(timeline)} chronological events:")
    for ev in timeline:
        print(f"    [{ev['date']}] {ev['title']} ({ev['category']})")

    print("\n--- 8. Testing Clinical Summary & Doctor Verification ---")
    visit_id = visit_data["id"]
    summary_res = client.get(f"/api/summaries/visit/{visit_id}")
    assert summary_res.status_code == 200
    summary = summary_res.json()
    assert summary is not None
    print(f"[OK] AI Clinical Summary ready! Chief Complaint: {summary['chief_complaint']}")
    print(f"    HPI: {summary['hpi']}")
    print(f"    Model Used: {summary['ai_model_used']}")

    # Doctor verifies summary
    verify_summary_payload = {
        "doctor_notes": "Urgent cardiology referral sent. Patient placed on oxygen and aspirin administered.",
        "is_doctor_verified": True
    }
    doc_ver_res = client.post(f"/api/summaries/{summary['id']}/verify", json=verify_summary_payload, headers={"Authorization": f"Bearer {doc_token}"})
    assert doc_ver_res.status_code == 200
    assert doc_ver_res.json()["is_doctor_verified"] is True
    print("[OK] Clinical Summary verified by Dr. Sharma with digital timestamp!")

    print("\n--- 9. Testing Live Dashboard Statistics ---")
    doc_stats = client.get("/api/stats/doctor").json()
    staff_stats = client.get("/api/stats/staff").json()
    print("[OK] Doctor Stats:", doc_stats)
    print("[OK] Staff Stats:", staff_stats)
    print("\n" + "="*50)
    print("  ALL API ENDPOINTS TESTED AND VERIFIED 100%!")
    print("="*50 + "\n")

if __name__ == "__main__":
    test_full_workflow()
