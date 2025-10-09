#!/bin/bash

echo "🚀 Upgrading Chrome Extension with improved extraction..."

# Backup current background.js
cp chrome-extension/background.js chrome-extension/background.js.old-fetch

# Replace with improved version
cp chrome-extension/background-improved.js chrome-extension/background.js

echo "✅ Background script upgraded to use Chrome Tabs API"
echo ""
echo "Key improvements:"
echo "- Uses Chrome Tabs API for reliable cross-origin access"
echo "- Smart link scoring for better page selection"
echo "- Parallel processing with tab pool (3 concurrent tabs)"
echo "- Built-in caching to avoid re-crawling"
echo "- Better error handling and recovery"
echo ""
echo "To test:"
echo "1. Reload the extension in Chrome"
echo "2. Visit a treatment center website"  
echo "3. Click the extension and extract"
echo ""
echo "To restore old version: cp chrome-extension/background.js.old-fetch chrome-extension/background.js"