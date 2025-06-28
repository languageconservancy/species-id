import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'frontend-ionic',
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
