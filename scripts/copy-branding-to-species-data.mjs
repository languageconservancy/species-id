#!/usr/bin/env node
/**
 * One-time or occasional: copy branding files from the app (web + Android + iOS)
 * into species-data/branding/ so the species-data repo owns them. After this,
 * run apply-branding.mjs to copy from species-data back into the app at build time.
 *
 * Usage: node scripts/copy-branding-to-species-data.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const ICON_DIR = path.join(ROOT, 'src', 'assets', 'core', 'icon');
const SPECIES_DATA = path.join(ROOT, 'src', 'assets', 'species-data');
const BRANDING_DIR = path.join(SPECIES_DATA, 'branding');
const ANDROID_RES = path.join(ROOT, 'android', 'app', 'src', 'main', 'res');
const IOS_APPICON = path.join(ROOT, 'ios', 'App', 'App', 'Assets.xcassets', 'AppIcon.appiconset', 'AppIcon.png');

const WEB_FILES = ['favicon.png', 'icon-no-bg.png', 'icon.png'];

/** Copy a file or directory recursively to dest. */
function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const name of fs.readdirSync(src)) {
      copyRecursive(path.join(src, name), path.join(dest, name));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

function main() {
  if (!fs.existsSync(SPECIES_DATA)) {
    console.warn('species-data not found at src/assets/species-data. Clone or create it first.');
    process.exit(1);
  }

  fs.mkdirSync(BRANDING_DIR, { recursive: true });

  // --- Web (assets/core/icon) ---
  for (const name of WEB_FILES) {
    const src = path.join(ICON_DIR, name);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(BRANDING_DIR, name));
      console.log('Copied', name, '-> species-data/branding/');
    } else {
      console.log('Skip (missing):', name);
    }
  }
  const icon1024 = path.join(ICON_DIR, 'icon-1024.png');
  if (fs.existsSync(icon1024)) {
    fs.copyFileSync(icon1024, path.join(BRANDING_DIR, 'icon-1024.png'));
    console.log('Copied icon-1024.png -> species-data/branding/');
  }

  // --- Menu/tab icons (tab1-icon.svg, tab2-icon.svg) -> species-data/branding/icons/ ---
  const brandingIconsDir = path.join(BRANDING_DIR, 'icons');
  fs.mkdirSync(brandingIconsDir, { recursive: true });
  for (const name of ['tab1-icon.svg', 'tab2-icon.svg']) {
    const src = path.join(ICON_DIR, name);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(brandingIconsDir, name));
      console.log('Copied', name, '-> species-data/branding/icons/');
    }
  }

  // --- iOS: AppIcon and optional Splash ---
  const brandingIos = path.join(BRANDING_DIR, 'ios');
  fs.mkdirSync(brandingIos, { recursive: true });
  if (fs.existsSync(IOS_APPICON)) {
    fs.copyFileSync(IOS_APPICON, path.join(brandingIos, 'AppIcon.png'));
    console.log('Copied ios/AppIcon.png -> species-data/branding/ios/');
  }
  const iosSplash = path.join(ROOT, 'ios', 'App', 'App', 'Assets.xcassets', 'Splash.imageset');
  if (fs.existsSync(iosSplash)) {
    copyRecursive(iosSplash, path.join(brandingIos, 'Splash.imageset'));
    console.log('Copied ios/Splash.imageset -> species-data/branding/ios/');
  }

  // --- Android: mipmap-*, drawable*, values/ic_launcher_background.xml ---
  const brandingAndroid = path.join(BRANDING_DIR, 'android');
  if (fs.existsSync(ANDROID_RES)) {
    const entries = fs.readdirSync(ANDROID_RES, { withFileTypes: true });
    for (const e of entries) {
      const srcPath = path.join(ANDROID_RES, e.name);
      const destPath = path.join(brandingAndroid, e.name);
      if (e.name.startsWith('mipmap-') || e.name.startsWith('drawable')) {
        copyRecursive(srcPath, destPath);
        console.log('Copied android/res/' + e.name, '-> species-data/branding/android/');
      } else if (e.name === 'values') {
        const valuesSrc = path.join(ANDROID_RES, 'values', 'ic_launcher_background.xml');
        if (fs.existsSync(valuesSrc)) {
          fs.mkdirSync(path.join(brandingAndroid, 'values'), { recursive: true });
          fs.copyFileSync(valuesSrc, path.join(brandingAndroid, 'values', 'ic_launcher_background.xml'));
          console.log('Copied android/res/values/ic_launcher_background.xml -> species-data/branding/android/');
        }
      }
    }
  }

  console.log('Done. Commit species-data/branding/ in the species-data repo, then use npm run apply-branding before builds.');
}

main();
