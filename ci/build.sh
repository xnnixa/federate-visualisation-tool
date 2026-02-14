#!/usr/bin/env bash
set -e
# Build the project for production
npm install
npm run lint
# npm run test
npm run build