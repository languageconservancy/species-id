#!/bin/bash

# Sync species assets (images, audio, etc.) from an S3 bucket to ./external-assets.
#
# Credentials: uses the AWS CLI default credential chain. Configure one of:
#   - aws configure
#   - AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY (and optionally AWS_REGION)
#   - AWS_PROFILE=your-profile
#   https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html
#
# Usage:
#   S3_BUCKET=your-bucket-name [S3_PREFIX=optional/path] ./scripts/download-s3-assets.sh
#   ./scripts/download-s3-assets.sh your-bucket-name [optional/path]
#
# S3_PREFIX: optional path inside the bucket (e.g. "species-assets" or "project/env").
#   If set, syncs s3://bucket/S3_PREFIX/ to ./external-assets. Omit to sync bucket root.

S3_BUCKET="${S3_BUCKET:-$1}"
S3_PREFIX="${S3_PREFIX:-$2}"
if [ -z "$S3_BUCKET" ]; then
  echo "Usage: S3_BUCKET=your-bucket-name [S3_PREFIX=path] $0"
  echo "   or: $0 your-bucket-name [path-inside-bucket]"
  exit 1
fi

SOURCE="s3://${S3_BUCKET}"
[ -n "$S3_PREFIX" ] && SOURCE="${SOURCE}/${S3_PREFIX}"

mkdir -p external-assets
aws s3 sync "$SOURCE" ./external-assets --delete
