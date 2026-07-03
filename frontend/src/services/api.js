import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true // Send cookies with every request
});

// Request interceptor — attach token from localStorage (fallback for cookie-based auth)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ems_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor — handle token refresh on 401
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retrying, attempt token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't retry refresh or login requests
      if (originalRequest.url?.includes('/auth/refresh-token') ||
          originalRequest.url?.includes('/auth/login')) {
        return Promise.reject(error.response?.data || error);
      }

      if (isRefreshing) {
        // Queue the request while refresh is in progress
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          if (token) originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await api.post('/auth/refresh-token');
        const newToken = data.token;

        // Update stored token
        if (newToken) {
          localStorage.setItem('ems_token', newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }

        processQueue(null, newToken);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        // Refresh failed — clear auth and redirect to login
        localStorage.removeItem('ems_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error.response?.data || error);
  }
);

export const listResource = (resource, params) => api.get(`/${resource}`, { params }).then((res) => res.data);
export const getResource = (resource, id) => api.get(`/${resource}/${id}`).then((res) => res.data);
export const createResource = (resource, payload) => api.post(`/${resource}`, payload).then((res) => res.data);
export const updateResource = (resource, id, payload) => api.patch(`/${resource}/${id}`, payload).then((res) => res.data);
export const deleteResource = (resource, id) => api.delete(`/${resource}/${id}`).then((res) => res.data);
