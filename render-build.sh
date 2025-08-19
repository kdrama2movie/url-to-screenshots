#!/bin/bash
# render-build.sh
set -e

echo "Installing system Chromium..."
apt-get update
apt-get install -y chromium

echo "Installing Node.js dependencies..."
npm install
