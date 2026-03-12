#!/usr/bin/env node
/**
 * Apply branding from species-data to the app (version-control safe).
 * Reads config and optional branding/ assets; writes branding.generated.json
 * so Capacitor uses project app name/ID. Run before: ionic build && cap sync
 *
 * Usage: node scripts/apply-branding.mjs
 * Requires: src/assets/species-data/config/config.json (or no-op with defaults)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const SPECIES_DATA = path.join(ROOT, 'src', 'assets', 'species-data');
const CONFIG_PATH = path.join(SPECIES_DATA, 'config', 'config.json');
const BRANDING_DIR = path.join(SPECIES_DATA, 'branding');
const OUT_PATH = path.join(ROOT, 'branding.generated.json');
const WEB_ICON_DIR = path.join(ROOT, 'src', 'assets', 'core', 'icon');
const ANDROID_RES = path.join(ROOT, 'android', 'app', 'src', 'main', 'res');
const IOS_APPICON_DEST = path.join(ROOT, 'ios', 'App', 'App', 'Assets.xcassets', 'AppIcon.appiconset', 'AppIcon.png');
const IOS_SPLASH_DEST = path.join(ROOT, 'ios', 'App', 'App', 'Assets.xcassets', 'Splash.imageset');

/** Copy a file or directory recursively to dest. */
function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const name of fs.readdirSync(src)) {
      copyRecursive(path.join(src, name), path.join(dest, name));
    }
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

function main() {
  let config = {};
  if (fs.existsSync(CONFIG_PATH)) {
    try {
      config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
    } catch (e) {
      console.warn('Could not parse config.json:', e.message);
    }
  } else {
    console.log('No species-data config found; using generic defaults (no file written).');
    return;
  }

  const appName = config.appName ?? config.mainMenuLabel ?? 'Species ID';
  const appId = config.appId ?? 'org.speciesid.app';
  const splashBackgroundColor = config.splashBackgroundColor ?? null;

  const generated = { appName, appId };
  if (splashBackgroundColor) generated.splashBackgroundColor = splashBackgroundColor;

  fs.writeFileSync(OUT_PATH, JSON.stringify(generated, null, 2) + '\n', 'utf-8');
  console.log('Wrote', OUT_PATH, '-> appName:', appName, 'appId:', appId);

  // Optional: copy icon assets from species-data/branding/ to web assets
  if (fs.existsSync(BRANDING_DIR)) {
    const faviconSrc = path.join(BRANDING_DIR, 'favicon.png');
    const iconNoBgSrc = path.join(BRANDING_DIR, 'icon-no-bg.png');
    const iconSrc = path.join(BRANDING_DIR, 'icon.png');
    if (fs.existsSync(WEB_ICON_DIR)) {
      if (fs.existsSync(faviconSrc)) {
        fs.copyFileSync(faviconSrc, path.join(WEB_ICON_DIR, 'favicon.png'));
        console.log('Copied branding/favicon.png -> assets/core/icon/');
      }
      if (fs.existsSync(iconNoBgSrc)) {
        fs.copyFileSync(iconNoBgSrc, path.join(WEB_ICON_DIR, 'icon-no-bg.png'));
        console.log('Copied branding/icon-no-bg.png -> assets/core/icon/');
      }
      if (fs.existsSync(iconSrc) && !fs.existsSync(faviconSrc)) {
        const dest = path.join(WEB_ICON_DIR, 'favicon.png');
        fs.copyFileSync(iconSrc, dest);
        console.log('Copied branding/icon.png -> assets/core/icon/favicon.png');
      }
      if (fs.existsSync(iconSrc) && !fs.existsSync(iconNoBgSrc)) {
        const dest = path.join(WEB_ICON_DIR, 'icon-no-bg.png');
        fs.copyFileSync(iconSrc, dest);
        console.log('Copied branding/icon.png -> assets/core/icon/icon-no-bg.png');
      }
    }

    // --- iOS: branding/ios/ -> app Assets.xcassets ---
    const brandingIos = path.join(BRANDING_DIR, 'ios');
    if (fs.existsSync(brandingIos)) {
      const iosAppIcon = path.join(brandingIos, 'AppIcon.png');
      if (fs.existsSync(iosAppIcon)) {
        fs.mkdirSync(path.dirname(IOS_APPICON_DEST), { recursive: true });
        fs.copyFileSync(iosAppIcon, IOS_APPICON_DEST);
        console.log('Copied branding/ios/AppIcon.png -> ios AppIcon.appiconset');
      }
      const iosSplash = path.join(brandingIos, 'Splash.imageset');
      if (fs.existsSync(iosSplash)) {
        copyRecursive(iosSplash, IOS_SPLASH_DEST);
        console.log('Copied branding/ios/Splash.imageset -> ios Assets.xcassets');
      }
    }

    // --- Android: branding/android/* -> app res/ ---
    const brandingAndroid = path.join(BRANDING_DIR, 'android');
    if (fs.existsSync(brandingAndroid) && fs.existsSync(ANDROID_RES)) {
      for (const name of fs.readdirSync(brandingAndroid)) {
        const srcPath = path.join(brandingAndroid, name);
        const destPath = path.join(ANDROID_RES, name);
        copyRecursive(srcPath, destPath);
        console.log('Copied branding/android/' + name, '-> android/res/');
      }
    }
  }
}

main();
