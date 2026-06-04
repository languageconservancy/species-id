import type { CapacitorConfig } from '@capacitor/cli';
import * as fs from 'fs';
import * as path from 'path';

/** Build-time branding: read from generated file (from species-data) or use generic defaults. */
function getBranding(): { appId: string; appName: string } {
  const root = typeof __dirname !== 'undefined' ? __dirname : process.cwd();
  const generatedPath = path.join(root, 'branding.generated.json');
  try {
    if (fs.existsSync(generatedPath)) {
      const data = JSON.parse(fs.readFileSync(generatedPath, 'utf-8'));
      return {
        appId: data.appId ?? 'org.speciesid.app',
        appName: data.appName ?? 'Species ID',
      };
    }
  } catch {
    // use defaults
  }
  return { appId: 'org.speciesid.app', appName: 'Species ID' };
}

const branding = getBranding();

const config: CapacitorConfig = {
  appId: branding.appId,
  appName: branding.appName,
  webDir: 'www',
  plugins: {
    CapacitorHttp: {
      enabled: true,
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
