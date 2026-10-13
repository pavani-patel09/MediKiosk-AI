import React from 'react';
import { Search, UserCheck, LogOut, Globe, HeartPulse, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import ReadAloudButton from './ReadAloudButton';

export default function Navbar({ onOpenSearch, onNavigate, currentView }) {
  const { user, role, logout } = useAuth();
  const { lang, setLang, t } = useLanguage();

  return (
    <nav className="navbar">
      <div className="wrap nav-wrap">
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <a
            href="#home"
            className="brand-link"
            onClick={(e) => { e.preventDefault(); onNavigate('landing'); }}
          >
            <div className="brand-mark">M</div>
            <span>{t('brand')}</span>
          </a>

          {/* Nav links */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className={`btn btn-sm ${currentView === 'landing' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => onNavigate('landing')}
            >
              Home
            </button>
            <button
              className={`btn btn-sm ${currentView === 'kiosk' ? 'btn-coral' : 'btn-ghost'}`}
              onClick={() => onNavigate('kiosk')}
            >
              Patient Kiosk
            </button>
            <button
              className={`btn btn-sm ${currentView === 'doctor' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => onNavigate('doctor')}
            >
              Doctor Queue
            </button>
            <button
              className={`btn btn-sm ${currentView === 'staff' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => onNavigate('staff')}
            >
              Triage Staff
            </button>
          </div>
        </div>

        {/* Right side tools */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Patient Quick Search button */}
          <button
            className="btn btn-outline btn-sm"
            onClick={onOpenSearch}
            title="Search patient by ID, Phone, or Name"
          >
            <Search size={16} />
            <span>Search Patient</span>
          </button>

          {/* Language Selector */}
          <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-main)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-full)', padding: '3px' }}>
            <button
              onClick={() => setLang('hi')}
              style={{
                padding: '4px 10px',
                borderRadius: '999px',
                fontSize: '12.5px',
                fontWeight: 700,
                background: lang === 'hi' ? 'var(--coral-600)' : 'transparent',
                color: lang === 'hi' ? '#fff' : 'var(--ink-soft)'
              }}
            >
              हिन्दी
            </button>
            <button
              onClick={() => setLang('te')}
              style={{
                padding: '4px 10px',
                borderRadius: '999px',
                fontSize: '12.5px',
                fontWeight: 700,
                background: lang === 'te' ? 'var(--coral-600)' : 'transparent',
                color: lang === 'te' ? '#fff' : 'var(--ink-soft)'
              }}
            >
              తెలుగు
            </button>
            <button
              onClick={() => setLang('en')}
              style={{
                padding: '4px 10px',
                borderRadius: '999px',
                fontSize: '12.5px',
                fontWeight: 700,
                background: lang === 'en' ? 'var(--teal-700)' : 'transparent',
                color: lang === 'en' ? '#fff' : 'var(--ink-soft)'
              }}
            >
              English
            </button>
          </div>

          {/* User profile / Login */}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ textAlign: 'right', lineHeight: 1.2 }}>
                <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--ink)' }}>
                  {user.full_name}
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--teal-700)', textTransform: 'capitalize' }}>
                  {user.role} • {user.department || 'Hospital'}
                </div>
              </div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={logout}
                title="Logout"
                style={{ padding: '6px 10px' }}
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => onNavigate('login')}
            >
              <User size={15} /> Login
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
