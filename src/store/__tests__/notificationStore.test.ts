import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useNotificationStore } from '../notificationStore';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('notificationStore', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
    // Reset store state
    useNotificationStore.setState({
      fcmToken: null,
      isSubscribed: false,
    });
  });

  describe('initial state', () => {
    it('should have null fcmToken when localStorage is empty', () => {
      const state = useNotificationStore.getState();
      expect(state.fcmToken).toBeNull();
      expect(state.isSubscribed).toBe(false);
    });
  });

  describe('setToken', () => {
    it('should set token and update isSubscribed to true', () => {
      const { setToken } = useNotificationStore.getState();

      setToken('test-fcm-token');

      const state = useNotificationStore.getState();
      expect(state.fcmToken).toBe('test-fcm-token');
      expect(state.isSubscribed).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('fcmToken', 'test-fcm-token');
    });

    it('should remove token from localStorage when set to null', () => {
      const { setToken } = useNotificationStore.getState();

      setToken('test-fcm-token');
      setToken(null);

      const state = useNotificationStore.getState();
      expect(state.fcmToken).toBeNull();
      expect(state.isSubscribed).toBe(false);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('fcmToken');
    });
  });

  describe('clearToken', () => {
    it('should clear token and set isSubscribed to false', () => {
      const { setToken, clearToken } = useNotificationStore.getState();

      setToken('test-fcm-token');
      clearToken();

      const state = useNotificationStore.getState();
      expect(state.fcmToken).toBeNull();
      expect(state.isSubscribed).toBe(false);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('fcmToken');
    });
  });
});
