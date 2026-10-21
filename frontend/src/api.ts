import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: attach JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

// Auth
export const register = (email: string, password: string, full_name: string) =>
  api.post('/api/v1/auth/register', { email, password, full_name });

export const login = (email: string, password: string) =>
  api.post('/api/v1/auth/login', { email, password });

export const getMe = () => api.get('/api/v1/auth/me');

// Documents
export const uploadDocument = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/api/v1/documents', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const listDocuments = () => api.get('/api/v1/documents');
export const getDocument = (id: string) => api.get(`/api/v1/documents/${id}`);
export const deleteDocument = (id: string) => api.delete(`/api/v1/documents/${id}`);

// Chat
export const sendMessage = (message: string, conversationId?: string, documentIds?: string[]) =>
  api.post('/api/v1/chat', {
    message,
    conversation_id: conversationId || undefined,
    document_ids: documentIds || undefined,
  });

// Conversations
export const listConversations = () => api.get('/api/v1/conversations');
export const getConversationMessages = (id: string) =>
  api.get(`/api/v1/conversations/${id}/messages`);
export const deleteConversation = (id: string) => api.delete(`/api/v1/conversations/${id}`);

// Health
export const healthCheck = () => api.get('/health');

export default api;
