import { create } from 'zustand';
import type { User } from '../types/auth';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');

  return {
    user,
    isAuthenticated: !!accessToken,
    accessToken,
    refreshToken,
    setAuth: (user, accessToken, refreshToken) => {
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      set({ user, isAuthenticated: true, accessToken, refreshToken });
    },
    logout: () => {
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      set({ user: null, isAuthenticated: false, accessToken: null, refreshToken: null });
    },
  };
});
