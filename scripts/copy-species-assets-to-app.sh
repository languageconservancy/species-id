#!/bin/bash
set -x

# Copy the species assets to the project
cp -r external-assets/birds ./src/assets/species-data/
cp -r external-assets/plants ./src/assets/species-data/