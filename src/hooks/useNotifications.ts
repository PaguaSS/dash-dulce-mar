import { useEffect, useCallback, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import {
  requestNotificationPermission,
  onForegroundMessage,
  isNotificationSupported,
  getNotificationPermissionStatus,
} from '../lib/firebase';
import { notificationService } from '../services/notification.service';
import toast from 'react-hot-toast';

interface NotificationPayload {
  notification?: {
    title?: string;
    body?: string;
  };
  data?: Record<string, string>;
}

export function useNotifications() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { fcmToken, isSubscribed, setToken, clearToken } = useNotificationStore();
  const [isLoading, setIsLoading] = useState(false);

  const permissionStatus = getNotificationPermissionStatus();
  const isSupported = isNotificationSupported();
  const isBlocked = permissionStatus === 'denied';

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isAuthenticated || !isSupported) {
      return false;
    }

    setIsLoading(true);
    try {
      const token = await requestNotificationPermission();
      if (token) {
        const deviceName = `${navigator.userAgent.slice(0, 50)}...`;
        await notificationService.subscribe(token, deviceName);
        setToken(token);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error subscribing to notifications:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, isSupported, setToken]);

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!fcmToken) {
      return true;
    }

    setIsLoading(true);
    try {
      await notificationService.unsubscribe(fcmToken);
      clearToken();
      return true;
    } catch (error) {
      console.error('Error unsubscribing from notifications:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [fcmToken, clearToken]);

  // Handle foreground messages
  useEffect(() => {
    if (!isAuthenticated || !fcmToken) {
      return;
    }

    const unsubscribeFn = onForegroundMessage((payload: unknown) => {
      const typedPayload = payload as NotificationPayload;
      const title = typedPayload.notification?.title || 'Dulce Mar';
      const body = typedPayload.notification?.body || '';

      toast(body, {
        icon: '🔔',
        duration: 5000,
      });

      // Also show a native notification if page is visible but not focused
      if (document.visibilityState === 'visible' && Notification.permission === 'granted') {
        new Notification(title, {
          body,
          icon: '/dulce-mar-logo.png',
        });
      }
    });

    return () => {
      if (unsubscribeFn) {
        unsubscribeFn();
      }
    };
  }, [isAuthenticated, fcmToken]);

  return {
    subscribe,
    unsubscribe,
    isSubscribed,
    isLoading,
    isSupported,
    isBlocked,
    permissionStatus,
  };
}
