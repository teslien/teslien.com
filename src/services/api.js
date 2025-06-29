import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/admin/login';
    }
    
    const message = error.response?.data?.message || error.message || 'An error occurred';
    toast.error(message);
    
    return Promise.reject(error);
  }
);

// Auth API functions
export const authAPI = {
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },
  
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
  
  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },
  
  verifyToken: async () => {
    const response = await api.get('/auth/verify');
    return response.data;
  },
  
  changePassword: async (passwords) => {
    const response = await api.put('/auth/change-password', passwords);
    return response.data;
  },
  
  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  }
};

// Blog API functions (public)
export const blogAPI = {
  getBlogs: async (params = {}) => {
    const response = await api.get('/blogs', { params });
    return response.data;
  },
  
  getBlogBySlug: async (slug) => {
    const response = await api.get(`/blogs/${slug}`);
    return response.data;
  },
  
  getRelatedBlogs: async (slug, limit = 3) => {
    const response = await api.get(`/blogs/${slug}/related?limit=${limit}`);
    return response.data;
  },
  
  getTags: async () => {
    const response = await api.get('/blogs/meta/tags');
    return response.data;
  },
  
  getStats: async () => {
    const response = await api.get('/blogs/meta/stats');
    return response.data;
  }
};

// Admin API functions
export const adminAPI = {
  // Blog management
  getBlogs: async (params = {}) => {
    const response = await api.get('/admin/blogs', { params });
    return response.data;
  },
  
  getBlogById: async (id) => {
    const response = await api.get(`/admin/blogs/${id}`);
    return response.data;
  },
  
  createBlog: async (blogData) => {
    const response = await api.post('/admin/blogs', blogData);
    return response.data;
  },
  
  updateBlog: async (id, blogData) => {
    const response = await api.put(`/admin/blogs/${id}`, blogData);
    return response.data;
  },
  
  deleteBlog: async (id) => {
    const response = await api.delete(`/admin/blogs/${id}`);
    return response.data;
  },
  
  // File upload
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await api.post('/admin/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  
  // Dashboard
  getDashboardStats: async () => {
    const response = await api.get('/admin/dashboard/stats');
    return response.data;
  }
};

// Utility functions
export const handleApiError = (error) => {
  const message = error.response?.data?.message || error.message || 'An error occurred';
  toast.error(message);
  return message;
};

export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('authToken', token);
  } else {
    localStorage.removeItem('authToken');
  }
};

export const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

export default api; 