# Chrome Extension Changelog

## Version 1.6.1 (October 9, 2025) - BUG FIX UPDATE

### 🐛 Critical Bug Fixes

#### Content Script Errors Fixed
- **FIXED**: "Identifier 'TREATMENT_PATTERNS' has already been declared" error
- **FIXED**: Duplicate content script injection prevented
- **FIXED**: "Cannot read properties of undefined (reading 'map')" in processPageData
- **IMPROVED**: Array validation before processing to prevent crashes

#### Copy to Tool Integration Fixed
- **FIXED**: Copy to Tool button now properly opens the program modal
- **FIXED**: handleChromeExtensionData is now globally accessible
- **FIXED**: Message source compatibility for both 'FFAS_EXTENSION' and 'FamilyFirstExtension'
- **IMPROVED**: Better error handling in script injection

#### Technical Improvements
- Added duplicate injection prevention with `window.__FF_CONTENT_SCRIPT_LOADED__`
- Made handleChromeExtensionData globally accessible as `window.handleChromeExtensionData`
- Improved array handling in processPageData with proper validation
- Better error recovery for clinical extraction failures

---

## Version 1.6.0 (October 9, 2025) - DEEP EXTRACTION UPDATE

### 🌊 Major Extraction Overhaul - Multi-Page Deep Analysis

#### Comprehensive Multi-Page Extraction
- **NEW**: Analyzes up to 30 pages per site for complete data
- **NEW**: Smart link prioritization based on relevance scoring
- **NEW**: Parallel page loading with intelligent caching
- **ENHANCED**: Finds and extracts data from About, Programs, Treatment, Staff pages
- **IMPROVED**: Much more thorough extraction across entire sites

#### Site-Specific Intelligence
- **NEW**: Custom extractor for Voyage Recovery
- **NEW**: Site-specific patterns and extraction logic
- **ENHANCED**: Adapts extraction based on site structure
- **IMPROVED**: Handles challenging sites with hidden data

#### Clinical-Grade Descriptions
- **FIXED**: No more generic "comprehensive treatment services"
- **NEW**: Specific level of care identification (Residential, PHP, IOP, etc.)
- **NEW**: Detailed therapy categorization (Evidence-Based vs Experiential)
- **ENHANCED**: Professional clinical writeups with proper formatting
- **IMPROVED**: Better specialization descriptions ("trauma and PTSD" vs "trauma")

#### Enhanced Detection Algorithms
- **NEW**: 6+ strategies for program name extraction
- **IMPROVED**: Location extraction with full address parsing
- **ENHANCED**: Phone/email detection with context awareness
- **EXPANDED**: 40+ therapy types detected
- **EXPANDED**: 15+ specialization categories
- **IMPROVED**: Staff credential and accreditation detection

### Technical Implementation
- Added `clinical-extractor.js` to content scripts
- Enhanced `content.js` with `findAdditionalLinks()` and `scoreLinks()`
- Implemented `extractVoyageRecoveryData()` for site-specific handling
- Improved `generateClinicalDescription()` with detailed logic
- Better integration between extraction modules

### Before/After Example (Voyage Recovery):
**Before**: "Voyagerecovery offers comprehensive treatment services. The program specializes in treating autism/ASD, substance abuse."

**After**: "Voyage Recovery provides residential treatment for adolescents ages 13-17 in Miami, FL. The program specializes in treating trauma and PTSD, anxiety disorders, depression and mood disorders, substance use disorders, utilizing an integrated treatment approach."

---

## Version 1.5.5 (October 9, 2025) - Copy to Tool Fix

### 🔧 Integration Fix
- Fixed "Copy to Tool" button functionality
- Direct script injection for reliable data transfer
- Automatic Doc Creator tab detection

---

## Version 1.5.4 (October 9, 2025) - Chrome Extension Integration

### 🔐 Encryption & Auto-Login
- **NEW**: Automatic login bypass for Chrome Extension users
- **NEW**: Encryption initialization for extension data
- **ENHANCED**: Message passing with retry logic
- **NEW**: Visual confirmation when data is received

### 🐛 Bug Fixes
- Fixed encryption errors for Chrome Extension users
- Fixed data not being transmitted to Doc Creator
- Fixed login screen appearing for extension users

---

## Version 1.5.3 (October 9, 2025) - Auto-Login Improvements

### 🔑 Session Management
- Enhanced auto-login for Chrome Extension users
- Fixed session storage initialization
- Improved login bypass mechanism

---

## Version 1.5.2 (October 9, 2025) - Content Injector

### 📝 Script Improvements
- Fixed content-injector.js initialization
- Improved data handling for Chrome Extension
- Better error recovery

---

## Version 1.5.1 (October 9, 2025) - Syntax Fix

### 🐛 Bug Fix
- Fixed orphaned else statement syntax error
- Improved error handling

---

## Version 1.5.0 (October 9, 2025)

### 🚀 MAJOR OVERHAUL - Clinical-Grade Extraction System

#### Complete Rewrite of Core Extraction Engine
- **NEW**: Created `clinical-extractor.js` - A sophisticated extraction system specifically designed for treatment programs
- **ENHANCED**: Complete rewrite of extraction logic with clinical accuracy in mind
- **IMPROVED**: Multi-strategy program name detection (meta tags, logos, domain analysis, schema.org)
- **ENHANCED**: Location extraction with full address parsing and state detection
- **IMPROVED**: Contact information extraction with context-aware priority

