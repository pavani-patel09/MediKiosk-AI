const API_BASE = '/api';

export const getAuthToken = () => localStorage.getItem('medikiosk_token');
export const setAuthToken = (token) => localStorage.setItem('medikiosk_token', token);
export const removeAuthToken = () => localStorage.removeItem('medikiosk_token');

async function request(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Don't set Content-Type if uploading FormData
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errorDetail = 'Request failed';
    try {
      const errJson = await res.json();
      errorDetail = errJson.detail || errorDetail;
    } catch {
      errorDetail = await res.text();
    }
    throw new Error(errorDetail);
  }

  return res.json();
}

export const api = {
  // Auth
  login: (username, password) => 
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    }),
  getMe: () => request('/auth/me'),

  // Patients
  searchPatients: (query) => request(`/patients/search?query=${encodeURIComponent(query)}`),
  checkDuplicatePatient: (phone, name) => 
    request(`/patients/check-duplicate?phone=${encodeURIComponent(phone)}${name ? `&name=${encodeURIComponent(name)}` : ''}`),
  registerPatient: (patientData) => 
    request('/patients/', {
      method: 'POST',
      body: JSON.stringify(patientData)
    }),
  getPatient: (id) => request(`/patients/${id}`),

  // Visits & Intake
  createVisit: (visitData) =>
    request('/visits/', {
      method: 'POST',
      body: JSON.stringify(visitData)
    }),
  submitIntake: (intakeData) =>
    request('/visits/intake', {
      method: 'POST',
      body: JSON.stringify(intakeData)
    }),
  getVisitsQueue: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/visits/queue${query ? `?${query}` : ''}`);
  },
  updateVisitStatus: (id, statusData) =>
    request(`/visits/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(statusData)
    }),

  // Documents & OCR
  uploadDocument: (formData) =>
    request('/documents/upload', {
      method: 'POST',
      body: formData
    }),
  verifyDocument: (verifyData) =>
    request('/documents/verify', {
      method: 'POST',
      body: JSON.stringify(verifyData)
    }),
  getPatientDocuments: (patientId) => request(`/documents/patient/${patientId}`),

  // Timeline
  getTimeline: (patientId) => request(`/timeline/${patientId}`),

  // Clinical Summary
  generateSummary: (visitId) => 
    request(`/summaries/generate/${visitId}`, { method: 'POST' }),
  getSummaryByVisit: (visitId) => request(`/summaries/visit/${visitId}`),
  verifySummary: (summaryId, verifyData) =>
    request(`/summaries/${summaryId}/verify`, {
      method: 'POST',
      body: JSON.stringify(verifyData)
    }),

  // Dashboard Stats
  getDoctorStats: () => request('/stats/doctor'),
  getStaffStats: () => request('/stats/staff')
};
