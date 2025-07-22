#!/bin/bash
# Custom build script for DigitalOcean App Platform

echo "Starting custom build process..."

# Check if package-lock.json exists
if [ -f "package-lock.json" ]; then
    echo "Found package-lock.json, using npm ci"
    npm ci --production
else
    echo "No package-lock.json found, using npm install"
    npm install --production
fi

echo "Build complete!"