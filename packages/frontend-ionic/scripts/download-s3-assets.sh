#!/bin/bash

# Require running aws configure from aws cli
# https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html

# Pull the truth from S3
mkdir -p external-assets
aws s3 sync s3://cro-species ./external-assets --delete
