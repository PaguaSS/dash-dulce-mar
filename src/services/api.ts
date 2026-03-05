import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Token refresh state to prevent race conditions
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const subscribeTokenRefresh = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};

const onTokenRefreshed = (token: string) => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

const onRefreshFailed = () => {
  refreshSubscribers = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check for 401/403 and if this request hasn't been retried yet
    if ((error.response?.status === 401 || error.response?.status === 403) && !originalRequest._retry) {
      originalRequest._retry = true;

      // If already refreshing, wait for the refresh to complete
      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((token: string) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }

      isRefreshing = true;

      try {
        const refreshToken = useAuthStore.getState().refreshToken;
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        // Use a clean axios instance to avoid interceptor loops
        const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
        const response = await axios.post<{ accessToken: string }>(
          `${baseURL}/auth/refresh-token`,
          { refreshToken }
        );

        const { accessToken } = response.data;

        // Update store
        const currentUser = useAuthStore.getState().user;
        if (currentUser) {
          useAuthStore.getState().setAuth(currentUser, accessToken, refreshToken);
        }

        // Update header and notify subscribers
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;

        isRefreshing = false;
        onTokenRefreshed(accessToken);

        return api(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        onRefreshFailed();

        // Refresh failed -> Logout and Redirect
        useAuthStore.getState().logout();
        window.location.href = '/';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
