import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, CheckCircle, AlertTriangle, ShieldCheck, FileText, 
  Clock, HeartPulse, User, Pill, Edit3, ShieldAlert 
} from 'lucide-react';
import { api } from '../services/api';
import ReadAloudButton from '../components/ReadAloudButton';

const TABS = ['Overview', 'History', 'Medications', 'Allergies', 'Documents', 'Timeline', 'AI Summary'];

export default function DoctorCaseView({ visitItem, onBack }) {
  const [activeTab, setActiveTab] = useState('Overview');
  const [patient, setPatient] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  // Verification state
  const [doctorNotes, setDoctorNotes] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedSuccess, setVerifiedSuccess] = useState(false);

  useEffect(() => {
    async function loadFullCase() {
      if (!visitItem) return;
      setLoading(true);
      try {
        const [patientData, timelineData, docsData, summaryData] = await Promise.all([
          api.getPatient(visitItem.patient_id),
          api.getTimeline(visitItem.patient_id),
          api.getPatientDocuments(visitItem.patient_id),
          api.getSummaryByVisit(visitItem.id).catch(() => null)
        ]);

        setPatient(patientData);
        setTimeline(timelineData);
        setDocuments(docsData);
        setSummary(summaryData);
        if (summaryData?.doctor_notes) {
          setDoctorNotes(summaryData.doctor_notes);
        }
      } catch (err) {
        console.error('Failed to load full case details:', err);
      } finally {
        setLoading(false);
      }
    }
    loadFullCase();
  }, [visitItem]);

  const handleVerifySummary = async () => {
    if (!summary) return;
    setIsVerifying(true);
    try {
      const updated = await api.verifySummary(summary.id, {
        doctor_notes: doctorNotes,
        is_doctor_verified: true
      });
      setSummary(updated);
      setVerifiedSuccess(true);
      setTimeout(() => setVerifiedSuccess(false), 4000);
    } catch (err) {
      alert(`Verification failed: ${err.message}`);
    } finally {
      setIsVerifying(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--ink-soft)' }}>
        Loading complete clinical records and longitudinal history...
      </div>
    );
  }

  const patientName = patient?.full_name || visitItem?.patient_name;
  const isRedFlag = visitItem?.is_red_flag || visitItem?.priority === 'red_flag';

  return (
    <div style={{ padding: '30px 0 80px' }}>
      <div className="wrap">
        {/* Top bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <button className="btn btn-ghost btn-sm" onClick={onBack}>
            <ArrowLeft size={16} /> Back to Doctor Queue
          </button>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span className="badge badge-teal">Token {visitItem?.token}</span>
            <ReadAloudButton text={`Patient case review for ${patientName}. Chief complaint: ${visitItem?.chief_complaint}`} />
          </div>
        </div>

        {/* Patient Banner */}
        <div className="card" style={{ padding: '24px 28px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                <h1 style={{ fontSize: '28px', margin: 0 }}>{patientName}</h1>
                <span className="badge badge-teal">{patient?.patient_uid}</span>
                {isRedFlag ? (
                  <span className="badge badge-red">🚩 PRIORITY SCREENING FLAG</span>
                ) : (
                  <span className="badge badge-green">Routine Review</span>
                )}
              </div>
              <div style={{ fontSize: '14.5px', color: 'var(--ink-soft)', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                <span><b>Age/Gender:</b> {patient?.age ? `${patient.age} yrs` : 'Not recorded'} • {patient?.gender}</span>
                <span><b>Blood Group:</b> {patient?.blood_group || 'Not recorded'}</span>
                <span><b>Phone:</b> {patient?.phone}</span>
                <span><b>Department:</b> {visitItem?.department}</span>
                <span><b>Visit Date:</b> {visitItem?.visit_date}</span>
              </div>
            </div>

            {summary?.is_doctor_verified ? (
              <div className="badge badge-green" style={{ padding: '8px 16px', fontSize: '14px' }}>
                ✓ Summary Verified by Dr. Sharma
              </div>
            ) : (
              <button className="btn btn-primary btn-sm" onClick={() => setActiveTab('AI Summary')}>
                <ShieldCheck size={16} /> Review & Verify Summary
              </button>
            )}
          </div>

          {/* Red Flag Warning Banner */}
          {isRedFlag && (
            <div style={{
              background: 'var(--red-bg)',
              border: '1.5px solid var(--red-border)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 18px',
              marginTop: '18px',
              color: 'var(--red-text)',
              fontSize: '14px',
              fontWeight: 600,
              display: 'flex',
              gap: '10px',
              alignItems: 'center'
            }}>
              <AlertTriangle size={18} />
              <span>{visitItem?.red_flag_reason || 'Urgent symptom reported at kiosk. Prompt clinician examination required.'}</span>
            </div>
          )}
        </div>

        {/* Layout: Left Tabs & Right Alerts Panel */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px' }}>
          {/* Main Area */}
          <div>
            {/* Tab navigation */}
            <div style={{ display: 'flex', gap: '6px', borderBottom: '1.5px solid var(--border-subtle)', marginBottom: '20px', flexWrap: 'wrap' }}>
              {TABS.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '10px 16px',
                    fontSize: '14.5px',
                    fontWeight: 600,
                    color: activeTab === tab ? 'var(--teal-700)' : 'var(--ink-soft)',
                    borderBottom: activeTab === tab ? '3px solid var(--teal-700)' : '3px solid transparent',
                    background: 'transparent'
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* TAB: OVERVIEW */}
            {activeTab === 'Overview' && (
              <div className="card" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '20px', marginBottom: '18px' }}>Today's Clinical Intake Overview</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <label className="label-title">Chief Complaint (Patient Reported)</label>
                    <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--coral-600)' }}>
                      {visitItem?.chief_complaint}
                    </div>
                  </div>
                  <div>
                    <label className="label-title">Severity & Duration</label>
                    <div style={{ fontSize: '15px' }}>
                      Severity: <b>{patient?.visits?.[0]?.intake?.severity || 'Moderate'}</b> • Duration: <b>{patient?.visits?.[0]?.intake?.symptom_duration || 'Not recorded'}</b>
                    </div>
                  </div>
                  <div>
                    <label className="label-title">Associated Symptoms</label>
                    <div style={{ fontSize: '15px' }}>
                      {patient?.visits?.[0]?.intake?.associated_symptoms || 'None reported'}
                    </div>
                  </div>
                  <div>
                    <label className="label-title">Recently Taken Medicines</label>
                    <div style={{ fontSize: '15px' }}>
                      {patient?.visits?.[0]?.intake?.recently_taken_meds || 'None reported'}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border-subtle)' }}>
                  <label className="label-title">Chronic Conditions On File</label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                    {patient?.chronic_conditions?.length > 0 ? (
                      patient.chronic_conditions.map(c => (
                        <span key={c.id} className="badge badge-amber" style={{ fontSize: '13px', padding: '6px 12px' }}>
                          {c.condition_name} ({c.status})
                        </span>
                      ))
                    ) : (
                      <span style={{ color: 'var(--ink-soft)', fontSize: '14px' }}>No chronic illnesses documented</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: HISTORY */}
            {activeTab === 'History' && (
              <div className="card" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '20px', marginBottom: '18px' }}>Past Medical & Surgical History</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label className="label-title">Chronic Illnesses</label>
                    {patient?.chronic_conditions?.map(c => (
                      <div key={c.id} style={{ background: 'var(--bg-main)', padding: '10px 14px', borderRadius: '8px', marginBottom: '6px' }}>
                        <b>{c.condition_name}</b> {c.icd10_code ? `[ICD-10: ${c.icd10_code}]` : ''} • Diagnosed: {c.diagnosed_date || 'Historical'}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: MEDICATIONS */}
            {activeTab === 'Medications' && (
              <div className="card" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '20px', marginBottom: '18px' }}>Medications History & Active Dosages</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {patient?.medications?.length > 0 ? (
                    patient.medications.map(m => (
                      <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-main)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '15px' }}>{m.medicine_name} ({m.dosage})</div>
                          <div style={{ fontSize: '13px', color: 'var(--ink-soft)' }}>
                            Frequency: {m.frequency} • Prescribing Doctor: {m.prescribing_doctor || 'Not recorded'}
                          </div>
                        </div>
                        <span className={`badge ${m.is_active ? 'badge-green' : 'badge-grey'}`}>
                          {m.is_active ? 'Active' : 'Discontinued'}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div style={{ color: 'var(--ink-soft)' }}>No regular medications recorded for this patient.</div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: ALLERGIES */}
            {activeTab === 'Allergies' && (
              <div className="card" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '20px', marginBottom: '18px' }}>Allergy Profiles</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {patient?.allergies?.length > 0 ? (
                    patient.allergies.map(a => (
                      <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--red-bg)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--red-border)' }}>
                        <div>
                          <b style={{ color: 'var(--red-text)' }}>⚠️ {a.allergen}</b>
                          <div style={{ fontSize: '13px', color: 'var(--ink-soft)' }}>Reaction: {a.reaction || 'Reported reaction'}</div>
                        </div>
                        <span className="badge badge-red">{a.severity}</span>
                      </div>
                    ))
                  ) : (
                    <div style={{ color: 'var(--ink-soft)' }}>No known drug or environmental allergies on file.</div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: DOCUMENTS */}
            {activeTab === 'Documents' && (
              <div className="card" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '20px', marginBottom: '18px' }}>Uploaded Medical Records & Extracted OCR</h3>
                {documents.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {documents.map(doc => (
                      <div key={doc.id} style={{ background: 'var(--bg-main)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '18px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <span style={{ fontWeight: 700, fontSize: '16px' }}>📄 {doc.original_filename} ({doc.doc_type})</span>
                          <span className={`badge ${doc.is_verified ? 'badge-green' : 'badge-yellow'}`}>
                            {doc.is_verified ? '✓ Clinician Verified' : 'OCR Unverified'}
                          </span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', fontSize: '13.5px' }}>
                          {doc.extracted_fields?.map((ef, i) => (
                            <div key={i} style={{ background: '#FFFFFF', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                              <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ink-muted)', display: 'block' }}>{ef.field_name}</span>
                              <b>{ef.corrected_value || ef.extracted_value}</b>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: 'var(--ink-soft)' }}>No uploaded records on file for this patient.</div>
                )}
              </div>
            )}

            {/* TAB: TIMELINE */}
            {activeTab === 'Timeline' && (
              <div className="card" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '20px', marginBottom: '18px' }}>Longitudinal Medical Timeline</h3>
                <div style={{ position: 'relative', paddingLeft: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ position: 'absolute', left: '10px', top: '10px', bottom: '10px', width: '2px', background: 'var(--teal-500)' }} />
                  {timeline.map((ev, i) => (
                    <div key={ev.id || i} style={{ position: 'relative' }}>
                      <div style={{
                        position: 'absolute',
                        left: '-23px',
                        top: '4px',
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: ev.is_current_visit ? 'var(--coral-600)' : 'var(--teal-700)',
                        border: '2px solid #FFFFFF',
                        boxShadow: '0 0 0 2px var(--teal-700)'
                      }} />
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--teal-700)', marginBottom: '3px' }}>
                        {ev.date}
                      </div>
                      <div className="card" style={{ padding: '14px 18px', background: ev.is_current_visit ? 'var(--coral-100)' : '#FFFFFF' }}>
                        <div style={{ fontWeight: 700, fontSize: '15px' }}>{ev.title}</div>
                        <div style={{ fontSize: '13.5px', color: 'var(--ink-soft)', marginTop: '4px' }}>{ev.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: AI SUMMARY */}
            {activeTab === 'AI Summary' && (
              <div className="card" style={{ padding: '28px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '22px', margin: 0 }}>Clinical Decision Support Summary</h3>
                  <span className="badge badge-teal">{summary?.ai_model_used || 'MediKiosk Clinical Engine'}</span>
                </div>

                {/* AI Disclaimer Alert */}
                <div style={{
                  background: 'var(--amber-bg)',
                  border: '1px solid var(--amber-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 18px',
                  color: 'var(--amber-text)',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  marginBottom: '20px'
                }}>
                  🤖 AI-Assisted Draft: This clinical summary is generated strictly from patient-reported answers and OCR-extracted documents. A licensed clinician must review and verify all items before clinical decisions.
                </div>

                {verifiedSuccess && (
                  <div style={{ background: 'var(--green-bg)', color: 'var(--green-text)', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontWeight: 600 }}>
                    ✓ Clinical summary successfully verified and signed by clinician!
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                  <div style={{ background: 'var(--bg-main)', padding: '16px', borderRadius: '10px' }}>
                    <label className="label-title">Chief Complaint</label>
                    <div style={{ fontSize: '15.5px', fontWeight: 600 }}>{summary?.chief_complaint || visitItem?.chief_complaint}</div>
                  </div>

                  <div style={{ background: 'var(--bg-main)', padding: '16px', borderRadius: '10px' }}>
                    <label className="label-title">History of Present Illness (HPI)</label>
                    <div style={{ fontSize: '15px', lineHeight: 1.5 }}>{summary?.hpi || 'Awaiting intake synthesis'}</div>
                  </div>

                  <div style={{ background: 'var(--bg-main)', padding: '16px', borderRadius: '10px' }}>
                    <label className="label-title">Past Medical & Surgical History</label>
                    <div style={{ fontSize: '15px' }}>{summary?.past_medical_history}</div>
                  </div>

                  <div style={{ background: 'var(--bg-main)', padding: '16px', borderRadius: '10px' }}>
                    <label className="label-title">Active Medications & Reported Intake</label>
                    <div style={{ fontSize: '15px' }}>{summary?.current_medications}</div>
                  </div>

                  <div style={{ background: 'var(--bg-main)', padding: '16px', borderRadius: '10px' }}>
                    <label className="label-title">Known Allergies</label>
                    <div style={{ fontSize: '15px', color: 'var(--red-text)', fontWeight: 600 }}>{summary?.allergies}</div>
                  </div>

                  <div style={{ background: 'var(--bg-main)', padding: '16px', borderRadius: '10px' }}>
                    <label className="label-title">Key Findings from Uploaded Documents</label>
                    <div style={{ fontSize: '15px' }}>{summary?.key_findings_from_docs}</div>
                  </div>

                  <div style={{ background: 'var(--bg-main)', padding: '16px', borderRadius: '10px' }}>
                    <label className="label-title">Critical Missing Clinical Information</label>
                    <div style={{ fontSize: '15px', color: 'var(--amber-text)' }}>{summary?.missing_clinical_info}</div>
                  </div>
                </div>

                {/* Doctor verification & notes */}
                <div style={{ borderTop: '1.5px solid var(--border-subtle)', paddingTop: '20px' }}>
                  <label className="label-title">Clinician Notes & Verification Signature</label>
                  <textarea
                    className="input-control"
                    rows={3}
                    placeholder="Enter doctor's examination notes, prescription orders, or modifications to summary..."
                    value={doctorNotes}
                    onChange={(e) => setDoctorNotes(e.target.value)}
                    style={{ marginBottom: '16px' }}
                  />

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    <button
                      className="btn btn-primary btn-lg"
                      onClick={handleVerifySummary}
                      disabled={isVerifying}
                    >
                      <ShieldCheck size={20} />
                      <span>{isVerifying ? 'Signing & Verifying...' : '✓ Approve & Digitally Verify Summary'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Alerts & Actions Panel */}
          <div>
            <div className="card" style={{ padding: '22px', position: 'sticky', top: '90px' }}>
              <h3 style={{ fontSize: '17px', marginBottom: '14px' }}>⚠️ Clinical Alerts</h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                {isRedFlag && (
                  <div style={{ background: 'var(--red-bg)', color: 'var(--red-text)', padding: '10px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 600 }}>
                    🔴 Red flag: Chest pain reported — priority evaluation indicated
                  </div>
                )}
                {patient?.chronic_conditions?.some(c => c.condition_name.includes('Hypertension')) && (
                  <div style={{ background: 'var(--amber-bg)', color: 'var(--amber-text)', padding: '10px 12px', borderRadius: '8px', fontSize: '13px' }}>
                    🟠 Hypertension history on file
                  </div>
                )}
                {patient?.allergies?.some(a => a.allergen.toLowerCase().includes('penicillin')) && (
                  <div style={{ background: 'var(--red-bg)', color: 'var(--red-text)', padding: '10px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 600 }}>
                    🔴 Severe Penicillin allergy documented
                  </div>
                )}
                <div style={{ background: 'var(--teal-50)', color: 'var(--teal-700)', padding: '10px 12px', borderRadius: '8px', fontSize: '13px' }}>
                  🟢 Vitals screening completed at intake
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
                <button
                  className="btn btn-primary btn-sm btn-block"
                  onClick={() => setActiveTab('AI Summary')}
                >
                  <ShieldCheck size={16} /> Open AI Verification
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
