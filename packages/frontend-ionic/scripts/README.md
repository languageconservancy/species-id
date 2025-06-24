# Scripts

## Description

Run these scripts from the root directory.

### download-s3-assets.sh

- Use to download all assets from cro-species bucket to external-assets/ (creating external-assets directory if missing).
- After this you can run [generate-index-json.mjs]() to create a new `index.json`.

### generate-index-json.mjs

- Use to create an index of assets and writes the SHA-256 hash of each file for later comparison to prevent unecessary downloads.
- Use this create or update the `index.json`.

### validate-index-against-db.mjs

Validates that all files referenced in the database are present in `index.json`, and that all files listed in `index.json` are referenced by the database. Reports missing or orphaned files for both bird images, bird audio, and plant images.
