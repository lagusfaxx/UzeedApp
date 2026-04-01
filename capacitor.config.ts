import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'cl.uzeed.app',
  appName: 'Uzeed',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    // Route all HTTP requests through native layer — bypasses CORS and
    // lets the native HTTP stack handle cookies automatically.
    iosScheme: 'capacitor',
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
    CapacitorCookies: {
      enabled: true,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
  },
};

export default config;
