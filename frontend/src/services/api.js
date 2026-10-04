import { isSupabaseConfigured } from './supabaseClient';
import { supabaseService } from './supabaseService';

const API_BASE = '/api';

export const authStorage = {
  getToken: () => localStorage.getItem('cw_token'),
  setToken: (token) => localStorage.setItem('cw_token', token),
  removeToken: () => localStorage.removeItem('cw_token'),
  getUser: () => {
    try {
      const u = localStorage.getItem('cw_user');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  },
  setUser: (user) => localStorage.setItem('cw_user', JSON.stringify(user)),
  removeUser: () => localStorage.removeItem('cw_user'),
  clear: () => {
    localStorage.removeItem('cw_token');
    localStorage.removeItem('cw_user');
  }
};

async function request(endpoint, options = {}) {
  const token = authStorage.getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || data.message || `Request failed with status ${response.status}`;
    const err = new Error(errorMsg);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
}

export const api = {
  // Auth
  studentLogin: (roll_number, password) =>
    isSupabaseConfigured
      ? supabaseService.studentLogin(roll_number, password)
      : request('/auth/student/login', {
          method: 'POST',
          body: JSON.stringify({ roll_number, password }),
        }),

  studentRegister: (userData) =>
    isSupabaseConfigured
      ? supabaseService.studentRegister(userData)
      : request('/auth/student/register', {
          method: 'POST',
          body: JSON.stringify(userData),
        }),

  adminLogin: (username, password) =>
    isSupabaseConfigured
      ? supabaseService.adminLogin(username, password)
      : request('/auth/admin/login', {
          method: 'POST',
          body: JSON.stringify({ username, password }),
        }),

  getProfile: () =>
    isSupabaseConfigured ? supabaseService.getProfile() : request('/auth/me'),

  getSections: () =>
    isSupabaseConfigured ? supabaseService.getSections() : request('/auth/sections'),

  // Classworks
  getClassworks: (params = {}) => {
    if (isSupabaseConfigured) {
      return supabaseService.getClassworks(params);
    }
    const query = new URLSearchParams();
    if (params.section) query.append('section', params.section);
    if (params.category) query.append('category', params.category);
    if (params.priority) query.append('priority', params.priority);
    if (params.search) query.append('search', params.search);
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return request(`/classworks${queryString}`);
  },

  getClassworkById: (id) =>
    isSupabaseConfigured ? supabaseService.getClassworkById(id) : request(`/classworks/${id}`),

  createClasswork: (workData) =>
    isSupabaseConfigured
      ? supabaseService.createClasswork(workData)
      : request('/classworks', {
          method: 'POST',
          body: JSON.stringify(workData),
        }),

  updateClasswork: (id, workData) =>
    isSupabaseConfigured
      ? supabaseService.updateClasswork(id, workData)
      : request(`/classworks/${id}`, {
          method: 'PUT',
          body: JSON.stringify(workData),
        }),

  deleteClasswork: (id) =>
    isSupabaseConfigured
      ? supabaseService.deleteClasswork(id)
      : request(`/classworks/${id}`, {
          method: 'DELETE',
        }),

  // Completions
  toggleComplete: (id, notes = '') =>
    isSupabaseConfigured
      ? supabaseService.toggleComplete(id, notes)
      : request(`/classworks/${id}/complete`, {
          method: 'POST',
          body: JSON.stringify({ notes }),
        }),

  getClassworkCompletions: (id) =>
    isSupabaseConfigured
      ? supabaseService.getClassworkCompletions(id)
      : request(`/classworks/${id}/completions`),

  getStats: () =>
    isSupabaseConfigured ? supabaseService.getStats() : request('/classworks/stats'),
};
