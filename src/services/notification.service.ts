import api from './api';

export const notificationService = {
  subscribe: async (fcmToken: string, deviceName?: string): Promise<void> => {
    await api.post('/notifications/subscribe', { fcmToken, deviceName });
  },

  unsubscribe: async (fcmToken: string): Promise<void> => {
    await api.post('/notifications/unsubscribe', { fcmToken });
  },

  sendTestNotification: async (): Promise<void> => {
    await api.post('/notifications/test');
  },
};
