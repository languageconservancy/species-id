# Scripts

## Description

Run these scripts from the root directory.

## General Procedure

1. If missing or needs updating, download species data from Google Sheets to csv files

1. Convert CSV files to a single sql
   `node ./scripts/process-bird-data.mjs`

1. Convert sql file to sqlite file
   `sqlite3 species-production.db < species.db`

1. Download all image/audio assets from Amazon S3 bucket
   `./scripts/download-s3-assets.sh`

1. From the assets downloaded in the previous step, generate `index.json`
   `node ./scripts/generate-index-json.mjs`

1. Validate the index against the offline sqlite database
   `node ./scripts/validate-index-against-db.mjs`

## Main Runnable Scripts

### download-s3-assets.sh

- Use to download all assets from cro-species bucket to external-assets/ (creating external-assets directory if missing).
- After this you can run [generate-index-json.mjs]() to create a new `index.json`.

### generate-index-json.mjs

- Use to create an index of assets and writes the SHA-256 hash of each file for later comparison to prevent unecessary downloads.
- Use this to create or update the `index.json`.

### validate-index-against-db.mjs

Validates that all files referenced in the database are present in `index.json`, and that all files listed in `index.json` are referenced by the database. Reports missing or orphaned files for both bird images, bird audio, and plant images.

### process-bird-data.mjs

Run this with --orders and --birds arguments passing in the location of the respective CSV files exported from Google Sheets.
An .sql file will be generated with all the statements needed to build the sqlite database used in the app.

After creating the sql file run the following command to convert it to sqlite3.
`sqlite3 birds.db < <bird-db.sql>`

## Helper Scripts

### birds-csv-to-sqlite-parser.mjs

Parses two CSV files exported from Google Sheets source of truth, into sqlite statements to be imported into the sqlite database that's used in the app.
Files:

1. Bird Orders CSV
2. Birds CSV

Running it from the terminal will parse a hardcoded example set of data.
