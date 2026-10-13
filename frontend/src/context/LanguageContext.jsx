import React, { createContext, useContext, useState } from 'react';

const LanguageContext = createContext(null);

const translations = {
  en: {
    brand: "MediKiosk AI",
    tagline: "Every patient's story, one intelligent intake.",
    subtagline: "MediKiosk automatically retrieves your previous records and captures today's visit history before you meet the doctor.",
    startKiosk: "Patient Kiosk / Start Intake",
    doctorPortal: "Doctor Portal",
    staffTriage: "Triage & Staff Queue",
    searchPlaceholder: "Search patient by ID, mobile number, or name...",
    registerNew: "+ Register New Patient",
    readAloud: "Read Aloud",
    welcomeTitle: "Welcome to MediKiosk",
    welcomeSub: "AI-Powered Clinical Intake & Patient History System",
    welcomeDesc: "We will automatically retrieve your health history from the hospital records, and collect details about your current visit.",
    startBtn: "Start Intake",
    stepIdentify: "Identify",
    stepConsent: "Consent",
    stepDept: "Department",
    stepIntake: "Symptoms & History",
    stepDocs: "Medical Records",
    stepTimeline: "Timeline Review",
    stepDone: "Complete",
    consentTitle: "Patient Privacy & Consent",
    consentText: "I agree to share my clinical history and medical records with my treating clinical team for today's OPD consultation.",
    consentAgree: "I Agree & Continue",
    consentDecline: "Decline",
    chiefComplaintPrompt: "What brings you to the hospital today?",
    severityPrompt: "How severe is this problem?",
    durationPrompt: "How long have you had this symptom?",
    tapToSpeak: "Tap to Speak",
    listening: "Listening...",
    continueBtn: "Continue",
    backBtn: "Back",
    finishBtn: "Finish Intake",
    uploadPrompt: "Do you have any old prescriptions, lab reports, or discharge summaries?",
    uploadSub: "Upload photos or PDFs — our medical OCR will extract key records for your doctor.",
    simOrUpload: "Upload Medical File",
    timelineTitle: "Your Longitudinal Medical Timeline",
    timelineSub: "Records arranged in chronological order from hospital database and your uploads.",
    confirmTimeline: "Confirm & Send to Doctor"
  },
  hi: {
    brand: "मेडीकियोस्क एआई",
    tagline: "हर मरीज का इतिहास, एक सुरक्षित शुरुआत।",
    subtagline: "मेडीकियोस्क डॉक्टर से मिलने से पहले आपके पिछले रिकॉर्ड स्वतः खोजता है और आज की स्वास्थ्य स्थिति दर्ज करता है।",
    startKiosk: "मरीज कियोस्क / इनटेक शुरू करें",
    doctorPortal: "डॉक्टर पोर्टल",
    staffTriage: "स्टाफ व ट्रायज कतार",
    searchPlaceholder: "मरीज आईडी, मोबाइल नंबर या नाम से खोजें...",
    registerNew: "+ नया मरीज पंजीकृत करें",
    readAloud: "बोलकर सुनाएं",
    welcomeTitle: "मेडीकियोस्क में आपका स्वागत है",
    welcomeSub: "एआई-संचालित क्लिनिकल इनटेक प्रणाली",
    welcomeDesc: "हम अस्पताल के डेटाबेस से आपके पिछले मेडिकल रिकॉर्ड निकालेंगे और आज की समस्या के बारे में जानकारी लेंगे।",
    startBtn: "शुरू करें",
    stepIdentify: "पहचान",
    stepConsent: "सहमति",
    stepDept: "विभाग",
    stepIntake: "लक्षण व इतिहास",
    stepDocs: "मेडिकल दस्तावेज",
    stepTimeline: "समयरेखा समीक्षा",
    stepDone: "समाप्त",
    consentTitle: "मरीज गोपनीयता और सहमति",
    consentText: "मैं आज के परामर्श के लिए अपने मेडिकल रिकॉर्ड और स्वास्थ्य इतिहास को डॉक्टर के साथ साझा करने की सहमति देता/देती हूँ।",
    consentAgree: "सहमति है और आगे बढ़ें",
    consentDecline: "अस्वीकार करें",
    chiefComplaintPrompt: "आज अस्पताल आने का मुख्य कारण क्या है?",
    severityPrompt: "यह समस्या कितनी गंभीर है?",
    durationPrompt: "यह लक्षण कितने समय से हैं?",
    tapToSpeak: "बोलने के लिए दबाएं",
    listening: "सुन रहे हैं...",
    continueBtn: "आगे बढ़ें",
    backBtn: "पीछे जाएं",
    finishBtn: "इनटेक पूर्ण करें",
    uploadPrompt: "क्या आपके पास कोई पुरानी पर्ची, लैब रिपोर्ट या डिस्चार्ज समरी है?",
    uploadSub: "फोटो या पीडीएफ अपलोड करें — हमारा मेडिकल ओसीआर डॉक्टर के लिए जरूरी जानकारी निकाल लेगा।",
    simOrUpload: "मेडिकल फाइल अपलोड करें",
    timelineTitle: "आपकी मेडिकल समयरेखा",
    timelineSub: "अस्पताल के रिकॉर्ड और अपलोड किए गए दस्तावेजों से तिथिनुसार व्यवस्थित इतिहास।",
    confirmTimeline: "सत्यापित करें और डॉक्टर को भेजें"
  },
  te: {
    brand: "మెడికియోస్క్ ఏఐ",
    tagline: "ప్రతి రోగి కథ, ఒకే తెలివైన సమగ్ర రికార్డు.",
    subtagline: "మెడికియోస్క్ డాక్టర్‌ను కలవడానికి ముందు మీ మునుపటి రికార్డులను స్వయంచాలకంగా సేకరిస్తుంది మరియు నేటి సందర్శన వివరాలను నమోదు చేస్తుంది.",
    startKiosk: "రోగి కియోస్క్ / ప్రారంభించండి",
    doctorPortal: "డాక్టర్ పోర్టల్",
    staffTriage: "స్టాఫ్ & ట్రయేజ్ క్యూ",
    searchPlaceholder: "రోగి ID, మొబైల్ నంబర్ లేదా పేరు ద్వారా వెతకండి...",
    registerNew: "+ కొత్త రోగి నమోదు",
    readAloud: "చదివి వినిపించండి",
    welcomeTitle: "మెడికియోస్క్‌కు స్వాగతం",
    welcomeSub: "ఏఐ ఆధారిత క్లినికల్ ఇంటేక్ సిస్టమ్",
    welcomeDesc: "మేము ఆసుపత్రి రికార్డుల నుండి మీ ఆరోగ్య చరిత్రను సేకరిస్తాము మరియు నేటి సమస్య వివరాలను నమోదు చేస్తాము.",
    startBtn: "ప్రారంభించండి",
    stepIdentify: "గుర్తింపు",
    stepConsent: "సమ్మతి",
    stepDept: "విభాగం",
    stepIntake: "లక్షణాలు & చరిత్ర",
    stepDocs: "వైద్య పత్రాలు",
    stepTimeline: "సమయరేఖ సమీక్ష",
    stepDone: "పూర్తి",
    consentTitle: "రోగి గోప్యత & సమ్మతి",
    consentText: "నేటి సంప్రదింపుల కోసం నా వైద్య చరిత్రను డాక్టర్‌తో పంచుకోవడానికి నేను అంగీకరిస్తున్నాను.",
    consentAgree: "అంగీకరిస్తున్నాను",
    consentDecline: "తిరస్కరించండి",
    chiefComplaintPrompt: "ఈరోజు మీరు ఆసుపత్రికి రావడానికి ప్రధాన కారణం ఏమిటి?",
    severityPrompt: "ఈ సమస్య ఎంత తీవ్రంగా ఉంది?",
    durationPrompt: "ఈ లక్షణం ఎంత కాలంగా ఉంది?",
    tapToSpeak: "మాట్లాడటానికి నొక్కండి",
    listening: "వింటున్నాము...",
    continueBtn: "కొనసాగించండి",
    backBtn: "వెనుకకు",
    finishBtn: "ఇంటేక్ పూర్తి చేయండి",
    uploadPrompt: "మీ వద్ద పాత ప్రిస్క్రిప్షన్లు లేదా ల్యాబ్ నివేదికలు ఉన్నాయా?",
    uploadSub: "ఫోటోలు లేదా PDFలను అప్‌లోడ్ చేయండి — మా మెడికల్ OCR డాక్టర్ కోసం కీలక వివరాలను సంగ్రహిస్తుంది.",
    simOrUpload: "వైద్య ఫైల్‌ను అప్‌లోడ్ చేయండి",
    timelineTitle: "మీ వైద్య సమయరేఖ",
    timelineSub: "ఆసుపత్రి రికార్డులు మరియు అప్‌లోడ్ చేసిన పత్రాల నుండి తేదీల ప్రకారం అమర్చబడిన చరిత్ర.",
    confirmTimeline: "నిర్ధారించి డాక్టర్‌కు పంపండి"
  }
};

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState('en');

  const t = (key) => {
    return translations[lang]?.[key] || translations['en']?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
