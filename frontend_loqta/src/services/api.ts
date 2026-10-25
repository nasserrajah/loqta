import axios from 'axios';
import type { ApiEnvelope, ApiPaginated, AuthResponse, CartDto, CategoriesResponse, ProductDto, ProductListQuery, UserDto } from './types';

/**
 * Central API layer. Use relative /api in dev (via Vite proxy) to avoid CORS,
 * otherwise use VITE_API_BASE_URL.
 */
const isDev = import.meta.env.DEV;
export const API_BASE_URL = isDev
  ? '/api/v1'
  : import.meta.env.VITE_API_BASE_URL || 'https://loqta-feto.onrender.com/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000,
});

const TOKEN_KEY = 'loqta_token';

export function setToken(token: string | null): void {
  if (token) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      // storage unavailable — the HttpOnly cookie still supports auth
    }
  } else {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      // ignore
    }
  }
}

function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

api.interceptors.request.use((config) => {
  // Prefer the Authorization header over the session cookie; the backend
  // accepts either and the header survives third-party cookie restrictions.
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Strip tokens/secrets from client-side error logs — never log them.
 * Note: keep logs short and structured; the backend never returns secrets.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const code = error.response?.data?.error?.code;
    if (error.code === 'ECONNABORTED') {
      console.error('API Error: request timed out');
    } else {
      console.error(`API Error: ${status ?? 'network'} ${code ?? error.message}`);
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (data: { email: string; password: string }): Promise<ApiEnvelope<AuthResponse>> => {
    const res = await api.post('/auth/login', data);
    const body = res.data;
    // Try to extract token if backend returns it (future deploy)
    const token = body?.data?.token || body?.token || null;
    if (token) setToken(token);
    // Normalize to expected shape
    return body?.data ? { data: body.data } : body;
  },
  register: async (data: { email: string; password: string; fullName: string }): Promise<ApiEnvelope<AuthResponse>> => {
    const res = await api.post('/auth/register', data);
    const body = res.data;
    const token = body?.data?.token || body?.token || null;
    if (token) setToken(token);
    return body?.data ? { data: body.data } : body;
  },
  logout: async () => {
    try {
      return (await api.post('/auth/logout')).data;
    } finally {
      setToken(null);
    }
  },
  me: async (): Promise<ApiEnvelope<UserDto>> => {
    const res = await api.get('/auth/me');
    const body = res.data;
    return body?.data ? { data: body.data } : body;
  },
  /** POST /auth/forgot-password — backend answers 202 with a generic message. */
  forgotPassword: async (email: string): Promise<ApiEnvelope<{ message: string }>> =>
    (await api.post('/auth/forgot-password', { email })).data,
  /** POST /auth/reset-password — uses the code from the email. */
  resetPassword: async (data: { token: string; newPassword: string }): Promise<ApiEnvelope<{ message: string }>> =>
    (await api.post('/auth/reset-password', data)).data,
  /** PUT /users/me/password — change password while authenticated. */
  changePassword: async (data: { currentPassword: string; newPassword: string }): Promise<ApiEnvelope<{ message: string }>> =>
    (await api.put('/users/me/password', data)).data,
};

export const favoriteService = {
  list: async (params?: { page?: number; pageSize?: number }): Promise<ApiPaginated<ProductDto>> =>
    (await api.get('/favorites', { params })).data,
  add: async (productId: string) => (await api.post(`/favorites/${productId}`)).data,
  remove: async (productId: string) => {
    await api.delete(`/favorites/${productId}`);
  },
};

export const cartService = {
  get: async (): Promise<ApiEnvelope<CartDto>> => (await api.get('/cart')).data,
  addItem: async (productId: string, quantity = 1): Promise<ApiEnvelope<CartDto>> =>
    (await api.post('/cart/items', { productId, quantity })).data,
  updateItem: async (itemId: string, quantity: number): Promise<ApiEnvelope<CartDto>> =>
    (await api.patch(`/cart/items/${itemId}`, { quantity })).data,
  removeItem: async (itemId: string): Promise<ApiEnvelope<CartDto>> =>
    (await api.delete(`/cart/items/${itemId}`)).data,
  clear: async () => {
    await api.delete('/cart');
  },
};

export const productService = {
  getProducts: async (params?: ProductListQuery): Promise<ApiPaginated<ProductDto>> =>
    (await api.get('/products', { params })).data,
  getProduct: async (id: string): Promise<ApiEnvelope<ProductDto>> => (await api.get(`/products/${id}`)).data,
};

export const categoryService = {
  /**
   * GET /categories returns a plain array (verified against the live API docs).
   * Defensively unwrap { data: [...] } as well.
   */
  list: async (): Promise<CategoriesResponse> => {
    const body = (await api.get('/categories')).data;
    return Array.isArray(body) ? body : body?.data ?? [];
  },
};
