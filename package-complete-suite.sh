#!/bin/bash
# Package CareConnect Complete Suite (Lite + Deluxe)

echo "📦 Packaging CareConnect Complete Suite..."

# Create temp directory
TEMP_DIR="/tmp/careconnect-suite-$$"
mkdir -p "$TEMP_DIR/CareConnect-Suite"

# Copy Lite version
echo "Adding Lite version..."
cp AppsCode-Lite.html "$TEMP_DIR/CareConnect-Suite/"

# Copy Deluxe version
echo "Adding Deluxe version..."
cp AppsCode-Deluxe.html "$TEMP_DIR/CareConnect-Suite/"

# Copy Chrome Extension
echo "Adding Chrome Extension..."
cp -r chrome-extension "$TEMP_DIR/CareConnect-Suite/Chrome-Extension"
rm -f "$TEMP_DIR/CareConnect-Suite/Chrome-Extension/.DS_Store"
rm -f "$TEMP_DIR/CareConnect-Suite/Chrome-Extension/icon-generator.html"
rm -f "$TEMP_DIR/CareConnect-Suite/Chrome-Extension/store-assets-generator.html"

# Copy documentation
echo "Adding documentation..."
mkdir -p "$TEMP_DIR/CareConnect-Suite/Documentation"
cp README.md "$TEMP_DIR/CareConnect-Suite/Documentation/"
cp SIMPLE-SETUP.md "$TEMP_DIR/CareConnect-Suite/Documentation/" 2>/dev/null || true
cp CARECONNECT-PRO-README.md "$TEMP_DIR/CareConnect-Suite/Documentation/" 2>/dev/null || true
cp CROSS-PLATFORM-GUIDE.md "$TEMP_DIR/CareConnect-Suite/Documentation/" 2>/dev/null || true

# Create Quick Start Guide
cat > "$TEMP_DIR/CareConnect-Suite/QUICK-START.txt" << 'EOF'
===========================================
    CareConnect Suite - Quick Start
===========================================

1. CHOOSE YOUR VERSION:
   - AppsCode-Lite.html = Simple version
   - AppsCode-Deluxe.html = Full features

2. DOUBLE-CLICK to open in your browser

3. LOGIN:
   Username: Doc121
   Password: FFA121

4. INSTALL CHROME EXTENSION:
   - Open Chrome
   - Go to chrome://extensions
   - Turn ON Developer Mode
   - Click "Load unpacked"
   - Select Chrome-Extension folder

That's it! Start creating documents.

For help, see Documentation folder.
===========================================
EOF

# Create the final ZIP
cd "$TEMP_DIR"
zip -r "CareConnect-Complete-Suite.zip" "CareConnect-Suite" -x "*.DS_Store" -x "__MACOSX"

# Move to project directory
mv "CareConnect-Complete-Suite.zip" "$OLDPWD/"

# Cleanup
rm -rf "$TEMP_DIR"

echo "✅ Complete suite packaged as CareConnect-Complete-Suite.zip"
echo ""
echo "Package contains:"
echo "  - CareConnect Lite (Simple version)"
echo "  - CareConnect Pro/Deluxe (Full features)"
echo "  - Chrome Extension"
echo "  - Complete documentation"
echo ""
echo "Ready to distribute to your team!"

