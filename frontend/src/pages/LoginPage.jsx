import React, { useState } from 'react';
import { Stethoscope, Shield, Lock, User, ArrowRight, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage({ onSuccess }) {
  const { login } = useAuth();
  const [username, setUsername] = useState('doc_sharma');
  const [password, setPassword] = useState('DoctorPassword123!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e?.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(username, password);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePresetSelect = (u, p) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div style={{ padding: '60px 0 80px', display: 'flex', justifyContent: 'center' }}>
      <div className="card" style={{ maxWidth: '460px', width: '100%', padding: '36px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '14px',
            background: 'var(--teal-700)',
            color: '#FFFFFF',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            fontWeight: 800,
            fontFamily: 'var(--font-serif)',
            marginBottom: '14px'
          }}>
            M
          </div>
          <h2 style={{ fontSize: '26px', marginBottom: '6px' }}>MediKiosk Portal Login</h2>
          <p style={{ fontSize: '14px', color: 'var(--ink-soft)' }}>
            Secure role-based access for Doctors, Staff, and Administrators
          </p>
        </div>

        {error && (
          <div style={{ background: 'var(--red-bg)', color: 'var(--red-text)', padding: '12px 14px', borderRadius: '8px', fontSize: '13.5px', marginBottom: '18px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '18px' }}>
            <label className="label-title">Username / Staff ID</label>
            <input
              type="text"
              className="input-control"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. doc_sharma or staff_meena"
              required
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label className="label-title">Password</label>
            <input
              type="password"
              className="input-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading} style={{ marginBottom: '24px' }}>
            <Lock size={18} />
            <span>{loading ? 'Authenticating...' : 'Sign In to Portal'}</span>
          </button>
        </form>

        {/* Demo Role Fast-Select Presets */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '20px' }}>
          <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--ink-muted)', textTransform: 'uppercase', marginBottom: '12px', textAlign: 'center' }}>
            Quick 1-Click Role Logins:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => handlePresetSelect('doc_sharma', 'DoctorPassword123!')}
              style={{ fontSize: '12.5px' }}
            >
              🩺 Doctor (Dr. Sharma)
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => handlePresetSelect('staff_meena', 'StaffPassword123!')}
              style={{ fontSize: '12.5px' }}
            >
              🧑‍💼 Staff (Meena Rao)
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => handlePresetSelect('admin', 'AdminPassword123!')}
              style={{ fontSize: '12.5px' }}
            >
              🔐 Administrator
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => handlePresetSelect('patient_sunita', 'PatientPassword123!')}
              style={{ fontSize: '12.5px' }}
            >
              🧑‍🤝‍🧑 Patient Portal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
