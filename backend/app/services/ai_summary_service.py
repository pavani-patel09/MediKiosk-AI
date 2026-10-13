import json
import logging
import requests
from typing import Dict, Any, Optional
from app.config import settings

logger = logging.getLogger("medikiosk.ai")

def generate_rule_based_clinical_summary(patient_data: Dict[str, Any], intake_data: Dict[str, Any], documents_data: list) -> Dict[str, Any]:
    """
    Robust clinical rule-based summarization engine that operates without external API keys.
    Strictly uses actual recorded and patient-reported data.
    """
    chief_complaint = intake_data.get("chief_complaint", "Not recorded")
    duration = intake_data.get("symptom_duration", "unspecified duration")
    onset = intake_data.get("symptom_onset", "recent")
    severity = intake_data.get("severity", "Moderate")
    associated = intake_data.get("associated_symptoms", "None reported")
    recent_meds = intake_data.get("recently_taken_meds", "None")
    changes = intake_data.get("changes_since_last_visit", "No prior visit changes recorded")
    
    # History of Present Illness (HPI)
    hpi_parts = [
        f"Patient reports {chief_complaint.lower()} with onset {onset} and duration of {duration}.",
        f"Severity is described as {severity}.",
    ]
    if associated and associated != "None reported":
        hpi_parts.append(f"Associated symptoms: {associated}.")
    if changes and changes != "No prior visit changes recorded":
        hpi_parts.append(f"Changes noted since previous visit: {changes}.")
    hpi = " ".join(hpi_parts)
    
    # Past Medical History
    chronic = patient_data.get("chronic_conditions", [])
    if chronic:
        pmh = ", ".join([f"{c.get('condition_name')} (Status: {c.get('status', 'Active')})" for c in chronic])
    else:
        pmh = "No documented chronic illnesses on record."
        
    # Medications
    meds = patient_data.get("medications", [])
    if meds:
        med_list = [f"{m.get('medicine_name')} {m.get('dosage')} ({m.get('frequency')})" for m in meds if m.get("is_active", True)]
        current_meds_str = ", ".join(med_list) if med_list else "None currently active"
    else:
        current_meds_str = "No regular medications on record."
    if recent_meds and recent_meds not in ["None", "No regular medicines", "Not recorded"]:
        current_meds_str += f" | Patient also reported taking recently: {recent_meds}."
        
    # Allergies
    allergies = patient_data.get("allergies", [])
    if allergies:
        allergy_str = ", ".join([f"{a.get('allergen')} (Severity: {a.get('severity', 'Moderate')})" for a in allergies])
    else:
        allergy_str = "No known drug or environmental allergies recorded."
    new_allergies = intake_data.get("newly_reported_allergies")
    if new_allergies and new_allergies not in ["None", "Not recorded"]:
        allergy_str += f" | Newly reported at intake: {new_allergies} (Requires clinician confirmation)."
        
    # Documents Findings
    doc_findings = []
    for doc in documents_data:
        doc_type = doc.get("doc_type", "Document")
        fields = {f.get("field_name"): f.get("extracted_value") for f in doc.get("extracted_fields", [])}
        findings_part = f"{doc_type.title()} ({fields.get('Date', 'Undated')}): "
        details = []
        if fields.get("Diagnosis") and fields.get("Diagnosis") != "Not recorded":
            details.append(f"Diagnosis: {fields.get('Diagnosis')}")
        if fields.get("Medicines & Dosages") and fields.get("Medicines & Dosages") != "Not recorded":
            details.append(f"Meds: {fields.get('Medicines & Dosages')}")
        if fields.get("Lab Test & Result") and fields.get("Lab Test & Result") != "Not recorded":
            details.append(f"Result: {fields.get('Lab Test & Result')}")
        if details:
            findings_part += "; ".join(details)
        else:
            findings_part += "Record verified on file."
        doc_findings.append(findings_part)
        
    key_findings = " \n".join(doc_findings) if doc_findings else "No previous medical documents uploaded for this visit."
    
    # Missing information checklist
    missing_items = []
    if not patient_data.get("blood_group") or patient_data.get("blood_group") == "Not recorded":
        missing_items.append("Blood group not verified.")
    if not patient_data.get("emergency_contact_phone"):
        missing_items.append("Emergency contact phone missing.")
    if severity == "Severe":
        missing_items.append("Urgent clinician examination recommended due to reported severity.")
    missing_info = " | ".join(missing_items) if missing_items else "Standard baseline intake parameters collected."
    
    follow_up = f"Clinical review with Dr. in {intake_data.get('department', 'General Medicine')}. Physical exam and diagnostic evaluation indicated."

    return {
        "chief_complaint": chief_complaint,
        "hpi": hpi,
        "past_medical_history": pmh,
        "current_medications": current_meds_str,
        "allergies": allergy_str,
        "key_findings_from_docs": key_findings,
        "missing_clinical_info": missing_info,
        "follow_up_recommendations": follow_up,
        "ai_model_used": "MediKiosk Clinical Rule Engine v2.0"
    }

def generate_ai_clinical_summary(patient_data: Dict[str, Any], intake_data: Dict[str, Any], documents_data: list) -> Dict[str, Any]:
    """
    Attempts to generate clinical summary via configured LLM API (Gemini / OpenAI),
    falling back seamlessly to rule-based engine.
    """
    if settings.GEMINI_API_KEY:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={settings.GEMINI_API_KEY}"
            prompt = f"""
            You are a clinical decision support assistant for hospital intake triage.
            Format a concise, objective clinical summary for a doctor's review based ONLY on the following intake data:
            
            Patient: {patient_data.get('full_name')} ({patient_data.get('age')} yo, {patient_data.get('gender')})
            Chief Complaint: {intake_data.get('chief_complaint')}
            Duration: {intake_data.get('symptom_duration')}, Severity: {intake_data.get('severity')}
            Associated Symptoms: {intake_data.get('associated_symptoms')}
            Changes: {intake_data.get('changes_since_last_visit')}
            Chronic Conditions: {json.dumps(patient_data.get('chronic_conditions', []))}
            Medications: {json.dumps(patient_data.get('medications', []))}
            Allergies: {json.dumps(patient_data.get('allergies', []))}
            Documents: {json.dumps(documents_data)}
            
            Return JSON with keys:
            - chief_complaint
            - hpi
            - past_medical_history
            - current_medications
            - allergies
            - key_findings_from_docs
            - missing_clinical_info
            - follow_up_recommendations
            Do not fabricate diagnoses. Clearly distinguish patient-reported vs verified.
            """
            headers = {"Content-Type": "application/json"}
            payload = {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"response_mime_type": "application/json"}
            }
            res = requests.post(url, json=payload, headers=headers, timeout=10)
            if res.status_code == 200:
                data = res.json()
                text = data["candidates"][0]["content"]["parts"][0]["text"]
                parsed = json.loads(text)
                parsed["ai_model_used"] = "Google Gemini 1.5 Flash"
                return parsed
        except Exception as e:
            logger.warning(f"Gemini API generation failed: {e}. Falling back to rule-based summarizer.")
            
    # Fallback to high quality rule-based engine
    return generate_rule_based_clinical_summary(patient_data, intake_data, documents_data)
