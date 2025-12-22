#!/bin/bash

# Download the assets from S3
./scripts/download-s3-assets.sh

# Generate the index.json file
node ./scripts/generate-index-json.mjs

# Validate the index.json file against the database
node ./scripts/validate-index-against-db.mjs external-assets/databases/species-production.db external-assets/index.json