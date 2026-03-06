# Scripts

## Description

Run these scripts from the root directory.

## General Procedure

1. If missing or needs updating, download species data from Google Sheets to CSV files.

2. Convert CSV files to a single SQL file:
   `node ./scripts/process-species-data.mjs --birds birds.csv --plants plants.csv --output species_data.sql`

3. Convert SQL file to SQLite database (ensure no existing species-production.db file exists):
   `sqlite3 species-production.db < species_data.sql`

4. Download all image/audio assets from Amazon S3 bucket (set your bucket name):
   `S3_BUCKET=your-bucket-name ./scripts/download-s3-assets.sh`

5. From the assets downloaded in the previous step, generate `index.json`:
   `node ./scripts/generate-index-json.mjs`

6. Validate the index against the offline SQLite database:
   `node ./scripts/validate-index-against-db.mjs src/assets/species-data/databases/species-production.db external-assets/index.json`

## Main Runnable Scripts

### download-s3-assets.sh

- Downloads assets from an S3 bucket to `external-assets/` (creating the directory if missing).
- **Credentials**: uses the AWS CLI default chain (`aws configure`, or `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY`, or `AWS_PROFILE`). See script header or [AWS CLI config](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html).
- **Bucket/path**: `S3_BUCKET=your-bucket ./scripts/download-s3-assets.sh` or `./scripts/download-s3-assets.sh your-bucket`. Optional path inside the bucket: `S3_PREFIX=species-assets` or second argument `./scripts/download-s3-assets.sh your-bucket species-assets`.
- After this you can run `generate-index-json.mjs` to create or update `index.json`.

### generate-index-json.mjs

- Creates an index of assets and writes the SHA-256 hash of each file for later comparison and download management.
- Use to create or update `index.json`.

### validate-index-against-db.mjs

Validates that all files referenced in the database are present in `index.json`, and that all files listed in `index.json` are referenced by the database. Reports missing or orphaned files for bird images, bird audio, and plant images.

### process-species-data.mjs

- Converts CSV files (exported from Google Sheets or similar) into SQL for the SQLite database.
- Options: `--birds <file>`, `--plants <file>`, `--output <file>` (default: species_data.sql).
- Example: `node scripts/process-species-data.mjs --birds birds.csv --plants plants.csv --output species_data.sql`
- After generating the SQL file, create the database: `sqlite3 species-production.db < species_data.sql`

### copy-branding-to-species-data.mjs

- One-time or occasional: copies all branding from the app into `species-data/branding/` so the species-data repo owns it. Copies web assets (`src/assets/core/icon/`: favicon, icon-no-bg, icon, icon-1024), iOS (`AppIcon.png`, `Splash.imageset` → `branding/ios/`), and Android (mipmap-*, drawable*, values/ic_launcher_background.xml → `branding/android/`). Run when moving existing app icons into species-data; then commit `species-data/branding/` in the species-data repo and use `apply-branding.mjs` before builds.

### apply-branding.mjs

- Build-time script: writes `branding.generated.json` from config; copies from `species-data/branding/` into the app: web icons → `src/assets/core/icon/`, `branding/ios/` → iOS Assets.xcassets (AppIcon, Splash.imageset), `branding/android/` → `android/app/src/main/res/`.
- Run before `ionic build` and `cap sync` when using project-specific branding. See README “Using this app for your own project” and “App icon and splash screen”.
- (Removed duplicate.)
- Build-time script: reads `src/assets/species-data/config/config.json` (and optional `species-data/branding/` assets), writes `branding.generated.json` for Capacitor app name/ID, and can copy icon/splash from `species-data/branding/` into the app. Run before `ionic build` and `cap sync` when using project-specific branding. See README “Using this app for your own project” and “App icon and splash screen”.

## Helper Scripts

### species-csv-to-sqlite-parser.mjs

Parses CSV files exported from Google Sheets (e.g. orders, birds, plants) into SQLite statements. Used by `process-species-data.mjs`.
