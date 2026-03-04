// utils/api.js
// ⚠️ VULN A02: JWT token stored in localStorage → XSS can steal it
//    Should use httpOnly cookies instead

import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

// VULN: Token in localStorage accessible to any JS on the page
export const getToken = () => localStorage.getItem('token');
export const setToken = (t) => localStorage.setItem('token', t);
export const removeToken = () => localStorage.removeItem('token');

// VULN: User object (with plaintext password potentially) stored in localStorage
export const getUser = () => {
  const u = localStorage.getItem('user');
  return u ? JSON.parse(u) : null;
};
export const setUser = (u) => localStorage.setItem('user', JSON.stringify(u));

const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use(config => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auth
export const login    = (data)  => api.post('/auth/login', data);
export const register = (data)  => api.post('/auth/register', data);
export const getProfile = ()    => api.get('/auth/profile');
export const forgotPassword = (email) => api.post('/auth/forgot-password', { email });

// Products
export const getProducts  = (search) => api.get('/products', { params: { search } });
export const getProduct   = (id)     => api.get(`/products/${id}`);
export const createProduct = (data)  => api.post('/products', data);
export const updateProduct = (id, data) => api.put(`/products/${id}`, data);
export const deleteProduct = (id)    => api.delete(`/products/${id}`);
export const uploadImage   = (form)  => api.post('/products/upload/image', form);
export const readFile      = (file)  => api.get('/products/file/read', { params: { file } });

// Orders
export const getOrders   = ()     => api.get('/orders');
export const getOrder    = (id)   => api.get(`/orders/${id}`);
export const createOrder = (data) => api.post('/orders', data);
export const updateOrderStatus = (id, status) => api.put(`/orders/${id}/status`, { status });

// Users
export const getUsers   = ()     => api.get('/users');
export const getUser_   = (id)   => api.get(`/users/${id}`);
export const updateUser = (id, data) => api.put(`/users/${id}`, data);

// Comments
export const getComments    = (productId) => api.get(`/comments/${productId}`);
export const createComment  = (data)      => api.post('/comments', data);
export const fetchPreview   = (url)       => api.post('/comments/fetch-preview', { url });

// Admin
export const adminStats   = ()     => api.get('/admin/stats');
export const adminPing    = (host) => api.post('/admin/ping', { host });
export const adminDeserialize = (data) => api.post('/admin/deserialize', data);

export default api;
