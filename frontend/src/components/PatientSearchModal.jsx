import React, { useState, useEffect } from 'react';
import { Search, UserCheck, UserPlus, X, Phone, Calendar, HeartPulse } from 'lucide-react';
import { api } from '../services/api';

export default function PatientSearchModal({ isOpen, onClose, onSelectPatient, onRegisterNew }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await api.searchPatients(query);
        setResults(data);
        setHasSearched(true);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(12, 30, 26, 0.65)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '20px'
    }}>
      <div className="card" style={{ maxWidth: '700px', width: '100%', maxHeight: '85vh', display: 'flex', flexDirection: 'column', padding: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '24px', margin: 0 }}>Patient Identification & Lookup</h2>
            <p style={{ fontSize: '14px', color: 'var(--ink-soft)', marginTop: '4px' }}>
              Search using Patient ID, registered mobile number, or full name to retrieve records automatically.
            </p>
          </div>
          <button onClick={onClose} style={{ color: 'var(--ink-muted)' }}>
            <X size={24} />
          </button>
        </div>

        {/* Search Bar */}
        <div style={{ position: 'relative', marginBottom: '20px' }}>
          <Search size={20} style={{ position: 'absolute', left: '16px', top: '15px', color: 'var(--teal-600)' }} />
          <input
            type="text"
            className="input-control"
            placeholder="Type Patient ID (e.g. PAT-2026-00124), Phone (e.g. 9876543210), or Name..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            style={{ paddingLeft: '48px', fontSize: '16px', height: '50px' }}
          />
        </div>

        {/* Results Area */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', minHeight: '180px' }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--ink-soft)' }}>
              Searching database...
            </div>
          )}

          {!loading && results.length > 0 && results.map((patient) => (
            <div
              key={patient.id}
              onClick={() => {
                onSelectPatient(patient);
                onClose();
              }}
              style={{
                background: 'var(--bg-main)',
                border: '1.5px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--teal-600)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 700, fontSize: '17px', color: 'var(--ink)' }}>
                    {patient.full_name}
                  </span>
                  <span className="badge badge-teal">{patient.patient_uid}</span>
                  <span className="badge badge-grey">
                    {patient.age ? `${patient.age} yrs` : 'Age N/A'} • {patient.gender}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: 'var(--ink-soft)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Phone size={13} /> {patient.phone}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={13} /> Last Visit: {patient.last_visit_date || 'None'}
                  </span>
                  {patient.chronic_conditions_summary && patient.chronic_conditions_summary !== 'None recorded' && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--coral-600)', fontWeight: 600 }}>
                      <HeartPulse size={13} /> {patient.chronic_conditions_summary}
                    </span>
                  )}
                </div>
              </div>

              <button className="btn btn-primary btn-sm" style={{ flexShrink: 0 }}>
                <UserCheck size={16} /> Select & Load
              </button>
            </div>
          ))}

          {!loading && hasSearched && results.length === 0 && (
            <div style={{ textAlign: 'center', padding: '36px 20px', background: 'var(--bg-main)', borderRadius: 'var(--radius-md)' }}>
              <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--ink)', marginBottom: '6px' }}>
                No matching records found for "{query}"
              </p>
              <p style={{ fontSize: '14px', color: 'var(--ink-soft)', marginBottom: '18px' }}>
                This patient might be visiting for the first time. You can register them now.
              </p>
              <button
                className="btn btn-coral"
                onClick={() => {
                  onClose();
                  if (onRegisterNew) onRegisterNew(query);
                }}
              >
                <UserPlus size={18} /> Register as New Patient
              </button>
            </div>
          )}

          {!hasSearched && !loading && (
            <div style={{ textAlign: 'center', padding: '36px 20px', color: 'var(--ink-muted)' }}>
              Start typing a name, phone number, or patient ID to find existing medical records.
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => {
              onClose();
              if (onRegisterNew) onRegisterNew(query);
            }}
          >
            <UserPlus size={16} /> New Patient Registration
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
