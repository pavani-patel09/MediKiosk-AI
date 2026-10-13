# MediKiosk AI — Intelligent Patient History & Clinical Intake Management System

**MediKiosk AI** is a production-grade, full-stack medical web application that automatically retrieves returning patients' clinical records and medical history, performs smart new-patient registration with duplicate detection, processes medical documents with real OCR, enables multilingual guided intake with voice, compiles longitudinal medical timelines, and generates AI-assisted clinical summaries with doctor review and approval.

---

## 🌟 Key Features

1. **Patient Identification & Automatic Data Retrieval**:
   - Prominent search on landing page and doctor queue by **Patient ID** (e.g., `PAT-2026-00124`), **10-Digit Mobile Number** (e.g., `9876543210`), or **Patient Name** (e.g., `Sunita Devi`).
   - Automatically loads existing demographics, known chronic illnesses, active medications, allergies, previous visits, and uploaded documents.
2. **Smart New-Patient Registration**:
   - Auto-generates unique medical ID (`PAT-2026-XXXXX`).
   - Live phone duplicate detection: warns staff if an existing patient already shares the mobile number or full name.
   - Captures emergency contacts and baseline clinical conditions.
3. **Intelligent Clinical Intake**:
   - For returning patients, displays existing medical profile first and asks only for current visit information.
   - Collects chief complaint, symptom onset/duration, severity, associated symptoms, changes since last visit, and recently taken medicines.
   - **Voice Input**: Integrated speech recognition (`webkitSpeechRecognition`) supporting **English**, **Hindi (हिन्दी)**, and **Telugu (తెలుగు)**.
   - **Read Aloud**: Accessible text-to-speech audio explanation (`speechSynthesis`).
   - **Red-Flag Screening**: Automatically screens symptoms for acute danger signs (e.g., severe chest pain, shortness of breath, blackout) and flags triage priority.
4. **Medical Document Upload & OCR Processing**:
   - Accepts PDF, PNG, JPG, JPEG medical files up to 25MB.
   - Extracts candidate medical entities: Document Type, Date, Doctor, Facility/Hospital, Diagnosis, Medicines & Dosages, Lab Results.
   - **Interactive Field Verification Modal**: Allows staff/clinicians to review extracted fields with confidence indicators, correct any values, and confirm before saving.
5. **Longitudinal Medical Timeline**:
   - Chronologically aggregates previous consultations, recorded diagnoses, medications, lab tests, and uploaded documents from the database.
6. **AI-Assisted Clinical Summary**:
   - Generates structured summaries: Chief Complaint, HPI, Past Medical History, Active Medications, Allergies, Document Highlights, Missing Information, and Recommended Follow-up.
   - **Configurable LLM API** (Google Gemini 1.5 Flash / OpenAI) + **100% Offline Clinical Rule Engine Fallback** if no API keys are provided.
   - Prominent AI disclaimer and digital clinician verification signature with timestamp.
7. **Doctor & Staff Dashboards**:
   - Real database-driven statistics (no mock numbers).
   - Doctor Queue with filtering by Department (`General Medicine`, `Surgery`, `Paediatrics`, `Ayurveda`) and Priority (`High Priority`, `Attention`, `Monitoring`, `Routine`).
   - Multi-tab Patient Detail Case View: `Overview`, `History`, `Medications`, `Allergies`, `Documents`, `Timeline`, `AI Summary`.
   - Triage Queue with token progression (`in_kiosk` -> `awaiting_review` -> `with_doctor` -> `completed`).

---

## 🏗️ Technology Stack

- **Frontend**: React 18, Vite, Lucide Icons, Vanilla CSS Design System with MediChrono warm-teal/orange palette.
- **Backend**: Python 3.12, FastAPI, Pydantic v2, PyPDF, Passlib/Bcrypt, Python-JOSE (JWT).
- **Database**: MySQL 8.0 with SQLAlchemy ORM + **Automatic SQLite Fallback** (`sqlite:///./medikiosk.db`) if MySQL credentials are not yet configured.
- **Speech**: Web Speech API (`SpeechRecognition` & `SpeechSynthesis`).

---

## 📁 Project Structure

