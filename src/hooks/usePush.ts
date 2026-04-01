import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

// Push notifications are disabled until Firebase is configured.
// To enable:
// 1. Create a project at https://console.firebase.google.com
// 2. Download google-services.json
// 3. Place it in android/app/google-services.json
// 4. Uncomment the code below and remove the empty function

export function usePushNotifications() {
  // No-op until Firebase is configured.
  // PushNotifications.register() crashes the Android app with
  // "Default FirebaseApp is not initialized" if google-services.json
  // is missing — and the crash happens in native Java, so JS try/catch
  // cannot prevent it.
}

/*
// Uncomment once google-services.json is in place:
import { PushNotifications } from '@capacitor/push-notifications';

export function usePushNotifications() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const setup = async () => {
      const permission = await PushNotifications.requestPermissions();
      if (permission.receive !== 'granted') return;

      await PushNotifications.register();

      PushNotifications.addListener('registration', (token) => {
        console.log('[Push] Token:', token.value);
        // TODO: Send token to backend for push delivery
      });

      PushNotifications.addListener('registrationError', (err) => {
        console.error('[Push] Registration error:', err);
      });

      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('[Push] Received:', notification);
      });

      PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
        console.log('[Push] Action:', action);
      });
    };

    setup();
    return () => { PushNotifications.removeAllListeners(); };
  }, []);
}
*/
