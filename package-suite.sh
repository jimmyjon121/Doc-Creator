#!/bin/bash
# package-suite.sh - Build a single ZIP containing the Doc Creator app, Chrome extension, and docs

set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
OUT_ZIP="family-first-doc-creator-suite.zip"

cd "$ROOT_DIR"

echo "📦 Building distribution package: $OUT_ZIP"

# Cleanup any previous zip
rm -f "$OUT_ZIP"

# Ensure extension zip is up-to-date
bash package-extension.sh 1>/dev/null

TMP_DIR="/tmp/family-first-suite-$$"
mkdir -p "$TMP_DIR"

# Copy App
mkdir -p "$TMP_DIR/Doc-Creator-App"
cp -R AppsCode.html "$TMP_DIR/Doc-Creator-App/"

# Copy Extension (unpacked) and packaged zip
mkdir -p "$TMP_DIR/Chrome-Extension"
cp -R chrome-extension/* "$TMP_DIR/Chrome-Extension/"
cp family-first-extension.zip "$TMP_DIR/Chrome-Extension/"

# Copy helpful docs
mkdir -p "$TMP_DIR/Instructions"
cp README.md CROSS-PLATFORM-GUIDE.md SIMPLE-SETUP.md "$TMP_DIR/Instructions/" 2>/dev/null || true

# Quick reference
if [ -f "Doc-Creator-CaseManager/QUICK-REFERENCE-v2.3.md" ]; then
  cp Doc-Creator-CaseManager/QUICK-REFERENCE-v2.3.md "$TMP_DIR/Instructions/"
fi

# Create the final zip
cd "$TMP_DIR/.."
zip -r "$ROOT_DIR/$OUT_ZIP" "$(basename "$TMP_DIR")" -x "*.DS_Store" -x "__MACOSX"

# Cleanup
rm -rf "$TMP_DIR"

echo "✅ Suite packaged as $OUT_ZIP"

echo "Distribution contents:"
zipinfo -1 "$ROOT_DIR/$OUT_ZIP" | sed 's/^/ └── /'

