import React, { useState } from 'react';
import Navbar from './components/Navbar';
import PatientSearchModal from './components/PatientSearchModal';
import LandingPage from './pages/LandingPage';
import KioskIntakePage from './pages/KioskIntakePage';
import PatientRegistration from './pages/PatientRegistration';
import DoctorDashboard from './pages/DoctorDashboard';
import DoctorCaseView from './pages/DoctorCaseView';
import StaffDashboard from './pages/StaffDashboard';
import LoginPage from './pages/LoginPage';
import { useAuth } from './context/AuthContext';

export default function App() {
  const [currentView, setCurrentView] = useState('landing');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedCase, setSelectedCase] = useState(null);
  const [registerPrefill, setRegisterPrefill] = useState('');
  const { role, user } = useAuth();

  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient);
    setCurrentView('kiosk');
  };

  const handleOpenCase = (caseItem) => {
    setSelectedCase(caseItem);
    setCurrentView('case');
  };

  const handleStartRegisterNew = (prefill = '') => {
    setRegisterPrefill(prefill);
    setCurrentView('register');
  };

  const handleRegistrationDone = (newPatient) => {
    setSelectedPatient(newPatient);
    setCurrentView('kiosk');
  };

  return (
    <div className="app-container">
      <Navbar
        onOpenSearch={() => setIsSearchOpen(true)}
        onNavigate={(view) => setCurrentView(view)}
        currentView={currentView}
      />

      <main style={{ flex: 1 }}>
        {currentView === 'landing' && (
          <LandingPage
            onNavigate={(view) => setCurrentView(view)}
            onSelectPatient={handleSelectPatient}
            onOpenSearch={() => setIsSearchOpen(true)}
            onRegisterNew={handleStartRegisterNew}
          />
        )}

        {currentView === 'kiosk' && (
          <KioskIntakePage
            initialPatient={selectedPatient}
            onFinish={() => {
              setSelectedPatient(null);
              setCurrentView('landing');
            }}
            onOpenSearch={() => setIsSearchOpen(true)}
            onRegisterNew={handleStartRegisterNew}
          />
        )}

        {currentView === 'register' && (
          <PatientRegistration
            prefillQuery={registerPrefill}
            onRegistered={handleRegistrationDone}
            onCancel={() => setCurrentView('landing')}
          />
        )}

        {currentView === 'doctor' && (
          <DoctorDashboard
            onOpenCase={handleOpenCase}
            onOpenSearch={() => setIsSearchOpen(true)}
          />
        )}

        {currentView === 'case' && selectedCase && (
          <DoctorCaseView
            visitItem={selectedCase}
            onBack={() => setCurrentView('doctor')}
          />
        )}

        {currentView === 'staff' && (
          <StaffDashboard
            onRegisterNew={handleStartRegisterNew}
            onOpenSearch={() => setIsSearchOpen(true)}
          />
        )}

        {currentView === 'login' && (
          <LoginPage
            onSuccess={() => {
              if (role === 'doctor') setCurrentView('doctor');
              else if (role === 'staff') setCurrentView('staff');
              else setCurrentView('landing');
            }}
          />
        )}
      </main>

      {/* Global Patient Search Modal */}
      <PatientSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectPatient={handleSelectPatient}
        onRegisterNew={handleStartRegisterNew}
      />

      {/* Footer */}
      <footer style={{
        background: '#FFFFFF',
        borderTop: '1px solid var(--border-subtle)',
        padding: '24px 0',
        textAlign: 'center',
        fontSize: '13.5px',
        color: 'var(--ink-soft)'
      }}>
        <div className="wrap" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <b>MediKiosk AI</b> — Intelligent Patient History & Clinical Intake Management System
          </div>
          <div>
            FastAPI • MySQL / SQLite • PyPDF & OCR • AI Decision Support
          </div>
        </div>
      </footer>
    </div>
  );
}
