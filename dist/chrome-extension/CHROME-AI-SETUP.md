# 🚀 Use Chrome's Built-in AI - Completely FREE!

## No API Key Needed!

Chrome is rolling out **Gemini Nano** built directly into the browser. This means:
- ✅ **100% FREE** - No API keys needed
- ✅ **Unlimited usage** - No quotas or limits
- ✅ **Privacy-focused** - Runs locally on your device
- ✅ **Fast** - No network requests needed

## How to Enable Chrome's Built-in AI

### Step 1: Update Chrome
Make sure you have Chrome version 127 or later:
1. Click the three dots menu → Help → About Google Chrome
2. Chrome will auto-update if needed
3. Restart Chrome

### Step 2: Enable Gemini Nano Flags
1. Type `chrome://flags` in your address bar
2. Search for "**optimization guide on device**"
3. Set it to **"Enabled BypassPerfRequirement"**
4. Search for "**prompt api for gemini nano**"  
5. Set it to **"Enabled"**
6. Click **"Relaunch"** at the bottom

### Step 3: Download Gemini Nano Model
1. Type `chrome://components` in your address bar
2. Find **"Optimization Guide On Device Model"**
3. Click **"Check for update"** if it shows version 0.0.0.0
4. Wait for download (may take a few minutes)

### Step 4: Verify It's Working
1. Open Chrome DevTools (F12)
2. Go to Console
3. Type: `await window.ai.canCreateTextSession()`
4. If it returns `"readily"`, you're good to go!

## Using the Extension with Chrome AI

Once Chrome's built-in AI is enabled:

1. **The extension will automatically detect it**
2. **No settings needed** - it just works!
3. **No API keys required**
4. Extract data from any treatment center website instantly

## Troubleshooting

### "window.ai is undefined"
- Make sure you enabled both flags mentioned above
- Restart Chrome completely (close all windows)
- Check that the model downloaded in chrome://components

### "Cannot create text session"
- The model might still be downloading
- Check chrome://components for the download status
- Try again in a few minutes

### Not available on your device?
Chrome's built-in AI currently requires:
- Chrome version 127+
- Windows, Mac, or Linux (not mobile yet)
- Device with at least 4GB RAM

## Fallback Options

If Chrome's built-in AI isn't available yet, the extension will automatically fall back to:
1. Google Gemini API (free with key)
2. OpenAI GPT-3.5 (requires credits)
3. Rule-based extraction (no AI)

## Privacy & Performance

Chrome's built-in AI is:
- **100% local** - Nothing leaves your device
- **Private** - No data sent to Google
- **Fast** - No network latency
- **Offline capable** - Works without internet

This is the BEST option for the extension - completely free and private!

---

**Note:** Chrome's built-in AI is being gradually rolled out. If it's not available yet, check back in a few weeks or use the Google Gemini API key as a temporary solution.
