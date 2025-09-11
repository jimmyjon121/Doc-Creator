# ClearHive Health - PDF Document Generation System
## Enterprise Healthcare Document Management Platform

### Product Overview
**ClearHive Health** is a comprehensive PDF document generation and management system designed for healthcare organizations specializing in adolescent treatment services. The platform streamlines the creation of aftercare options documents, treatment plans, and discharge packets with professional formatting and branding.

**Current Deployment**: Family First Adolescent Services, Palm Beach Gardens, FL

---

## About ClearHive Health

ClearHive Health provides healthcare facilities with a powerful, customizable document generation system that:
- Reduces documentation time by 75%
- Ensures consistent, professional formatting
- Maintains compliance with healthcare documentation standards
- Enables real-time collaboration during family sessions
- Supports multi-facility deployment

---

## System Architecture

### Core Components

#### 1. **Server Module** (`server.js`)
- Express.js web server (configurable port, default 3000)
- RESTful API for document generation and file management
- CORS-enabled for cross-origin requests
- Multi-tenant ready architecture
- File upload/download with multer middleware
- PDF validation and configurable size limits

#### 2. **Document Generator** (`aftercareDocumentGenerator.js`)
- Powered by jsPDF library for reliable PDF creation
- Dynamic letterhead system (customizable per organization)
- Structured template engine for consistent formatting
- Multi-section document support
- Automatic pagination and footer management

#### 3. **Web Interface** (`aftercare-builder.html`)
- Zero-dependency browser application
- Responsive design for tablets and desktops
- Three-state selection system:
  - Single click: Primary Recommendation
  - Double click: Home Recommendation  
  - Triple click: Remove selection
- Real-time search with fuzzy matching
- Print-to-PDF for instant generation

#### 4. **Data Management**
- **`treatmentData.js`**: Customizable program database
- **`templates.js`**: Organization-specific templates
- **`documentFormatter.js`**: Branding and formatting engine

---

## Key Features

### Document Generation Workflow

1. **Intelligent Program Selection**
   - Access comprehensive program database
   - Smart categorization (Primary/Home recommendations)
   - Real-time filtering and search
   - Visual feedback for selections

2. **Professional PDF Creation**
   - Organization-branded letterhead
   - Structured content sections
   - Automatic formatting and pagination
   - Contact information management
   - Compliance-ready footers

3. **Document Types Supported**
   - Aftercare Options Documents
   - Treatment Plans
   - Discharge Packets
   - Alumni Services Documentation
   - Custom document templates

### Multi-Organization Support

ClearHive Health supports deployment across multiple facilities with:
- Customizable branding per organization
- Separate program databases
- Organization-specific templates
- Isolated data storage
- Configurable workflows

---

## Technical Implementation

### API Endpoints

```javascript
POST /api/create-document        // Generate new PDF document
POST /api/create-aftercare       // Create aftercare options PDF
GET  /api/programs               // Retrieve program database
POST /api/merge-pdfs            // Combine multiple PDFs
POST /upload                    // File upload endpoint
GET  /download/:filename        // File download endpoint
GET  /api/organization          // Get org configuration
```

### PDF Generation Pipeline

```javascript
// ClearHive Health Document Pipeline
1. Receive request with client data
2. Load organization configuration
3. Initialize PDF engine (jsPDF/PDFKit)
4. Apply branded letterhead template
5. Inject structured content
6. Add compliance footers
7. Generate and store document
8. Return secure download link
```

### Security Architecture
- File type validation
- Configurable size limits
- Filename sanitization
- Secure output directories
- Organization data isolation

---

## Deployment Structure

```
clearhive-health/
│
├── /core/                           // ClearHive Core
│   ├── server.js                    // Main application server
│   ├── aftercareDocumentGenerator.js // PDF generation engine
│   ├── documentFormatter.js         // Formatting utilities
│   └── config.js                    // Platform configuration
│
├── /organizations/                  // Multi-tenant support
│   └── /family-first/              // Current deployment
│       ├── treatmentData.js        // Organization programs
│       ├── templates.js            // Custom templates
│       └── branding.json           // Branding configuration
│
├── /public/
│   └── aftercare-builder.html      // Web interface
│
├── /output/                        // Generated documents
│   └── /[organization-id]/
│       └── [documents]
│
├── /uploads/                       // Temporary storage
│   └── /[organization-id]/
│
└── package.json                    // Dependencies
```

---

## Dependencies

```json
{
  "name": "clearhive-health",
  "version": "2.0.0",
  "dependencies": {
    "express": "^4.18.0",
    "cors": "^2.8.5",
    "multer": "^1.4.5",
    "pdfkit": "^0.13.0",
    "pdf-lib": "^1.17.1",
    "jspdf": "^2.5.1",
    "fs-extra": "^11.0.0",
    "dotenv": "^16.0.0"
  }
}
```

---

## Data Models

### Program Object Schema
```javascript
{
  id: "unique-identifier",
  organizationId: "org-uuid",
  name: "Program Name",
  category: "Primary" | "Home" | "StepDown" | "Crisis",
  description: "Detailed program description",
  specialties: ["Trauma", "Substance Abuse", "DBT"],
  contact: {
    phone: "555-555-5555",
    website: "www.example.com",
    email: "contact@example.com",
    address: "Full address",
    fax: "555-555-5556"
  },
  insurance: ["Insurance1", "Insurance2"],
  ageRange: "13-17",
  treatmentDuration: "30-90 days",
  licensure: ["State licenses"],
  accreditation: ["JCAHO", "CARF"]
}
```

