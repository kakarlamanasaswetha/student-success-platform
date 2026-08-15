import api from './axios';

// Auth
export const registerUser = (data) => api.post('/auth/register', data);
export const loginUser = (data) => api.post('/auth/login', data);
export const fetchMe = () => api.get('/auth/me');

// Student
export const fetchStudentDashboard = (id) => api.get(id ? `/students/${id}/dashboard` : '/students/me/dashboard');
export const fetchStudentProgress = (id) => api.get(id ? `/students/${id}/progress` : '/students/me/progress');
export const fetchStudentRecommendations = (id, refresh = false) =>
  api.get(id ? `/students/${id}/recommendations` : '/students/me/recommendations', { params: { refresh } });
export const recalculateStudentRisk = (id) => api.post(`/students/${id}/recalculate-risk`);

// Advisor
export const fetchStudentList = (params) => api.get('/advisor/students', { params });
export const fetchStudentSummary = (id) => api.get(`/advisor/students/${id}/summary`);
export const fetchStudentNotes = (id) => api.get(`/advisor/students/${id}/notes`);
export const addStudentNote = (id, data) => api.post(`/advisor/students/${id}/notes`, data);

// Courses / instructor
export const fetchCourses = () => api.get('/courses');
export const fetchCourseRoster = (id) => api.get(`/courses/${id}/roster`);

// Alerts
export const fetchAlerts = (status) => api.get('/alerts', { params: status ? { status } : {} });
export const acknowledgeAlert = (id) => api.patch(`/alerts/${id}/acknowledge`);
export const resolveAlert = (id) => api.patch(`/alerts/${id}/resolve`);

// AI
export const fetchAIStatus = () => api.get('/ai/status');
export const sendChatMessage = (message) => api.post('/ai/chat', { message });
export const fetchChatHistory = () => api.get('/ai/chat/history');
