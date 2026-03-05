import { initializeApp } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import type { Messaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let app: FirebaseApp | null = null;
let messaging: Messaging | null = null;

function isFirebaseConfigured(): boolean {
  return !!(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.messagingSenderId &&
    firebaseConfig.appId
  );
}

function initializeFirebase(): boolean {
  if (!isFirebaseConfigured()) {
    console.warn('Firebase not configured. Push notifications disabled.');
    return false;
  }

  if (!app) {
    app = initializeApp(firebaseConfig);
  }

  if (!messaging && 'Notification' in window) {
    messaging = getMessaging(app);
  }

  return true;
}

export async function requestNotificationPermission(): Promise<string | null> {
  if (!initializeFirebase() || !messaging) {
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Notification permission denied');
      return null;
    }

    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      console.error('VAPID key not configured');
      return null;
    }

    // Convert config object to query string
    const params = new URLSearchParams({
      apiKey: firebaseConfig.apiKey || '',
      authDomain: firebaseConfig.authDomain || '',
      projectId: firebaseConfig.projectId || '',
      storageBucket: firebaseConfig.storageBucket || '',
      messagingSenderId: firebaseConfig.messagingSenderId || '',
      appId: firebaseConfig.appId || '',
    });

    // Register service worker with config
    const swUrl = `/firebase-messaging-sw.js?${params.toString()}`;
    const registration = await navigator.serviceWorker.register(swUrl);
    
    // Wait for the service worker to be active
    await navigator.serviceWorker.ready;

    const token = await getToken(messaging, { 
      vapidKey,
      serviceWorkerRegistration: registration 
    });
    console.log('FCM token obtained:', token?.slice(0, 20) + '...');
    return token;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
}

export function onForegroundMessage(callback: (payload: unknown) => void): (() => void) | null {
  if (!initializeFirebase() || !messaging) {
    return null;
  }

  return onMessage(messaging, callback);
}

export function isNotificationSupported(): boolean {
  return 'Notification' in window && 'serviceWorker' in navigator;
}

export function getNotificationPermissionStatus(): NotificationPermission | null {
  if (!('Notification' in window)) {
    return null;
  }
  return Notification.permission;
}
