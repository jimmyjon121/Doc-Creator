# CareConnect Clinical Intel v11 - Team Deployment Guide

## Quick Install (For Your Team)

### Step 1: Remove Old Version
1. Open Chrome
2. Type `chrome://extensions/` in the address bar
3. Find "Family First Clinical Extractor" (old version)
4. Click "Remove"

### Step 2: Install New Version
1. Stay on `chrome://extensions/` page
2. Turn ON "Developer mode" (toggle in top right)
3. Click "Load unpacked" button
4. Select the `chrome-extension-enhanced` folder
5. You should see "CareConnect Clinical Intel v11.0"

### Step 3: Optional - Add AI Power (One-Time Setup)
1. Click the extension icon in Chrome toolbar
2. Click "Settings" link
3. Choose ONE option:
   - **Option A: Google Gemini (FREE & Recommended)**
     - Click "Get free API key" link
     - Sign in with Google account
     - Copy the key that starts with "AIzaSy..."
     - Paste it and click "Save & Test"
   - **Option B: No AI (Works Great!)**
     - Just close settings and start using

### That's It! ✅

## How to Use

1. Go to any treatment center website
2. Click the CareConnect icon in toolbar
3. Click "Analyze Treatment Program"
4. Wait 30-60 seconds (you'll see live progress)
5. Click "Copy to Clipboard"
6. Paste into Doc Creator

## What's New & Better

### You Asked For:
✅ Better progress tracking (not just "0 data points")
✅ More accurate extraction
✅ Professional UI
✅ Multi-page analysis
✅ Optional AI enhancement

### You Got:
- **Live Metrics**: See exactly what's being found in real-time
- **50-Page Analysis**: Automatically crawls entire sites
- **4 AI Options**: Choose Gemini (free), OpenAI, Claude, or none
- **100+ Extraction Patterns**: Works great without AI
- **Modern Dark UI**: Easy on the eyes
- **Clinical-Grade Output**: Ready for Doc Creator

## Quick Tips

📍 **Best Results**: Let it run the full analysis (30-60 seconds)
📍 **Free AI**: Gemini gives you 60 uses per minute for free
📍 **No AI Needed**: The tool works excellently without any API key
📍 **Multiple Sites**: Can analyze multiple tabs simultaneously

## Troubleshooting

**"It's not working"**
- Refresh the website page first
- Make sure you see v11.0 in extensions page
- Try removing and re-adding the extension

**"It's finding less than before"**
- v11 is MORE accurate, not just more data
- It filters out incorrect information
- Check the confidence score

**"Do I need the API key?"**
- No! It works great without it
- API key adds maybe 10-20% more findings
- Try without first, add key if needed

## For IT/Admin

**Deployment via Group Policy:**
```
Extension ID: Will be generated after first install
Update URL: Local folder or network share
Permissions needed: None beyond standard Chrome
```

**Silent Config:**
Can pre-configure API keys via managed storage if needed.

---

**Questions?** The tool is designed to be self-explanatory. 
Just click and analyze - it's that simple! 🚀
