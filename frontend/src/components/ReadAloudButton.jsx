import React, { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function ReadAloudButton({ text, className = '' }) {
  const [speaking, setSpeaking] = useState(false);
  const { lang } = useLanguage();

  const toggleSpeak = () => {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech is not supported by your browser.');
      return;
    }

    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    if (!text) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Choose appropriate locale
    if (lang === 'hi') utterance.lang = 'hi-IN';
    else if (lang === 'te') utterance.lang = 'te-IN';
    else utterance.lang = 'en-IN';
    
    utterance.rate = 0.95;

    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  return (
    <button
      onClick={toggleSpeak}
      className={`btn btn-sm ${speaking ? 'btn-coral' : 'btn-ghost'} ${className}`}
      title="Read aloud"
      type="button"
    >
      {speaking ? <VolumeX size={16} /> : <Volume2 size={16} />}
      <span>{speaking ? 'Stop' : 'Read Aloud'}</span>
    </button>
  );
}
