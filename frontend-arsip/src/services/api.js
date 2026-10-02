import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add bearer token automatically
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: auto-logout on 401
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired or invalid, clear auth data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Redirect to login if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// =============================================
// AUTH SERVICES (SSO via Absensi Backend)
// =============================================
export const authService = {
  login: async (email, password) => {
    const response = await API.post('/login', { email, password });
    if (response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  register: async (name, email, password) => {
    const response = await API.post('/register', { name, email, password });
    if (response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  verifySso: async (absensiToken) => {
    const response = await API.post('/sso/verify', { token: absensiToken });
    if (response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  logout: async () => {
    try {
      await API.post('/logout');
    } catch (err) {
      // Even if API fails, clear local data
      console.warn('Logout API call failed:', err);
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getUser: () => {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  },

  getToken: () => {
    return localStorage.getItem('token');
  },

  isLoggedIn: () => {
    return !!localStorage.getItem('token');
  }
};

// =============================================
// MODUL SERVICES
// =============================================
export const modulService = {
  // Get modules (filtered by role on backend)
  getMyModuls: async () => {
    const response = await API.get('/moduls');
    return response.data.data;
  },

  // Get all modules (Admin view)
  getAllModuls: async () => {
    const response = await API.get('/moduls');
    return response.data.data;
  },

  // Upload a module
  uploadModul: async (formData) => {
    const response = await API.post('/moduls', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Update a module
  updateModul: async (id, formData) => {
    const response = await API.post(`/moduls/${id}/update`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Review module (Admin action)
  reviewModul: async (id, status, catatanRevisi) => {
    const response = await API.post(`/moduls/${id}/review`, {
      status,
      catatan_revisi: catatanRevisi,
    });
    return response.data;
  },

  // Delete module (Admin action)
  deleteModul: async (id) => {
    const response = await API.post(`/moduls/${id}/delete`);
    return response.data;
  }
};

// =============================================
// MAPEL SERVICES
// =============================================
export const mapelService = {
  getAllMapels: async () => {
    const response = await API.get('/mapels');
    return response.data;
  },
  createMapel: async (data) => {
    const response = await API.post('/mapels', data);
    return response.data;
  },
  updateMapel: async (id, data) => {
    const response = await API.put(`/mapels/${id}`, data);
    return response.data;
  },
  deleteMapel: async (id) => {
    const response = await API.delete(`/mapels/${id}`);
    return response.data;
  }
};

// =============================================
// JENIS PERANGKAT SERVICES
// =============================================
export const jenisPerangkatService = {
  getAllJenis: async () => {
    const response = await API.get('/jenis-perangkat');
    return response.data;
  },
  createJenis: async (data) => {
    const response = await API.post('/jenis-perangkat', data);
    return response.data;
  },
  updateJenis: async (id, data) => {
    const response = await API.put(`/jenis-perangkat/${id}`, data);
    return response.data;
  },
  deleteJenis: async (id) => {
    const response = await API.delete(`/jenis-perangkat/${id}`);
    return response.data;
  }
};

// =============================================
// USER SERVICES (Admin - Kelola Akun)
// =============================================
export const userService = {
  getAllUsers: async () => {
    const response = await API.get('/users');
    return response.data;
  },
  getPendingUsers: async () => {
    const response = await API.get('/users/pending');
    return response.data;
  },
  approveUser: async (id) => {
    const response = await API.post(`/users/${id}/approve`);
    return response.data;
  },
  updateStatus: async (id, status) => {
    const response = await API.put(`/users/${id}/status`, { status });
    return response.data;
  },
  updateRole: async (id, data) => {
    const response = await API.put(`/users/${id}/role`, data);
    return response.data;
  },
  resetPassword: async (id) => {
    const response = await API.put(`/users/${id}/reset-password`);
    return response.data;
  },
  deleteUser: async (id) => {
    const response = await API.delete(`/users/${id}`);
    return response.data;
  }
};
// =============================================
// SETTINGS SERVICES
// =============================================
export const settingsService = {
  getActiveTahunAjaran: async () => {
    const response = await API.get('/settings/tahun-ajaran');
    return response.data;
  },
  updateActiveTahunAjaran: async (tahunAjaran) => {
    const response = await API.put('/settings/tahun-ajaran', { tahun_ajaran: tahunAjaran });
    return response.data;
  }
};