### Document Request Schema
```javascript
{
  organizationId: "family-first",
  clientName: "Client Name",
  clientId: "optional-client-id",
  date: "2024-01-01",
  primaryPrograms: ["program-id-1", "program-id-2"],
  homePrograms: ["program-id-3", "program-id-4"],
  socialWorker: "Jane Smith, LCSW",
  sessionNotes: "Additional notes",
  documentType: "aftercare-options",
  metadata: {
    sessionType: "family",
    participants: ["client", "mother", "father"]
  }
}
```

---

## Branding & Customization

### Organization Configuration

Each deployment can customize:

```javascript
{
  "organizationName": "Family First Adolescent Services",
  "logo": "/assets/logo.png",
  "colors": {
    "primary": "#003366",
    "secondary": "#0066CC",
    "accent": "#4A90E2"
  },
  "contact": {
    "address": "700 Village Square Crossing, Unit 101",
    "city": "Palm Beach Gardens, FL 33410",
    "phone": "(561) 328-7370",
    "fax": "(561) 328-7371",
    "website": "familyfirstas.com"
  },
  "documentSettings": {
    "fontSize": 11,
    "fontFamily": "Helvetica",
    "margins": 50,
    "lineSpacing": 1.5
  }
}
```

### Professional Formatting System

ClearHive Health maintains consistent professional appearance:

- **Headers**: 16pt bold, organization primary color
- **Subheaders**: 14pt bold, organization secondary color
- **Body text**: 11pt regular, professional gray (#333333)
- **Margins**: Configurable (default 50pt)
- **Line spacing**: Configurable (default 1.5x)
- **Page numbering**: Automatic

---

## Installation & Setup

### For Healthcare Organizations

1. **Initial Setup**
   ```bash
   git clone https://github.com/clearhive/health-docs.git
   cd health-docs
   npm install
   cp .env.example .env
   # Configure organization settings
   npm run setup:organization
   ```

2. **Configuration**
   - Edit `/organizations/[your-org]/config.json`
   - Add your program database
   - Customize templates
   - Upload logo assets

3. **Launch**
   ```bash
   npm start
   # Access at http://localhost:3000
   ```

### For Developers

1. **Development Mode**
   ```bash
   npm run dev
   ```

2. **Testing**
   ```bash
   npm test
   npm run test:pdf
   ```

3. **Building for Production**
   ```bash
   npm run build
   npm run deploy
   ```

---

## Usage Instructions

### For Clinical Staff

1. **Creating Aftercare Documents**
   - Access ClearHive Health portal
   - Search or browse treatment programs
   - Click to categorize (1x=Primary, 2x=Home)
   - Enter client information
   - Generate professional PDF
   - Present during family session

2. **Managing Discharge Packets**
   - Upload required documents
   - Arrange in preferred order
   - Generate combined packet
   - Include cover page and TOC

### For Administrators

1. **Managing Programs**
   - Access admin portal
   - Add/edit/remove programs
   - Update contact information
   - Manage insurance acceptance

2. **Customizing Templates**
   - Edit template language
   - Adjust formatting
   - Update branding elements

---

## Compliance & Standards

ClearHive Health maintains compliance with:
- HIPAA privacy requirements
- State documentation requirements
- JCAHO documentation standards
- CARF accreditation requirements

### Security Features
- Encrypted data transmission
- Secure file storage
- Audit logging
- Session management
- Role-based access control (coming soon)

---

## Performance Metrics

- **Document Generation**: <2 seconds average
- **Search Response**: <100ms
- **File Upload**: 50MB maximum
- **Concurrent Users**: 100+ supported
- **Monthly Documents**: 10,000+ capacity

---

## Roadmap

### Version 2.1 (Q1 2025)
- Electronic signature integration
- Mobile application
- Advanced analytics dashboard

### Version 2.2 (Q2 2025)
- EHR integrations (Epic, Cerner)
- Automated insurance verification
- Batch document generation

### Version 3.0 (Q3 2025)
- AI-powered program matching
- Multi-language support
- Advanced workflow automation

---

## Support & Resources

### ClearHive Health Support
**Email**: support@clearhivehealth.com  
**Documentation**: docs.clearhivehealth.com  
**Phone**: 1-800-CLEARHIVE  

### Current Implementation
**Organization**: Family First Adolescent Services  
**Location**: Palm Beach Gardens, FL  
**Contact**: (561) 328-7370  

---

## License

ClearHive Health - Enterprise License  
© 2024 ClearHive Health Technologies. All rights reserved.

Licensed for use by authorized healthcare organizations only.

---

## Acknowledgments

ClearHive Health is proudly serving behavioral health organizations across the United States, helping streamline documentation and improve patient care outcomes.

---

*Documentation Version: 2.0.0*  
*Platform Version: ClearHive Health Doc Creater v2.0*  
*Last Updated: 2024*# Doc-Creator