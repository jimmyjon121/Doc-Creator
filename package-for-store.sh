#!/bin/bash
# Chrome Web Store Package Creator for Family First Program Extractor

echo "🚀 Creating Chrome Web Store submission package..."
echo ""

# Create clean submission directory
rm -rf chrome-store-submission
mkdir -p chrome-store-submission

echo "📁 Copying extension files..."

# Copy all extension files
cp chrome-extension/manifest.json chrome-store-submission/
cp chrome-extension/popup.html chrome-store-submission/
cp chrome-extension/popup.js chrome-store-submission/
cp chrome-extension/content.js chrome-store-submission/
cp chrome-extension/background.js chrome-store-submission/

# Copy icons (required for submission)
cp chrome-extension/icon16.png chrome-store-submission/
cp chrome-extension/icon48.png chrome-store-submission/
cp chrome-extension/icon128.png chrome-store-submission/

# Remove any development/documentation files that shouldn't be in submission
rm -f chrome-store-submission/README.md
rm -f chrome-store-submission/store-assets-generator.html
rm -f chrome-store-submission/icon-generator.html
rm -f chrome-store-submission/*.md

echo "🔍 Validating extension structure..."

# Check required files exist
required_files=(
    "manifest.json"
    "popup.html" 
    "popup.js"
    "content.js"
    "background.js"
    "icon16.png"
    "icon48.png" 
    "icon128.png"
)

missing_files=()
for file in "${required_files[@]}"; do
    if [[ ! -f "chrome-store-submission/$file" ]]; then
        missing_files+=("$file")
    fi
done

if [[ ${#missing_files[@]} -gt 0 ]]; then
    echo "❌ Error: Missing required files:"
    printf '%s\n' "${missing_files[@]}"
    exit 1
fi

echo "✅ All required files present"

# Validate manifest.json
echo "🔍 Validating manifest.json..."
if ! python3 -c "import json; json.load(open('chrome-store-submission/manifest.json'))" 2>/dev/null; then
    echo "❌ Error: Invalid JSON in manifest.json"
    exit 1
fi

echo "✅ Manifest.json is valid"

# Create the submission zip
echo "📦 Creating submission zip file..."
cd chrome-store-submission
zip -r "../family-first-program-extractor-v1.0.0.zip" . -x "*.DS_Store" "__MACOSX/*"
cd ..

# Get file size
zip_size=$(du -h "family-first-program-extractor-v1.0.0.zip" | cut -f1)

echo ""
echo "🎉 SUCCESS! Chrome Web Store package created!"
echo ""
echo "📋 SUBMISSION READY:"
echo "   📦 Zip File: family-first-program-extractor-v1.0.0.zip ($zip_size)"
echo "   📁 Package Contents: chrome-store-submission/"
echo ""
echo "🌐 NEXT STEPS:"
echo "   1. Go to: https://chrome.google.com/webstore/devconsole/"
echo "   2. Sign in and pay \$5 developer registration fee (one-time)"
echo "   3. Click 'Add new item' and upload the zip file"
echo "   4. Fill in store listing details (see store-listing.md for copy)"
echo "   5. Upload promotional images (generate with store-assets-generator.html)"
echo "   6. Submit for review (typically 1-3 business days)"
echo ""
echo "📋 REQUIRED STORE ASSETS:"
echo "   • Screenshots (1280x800) - at least 1 required"
echo "   • Small promo tile (440x280) - required"
echo "   • Large promo tile (920x680) - optional"
echo "   • Marquee tile (1400x560) - optional"
echo ""
echo "💡 Generate all assets by opening: chrome-extension/store-assets-generator.html"
echo ""

# List contents for verification
echo "📋 PACKAGE CONTENTS:"
echo "$(cd chrome-store-submission && find . -type f | sort)"
echo ""

echo "✨ Ready for Chrome Web Store submission!"