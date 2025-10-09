# 🖥️ Cross-Platform Setup Guide

This guide ensures the Family First Doc Creator works seamlessly on both Windows and Mac.

## 🚀 Quick Start

### Windows Users:
1. Double-click `start-server.bat`
2. Open Chrome and go to: http://localhost:8000/AppsCode.html
3. Log in with: Username: `Doc121` | Password: `FFA121`

### Mac/Linux Users:
1. Double-click `start-server.sh` (or run `./start-server.sh` in Terminal)
2. Open Chrome and go to: http://localhost:8000/AppsCode.html
3. Log in with: Username: `Doc121` | Password: `FFA121`

## 📦 Chrome Extension Setup

### Installing the Extension (Both Platforms):
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `chrome-extension` folder from your Doc Creator directory
5. The extension icon will appear in your toolbar

### How the Extension Works:
- **Auto-Detection**: The extension automatically finds your Doc Creator tool
- **No Configuration Needed**: Works immediately after installation
- **Smart Integration**: Detects if Doc Creator is open and sends data directly

## 🔧 Troubleshooting

### "Doc Creator not found" Error:
1. Make sure you started the server (run the .bat or .sh file)
2. Check that you can access http://localhost:8000/AppsCode.html
3. If using a different port, the extension will try ports 8000 and 8080

### Extension Can't Send Data:
1. Make sure Doc Creator is open in a tab
2. The URL should be http://localhost:8000/AppsCode.html
3. Try refreshing both the extension and Doc Creator page

### Python Not Found (Windows):
1. Install Python from https://python.org
2. During installation, CHECK "Add Python to PATH"
3. Restart your computer after installation

### Python Not Found (Mac):
1. Mac usually has Python pre-installed
2. If not, install from https://python.org or use Homebrew
3. The script uses `python3` which is standard on Mac

## 📋 File Paths

### No File Path Configuration Needed!
- The extension uses localhost (http://localhost:8000)
- This works the same on all platforms
- No need to worry about file:/// paths

### Manual Server Start:
If the startup scripts don't work, open Terminal/Command Prompt:
```bash
# Navigate to Doc Creator folder
cd /path/to/Doc-Creator

# Start server
python -m http.server 8000    # Windows
python3 -m http.server 8000   # Mac/Linux
```

## 🔒 Security Notes

- The tool runs locally on your computer
- No data is sent to external servers
- All PHI stays on your machine
- The localhost server is only accessible from your computer

## 💡 Pro Tips

1. **Bookmark the URL**: Save http://localhost:8000/AppsCode.html
2. **Pin the Extension**: Click the puzzle piece icon and pin the extension
3. **Keep Server Running**: Leave the terminal window open while using
4. **Auto-Start**: Add the startup script to your system startup folder

## 🆘 Need Help?

If you encounter issues:
1. Check that the server is running (terminal window should be open)
2. Try a different browser if Chrome has issues
3. Ensure no other program is using port 8000
4. Contact support with any error messages

---

**Remember**: The beauty of this setup is its simplicity - just start the server and go!
