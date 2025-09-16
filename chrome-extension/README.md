tmobil# Family First Program Extractor - Chrome Extension

This Chrome extension makes it easy to extract treatment program information from websites and paste it directly into the Family First Doc Creator tool.

## Installation Instructions

### For Your Team (Easy Method):

1. **Download the Extension**
   - Download this entire `chrome-extension` folder to your computer
   - Or get it from your team lead

2. **Open Chrome Extensions**
   - Open Chrome browser
   - Go to `chrome://extensions/`
   - Turn on "Developer mode" (toggle in top right)

3. **Load the Extension**
   - Click "Load unpacked"
   - Select the `chrome-extension` folder
   - The extension will appear in your toolbar!

## How to Use

1. **Navigate to a Program Website**
   - Go to any treatment program's website
   - Click the Family First extension icon (blue "F" icon)

2. **Extract Information**
   - Click "Extract Page Info"
   - The extension will automatically grab:
     - Program name and location
     - Contact information (phone, email, address)
     - Services and features
     - Clinical approaches mentioned
     - Any other relevant details

3. **Copy to Doc Creator**
   - Review the extracted information
   - Click "Copy to Clipboard"
   - Click "Open Doc Creator" (or go to your Doc Creator tool)
   - Paste the information into the Quick Mode text area
   - Click "Generate Write-up"

## Features

- ✅ Works on ANY website
- ✅ Automatically finds contact information
- ✅ Detects therapy modalities (DBT, CBT, EMDR, etc.)
- ✅ Extracts program descriptions and features
- ✅ One-click copy to clipboard
- ✅ Direct link to open Doc Creator

## Updating the Tool URL

If your Doc Creator tool is hosted somewhere other than `localhost:8000`:

1. Open `popup.js`
2. Find line 11: `chrome.tabs.create({ url: 'http://localhost:8000' });`
3. Change the URL to your hosted location
4. Repeat for line 65
5. Save and reload the extension

## Troubleshooting

**Extension not appearing?**
- Make sure Developer Mode is ON
- Try reloading the extension
- Check that all files are in the folder

**Not extracting information?**
- After installing, reload the extension by clicking the refresh icon
- Reload the webpage you're trying to extract from
- Some websites block content extraction
- If you see "Cannot read properties of undefined", reload both the extension and the webpage
- Try selecting specific text and right-clicking
- Manually copy/paste if needed

**Can't find contact info?**
- The extension looks for common patterns
- Some sites hide contact info behind forms
- Check the website's "Contact" or "Admissions" page

## Privacy & Security

- This extension only reads page content when you click "Extract"
- No data is sent to any servers
- All processing happens locally in your browser
- Information is only stored temporarily for copying

## For Developers

To modify the extraction logic, edit:
- `popup.js` - Main extension logic
- `extractPageInfo()` function - Extraction patterns
- `formatExtractedInfo()` function - Output formatting

The extension uses:
- Chrome Manifest V3
- No external dependencies
- Pure JavaScript