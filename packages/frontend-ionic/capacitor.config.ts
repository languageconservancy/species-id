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
    VoiceRecorder: {
      enabled: true,
    },
  },
  server: {
    allowNavigation: ['us.i.posthog.com', '*.posthog.com'],
  },
};

export default config;
