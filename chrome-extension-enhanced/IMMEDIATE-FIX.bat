@echo off
echo.
echo ========================================
echo   FIXING CHROME EXTENSION
echo ========================================
echo.
echo This will reset your extension to a working state.
echo.
pause

echo.
echo Step 1: Killing Chrome to ensure clean reload...
taskkill /F /IM chrome.exe 2>nul
timeout /t 2 >nul

echo.
echo Step 2: Clearing Chrome extension cache...
rd /s /q "%LOCALAPPDATA%\Google\Chrome\User Data\Default\Extensions\*family*" 2>nul

echo.
echo Step 3: Opening Chrome Extensions page...
start chrome "chrome://extensions/"

echo.
echo ========================================
echo   MANUAL STEPS REQUIRED:
echo ========================================
echo.
echo 1. Chrome has opened to the extensions page
echo 2. Click "Load unpacked"
echo 3. Navigate to: chrome-extension-v3 (the ORIGINAL folder)
echo 4. Select that folder
echo 5. The extension will now work!
echo.
echo ========================================
echo.
pause
