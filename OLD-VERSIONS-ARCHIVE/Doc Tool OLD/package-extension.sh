#!/bin/bash

# Script to package the Chrome extension for distribution

echo "Packaging Family First Chrome Extension..."

# Create a clean directory for the package
rm -f family-first-extension.zip

# Zip the extension files
cd chrome-extension
zip -r ../family-first-extension.zip . -x "*.DS_Store" -x "__MACOSX" -x "icon-generator.html"

cd ..

echo "✅ Extension packaged as family-first-extension.zip"
echo ""
echo "To distribute to your team:"
echo "1. Share the family-first-extension.zip file"
echo "2. Team members unzip it to a folder"
echo "3. Load the folder as an unpacked extension in Chrome"
echo ""
echo "Or share the entire chrome-extension folder directly."