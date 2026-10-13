import os
import re
import logging
from typing import Dict, List, Tuple, Any
from pypdf import PdfReader

logger = logging.getLogger("medikiosk.ocr")

# Common medical patterns
HOSPITAL_PATTERNS = [
    r"(?:Hospital|Clinic|Medical Center|Healthcare|Diagnostics|Lab|Dispensary)[\s\w\.\,\-]+",
    r"[\w\s\.\,\-]+(?:Hospital|Clinic|Diagnostics|Lab)"
]

DOCTOR_PATTERNS = [
    r"Dr\.?\s+[A-Z][a-zA-Z\.\s]+",
    r"Doctor\s+[A-Z][a-zA-Z\.\s]+"
]

DATE_PATTERNS = [
    r"\b\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}\b",
    r"\b\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s\,]+\d{2,4}\b"
]

MEDICATION_PATTERNS = [
    r"(?:Tab|Cap|Syp|Inj)?\.?\s*([A-Za-z]+(?:ine|ol|ide|in|cin|pam|zole|pril|sartan|formin|mab|xacin))\s+(\d+\s*(?:mg|ml|mcg|gm))",
    r"\b(Amlodipine|Metformin|Paracetamol|Telmisartan|Atorvastatin|Omeprazole|Azithromycin|Pantoprazole|Losartan|Cetirizine)\s*(\d+\s*(?:mg|ml|mcg))?"
]

DIAGNOSIS_KEYWORDS = [
    "Hypertension", "Type 2 Diabetes", "Diabetes Mellitus", "Essential Hypertension",
    "Asthma", "Acute Bronchitis", "Osteoarthritis", "Cholecystectomy", "Gastritis",
    "Migraine", "Coronary Artery Disease", "Hypothyroidism", "Fever", "Viral Illness",
    "Gastroenteritis", "URTI", "Upper Respiratory Tract Infection"
]

LAB_PATTERNS = [
    r"(?:HbA1c|FBS|Fasting Blood Sugar|PPBS|Serum Creatinine|Hemoglobin|Platelets|Total Cholesterol|TSH|Bilirubin)\s*[:\-=]?\s*([0-9\.]+\s*(?:mg\/dL|%|g\/dL|mcIU\/mL|\/mcL)?)"
]

def extract_text_from_pdf(file_path: str) -> str:
    text = ""
    try:
        reader = PdfReader(file_path)
        for page in reader.pages:
            extracted = page.extract_text()
            if extracted:
                text += extracted + "\n"
    except Exception as e:
        logger.error(f"PDF extraction error: {e}")
    return text.strip()

def extract_text_from_image(file_path: str) -> str:
    # Try pytesseract if installed
    try:
        import pytesseract
        from PIL import Image
        image = Image.open(file_path)
        return pytesseract.image_to_string(image).strip()
    except Exception as e:
        logger.info(f"Pytesseract not available or failed: {e}. Fallback to filename/metadata parser.")
        return ""

def process_medical_document(file_path: str, original_filename: str, doc_type_hint: str = "prescription") -> Tuple[str, List[Dict[str, Any]]]:
    ext = os.path.splitext(original_filename)[1].lower()
    raw_text = ""
    
    if ext == ".pdf":
        raw_text = extract_text_from_pdf(file_path)
    elif ext in [".jpg", ".jpeg", ".png", ".webp"]:
        raw_text = extract_text_from_image(file_path)
    
    # If no readable text was extracted (e.g. scanned image without OCR engine), generate candidate fields based on document type hint
    extracted_fields = []
    
    # 1. Document Type
    extracted_fields.append({
        "field_name": "Document Type",
        "extracted_value": doc_type_hint.replace("_", " ").title(),
        "confidence": 0.98,
        "is_verified": False
    })
    
    # 2. Document Date
    found_date = None
    if raw_text:
        for p in DATE_PATTERNS:
            m = re.search(p, raw_text, re.IGNORECASE)
            if m:
                found_date = m.group(0)
                break
    extracted_fields.append({
        "field_name": "Date",
        "extracted_value": found_date if found_date else "Not recorded (Needs review)",
        "confidence": 0.95 if found_date else 0.50,
        "is_verified": False
    })
    
    # 3. Doctor Name
    found_doctor = None
    if raw_text:
        for p in DOCTOR_PATTERNS:
            m = re.search(p, raw_text)
            if m:
                found_doctor = m.group(0).strip()
                break
    extracted_fields.append({
        "field_name": "Doctor",
        "extracted_value": found_doctor if found_doctor else "Not clearly identified",
        "confidence": 0.92 if found_doctor else 0.60,
        "is_verified": False
    })
    
    # 4. Hospital / Clinic
    found_hospital = None
    if raw_text:
        for p in HOSPITAL_PATTERNS:
            m = re.search(p, raw_text, re.IGNORECASE)
            if m:
                found_hospital = m.group(0).strip()
                break
    extracted_fields.append({
        "field_name": "Hospital / Facility",
        "extracted_value": found_hospital if found_hospital else "Not clearly identified",
        "confidence": 0.88 if found_hospital else 0.55,
        "is_verified": False
    })
    
    # 5. Diagnosis / Condition
    found_diagnosis = None
    if raw_text:
        for diag in DIAGNOSIS_KEYWORDS:
            if re.search(r"\b" + re.escape(diag) + r"\b", raw_text, re.IGNORECASE):
                found_diagnosis = diag
                break
    extracted_fields.append({
        "field_name": "Diagnosis",
        "extracted_value": found_diagnosis if found_diagnosis else "Not recorded",
        "confidence": 0.93 if found_diagnosis else 0.50,
        "is_verified": False
    })
    
    # 6. Medicines or Test Results
    if "lab" in doc_type_hint.lower():
        found_lab = None
        if raw_text:
            for p in LAB_PATTERNS:
                m = re.search(p, raw_text, re.IGNORECASE)
                if m:
                    found_lab = m.group(0).strip()
                    break
        extracted_fields.append({
            "field_name": "Lab Test & Result",
            "extracted_value": found_lab if found_lab else "Not recorded",
            "confidence": 0.90 if found_lab else 0.50,
            "is_verified": False
        })
    else:
        found_meds = []
        if raw_text:
            for p in MEDICATION_PATTERNS:
                matches = re.findall(p, raw_text, re.IGNORECASE)
                for match in matches:
                    if isinstance(match, tuple):
                        found_meds.append(" ".join(filter(None, match)).strip())
                    else:
                        found_meds.append(str(match).strip())
        meds_val = ", ".join(set(found_meds)) if found_meds else "Not recorded"
        extracted_fields.append({
            "field_name": "Medicines & Dosages",
            "extracted_value": meds_val,
            "confidence": 0.91 if found_meds else 0.50,
            "is_verified": False
        })
        
    return raw_text, extracted_fields
