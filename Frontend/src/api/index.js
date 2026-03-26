import axios from 'axios';

const API_BASE_URL = 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('wf_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('wf_token');
      localStorage.removeItem('wf_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
};

// User API
export const userAPI = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  getDepartments: () => api.get('/users/departments'),
};

// Task API
export const taskAPI = {
  getAll: (params) => api.get('/tasks', { params }),
  getById: (id) => api.get(`/tasks/${id}`),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  updateStatus: (id, status) => api.patch(`/tasks/${id}/status`, { status }),
  delete: (id) => api.delete(`/tasks/${id}`),
  addComment: (id, text) => api.post(`/tasks/${id}/comments`, { text }),
};

// Progress API
export const progressAPI = {
  log: (data) => api.post('/progress', data),
  getAll: (params) => api.get('/progress', { params }),
  getSummary: (userId) => api.get(`/progress/summary/${userId}`),
};

// Alert API
export const alertAPI = {
  getAll: (params) => api.get('/alerts', { params }),
  markAsRead: (id) => api.patch(`/alerts/${id}/read`),
  markAllAsRead: () => api.patch('/alerts/read-all'),
  delete: (id) => api.delete(`/alerts/${id}`),
};

// Analytics API
export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getProductivityTrends: (params) => api.get('/analytics/productivity-trends', { params }),
  getDepartmentStats: () => api.get('/analytics/department-stats'),
  getTaskDistribution: () => api.get('/analytics/task-distribution'),
  getTopPerformers: (params) => api.get('/analytics/top-performers', { params }),
};

// Report API
export const reportAPI = {
  generate: (data) => api.post('/reports/generate', data),
  getAll: (params) => api.get('/reports', { params }),
  getById: (id) => api.get(`/reports/${id}`),
  delete: (id) => api.delete(`/reports/${id}`),
};

// Scoring API
export const scoringAPI = {
  getScore: (userId) => api.get(`/scoring/${userId}`),
  predict: (userId) => api.get(`/scoring/${userId}/predict`),
};

// Automation API
export const automationAPI = {
  getLogs: (params) => api.get('/automation/logs', { params }),
  getStatus: () => api.get('/automation/status'),
  trigger: (workflow) => api.post(`/automation/trigger/${workflow}`),
};

export default api;