```
project tt(24EG107J11)/
├── backend/
│   ├── app/
│   │   ├── main.py                    # FastAPI application, CORS, static uploads
│   │   ├── config.py                  # Pydantic Settings & environment variables
│   │   ├── database.py                # SQLAlchemy engine with MySQL & SQLite auto-fallback
│   │   ├── models/                    # SQLAlchemy ORM models
│   │   │   ├── user.py                # Users & RBAC roles
│   │   │   ├── patient.py             # Patient, Allergy, ChronicCondition, Medication
│   │   │   ├── visit.py               # Visit tokens & IntakeRecord
│   │   │   ├── document.py            # MedicalDocument & ExtractedField
│   │   │   ├── clinical_summary.py    # ClinicalSummary with doctor verification
│   │   │   └── audit.py               # Healthcare regulatory AuditLog
│   │   ├── schemas/                   # Pydantic v2 request/response schemas
│   │   ├── api/                       # API router endpoints
│   │   │   ├── auth.py                # Login, registration, token verification
│   │   │   ├── patients.py            # Search, duplicate check, profile retrieval
│   │   │   ├── visits.py              # Token creation, intake submission, queue
│   │   │   ├── documents.py           # Real file upload, OCR extraction, field verification
│   │   │   ├── timeline.py            # Chronological longitudinal timeline
│   │   │   ├── summaries.py           # AI summary generation & clinician verification
│   │   │   └── stats.py               # Real-time dashboard statistics
│   │   └── services/                  # Business logic
│   │       ├── auth_service.py        # Bcrypt password hashing & JWT tokens
│   │       ├── ocr_service.py         # PyPDF & regex medical entity extractor
│   │       ├── ai_summary_service.py  # Gemini LLM connector & rule-based engine
│   │       └── audit_service.py       # Audit event logging
│   ├── uploads/                       # Secure uploaded file storage directory
│   ├── seed_data.py                   # Synthetic realistic Indian patient database seeder
│   ├── test_api.py                    # Automated end-to-end API test script
│   ├── run_backend.py                 # Backend launch script
│   ├── requirements.txt               # Python package dependencies
│   └── .env.example                   # Environment configuration template
│
├── frontend/
│   ├── index.html                     # HTML root with fonts & metadata
│   ├── package.json                   # React 18, Vite, Lucide dependencies
│   ├── vite.config.js                 # Vite config with backend proxy
│   └── src/
│       ├── main.jsx                   # React root entrypoint
│       ├── App.jsx                    # View navigation & state management
│       ├── index.css                  # Modern medical design system CSS
│       ├── context/
│       │   ├── AuthContext.jsx        # JWT auth state & user session
│       │   └── LanguageContext.jsx    # Translations for English, Hindi, Telugu
│       ├── services/
│       │   └── api.js                 # Centralized API client
│       ├── components/
│       │   ├── Navbar.jsx             # Top bar, role badge, language selector, TTS
│       │   ├── PatientSearchModal.jsx # Instant patient search dialog
│       │   ├── SpeechMicButton.jsx    # Multilingual voice input button
│       │   ├── ReadAloudButton.jsx    # Web Speech API text-to-speech button
│       │   └── OCRVerificationModal.jsx # Interactive field editing & confirmation
│       └── pages/
│           ├── LandingPage.jsx        # Hero, search bar, role entrance, live metrics
│           ├── PatientRegistration.jsx # Duplicate check, validation, unique UID
│           ├── KioskIntakePage.jsx    # Step-by-step kiosk, returning patient check
│           ├── DoctorDashboard.jsx    # Live queue, priority badges, stats
│           ├── DoctorCaseView.jsx     # Patient detail tabs & AI summary verification
│           ├── StaffDashboard.jsx     # Triage queue, token status, red-flag screening
│           └── LoginPage.jsx          # Secure login with 1-click test credentials
└── README.md
```

---

## 🚀 Installation & Execution Guide (Windows / VS Code)

### 1. Prerequisites
- **Python 3.12+**
- **Node.js v18+ & npm**
- **MySQL 8.0** (optional; SQLite fallback runs automatically if MySQL credentials are not provided)

---

### 2. Backend Setup & Run

Open a terminal in the project directory:

```powershell
# 1. Install backend dependencies
python -m pip install -r backend/requirements.txt

# 2. Seed database with synthetic patient records
python backend/seed_data.py

# 3. Run automated API verification tests
python backend/test_api.py

# 4. Start the backend server
python backend/run_backend.py
```

The backend will start at:
- **API Base URL**: `http://127.0.0.1:8000/api`
- **Swagger Documentation**: `http://127.0.0.1:8000/docs`

