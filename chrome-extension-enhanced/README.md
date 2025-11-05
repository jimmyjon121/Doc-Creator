# Family First Clinical Extractor v5.0

## Professional Clinical-Grade Data Extraction

This Chrome extension provides HIPAA-safe, clinical-grade extraction of treatment program data formatted for professional documentation.

## Key Features

### 🏥 Clinical-Grade Output Format
- **Structured Write-Ups**: Professional format ready for Doc Creator
- **HIPAA-Safe**: No PHI, clinical tone, factual reporting
- **Standardized Sections**: Consistent 9-section format
- **80-Character Lines**: Optimized for Calibri font and professional documents

### 📊 Comprehensive Extraction
- **50+ Data Fields**: From basic contact to clinical specializations
- **Smart Strategies**: Multiple fallback methods for each field
- **Evidence-Based vs Experiential**: Precise therapy categorization
- **Controlled Vocabularies**: 15+ specialization categories, 20+ insurance providers

### 🎯 Professional Data Structure

#### Output Sections (Exact Order):
1. **Program Header**: Name — City, ST
2. **Levels of Care**: Residential | PHP | IOP | Outpatient
3. **OVERVIEW**: 3-5 concise sentences, no marketing fluff
4. **PROGRAM STRUCTURE**: Length of stay, staff ratio, academics
5. **CLINICAL SERVICES**: Evidence-based, experiential, specializations
6. **FAMILY & ACADEMICS**: Family touchpoints, school supports
7. **ADMISSIONS & LOGISTICS**: Insurance, payment options
8. **ACCREDITATIONS / QUALITY**: Clinical and educational certifications
9. **CONTACT**: Phone | Email | Website

## Installation

1. Go to `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the `chrome-extension-enhanced` folder
5. Look for **Family First Clinical Extractor** v5.0.0

## Usage

1. Navigate to any treatment center website
2. Click the extension icon
3. Click **Extract Program Information**
4. Clinical write-up is automatically copied to clipboard
5. Paste directly into Doc Creator

## Test Sites

- https://www.newportacademy.com/
- https://www.paradigmtreatment.com/
- https://elevationsrtc.com/
- https://www.discoveryranch.net/

## Data Extraction Strategies

### Program Name Detection
1. JSON-LD structured data
2. Open Graph meta tags
3. Logo alt text
4. H1 heading
5. Domain heuristics

### Location Parsing
- Full address extraction
- City, State parsing
- State abbreviation normalization
- Never includes street address in header

### Clinical Services Categorization
- **Evidence-Based**: CBT, DBT, EMDR, ACT, MI, TF-CBT, etc.
- **Experiential**: Art, Music, Equine, Adventure, Wilderness, etc.
- **Specializations**: Trauma/PTSD, Anxiety, Depression, ADHD, etc.

### Insurance Detection
- 20+ major providers
- Automatic normalization (e.g., BCBS variations)
- Explicit mention requirement

### Quality Scoring
- 0-100% confidence based on:
  - Data field coverage
  - Cross-signal agreement
  - Source reliability

## Technical Architecture

### Files
- `manifest.json`: Extension configuration (v5.0.0)
- `enhanced-extractor.js`: Clinical-grade extraction engine
- `clinical-formatter.js`: Professional write-up formatter
- `popup.js`: User interface controller
- `popup.html`: Extension popup UI
- `background.js`: Service worker

### Data Flow
1. Content script extracts structured data
2. Formatter generates clinical write-up
3. Popup displays stats and preview
4. Auto-copy to clipboard for Doc Creator

## Version History

### v5.0.0 (Current)
- Clinical-grade formatter with exact specifications
- Enhanced extraction with field map strategies
- Clean workspace, removed duplicate files
- Professional 9-section output format
- HIPAA-safe, clinical tone

### v4.0.0
- Complete rewrite for reliability
- 50+ data fields
- Professional UI

## Support

For issues or questions about the clinical extraction format, refer to the inline documentation in:
- `clinical-formatter.js`: Output format contract
- `enhanced-extractor.js`: Extraction strategies

## License

Property of Family First Adolescent Services