#### Clinical Data Extraction
- **NEW**: Comprehensive therapy modality detection (40+ therapy types)
- **NEW**: Clinical specialization categorization (15+ categories)
- **NEW**: Staff credentials and qualification extraction
- **NEW**: Program length and duration detection
- **NEW**: Family involvement program details
- **NEW**: Academic support information extraction
- **NEW**: Insurance acceptance detection
- **NEW**: Accreditation and certification extraction

#### Formatting Excellence
- **NEW**: Professional clinical write-up formatting
- **NEW**: Structured sections for easy readability
- **NEW**: Evidence-based vs. experiential therapy categorization
- **NEW**: Clinical specialization listings
- **NEW**: Comprehensive contact information formatting

#### User Experience
- **IMPROVED**: Real-time extraction progress with detailed status
- **ENHANCED**: Activity log with timestamped events
- **NEW**: Extraction statistics display
- **IMPROVED**: Error handling and recovery
- **ENHANCED**: Visual feedback throughout extraction process

#### Technical Improvements
- **OPTIMIZED**: Extraction speed and accuracy
- **ENHANCED**: Memory usage and performance
- **IMPROVED**: Cross-site compatibility
- **FIXED**: Edge cases in data extraction
- **ENHANCED**: Regex patterns for better matching

### Why This Matters
This is the most significant update to the Chrome extension to date. The entire extraction system has been rebuilt from the ground up to produce clinical-quality write-ups that are:
- **Accurate**: Multi-strategy extraction ensures correct program identification
- **Comprehensive**: Captures all relevant clinical and administrative details
- **Professional**: Formatted for immediate use in clinical documentation
- **Reliable**: Robust error handling and fallback strategies

## Version 1.4.0 (October 9, 2025) - CRITICAL FIX
### 🚨 Major Extraction Improvements
- **Fixed Generic Extraction Issue**: No more "Treatment Program" and "Location extracted from page"
- **Improved Name Detection**: Now properly extracts facility names like "Voyage Recovery"
- **Better Phone Extraction**: Handles various phone formats (xxx-xxx-xxxx, (xxx) xxx-xxxx, etc.)
- **Enhanced Location Detection**: Finds city/state even without full addresses
- **Smart Population Detection**: Identifies "young adult men", age ranges, etc.
- **Feature Extraction**: Finds unique features like "5 full-time therapists", "week-long family program"

### 🎯 Specific Fixes for Sites Like Voyage Recovery
- Properly extracts facility name from logos, meta tags, and domain names
- Finds phone numbers even when formatted differently
- Detects location from various text patterns
- Identifies program-specific features and descriptions

### 📋 Technical Improvements
- New `improved-extractor.js` with smarter pattern matching
- Fallback strategies for each data point
- Better handling of sites without structured data
- Improved cleaning and validation of extracted data

---

## Version 1.3.0 (October 9, 2025)
### 🎯 Major Improvements
- **Editable Fields in Doc Creator Integration**: All extracted fields (name, location, phone, website, email) are now editable before adding to document
- **Fixed Button ID Conflicts**: Resolved duplicate ID issues that prevented Add/Cancel buttons from working
- **Enhanced User Experience**: Added hover effects and visual feedback to buttons
- **Better Field Labels**: Added helpful hints like "(Direct contact or main number)" for phone field

### 🐛 Bug Fixes
- Fixed "Add Program" and "Cancel" buttons not responding to clicks
- Resolved JavaScript template literal syntax errors
- Fixed optional chaining operator compatibility issues

### 💡 Features
- Added ability to edit/correct extracted information before saving
- Option to add direct contact numbers instead of general numbers
- Email field now properly optional
- Better focus management for input fields

---

## Version 1.2.0 (October 9, 2025)
### 🎯 Clinical Writeup Improvements
- **Program-Specific Content**: No more generic descriptions - extracts unique features from each website
- **Clinical Session Format**: Formatted specifically for family therapy sessions
- **Better Data Extraction**: Improved patterns for finding program-specific details
- **Enhanced Formatter**: New `enhanced-formatter.js` for generating clinical writeups

### 📋 New Features
- Extracts unique program philosophies
- Identifies specific staff credentials
- Pulls daily schedules and structure
- Captures academic program details
- Finds family involvement specifics
- Extracts aftercare planning details
- Identifies length of stay information

---

## Version 1.1.0 (Initial Enhanced Version)
### 🚀 Core Features
- Chrome Manifest V3 support
- Enhanced data extraction from treatment program websites
- Integration with Doc Creator app
- Multi-page extraction support
- Progress indicators and activity log
- Automatic detection of program information
- Support for structured data (JSON-LD, Schema.org)

### 📊 Extraction Capabilities
- Program names and locations
- Contact information (phone, email, website)
- Treatment modalities and therapies
- Specializations and conditions treated
- Age ranges and demographics
- Accreditations and certifications
- Insurance information

---

## Installation Instructions
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked"
4. Select the `chrome-extension-enhanced` folder
5. The extension icon will appear in your toolbar

## Updating
When updating to a new version:
1. Go to `chrome://extensions/`
2. Find "Family First Program Extractor"
3. Click the refresh/reload button (↻)
4. Verify the new version number is displayed

## Testing
After updating, test on a program website:
1. Visit any treatment program website
2. Click the extension icon
3. Click "Extract Program Info"
4. Verify extraction completes successfully
5. Test the "Copy to Tool" function
6. Confirm editable fields work in Doc Creator

---

**Current Version:** 1.6.1
**Last Updated:** October 9, 2025
**Maintained by:** Family First Adolescent Services
