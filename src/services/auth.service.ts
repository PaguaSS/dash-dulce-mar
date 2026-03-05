import api from './api';
import type { LoginCredentials, AuthResponse } from '../types/auth'; // We'll create types next or inline them if preferred

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },

  refreshToken: async (token: string): Promise<{ accessToken: string }> => {
    const response = await api.post<{ accessToken: string }>('/auth/refresh-token', { refreshToken: token });
    return response.data;
  },
};
