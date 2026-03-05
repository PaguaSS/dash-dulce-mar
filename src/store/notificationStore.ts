import { create } from 'zustand';

interface NotificationState {
  fcmToken: string | null;
  isSubscribed: boolean;
  setToken: (token: string | null) => void;
  clearToken: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => {
  const storedToken = localStorage.getItem('fcmToken');

  return {
    fcmToken: storedToken,
    isSubscribed: !!storedToken,
    setToken: (token) => {
      if (token) {
        localStorage.setItem('fcmToken', token);
      } else {
        localStorage.removeItem('fcmToken');
      }
      set({ fcmToken: token, isSubscribed: !!token });
    },
    clearToken: () => {
      localStorage.removeItem('fcmToken');
      set({ fcmToken: null, isSubscribed: false });
    },
  };
});
