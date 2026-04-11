import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL + '/api';

const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export const authApi = {
  register: (email, password) => api.post('/auth/register', { email, password }),
  login: (email, password) => api.post('/auth/login', { email, password }),
};

export const repoApi = {
  ingest: (repoUrl) => api.post('/ingest-repo', { repoUrl }),
  switchRepo: (repoUrl) => api.post('/switch-repo', { repoUrl }),
  listRepos: () => api.get('/repos'),
};

export const searchApi = {
  search: (query) => api.post('/search', { query }),
};

export const chatApi = {
  ask: (question) => api.post('/chat', { question }),
};

export default api;
