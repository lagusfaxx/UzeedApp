import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
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
        // TODO: Navigate based on notification data
      });
    };

    setup();

    return () => {
      PushNotifications.removeAllListeners();
    };
  }, []);
}
