import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'org.crowlanguage.apsaalookebirdsplants',
  appName: 'Apsáalooke Birds & Plants',
  webDir: 'www',
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
    CapacitorSQLite: {
      iosDatabaseLocation: 'Library/NoCloud/databases',
    },
    StatusBar: {
      overlaysWebView: false,
    },
    VoiceRecorder: {
      enabled: true,
    },
    Keyboard: {
      resize: 'native',
    },
  },
  server: {
    allowNavigation: ['us.i.posthog.com', '*.posthog.com'],
  },
};

export default config;
