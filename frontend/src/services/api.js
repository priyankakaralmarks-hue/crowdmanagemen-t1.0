import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle unauthorized responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Don't auto-redirect on login or auth checks
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/signup')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
  getDemoAccounts: () => api.get('/auth/demo-accounts')
};

// Resource endpoints
export const resourceApi = {
  getAll: () => api.get('/resources'),
  getById: (id) => api.get(`/resources/${id}`),
  create: (data) => api.post('/resources', data),
  update: (id, data) => api.put(`/resources/${id}`, data),
  delete: (id) => api.delete(`/resources/${id}`)
};

// Request endpoints
export const requestApi = {
  submit: (data) => api.post('/requests', data),
  getMyRequests: () => api.get('/requests/my-requests'),
  getAll: (params) => api.get('/requests', { params }),
  getById: (id) => api.get(`/requests/${id}`)
};

// Vote endpoints
export const voteApi = {
  castVote: (requestId) => api.post(`/votes/${requestId}`),
  removeVote: (requestId) => api.delete(`/votes/${requestId}`),
  getMyVotes: () => api.get('/votes/my-votes')
};

// Ranking endpoints
export const rankingApi = {
  getLeaderboard: (params) => api.get('/ranking', { params }),
  getExplanation: (requestId) => api.get(`/ranking/explain/${requestId}`)
};

// Allocation endpoints
export const allocationApi = {
  allocate: (requestId, data) => api.post(`/allocations/${requestId}`, data || {}),
  getHistory: (params) => api.get('/allocations/history', { params })
};

// Stats endpoints
export const statsApi = {
  getOverview: () => api.get('/stats/overview')
};

export default api;
