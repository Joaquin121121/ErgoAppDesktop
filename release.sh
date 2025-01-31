#!/bin/bash

# Usage: ./release.sh v1.0.0

VERSION=$1
REPO="Joaquin121121/ErgoAppDesktop"
GITHUB_TOKEN="${UPDATER_TOKEN}"
APP_NAME="ergoapp-desktop"  # Lowercase with hyphens

if [[ ! $VERSION =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "Version must be in format v1.0.0"
    exit 1
fi

# Ensure we have all build artifacts
if [ ! -d "dist" ]; then
    echo "dist directory not found. Build the app first!"
    exit 1
fi

# Create or switch to updater branch
git checkout -B updater

# Create latest.json
cat > latest.json << EOF
{
  "version": "${VERSION}",
  "notes": "Release ${VERSION}",
  "pub_date": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "platforms": {
    "darwin-x86_64": {
      "signature": "$(tauri signer sign dist/${APP_NAME}.app.tar.gz)",
      "url": "https://github.com/${REPO}/releases/download/${VERSION}/${APP_NAME}.app.tar.gz"
    },
    "darwin-aarch64": {
      "signature": "$(tauri signer sign dist/${APP_NAME}.app.tar.gz)",
      "url": "https://github.com/${REPO}/releases/download/${VERSION}/${APP_NAME}.app.tar.gz"
    },
    "linux-x86_64": {
      "signature": "$(tauri signer sign dist/${APP_NAME}.AppImage.tar.gz)",
      "url": "https://github.com/${REPO}/releases/download/${VERSION}/${APP_NAME}.AppImage.tar.gz"
    },
    "windows-x86_64": {
      "signature": "$(tauri signer sign dist/${APP_NAME}.msi.zip)",
      "url": "https://github.com/${REPO}/releases/download/${VERSION}/${APP_NAME}.msi.zip"
    }
  }
}
EOF

# Update updater branch
git add latest.json
git commit -m "Update latest.json for ${VERSION}"
git push origin updater -f

# Create GitHub Release
curl \
  -X POST \
  -H "Accept: application/vnd.github.v3+json" \
  -H "Authorization: token ${GITHUB_TOKEN}" \
  https://api.github.com/repos/${REPO}/releases \
  -d "{
    \"tag_name\": \"${VERSION}\",
    \"name\": \"Release ${VERSION}\",
    \"body\": \"Release notes for version ${VERSION}\",
    \"draft\": false,
    \"prerelease\": false
  }"

# Get release ID
RELEASE_ID=$(curl -s \
  -H "Accept: application/vnd.github.v3+json" \
  -H "Authorization: token ${GITHUB_TOKEN}" \
  "https://api.github.com/repos/${REPO}/releases/tags/${VERSION}" | \
  grep -m 1 "\"id\":" | \
  grep -o "[0-9]\\+")

# Upload assets
for file in dist/*.{tar.gz,zip}; do
  if [ -f "$file" ]; then
    echo "Uploading $file..."
    curl \
      -X POST \
      -H "Accept: application/vnd.github.v3+json" \
      -H "Authorization: token ${GITHUB_TOKEN}" \
      -H "Content-Type: application/octet-stream" \
      --data-binary @"$file" \
      "https://uploads.github.com/repos/${REPO}/releases/${RELEASE_ID}/assets?name=$(basename "$file")"
  fi
done