---

### 3. Frontend Setup & Run

Open a second terminal:

```powershell
# Navigate to frontend folder
cd frontend

# Install npm dependencies
npm install

# Start Vite development server
npm run dev
```

The frontend will open at:
- **Web Application URL**: `http://127.0.0.1:5173/`

---

## 🗄️ MySQL Configuration (Optional)

To connect directly to your local MySQL 8.0 server:
1. Open MySQL Workbench or command line and create a database:
   ```sql
   CREATE DATABASE medikiosk_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
2. Copy `backend/.env.example` to `backend/.env`:
   ```ini
   MYSQL_USER=root
   MYSQL_PASSWORD=your_mysql_password
   MYSQL_HOST=localhost
   MYSQL_PORT=3306
   MYSQL_DB=medikiosk_db
   ```
3. Restart `backend/run_backend.py`. The system will automatically detect MySQL and initialize the schema.

---

## 🔑 Test Credentials & Demo Personas

| Role | Username | Password | Full Name | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Doctor** | `doc_sharma` | `DoctorPassword123!` | Dr. A. Sharma | General Medicine • Lic: MCI-2018-99420 |
| **Triage Staff** | `staff_meena` | `StaffPassword123!` | Meena Rao | Triage Staff • Lic: STF-0091 |
| **Administrator** | `admin` | `AdminPassword123!` | Administrator | System Admin |
| **Patient** | `patient_sunita` | `PatientPassword123!` | Sunita Devi | Patient Portal |

---

## 👥 Seed Patient Records (Synthetic Fictional Patients)

| Patient UID | Name | Phone | Age/Gender | Known Conditions / Allergies | Today's Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **PAT-2026-00124** | Sunita Devi | `9876543210` | 54 / Female | Essential Hypertension on Amlodipine 5mg; prior Cholecystectomy Nov 2023 | 🚩 High Priority (Chest pain, Token `A-108`) |
| **PAT-2026-00127** | Ramesh Nair | `9845123456` | 61 / Male | Type 2 Diabetes on Metformin; Hypertension on Telmisartan; **Penicillin Allergy (Severe)** | 🟠 Attention (Diabetic review, Token `A-114`) |
| **PAT-2026-00125** | Anitha K. | `9123456780` | 21 / Female | Recurrent dyspepsia / bloating (AYUSH) | 🟡 Monitoring (Ayurveda, Token `Y-204`) |
| **PAT-2026-00126** | Kiran Shetty | `9988776655` | 19 / Male | Acute viral cold symptoms, Paracetamol | 🟢 Routine (Completed, Token `A-101`) |
| **PAT-2026-00128** | Lakshmi Bai | `9765432109` | 68 / Female | Bilateral Knee Osteoarthritis (AYUSH) | 🟡 Monitoring (With Doctor, Token `Y-209`) |
| **PAT-2026-00129** | Arjun Verma | `9654321098` | 8 / Male | Mild low-grade fever, fully immunised | 🟢 Routine (Paediatrics, Token `P-302`) |

---

## 🧪 Verification & Testing Checklist

- [x] **Patient Search & Automatic Retrieval**: Search `9876543210` or `Sunita` or `PAT-2026-00124` -> Profile loads with existing records.
- [x] **Duplicate Detection**: Registering a phone number that already exists displays an alert prompting staff to link the existing record.
- [x] **Unique Medical ID**: New registration automatically creates a `PAT-2026-XXXXX` format UID.
- [x] **Red-Flag Screening**: Reporting symptoms such as chest pain or severe shortness of breath flags the visit priority to `red_flag`.
- [x] **Medical Document OCR**: Real file upload (PDF/PNG/JPG) extracts Candidate Date, Hospital, Doctor, Diagnosis, and Medicines with interactive editable review screen.
- [x] **Longitudinal Medical Timeline**: Aggregates visits, diagnoses, prescriptions, and lab investigations chronologically.
- [x] **AI Clinical Summary**: Generates structured summary distinguishing patient-reported vs verified facts, with AI disclaimer and clinician verification signature.
- [x] **Doctor Queue & Statistics**: Real database-driven stats and multi-tab case review.
- [x] **Triage Queue**: Token management and stage progression.
- [x] **Multilingual Support**: English, Hindi, and Telugu labels, questions, and Web Speech API.
