import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const AI_API_BASE_URL = import.meta.env.VITE_AI_API_BASE_URL;
const MEDICAL_API_BASE_URL = import.meta.env.VITE_MEDICAL_API_BASE_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add authentication interceptor (CRITICAL for backend communication)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const aiApi = axios.create({
  baseURL: AI_API_BASE_URL,
});

aiApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const medicalApi = axios.create({
  baseURL: MEDICAL_API_BASE_URL,
});

medicalApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      url: error.config?.url
    });
    return Promise.reject(error);
  }
);

aiApi.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('AI API Error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      url: error.config?.url
    });
    return Promise.reject(error);
  }
);

medicalApi.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Medical API Error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      url: error.config?.url
    });
    return Promise.reject(error);
  }
);

// Auth Service - matches auth.ts handlers
export const authService = {
  login: (email, password) => api.post("/login", { email, password }),
  register: (userData) => api.post("/register", userData),
};

// User Service - matches user.ts handlers  
export const userService = {
  getUsers: () => api.get("/users"),
  getUser: (id) => api.get(`/users/${id}`),
  createUser: (data) => api.post("/users", data),
  updateUser: (id, data) => api.put(`/users/${id}`, data),
  deleteUser: (id) => api.delete(`/users/${id}`),
  register: (userData) => api.post("/register", userData),
};

// Doctor Service - matches doctor.ts handlers
export const doctorService = {
  getDoctors: () => api.get("/doctors"),
  getDoctor: (id) => api.get(`/doctors/${id}`),
  createDoctor: (data) => api.post("/doctors", data),
  updateDoctor: (id, data) => api.put(`/doctors/${id}`, data),
  deleteDoctor: (id) => api.delete(`/doctors/${id}`),
};

// Patient Service - matches patient.ts handlers
export const patientService = {
  getPatients: () => api.get("/patients"),
  getPatient: (id) => api.get(`/patients/${id}`),
  createPatient: (data) => api.post("/patients", data),
  updatePatient: (id, data) => api.put(`/patients/${id}`, data),
  deletePatient: (id) => api.delete(`/patients/${id}`),
  addMedicalHistory: (id, data) => api.post(`/patients/${id}/medical-history`, data),
};

// Appointment Service - matches appointment.ts handlers
export const appointmentService = {
  getAppointments: () => api.get("/appointments"),
  getAppointment: (id) => api.get(`/appointments/${id}`),
  createAppointment: (data) => api.post("/appointments", data),
  updateAppointment: (id, data) => api.put(`/appointments/${id}`, data),
  deleteAppointment: (id) => api.delete(`/appointments/${id}`),
};

// Transcription Service - matches transcription.ts handlers
export const transcriptionService = {
  transcribe: (data) => api.post("/transcriptions/transcribe", data),
  getTranscriptions: () => api.get("/transcriptions"),
  getTranscription: (id) => api.get(`/transcriptions/${id}`),
  createTranscription: (data) => api.post("/transcriptions", data),
  updateTranscription: (id, data) => api.put(`/transcriptions/${id}`, data),
  deleteTranscription: (id) => api.delete(`/transcriptions/${id}`),
};

// Medical Image Service - uses separate medical API gateway
export const medicalImageService = {
  getMedicalImages: () => medicalApi.get("/medical-images"),
  getMedicalImage: (id) => medicalApi.get(`/medical-images/${id}`),
  uploadMedicalImage: (data) => medicalApi.post("/medical-images", data),
  updateMedicalImage: (id, data) => medicalApi.put(`/medical-images/${id}`, data),
  deleteMedicalImage: (id) => medicalApi.delete(`/medical-images/${id}`),
  analyzeMedicalImage: (id, data) => medicalApi.post(`/medical-images/${id}/analyze`, data),
};

// AI Interaction Service - matches aiInteraction.ts handlers (separate API gateway)
export const aiInteractionService = {
  // Virtual Assistant - expects { userId, query }
  virtualAssistant: (query, userId) =>
    aiApi.post("/ai-interactions/virtual-assistant", { userId, query }),
  
  // Text to Speech - expects { text, language }
  textToSpeech: (text, language = 'en') =>
    aiApi.post("/ai-interactions/text-to-speech", { text, language }),
  
  // CRUD operations
  getAIInteractions: (userId) => {
    const url = userId ? `/ai-interactions?userId=${userId}` : '/ai-interactions';
    return aiApi.get(url);
  },
  getAIInteraction: (id) => aiApi.get(`/ai-interactions/${id}`),
  createAIInteraction: (data) => aiApi.post("/ai-interactions", data),
  updateAIInteraction: (id, data) => aiApi.put(`/ai-interactions/${id}`, data),
  deleteAIInteraction: (id) => aiApi.delete(`/ai-interactions/${id}`),
};

export default api;
