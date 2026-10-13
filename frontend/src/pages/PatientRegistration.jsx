import React, { useState } from 'react';
import { UserPlus, AlertTriangle, ShieldCheck, ArrowRight, UserCheck, X } from 'lucide-react';
import { api } from '../services/api';

export default function PatientRegistration({ onRegistered, onCancel, prefillQuery = '' }) {
  const isNumber = /^\d+$/.test(prefillQuery.trim());
  
  const [formData, setFormData] = useState({
    full_name: !isNumber ? prefillQuery : '',
    age: '',
    gender: 'Female',
    blood_group: 'Not recorded',
    phone: isNumber ? prefillQuery : '',
    email: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    address: '',
    allergies: '',
    chronic_conditions: '',
    medications: ''
  });

  const [errors, setErrors] = useState({});
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const errs = {};
    if (!formData.full_name.trim() || formData.full_name.trim().length < 2) {
      errs.full_name = 'Full name is required (at least 2 characters)';
    }
    if (!formData.phone.trim() || !/^\d{10}$/.test(formData.phone.trim())) {
      errs.phone = 'Valid 10-digit Indian mobile number is required';
    }
    if (!formData.age || parseInt(formData.age) < 0 || parseInt(formData.age) > 125) {
      errs.age = 'Please enter a valid age (0-125)';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handlePhoneBlur = async () => {
    if (formData.phone.trim().length === 10) {
      try {
        const check = await api.checkDuplicatePatient(formData.phone.trim(), formData.full_name.trim());
        if (check.has_exact_phone_match) {
          setDuplicateWarning(check.phone_matches);
        } else {
          setDuplicateWarning(null);
        }
      } catch (err) {
        console.warn(err);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const payload = {
        full_name: formData.full_name.trim(),
        age: parseInt(formData.age),
        gender: formData.gender,
        blood_group: formData.blood_group,
        phone: formData.phone.trim(),
        email: formData.email.trim() || null,
        emergency_contact_name: formData.emergency_contact_name.trim() || null,
        emergency_contact_phone: formData.emergency_contact_phone.trim() || null,
        address: formData.address.trim() || null,
        allergies: formData.allergies ? [{ allergen: formData.allergies.trim(), severity: 'Moderate' }] : [],
        chronic_conditions: formData.chronic_conditions ? [{ condition_name: formData.chronic_conditions.trim(), status: 'Active' }] : [],
        medications: formData.medications ? [{ medicine_name: formData.medications.trim(), dosage: 'As recorded', frequency: 'Regular' }] : []
      };

      const newPatient = await api.registerPatient(payload);
      onRegistered(newPatient);
    } catch (err) {
      alert(`Registration failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '36px 0 60px' }}>
      <div className="wrap" style={{ maxWidth: '800px' }}>
        <div className="card" style={{ padding: '36px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h1 style={{ fontSize: '28px', marginBottom: '6px' }}>New Patient Registration</h1>
              <p style={{ color: 'var(--ink-soft)', fontSize: '15px' }}>
                Create a permanent medical identifier (UID) and clinical profile.
              </p>
            </div>
            {onCancel && (
              <button className="btn btn-ghost btn-sm" onClick={onCancel}>
                <X size={18} /> Cancel
              </button>
            )}
          </div>

          {/* Duplicate Phone Warning Modal Banner */}
          {duplicateWarning && (
            <div style={{
              background: 'var(--amber-bg)',
              border: '1.5px solid var(--amber-border)',
              borderRadius: 'var(--radius-md)',
              padding: '16px 20px',
              marginBottom: '24px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--amber-text)', fontWeight: 700, marginBottom: '8px' }}>
                <AlertTriangle size={20} />
                <span>Existing Patient Record Detected with Phone {formData.phone}</span>
              </div>
              <p style={{ fontSize: '14px', color: 'var(--ink-soft)', marginBottom: '12px' }}>
                We found matching records for this mobile number. Would you like to use an existing profile instead of creating a duplicate?
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {duplicateWarning.map(dup => (
                  <div key={dup.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FFFFFF', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                    <span>
                      <b>{dup.full_name}</b> ({dup.patient_uid}) • {dup.age} yrs • {dup.gender}
                    </span>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => onRegistered(dup)}
                    >
                      <UserCheck size={14} /> Use This Profile
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <label className="label-title">Full Name *</label>
                <input
                  type="text"
                  className="input-control"
                  placeholder="e.g. Ramesh Kumar"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                />
                {errors.full_name && <div style={{ color: 'var(--red-text)', fontSize: '12.5px', marginTop: '4px' }}>{errors.full_name}</div>}
              </div>

              <div>
                <label className="label-title">10-Digit Mobile Number *</label>
                <input
                  type="tel"
                  maxLength={10}
                  className="input-control"
                  placeholder="e.g. 9876543210"
                  value={formData.phone}
                  onBlur={handlePhoneBlur}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
                />
                {errors.phone && <div style={{ color: 'var(--red-text)', fontSize: '12.5px', marginTop: '4px' }}>{errors.phone}</div>}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <label className="label-title">Age (Years) *</label>
                <input
                  type="number"
                  min="0"
                  max="125"
                  className="input-control"
                  placeholder="e.g. 45"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                />
                {errors.age && <div style={{ color: 'var(--red-text)', fontSize: '12.5px', marginTop: '4px' }}>{errors.age}</div>}
              </div>

              <div>
                <label className="label-title">Gender *</label>
                <select
                  className="input-control"
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                >
                  <option>Female</option>
                  <option>Male</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label className="label-title">Blood Group</label>
                <select
                  className="input-control"
                  value={formData.blood_group}
                  onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
                >
                  <option>Not recorded</option>
                  <option>A+</option>
                  <option>A-</option>
                  <option>B+</option>
                  <option>B-</option>
                  <option>AB+</option>
                  <option>AB-</option>
                  <option>O+</option>
                  <option>O-</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <label className="label-title">Emergency Contact Name</label>
                <input
                  type="text"
                  className="input-control"
                  placeholder="e.g. Sunita Devi (Spouse)"
                  value={formData.emergency_contact_name}
                  onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                />
              </div>

              <div>
                <label className="label-title">Emergency Contact Phone</label>
                <input
                  type="tel"
                  maxLength={10}
                  className="input-control"
                  placeholder="10-digit number"
                  value={formData.emergency_contact_phone}
                  onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value.replace(/\D/g, '') })}
                />
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label className="label-title">Residential Address</label>
              <input
                type="text"
                className="input-control"
                placeholder="House No, Street, City, State"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            {/* Baseline Medical History Inputs */}
            <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '20px', marginBottom: '28px' }}>
              <h3 style={{ fontSize: '18px', marginBottom: '14px' }}>Known Baseline Medical History (Optional)</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '14px' }}>
                <div>
                  <label className="label-title">Known Allergies</label>
                  <input
                    type="text"
                    className="input-control"
                    placeholder="e.g. Penicillin, Peanuts, Sulfa"
                    value={formData.allergies}
                    onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label-title">Chronic Conditions</label>
                  <input
                    type="text"
                    className="input-control"
                    placeholder="e.g. Hypertension, Type 2 Diabetes, Asthma"
                    value={formData.chronic_conditions}
                    onChange={(e) => setFormData({ ...formData, chronic_conditions: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="label-title">Current Regular Medications</label>
                <input
                  type="text"
                  className="input-control"
                  placeholder="e.g. Amlodipine 5mg, Metformin 500mg"
                  value={formData.medications}
                  onChange={(e) => setFormData({ ...formData, medications: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '14px' }}>
              {onCancel && (
                <button type="button" className="btn btn-ghost" onClick={onCancel}>
                  Cancel
                </button>
              )}
              <button type="submit" className="btn btn-coral btn-lg" disabled={loading}>
                <UserPlus size={20} />
                <span>{loading ? 'Creating Patient Record...' : 'Complete Registration & Open Intake'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
