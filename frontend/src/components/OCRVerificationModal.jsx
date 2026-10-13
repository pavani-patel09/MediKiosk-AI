import React, { useState } from 'react';
import { Check, X, Edit2, ShieldCheck, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

export default function OCRVerificationModal({ document, onClose, onVerified }) {
  const [fields, setFields] = useState(
    document?.extracted_fields?.map(f => ({
      field_name: f.field_name,
      corrected_value: f.corrected_value || f.extracted_value || '',
      confidence: f.confidence,
      is_verified: f.is_verified
    })) || []
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  if (!document) return null;

  const handleFieldChange = (index, value) => {
    const updated = [...fields];
    updated[index].corrected_value = value;
    setFields(updated);
  };

  const handleConfirm = async () => {
    setSaving(true);
    setError(null);
    try {
      await api.verifyDocument({
        document_id: document.id,
        fields: fields.map(f => ({
          field_name: f.field_name,
          corrected_value: f.corrected_value,
          is_verified: true
        }))
      });
      if (onVerified) onVerified(fields);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save verification');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(12, 30, 26, 0.6)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '20px'
    }}>
      <div className="card" style={{ maxWidth: '640px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '22px', marginBottom: '4px' }}>Review OCR Extracted Fields</h2>
            <p style={{ fontSize: '14px', color: 'var(--ink-soft)' }}>
              Source: <b style={{ color: 'var(--ink)' }}>{document.original_filename}</b> ({document.doc_type})
            </p>
          </div>
          <button onClick={onClose} style={{ color: 'var(--ink-muted)' }}>
            <X size={22} />
          </button>
        </div>

        <div style={{
          background: 'var(--yellow-bg)',
          border: '1px solid var(--yellow-border)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 16px',
          fontSize: '13px',
          color: 'var(--yellow-text)',
          marginBottom: '20px',
          display: 'flex',
          gap: '10px',
          alignItems: 'center'
        }}>
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>
            OCR output is screened automatically. Please verify or correct any values before adding to the clinical history.
          </span>
        </div>

        {error && (
          <div style={{ color: 'var(--red-text)', background: 'var(--red-bg)', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '13.5px' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
          {fields.map((field, idx) => (
            <div key={idx} style={{
              background: 'var(--bg-main)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span className="label-title" style={{ marginBottom: 0 }}>{field.field_name}</span>
                <span className={`badge ${field.confidence > 0.85 ? 'badge-green' : 'badge-yellow'}`}>
                  {Math.round(field.confidence * 100)}% match
                </span>
              </div>
              <input
                type="text"
                className="input-control"
                value={field.corrected_value}
                onChange={(e) => handleFieldChange(idx, e.target.value)}
                placeholder={`Enter ${field.field_name}`}
                style={{ fontSize: '14.5px', padding: '9px 12px' }}
              />
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={handleConfirm} disabled={saving}>
            <ShieldCheck size={18} />
            <span>{saving ? 'Saving...' : 'Confirm & Save to Record'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
