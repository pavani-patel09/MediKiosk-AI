import React, { useState } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function SpeechMicButton({ onTranscript, className = '' }) {
  const [listening, setListening] = useState(false);
  const { lang, t } = useLanguage();

  const handleToggleMic = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use Google Chrome or Edge.');
      return;
    }

    if (listening) {
      setListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;

      // Select recognition language
      if (lang === 'hi') recognition.lang = 'hi-IN';
      else if (lang === 'te') recognition.lang = 'te-IN';
      else recognition.lang = 'en-IN';

      recognition.onstart = () => {
        setListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript && onTranscript) {
          onTranscript(transcript);
        }
      };

      recognition.onerror = (err) => {
        console.error('Speech recognition error:', err);
        setListening(false);
      };

      recognition.onend = () => {
        setListening(false);
      };

      recognition.start();
    } catch (e) {
      console.error('Speech recognition failed to start:', e);
      setListening(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      <button
        type="button"
        onClick={handleToggleMic}
        className={`btn ${listening ? 'btn-coral mic-active' : 'btn-outline'} ${className}`}
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          padding: 0,
          boxShadow: listening ? '0 0 0 8px rgba(232, 89, 12, 0.2)' : 'none'
        }}
      >
        {listening ? <MicOff size={26} /> : <Mic size={26} />}
      </button>
      <span style={{ fontSize: '13px', fontWeight: 600, color: listening ? 'var(--coral-600)' : 'var(--ink-soft)' }}>
        {listening ? t('listening') : t('tapToSpeak')}
      </span>
    </div>
  );
}
