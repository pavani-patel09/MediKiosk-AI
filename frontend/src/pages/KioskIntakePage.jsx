import React, { useState, useEffect } from 'react';
import { 
  HeartPulse, Shield, Stethoscope, FileText, CheckCircle2, 
  AlertTriangle, ArrowRight, ArrowLeft, Mic, Upload, Check, User
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import SpeechMicButton from '../components/SpeechMicButton';
import ReadAloudButton from '../components/ReadAloudButton';
import OCRVerificationModal from '../components/OCRVerificationModal';

const STEPS = ['Identify', 'Consent', 'Department', 'Symptoms', 'Documents', 'Review', 'Finish'];

export default function KioskIntakePage({ initialPatient, onFinish, onOpenSearch, onRegisterNew }) {
  const { lang, t } = useLanguage();
  const [currentStep, setCurrentStep] = useState(initialPatient ? 1 : 0);
  const [patient, setPatient] = useState(initialPatient || null);

  // Intake State
  const [department, setDepartment] = useState('General Medicine');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [symptomOnset, setSymptomOnset] = useState('');
  const [symptomDuration, setSymptomDuration] = useState('1 to 2 days');
  const [severity, setSeverity] = useState('Moderate');
  const [associatedSymptoms, setAssociatedSymptoms] = useState('');
  const [changesSinceLastVisit, setChangesSinceLastVisit] = useState('');
  const [recentlyTakenMeds, setRecentlyTakenMeds] = useState('');
  const [newAllergies, setNewAllergies] = useState('');
  const [consentAgreed, setConsentAgreed] = useState(true);

  // Red Flag Flagging
  const [redFlagDetected, setRedFlagDetected] = useState(false);

  // Documents
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedDocForOcr, setSelectedDocForOcr] = useState(null);

  // Submission result
  const [visitToken, setVisitToken] = useState('A-108');
  const [submitting, setSubmitting] = useState(false);

  // Quick complaint buttons
  const QUICK_COMPLAINTS = [
    { label: 'Chest pain or pressure', flag: true },
    { label: 'Fever and cold / cough', flag: false },
    { label: 'Stomach pain or acidity', flag: false },
    { label: 'Severe headache', flag: true },
    { label: 'Joint pain or swelling', flag: false },
    { label: 'Routine diabetic follow-up', flag: false }
  ];

  const handleComplaintSelect = (item) => {
    setChiefComplaint(item.label);
    if (item.flag) {
      setRedFlagDetected(true);
    }
  };

  const handleSpeechTranscript = (text) => {
    if (!chiefComplaint) {
      setChiefComplaint(text);
      if (/chest|breath|faint|unconscious|stroke/i.test(text)) {
        setRedFlagDetected(true);
      }
    } else {
      setAssociatedSymptoms(prev => prev ? `${prev}, ${text}` : text);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !patient) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('patient_id', patient.id);
      formData.append('doc_type', 'prescription');
      formData.append('file', file);

      const docRecord = await api.uploadDocument(formData);
      setUploadedDocs(prev => [...prev, docRecord]);
      // Open verification modal for extracted fields
      setSelectedDocForOcr(docRecord);
    } catch (err) {
      alert(`File upload failed: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmitIntake = async () => {
    if (!patient) return;
    setSubmitting(true);
    try {
      const payload = {
        patient_id: patient.id,
        department,
        chief_complaint: chiefComplaint || 'Routine medical checkup',
        symptom_onset: symptomOnset,
        symptom_duration: symptomDuration,
        severity,
        associated_symptoms: associatedSymptoms,
        changes_since_last_visit: changesSinceLastVisit,
        recently_taken_meds: recentlyTakenMeds,
        newly_reported_allergies: newAllergies,
        language_used: lang
      };

      const result = await api.submitIntake(payload);
      setVisitToken(result.visit_token);
      setCurrentStep(6); // Finish step
    } catch (err) {
      alert(`Failed to submit intake: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '30px 0 80px', minHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
      <div className="wrap" style={{ maxWidth: '820px' }}>
        
        {/* Progress Tracker */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '36px', position: 'relative' }}>
          {STEPS.map((stepName, idx) => (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, flex: 1 }}>
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: idx < currentStep ? 'var(--teal-700)' : idx === currentStep ? '#FFFFFF' : '#FFFFFF',
                border: idx === currentStep ? '2px solid var(--teal-700)' : '2px solid var(--border-subtle)',
                color: idx < currentStep ? '#FFFFFF' : idx === currentStep ? 'var(--teal-700)' : 'var(--ink-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '14px',
                boxShadow: idx === currentStep ? '0 0 0 3px rgba(13, 110, 110, 0.15)' : 'none'
              }}>
                {idx < currentStep ? '✓' : idx + 1}
              </div>
              <span style={{ fontSize: '12px', marginTop: '6px', fontWeight: 600, color: idx === currentStep ? 'var(--teal-900)' : 'var(--ink-soft)' }}>
                {stepName}
              </span>
            </div>
          ))}
        </div>

        {/* ================= STEP 0: IDENTIFY ================= */}
        {currentStep === 0 && (
          <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
            <ReadAloudButton text="Please identify yourself. If you have visited before, search using your mobile number or Patient ID to load your history automatically." />
            <h1 style={{ fontSize: '32px', margin: '16px 0 8px' }}>Identify Yourself</h1>
            <p style={{ fontSize: '16px', color: 'var(--ink-soft)', marginBottom: '32px' }}>
              Welcome to the MediKiosk intelligent intake. If you have visited before, we will retrieve your records instantly.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px' }}>
              <div
                className="card"
                style={{ padding: '28px', border: '2px solid var(--teal-600)', background: 'var(--teal-50)', cursor: 'pointer' }}
                onClick={onOpenSearch}
              >
                <div style={{ fontSize: '36px', marginBottom: '10px' }}>🪪</div>
                <h3 style={{ fontSize: '20px', marginBottom: '6px' }}>Existing Patient</h3>
                <p style={{ fontSize: '14px', color: 'var(--ink-soft)' }}>
                  Search by Mobile Number, Patient ID, or Name to load existing history.
                </p>
                <button className="btn btn-primary btn-sm" style={{ marginTop: '16px' }}>
                  Search Records →
                </button>
              </div>

              <div
                className="card"
                style={{ padding: '28px', border: '2px solid var(--coral-500)', background: 'var(--coral-100)', cursor: 'pointer' }}
                onClick={onRegisterNew}
              >
                <div style={{ fontSize: '36px', marginBottom: '10px' }}>🆕</div>
                <h3 style={{ fontSize: '20px', marginBottom: '6px' }}>New Patient</h3>
                <p style={{ fontSize: '14px', color: 'var(--ink-soft)' }}>
                  First time visiting? Register your details to generate a unique Patient ID.
                </p>
                <button className="btn btn-coral btn-sm" style={{ marginTop: '16px' }}>
                  New Registration →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 1: CONSENT ================= */}
        {currentStep === 1 && patient && (
          <div className="card" style={{ padding: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span className="badge badge-teal">Verified Identity: {patient.full_name} ({patient.patient_uid})</span>
              <ReadAloudButton text="Before we begin: We will collect information about your health and previous medical records so your doctor can understand your history more quickly. Your data is protected." />
            </div>

            <h1 style={{ fontSize: '30px', marginBottom: '10px' }}>Before We Begin</h1>
            <p style={{ fontSize: '16px', color: 'var(--ink-soft)', marginBottom: '24px' }}>
              We will retrieve your existing medical history and only ask questions relevant to today's consultation.
            </p>

            {/* Returning patient banner */}
            <div style={{ background: 'var(--teal-50)', border: '1px solid var(--teal-100)', borderRadius: 'var(--radius-md)', padding: '18px 22px', marginBottom: '24px' }}>
              <h4 style={{ fontSize: '16px', color: 'var(--teal-700)', marginBottom: '8px' }}>
                ✓ Patient Profile Loaded from Hospital Records:
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '14.5px' }}>
                <div><b>Age/Gender:</b> {patient.age ? `${patient.age} yrs` : 'Not recorded'} • {patient.gender}</div>
                <div><b>Phone:</b> {patient.phone}</div>
                <div><b>Blood Group:</b> {patient.blood_group || 'Not recorded'}</div>
                <div><b>Existing Allergies:</b> {patient.allergies?.map(a => a.allergen).join(', ') || 'No known allergies'}</div>
              </div>
            </div>

            <div style={{
              background: 'var(--bg-main)',
              border: '1.5px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '18px 22px',
              display: 'flex',
              gap: '14px',
              alignItems: 'flex-start',
              marginBottom: '28px'
            }}>
              <input
                type="checkbox"
                id="consentCheck"
                checked={consentAgreed}
                onChange={(e) => setConsentAgreed(e.target.checked)}
                style={{ width: '22px', height: '22px', marginTop: '2px', accentColor: 'var(--teal-700)' }}
              />
              <label htmlFor="consentCheck" style={{ fontSize: '15.5px', fontWeight: 600, color: 'var(--ink)', cursor: 'pointer' }}>
                {t('consentText')}
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button className="btn btn-ghost" onClick={() => setCurrentStep(0)}>
                <ArrowLeft size={16} /> Back
              </button>
              <button
                className="btn btn-primary btn-lg"
                disabled={!consentAgreed}
                onClick={() => setCurrentStep(2)}
              >
                Continue to Department <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 2: DEPARTMENT ================= */}
        {currentStep === 2 && (
          <div className="card" style={{ padding: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span className="badge badge-teal">Step 2 of 5</span>
              <ReadAloudButton text="What department do you need to visit today? General Medicine, Surgery, Paediatrics, or Ayurveda." />
            </div>

            <h1 style={{ fontSize: '30px', marginBottom: '10px' }}>What Brings You in Today?</h1>
            <p style={{ fontSize: '16px', color: 'var(--ink-soft)', marginBottom: '28px' }}>
              Choose the clinical department for your consultation token.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', marginBottom: '34px' }}>
              {[
                { id: 'General Medicine', icon: '🩺', desc: 'Fever, diabetes, BP, general health' },
                { id: 'Surgery', icon: '🔪', desc: 'Pre/post-op consultations, wounds' },
                { id: 'Paediatrics', icon: '🧒', desc: 'Child health, immunisation, growth' },
                { id: 'Ayurveda', icon: '🌿', desc: 'Holistic & Ayurvedic care (AYUSH)' }
              ].map(dept => (
                <div
                  key={dept.id}
                  onClick={() => setDepartment(dept.id)}
                  style={{
                    padding: '24px',
                    borderRadius: 'var(--radius-lg)',
                    border: department === dept.id ? '2.5px solid var(--teal-700)' : '1.5px solid var(--border-subtle)',
                    background: department === dept.id ? 'var(--teal-50)' : '#FFFFFF',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>{dept.icon}</div>
                  <h3 style={{ fontSize: '19px', marginBottom: '4px' }}>{dept.id}</h3>
                  <p style={{ fontSize: '13.5px', color: 'var(--ink-soft)' }}>{dept.desc}</p>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button className="btn btn-ghost" onClick={() => setCurrentStep(1)}>
                <ArrowLeft size={16} /> Back
              </button>
              <button className="btn btn-primary btn-lg" onClick={() => setCurrentStep(3)}>
                Continue to Symptoms <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 3: SYMPTOMS & CLINICAL INTAKE ================= */}
        {currentStep === 3 && (
          <div className="card" style={{ padding: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span className="badge badge-teal">Step 3 of 5 • {department}</span>
              <ReadAloudButton text={`Please describe your current complaint. You can tap the microphone to speak in ${lang === 'hi' ? 'Hindi' : lang === 'te' ? 'Telugu' : 'English'}.`} />
            </div>

            <h1 style={{ fontSize: '30px', marginBottom: '10px' }}>Today's Symptoms & Reason for Visit</h1>
            <p style={{ fontSize: '16px', color: 'var(--ink-soft)', marginBottom: '24px' }}>
              Speak or select your main complaint. We only collect changes since your last visit.
            </p>

            {/* Red flag priority banner */}
            {redFlagDetected && (
              <div style={{
                background: 'var(--red-bg)',
                border: '1.5px solid var(--red-border)',
                borderRadius: 'var(--radius-md)',
                padding: '16px 20px',
                color: 'var(--red-text)',
                fontWeight: 700,
                display: 'flex',
                gap: '12px',
                alignItems: 'center',
                marginBottom: '24px'
              }}>
                <AlertTriangle size={24} style={{ flexShrink: 0 }} />
                <span>
                  🚩 Priority screening flag detected from reported symptoms. Triage staff and doctor have been notified for priority review.
                </span>
              </div>
            )}

            {/* Speech Microphone & Quick Replies */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '20px 0 28px' }}>
              <SpeechMicButton onTranscript={handleSpeechTranscript} />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label className="label-title">Quick Complaint Options</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {QUICK_COMPLAINTS.map((item, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`btn btn-sm ${chiefComplaint === item.label ? 'btn-coral' : 'btn-ghost'}`}
                    onClick={() => handleComplaintSelect(item)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Detailed Complaint Input */}
            <div style={{ marginBottom: '20px' }}>
              <label className="label-title">Chief Complaint (Main Reason for Visit) *</label>
              <textarea
                className="input-control"
                rows={3}
                placeholder="Describe your symptoms (e.g. Chest discomfort since yesterday, feeling breathlessness on stairs)..."
                value={chiefComplaint}
                onChange={(e) => {
                  setChiefComplaint(e.target.value);
                  if (/chest|breath|faint|unconscious/i.test(e.target.value)) {
                    setRedFlagDetected(true);
                  }
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <label className="label-title">Symptom Duration</label>
                <select
                  className="input-control"
                  value={symptomDuration}
                  onChange={(e) => setSymptomDuration(e.target.value)}
                >
                  <option>Less than 24 hours</option>
                  <option>1 to 2 days</option>
                  <option>3 to 7 days</option>
                  <option>1 to 4 weeks</option>
                  <option>More than 1 month</option>
                </select>
              </div>

              <div>
                <label className="label-title">Symptom Severity</label>
                <select
                  className="input-control"
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                >
                  <option>Mild</option>
                  <option>Moderate</option>
                  <option>Severe</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <label className="label-title">Medicines Taken Recently (Last 48 hrs)</label>
                <input
                  type="text"
                  className="input-control"
                  placeholder="e.g. Paracetamol 650mg, Amlodipine"
                  value={recentlyTakenMeds}
                  onChange={(e) => setRecentlyTakenMeds(e.target.value)}
                />
              </div>

              <div>
                <label className="label-title">Newly Reported Allergies (if any)</label>
                <input
                  type="text"
                  className="input-control"
                  placeholder="e.g. None or newly noticed reaction"
                  value={newAllergies}
                  onChange={(e) => setNewAllergies(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '28px' }}>
              <button className="btn btn-ghost" onClick={() => setCurrentStep(2)}>
                <ArrowLeft size={16} /> Back
              </button>
              <button
                className="btn btn-primary btn-lg"
                disabled={!chiefComplaint.trim()}
                onClick={() => setCurrentStep(4)}
              >
                Continue to Documents <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 4: MEDICAL DOCUMENTS & OCR ================= */}
        {currentStep === 4 && (
          <div className="card" style={{ padding: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span className="badge badge-teal">Step 4 of 5 • Medical Records</span>
              <ReadAloudButton text="Do you have old prescriptions, lab reports, or discharge summaries? Please upload them now, or skip to review." />
            </div>

            <h1 style={{ fontSize: '30px', marginBottom: '10px' }}>Upload Medical Documents</h1>
            <p style={{ fontSize: '16px', color: 'var(--ink-soft)', marginBottom: '24px' }}>
              Upload prescriptions, lab reports, or discharge summaries. Our OCR extracts diagnoses and medicines automatically.
            </p>

            {/* Drag & Drop Upload Zone */}
            <div style={{
              border: '2px dashed var(--teal-500)',
              borderRadius: 'var(--radius-lg)',
              padding: '36px',
              textAlign: 'center',
              background: 'var(--teal-50)',
              marginBottom: '24px'
            }}>
              <Upload size={40} style={{ color: 'var(--teal-700)', marginBottom: '12px' }} />
              <h3 style={{ fontSize: '18px', marginBottom: '6px' }}>Upload Photos or PDF Medical Records</h3>
              <p style={{ fontSize: '14px', color: 'var(--ink-soft)', marginBottom: '18px' }}>
                Supports PDF, JPG, PNG files (Max 25MB)
              </p>
              <label className="btn btn-primary" style={{ cursor: 'pointer' }}>
                <span>{isUploading ? 'Extracting Text (OCR)...' : 'Choose File to Scan'}</span>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            {/* Uploaded Documents List */}
            {uploadedDocs.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ fontSize: '16px', marginBottom: '12px' }}>Processed Documents ({uploadedDocs.length}):</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {uploadedDocs.map(doc => (
                    <div
                      key={doc.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: 'var(--bg-main)',
                        padding: '12px 18px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-subtle)'
                      }}
                    >
                      <div>
                        <b>{doc.original_filename}</b>
                        <span style={{ fontSize: '13px', color: 'var(--ink-soft)', marginLeft: '8px' }}>
                          ({doc.doc_type})
                        </span>
                      </div>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => setSelectedDocForOcr(doc)}
                      >
                        Review OCR Extracted Fields
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '28px' }}>
              <button className="btn btn-ghost" onClick={() => setCurrentStep(3)}>
                <ArrowLeft size={16} /> Back
              </button>
              <button className="btn btn-primary btn-lg" onClick={() => setCurrentStep(5)}>
                Review Timeline & Finish <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 5: REVIEW INTAKE BEFORE SUBMISSION ================= */}
        {currentStep === 5 && (
          <div className="card" style={{ padding: '40px' }}>
            <h1 style={{ fontSize: '30px', marginBottom: '10px' }}>Review Your Intake Summary</h1>
            <p style={{ fontSize: '16px', color: 'var(--ink-soft)', marginBottom: '24px' }}>
              Please confirm the recorded details before sending to Dr. Sharma.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '28px' }}>
              <div style={{ background: 'var(--bg-main)', padding: '16px', borderRadius: '12px' }}>
                <span className="label-title">Patient</span>
                <div style={{ fontSize: '17px', fontWeight: 700 }}>{patient?.full_name} ({patient?.patient_uid})</div>
              </div>

              <div style={{ background: 'var(--bg-main)', padding: '16px', borderRadius: '12px' }}>
                <span className="label-title">Department</span>
                <div style={{ fontSize: '16px', fontWeight: 600 }}>{department}</div>
              </div>

              <div style={{ background: 'var(--bg-main)', padding: '16px', borderRadius: '12px' }}>
                <span className="label-title">Chief Complaint Reported Today</span>
                <div style={{ fontSize: '16px', color: 'var(--coral-600)', fontWeight: 600 }}>{chiefComplaint}</div>
                <div style={{ fontSize: '14px', color: 'var(--ink-soft)', marginTop: '4px' }}>
                  Duration: {symptomDuration} • Severity: {severity}
                </div>
              </div>

              {recentlyTakenMeds && (
                <div style={{ background: 'var(--bg-main)', padding: '16px', borderRadius: '12px' }}>
                  <span className="label-title">Recently Taken Medications</span>
                  <div style={{ fontSize: '15px' }}>{recentlyTakenMeds}</div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button className="btn btn-ghost" onClick={() => setCurrentStep(4)}>
                <ArrowLeft size={16} /> Back & Edit
              </button>
              <button
                className="btn btn-coral btn-lg"
                disabled={submitting}
                onClick={handleSubmitIntake}
              >
                <CheckCircle2 size={20} />
                <span>{submitting ? 'Sending to Doctor...' : 'Confirm & Generate OPD Token'}</span>
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 6: COMPLETION ================= */}
        {currentStep === 6 && (
          <div className="card" style={{ padding: '50px 30px', textAlign: 'center' }}>
            <div style={{
              width: '90px',
              height: '90px',
              borderRadius: '50%',
              background: 'var(--green-bg)',
              color: 'var(--green-text)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '44px',
              margin: '0 auto 24px'
            }}>
              ✓
            </div>
            <h1 style={{ fontSize: '34px', marginBottom: '10px' }}>
              You're All Set{patient?.full_name ? `, ${patient.full_name}` : ''}!
            </h1>
            <p style={{ fontSize: '18px', color: 'var(--ink-soft)', maxWidth: '30em', margin: '0 auto 28px' }}>
              Your clinical history and uploaded records have been transmitted to your treating doctor.
            </p>

            <div style={{
              display: 'inline-block',
              background: 'var(--teal-50)',
              border: '2px dashed var(--teal-600)',
              borderRadius: '16px',
              padding: '24px 40px',
              marginBottom: '32px'
            }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--teal-700)', textTransform: 'uppercase' }}>
                Your Assigned OPD Token
              </div>
              <div style={{ fontSize: '48px', fontWeight: 800, color: 'var(--teal-900)', fontFamily: 'var(--font-serif)', margin: '6px 0' }}>
                {visitToken}
              </div>
              <div style={{ fontSize: '14px', color: 'var(--ink-soft)' }}>
                Please take a seat in Ward 2. Your token will be called shortly.
              </div>
            </div>

            <div>
              <button className="btn btn-primary btn-lg" onClick={() => onFinish()}>
                Finish & Return to Home
              </button>
            </div>
          </div>
        )}

      </div>

      {/* OCR Review Modal if opened */}
      {selectedDocForOcr && (
        <OCRVerificationModal
          document={selectedDocForOcr}
          onClose={() => setSelectedDocForOcr(null)}
          onVerified={() => {
            alert('Extracted document values verified and updated!');
            setSelectedDocForOcr(null);
          }}
        />
      )}
    </div>
  );
}
