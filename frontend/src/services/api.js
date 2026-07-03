import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ems_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error.response?.data || error)
);

export const listResource = (resource, params) => api.get(`/${resource}`, { params }).then((res) => res.data);
export const getResource = (resource, id) => api.get(`/${resource}/${id}`).then((res) => res.data);
export const createResource = (resource, payload) => api.post(`/${resource}`, payload).then((res) => res.data);
export const updateResource = (resource, id, payload) => api.patch(`/${resource}/${id}`, payload).then((res) => res.data);
export const deleteResource = (resource, id) => api.delete(`/${resource}/${id}`).then((res) => res.data);
