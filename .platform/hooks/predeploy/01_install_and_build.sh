#!/bin/bash
# Elastic Beanstalk platform hook: this is a backend+frontend monorepo, not a
# single npm package, so the platform's own automatic `npm install` at the deploy
# root (which only sees the placeholder root package.json) isn't enough — this
# hook installs each half's real dependencies and builds the frontend so
# backend/src/app.js has a frontend/dist to serve before the app process starts.
set -eu

APP_DIR="/var/app/staging"

echo "==> Installing backend dependencies"
cd "$APP_DIR/backend"
npm ci --omit=dev

echo "==> Installing frontend dependencies and building"
cd "$APP_DIR/frontend"
npm ci
npm run build

echo "==> predeploy hook complete"
