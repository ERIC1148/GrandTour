import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.grandtour.app',
  appName: 'Grand Tour',
  webDir: 'dist',
  android: {
    // The wine field goes edge to edge; the web layout already pads for the
    // status and gesture bars via env(safe-area-inset-*).
    backgroundColor: '#161013',
  },
  plugins: {
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#161013',
      overlaysWebView: true,
    },
  },
};

export default config;
