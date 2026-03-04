#!/usr/bin/env node
/**
 * Syncs app version from package.json to Android and iOS native projects.
 * Run from packages/frontend-ionic: node scripts/sync-version.mjs
 * Or: npm run version:sync
 */
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const version = pkg.version;
if (!version) {
  console.error('No version in package.json');
  process.exit(1);
}

// Android: update versionName in android/app/build.gradle
const buildGradlePath = join(root, 'android', 'app', 'build.gradle');
let buildGradle = readFileSync(buildGradlePath, 'utf8');
buildGradle = buildGradle.replace(/versionName\s+"[^"]+"/, `versionName "${version}"`);
writeFileSync(buildGradlePath, buildGradle);
console.log(`Android versionName -> ${version}`);

// iOS: update MARKETING_VERSION in project.pbxproj
const pbxPath = join(root, 'ios', 'App', 'App.xcodeproj', 'project.pbxproj');
let pbx = readFileSync(pbxPath, 'utf8');
pbx = pbx.replace(/MARKETING_VERSION = [^;]+;/g, `MARKETING_VERSION = ${version};`);
writeFileSync(pbxPath, pbx);
console.log(`iOS MARKETING_VERSION -> ${version}`);

console.log('Version sync done. Bump versionCode in android/app/build.gradle when releasing.');
