/**
 * Document Model - Document generation logic for aftercare documents
 * Handles document construction, formatting, and export
 * @file document-model.js
 * @requires program-types.js
 * @requires program-core.js
 */

(function() {
  'use strict';

  // ============================================================================
  // DOCUMENT TYPES
  // ============================================================================

  /**
   * Document type definitions
   */
  const DOC_TYPES = {
    AFTERCARE_OPTIONS: {
      id: 'aftercare-options',
      name: 'Aftercare Options',
      description: 'Week 5 - Compare programs for family',
      headerTemplate: (initials) => `Hello,

The FFAS clinical team has formulated a list of recommendations and options to support ${initials}'s continuing care. Included in the list is: contact information, location, website, and a breakdown of specialties and services provided by each program.

Aftercare Options:`,
    },
    AFTERCARE_PLAN: {
      id: 'aftercare-plan',
      name: 'Aftercare Plan',
      description: 'At discharge - Finalized placement',
      headerTemplate: (initials) => `Hello,

Below is ${initials}'s aftercare plan. Included in this list is: contact information, location, website, and a breakdown of specialties and services provided by the program.

Aftercare Plan:`,
    },
  };

  /**
   * At-Home section header
   */
  const AT_HOME_HEADER = `AT HOME Recommendation: If extended residential care is not a viable option, below are the clinical recommendations should your child return home.`;

  // ============================================================================
  // ALUMNI SERVICES CONTENT
  // ============================================================================

  /**
   * Alumni services blocks
   */
  const ALUMNI_SERVICES = {
    PARENT_FOCUS_GROUP: {
      id: 'parent-focus-group',
      name: 'Parent Focus Group',
      content: `Parent Focus Group:
Thursday 3:30-5:00pm EST
https://us06web.zoom.us/j/89418742321?pwd=lln0XmbUHF1bk4bUi7y4Q6GObFmMQh.1
Meeting ID: 894 1874 2321 | Passcode: 056912

Friday 3:30-5:00pm EST
https://us06web.zoom.us/j/89876708775?pwd=swYjZuM7EiUr89sR8SYpY7M60y1FAH.1
Meeting ID: 898 7670 8775 | Passcode: 374367`,
    },
    ALUMNI_PROGRAMMING: {
      id: 'alumni-programming',
      name: 'Alumni Programming (Parent Support Group)',
      content: `Alumni Programming (Parent Support Group):
Wednesday & Sunday 7:00-8:00pm EST
https://us02web.zoom.us/j/88924044948?pwd=aUl2ejRFdldXODFyRlZreVorVGNaUT09
Meeting ID: 889 2404 4948 | Passcode: Family123`,
    },
    NEST_ALUMNI: {
      id: 'nest-alumni',
      name: 'NEST Alumni Programming',
      content: `NEST Alumni Programming:
Friday 4:30-5:30pm EST
https://us06web.zoom.us/j/86864413744`,
      requiresHouse: 'NEST',
    },
  };

  // ============================================================================
  // DOCUMENT STATE
  // ============================================================================

  /**
   * Current document draft state
   * @typedef {Object} DocumentDraft
   * @property {string} id - Draft ID
   * @property {string} type - Document type
   * @property {string} clientId - Client ID
   * @property {string} clientInitials - Client initials
   * @property {string} scenario - 'primary' | 'admin-discharge' | 'at-home'
   * @property {Object} phases - Programs by phase
   * @property {string[]} phases.stabilize - Program IDs for stabilize phase
   * @property {string[]} phases.bridge - Program IDs for bridge phase
   * @property {string[]} phases.sustain - Program IDs for sustain phase
   * @property {string[]} phases.atHome - Program IDs for at-home
   * @property {Object.<string, string>} programNotes - Notes per program ID
   * @property {Object.<string, string>} programTracks - Track per program ID
   * @property {Object} alumni - Alumni services selection
   * @property {boolean} alumni.parentFocusGroup
   * @property {boolean} alumni.alumniProgramming
   * @property {boolean} alumni.nestAlumni
   * @property {Date} createdAt
   * @property {Date} updatedAt
   * @property {string} status - 'draft' | 'exported' | 'finalized'
   */

  let _currentDraft = null;
  let _autoSaveTimer = null;
  const STORAGE_KEY = 'cc-document-draft';

  // ============================================================================
  // DRAFT MANAGEMENT
  // ============================================================================

  /**
   * Create a new document draft
   * @param {string} type - Document type ('aftercare-options' or 'aftercare-plan')
   * @param {string} clientId - Client ID
   * @param {string} clientInitials - Client initials
   * @returns {DocumentDraft}
   */
  function createDraft(type, clientId, clientInitials) {
    const draft = {
      id: `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      clientId,
      clientInitials: clientInitials || 'XX',
      scenario: 'primary',
      phases: {
        simple: [],      // For Aftercare Options (simple list)
        stabilize: [],
        bridge: [],
        sustain: [],
        atHome: [],
      },
      programNotes: {},
      programTracks: {},
      alumni: {
        parentFocusGroup: type === 'aftercare-plan',
        alumniProgramming: type === 'aftercare-plan',
        nestAlumni: false,
      },
      atHomeMode: 'include', // 'include' | 'separate' | 'none'
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'draft',
    };

    _currentDraft = draft;
    _saveDraft();
    _startAutoSave();

    window.dispatchEvent(new CustomEvent('ccdocs:draftCreated', {
      detail: { draft }
    }));

    return draft;
  }

  /**
   * Get current draft
   * @returns {DocumentDraft|null}
   */
  function getCurrentDraft() {
    return _currentDraft;
  }

  /**
   * Load draft from storage
   * @returns {DocumentDraft|null}
   */
  function loadDraft() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        _currentDraft = JSON.parse(saved);
        _currentDraft.createdAt = new Date(_currentDraft.createdAt);
        _currentDraft.updatedAt = new Date(_currentDraft.updatedAt);
        _startAutoSave();
        return _currentDraft;
      }
    } catch (e) {
      console.warn('Failed to load draft:', e);
    }
    return null;
  }

  /**
   * Save draft to storage
   */
  function _saveDraft() {
    if (!_currentDraft) return;

    _currentDraft.updatedAt = new Date();

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(_currentDraft));
    } catch (e) {
      console.warn('Failed to save draft:', e);
    }

    window.dispatchEvent(new CustomEvent('ccdocs:draftSaved', {
      detail: { draft: _currentDraft }
    }));
  }

  /**
   * Start auto-save timer
   */
  function _startAutoSave() {
    _stopAutoSave();
    
    const prefs = window.ccPreferences?.get() || {};
    const interval = (prefs.autoSaveInterval || 3) * 60 * 1000; // Default 3 minutes

    if (interval > 0) {
      _autoSaveTimer = setInterval(_saveDraft, interval);
    }
  }

  /**
   * Stop auto-save timer
   */
  function _stopAutoSave() {
    if (_autoSaveTimer) {
      clearInterval(_autoSaveTimer);
      _autoSaveTimer = null;
    }
  }

  /**
   * Clear draft
   */
  function clearDraft() {
    _currentDraft = null;
    _stopAutoSave();
    
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      // Ignore
    }

    window.dispatchEvent(new CustomEvent('ccdocs:draftCleared'));
  }

  // ============================================================================
  // DRAFT MODIFICATION
  // ============================================================================

  /**
   * Add program to a phase
   * @param {string} phase - 'stabilize' | 'bridge' | 'sustain' | 'atHome'
   * @param {string} programId
   * @param {string} track - Optional track identifier
   */
  function addProgram(phase, programId, track = 'primary') {
    if (!_currentDraft) return;
    if (!_currentDraft.phases[phase]) return;

    // Don't add duplicates
    if (_currentDraft.phases[phase].includes(programId)) return;

    _currentDraft.phases[phase].push(programId);
    _currentDraft.programTracks[programId] = track;
    _saveDraft();

    window.dispatchEvent(new CustomEvent('ccdocs:programAdded', {
      detail: { phase, programId, track }
    }));
    
    // Emit event for onboarding checklist
    if (window.OnboardingEvents) {
      OnboardingEvents.emit('cc:doc:programAdded', { phase, programId });
    }
    window.dispatchEvent(new CustomEvent('cc:doc:programAdded', { detail: { phase, programId } }));
    console.log('[Document] Emitted cc:doc:programAdded to window');
  }

  /**
   * Remove program from a phase
   * @param {string} phase
   * @param {string} programId
   */
  function removeProgram(phase, programId) {
    if (!_currentDraft) return;
    if (!_currentDraft.phases[phase]) return;

    const index = _currentDraft.phases[phase].indexOf(programId);
    if (index > -1) {
      _currentDraft.phases[phase].splice(index, 1);
      delete _currentDraft.programNotes[programId];
      delete _currentDraft.programTracks[programId];
      _saveDraft();

      window.dispatchEvent(new CustomEvent('ccdocs:programRemoved', {
        detail: { phase, programId }
      }));
    }
  }

  /**
   * Move program between phases
   * @param {string} programId
   * @param {string} fromPhase
   * @param {string} toPhase
   * @param {number} toIndex - Optional position in target phase
   */
  function moveProgram(programId, fromPhase, toPhase, toIndex = -1) {
    if (!_currentDraft) return;

    // Remove from source
    const fromIndex = _currentDraft.phases[fromPhase]?.indexOf(programId);
    if (fromIndex > -1) {
      _currentDraft.phases[fromPhase].splice(fromIndex, 1);
    }

    // Add to target
    if (toIndex >= 0) {
      _currentDraft.phases[toPhase].splice(toIndex, 0, programId);
    } else {
      _currentDraft.phases[toPhase].push(programId);
    }

    _saveDraft();
  }

  /**
   * Reorder programs within a phase
   * @param {string} phase
   * @param {string[]} programIds - New order of program IDs
   */
  function reorderPrograms(phase, programIds) {
    if (!_currentDraft) return;
    _currentDraft.phases[phase] = programIds;
    _saveDraft();
  }

  /**
   * Set note for a program
   * @param {string} programId
   * @param {string} note
   */
  function setProgramNote(programId, note) {
    if (!_currentDraft) return;
    
    if (note && note.trim()) {
      _currentDraft.programNotes[programId] = note.trim();
    } else {
      delete _currentDraft.programNotes[programId];
    }
    _saveDraft();
  }

  /**
   * Set document type
   * @param {string} type
   */
  function setDocumentType(type) {
    if (!_currentDraft) return;
    _currentDraft.type = type;
    _saveDraft();
  }

  /**
   * Set scenario
   * @param {string} scenario - 'primary' | 'admin-discharge' | 'at-home'
   */
  function setScenario(scenario) {
    if (!_currentDraft) return;
    _currentDraft.scenario = scenario;
    _saveDraft();
  }
  
  /**
   * Set at-home mode
   * @param {string} mode - 'include' | 'separate' | 'none'
   */
  function setAtHomeMode(mode) {
    if (!_currentDraft) return;
    _currentDraft.atHomeMode = mode;
    _saveDraft();
  }

  /**
   * Toggle alumni service
   * @param {string} serviceId - 'parentFocusGroup' | 'alumniProgramming' | 'nestAlumni'
   * @param {boolean} enabled
   */
  function setAlumniService(serviceId, enabled) {
    if (!_currentDraft) return;
    _currentDraft.alumni[serviceId] = enabled;
    _saveDraft();
  }

  /**
   * Update client info
   * @param {string} clientId
   * @param {string} clientInitials
   */
  function setClient(clientId, clientInitials) {
    if (!_currentDraft) return;
    _currentDraft.clientId = clientId;
    _currentDraft.clientInitials = clientInitials || 'XX';
    _saveDraft();
  }

  // ============================================================================
  // PROGRAM WRITE-UP GENERATION
  // ============================================================================

  /**
   * Generate write-up for a program (supports both database and custom programs)
   * @param {UiProgram|Object} program
   * @param {string} style - 'concise' | 'standard' | 'detailed'
   * @returns {string}
   */
  function generateProgramWriteUp(program, style = 'standard') {
    // Handle custom programs
    if (program.isCustom) {
      return _generateCustomProgramWriteUp(program);
    }
    
    const lines = [];
    
    // Title line (10pt Bold)
    const locationPart = program.city && program.state 
      ? `(${program.city}, ${program.state})` 
      : program.primaryLOC;
    lines.push(`${program.name} – ${locationPart}`);
    lines.push('');
    
    // Level of Care paragraph (9pt)
    const locParagraph = _buildLOCParagraph(program, style);
    if (locParagraph) {
      lines.push(locParagraph);
      lines.push('');
    }
    
    // Program Details bullets (9pt)
    const bullets = _buildProgramBullets(program, style);
    if (bullets.length > 0) {
      bullets.forEach(bullet => {
        lines.push(`• ${bullet}`);
      });
      lines.push('');
    }
    
    // Contact block (9pt)
    const contactLines = _buildContactBlock(program);
    if (contactLines.length > 0) {
      lines.push(...contactLines);
    }
    
    return lines.join('\n');
  }

  /**
   * Build LOC paragraph
   * @param {UiProgram} program
   * @param {string} style
   * @returns {string}
   */
  function _buildLOCParagraph(program, style) {
    const parts = [];
    
    // Level of care
    if (program.levelOfCare.length > 0) {
      const locLabels = window.ccProgramTypes?.LOC_LABELS || {};
      const locStr = program.levelOfCare
        .map(loc => locLabels[loc] || loc)
        .join(' and ');
      parts.push(locStr);
    }
    
    // Age range
    if (program.ageMin || program.ageMax) {
      const minAge = program.ageMin || 'younger';
      const maxAge = program.ageMax || 'adult';
      parts.push(`for ages ${minAge}-${maxAge}`);
    }
    
    // Gender
    if (program.gendersServed && program.gendersServed.length > 0) {
      const gender = program.gendersServed.join('/');
      parts.push(gender);
    }
    
    // Clinical focus from summary (brief)
    if (style !== 'concise' && program.summary) {
      // Extract first sentence or two
      const summaryPart = program.summary.split('.').slice(0, 2).join('.').trim();
      if (summaryPart && summaryPart.length < 200) {
        parts.push(summaryPart);
      }
    }
    
    return parts.filter(Boolean).join('. ').replace(/\.\./g, '.') + '.';
  }

  /**
   * Build program bullets with bolded descriptors
   * @param {UiProgram} program
   * @param {string} style
   * @returns {string[]}
   */
  function _buildProgramBullets(program, style) {
    const bullets = [];
    
    // Use features if available
    if (program.features && program.features.length > 0) {
      // Features often come pre-formatted with descriptors
      program.features.forEach(feature => {
        // If feature already has a colon (descriptor pattern), use as-is
        if (feature.includes(':')) {
          bullets.push(feature);
        } else {
          // Try to extract a descriptor from the start
          bullets.push(feature);
        }
      });
    } else {
      // Generate bullets from available data
      
      // Clinical modalities
      if (program.modalities && program.modalities.length > 0) {
        const modalityStr = program.modalities.join(', ');
        bullets.push(`Trauma-Informed Care: Offers ${modalityStr} for trauma and emotional regulation.`);
      }
      
      // LGBTQ+ affirming
      if (program.lgbtqAffirming) {
        bullets.push(`Inclusive Environment: LGBTQ+ affirming program with trained staff.`);
      }
      
      // Academics (for RTC/TBS)
      if (program.academics) {
        const acadParts = [];
        if (program.academics.accreditedSchool) acadParts.push('accredited school');
        if (program.academics.specialEducation) acadParts.push('IEP/504 support');
        if (program.academics.creditsTransferable) acadParts.push('credit recovery');
        if (acadParts.length > 0) {
          bullets.push(`Academic Integration: ${acadParts.join(', ')}.`);
        }
      }
      
      // Clinical flags
      if (program.treatsASD) {
        bullets.push(`Specialized Services: Autism spectrum disorder treatment available.`);
      }
      if (program.treatsSUD) {
        bullets.push(`Substance Use: Co-occurring substance use disorder treatment.`);
      }
      
      // Weekly structure
      if (style === 'detailed' && program.weeklyStructure && program.weeklyStructure.length > 0) {
        program.weeklyStructure.forEach(item => {
          if (!bullets.some(b => b.includes(item.split(':')[0]))) {
            bullets.push(item);
          }
        });
      }
    }
    
    // Limit bullets based on style
    const maxBullets = style === 'concise' ? 3 : (style === 'detailed' ? 8 : 5);
    return bullets.slice(0, maxBullets);
  }

  /**
   * Build contact block
   * @param {UiProgram} program
   * @returns {string[]}
   */
  function _buildContactBlock(program) {
    const lines = [];
    const contacts = program.contacts || {};
    
    if (contacts.phone || contacts.admissionsPhone) {
      lines.push(`Phone: ${contacts.admissionsPhone || contacts.phone}`);
    }
    if (contacts.email || contacts.admissionsEmail) {
      lines.push(`Email: ${contacts.admissionsEmail || contacts.email}`);
    }
    if (contacts.website) {
      // Clean up website URL for display
      const url = contacts.website.replace(/^https?:\/\//, '').replace(/\/$/, '');
      lines.push(`Website: ${url}`);
    }
    if (program.fullAddress) {
      lines.push(`Address: ${program.fullAddress}`);
    } else if (program.city && program.state) {
      lines.push(`Location: ${program.city}, ${program.state}`);
    }
    
    return lines;
  }
  
  /**
   * Generate write-up for a custom (manually entered) program
   * @param {Object} program - Custom program object
   * @returns {string}
   */
  function _generateCustomProgramWriteUp(program) {
    const lines = [];
    
    // Title line (matching standard format: "Name – Location")
    const locationPart = program.location || (program.city && program.state ? `${program.city}, ${program.state}` : '');
    lines.push(`${program.name}${locationPart ? ` – (${locationPart})` : ''}`);
    lines.push('');
    
    // Level of care description paragraph
    if (program.primaryLOC) {
      lines.push(`${program.primaryLOC} program providing clinical services.`);
      lines.push('');
    }
    
    // Services as bullets (split by comma if multiple)
    if (program.services) {
      const services = program.services.split(/[,;]/).map(s => s.trim()).filter(s => s);
      if (services.length > 1) {
        // Multiple services - format as bullets
        services.forEach(service => {
          lines.push(`• ${service}`);
        });
      } else {
        // Single service description - format as paragraph
        lines.push(`• Services: ${program.services}`);
      }
      lines.push('');
    }
    
    // Additional notes as bullet if provided
    if (program.notes) {
      lines.push(`• Note: ${program.notes}`);
      lines.push('');
    }
    
    // Contact information block (matching standard format)
    if (program.phone) {
      lines.push(`Phone: ${program.phone}`);
    }
    if (program.website) {
      const url = program.website.replace(/^https?:\/\//, '').replace(/\/$/, '');
      lines.push(`Website: ${url}`);
    }
    if (program.location) {
      lines.push(`Location: ${program.location}`);
    } else if (program.city && program.state) {
      lines.push(`Location: ${program.city}, ${program.state}`);
    }
    
    return lines.join('\n');
  }
  
  /**
   * Get program by ID (checks both database and custom programs)
   * @param {string} programId
   * @returns {Object|null}
   */
  function _getProgramById(programId) {
    // Check if it's a custom program
    if (programId.startsWith('custom_') && _currentDraft?.customPrograms?.[programId]) {
      return _currentDraft.customPrograms[programId];
    }
    // Look up in database
    return window.ccPrograms?.byId(programId) || null;
  }

  // ============================================================================
  // DOCUMENT GENERATION
  // ============================================================================

  /**
   * Generate complete document content
   * @param {DocumentDraft} draft - Optional draft to use (defaults to current)
   * @returns {string}
   */
  function generateDocument(draft = null) {
    const doc = draft || _currentDraft;
    if (!doc) {
      console.error('No draft to generate');
      return '';
    }

    const lines = [];
    const prefs = window.ccPreferences?.get() || {};
    const style = prefs.writeUpLength || 'standard';

    // Get document type
    const docType = doc.type === 'aftercare-plan' 
      ? DOC_TYPES.AFTERCARE_PLAN 
      : DOC_TYPES.AFTERCARE_OPTIONS;

    // Header
    lines.push(docType.headerTemplate(doc.clientInitials));
    lines.push('');
    lines.push('');

    // Get programs API
    const programs = window.ccPrograms;
    if (!programs) {
      console.error('ccPrograms not available');
      return lines.join('\n');
    }

    // Check if using simple list (Aftercare Options) or phased view (Aftercare Plan)
    const isAftercarePlan = doc.type === 'aftercare-plan';
    
    if (isAftercarePlan) {
      // Aftercare Plan: Use phased structure
      const phases = ['stabilize', 'bridge', 'sustain'];
      phases.forEach(phase => {
        const programIds = doc.phases[phase] || [];
        if (programIds.length === 0) return;

        programIds.forEach(id => {
          const program = _getProgramById(id);
          if (!program) return;

          lines.push(generateProgramWriteUp(program, style));
          lines.push('');
          lines.push('');
        });
      });
    } else {
      // Aftercare Options: Use simple list
      const simplePrograms = doc.phases.simple || [];
      simplePrograms.forEach(id => {
        const program = _getProgramById(id);
        if (!program) return;

        lines.push(generateProgramWriteUp(program, style));
        lines.push('');
        lines.push('');
      });
    }

    // At-Home section (only if mode is 'include')
    const atHomeMode = doc.atHomeMode || 'include';
    const atHomePrograms = doc.phases.atHome || [];
    
    if (atHomeMode === 'include' && atHomePrograms.length > 0) {
      lines.push('');
      lines.push(AT_HOME_HEADER);
      lines.push('');
      lines.push('');

      atHomePrograms.forEach(id => {
        const program = _getProgramById(id);
        if (!program) return;

        lines.push(generateProgramWriteUp(program, style));
        lines.push('');
        lines.push('');
      });
    }

    // Alumni services (for Aftercare Plan only)
    if (doc.type === 'aftercare-plan') {
      const alumniContent = [];
      
      if (doc.alumni.parentFocusGroup) {
        alumniContent.push(ALUMNI_SERVICES.PARENT_FOCUS_GROUP.content);
      }
      if (doc.alumni.alumniProgramming) {
        alumniContent.push(ALUMNI_SERVICES.ALUMNI_PROGRAMMING.content);
      }
      if (doc.alumni.nestAlumni) {
        alumniContent.push(ALUMNI_SERVICES.NEST_ALUMNI.content);
      }

      if (alumniContent.length > 0) {
        lines.push('');
        lines.push('─'.repeat(50));
        lines.push('');
        lines.push('ALUMNI SERVICES');
        lines.push('');
        lines.push(alumniContent.join('\n\n'));
      }
    }

    return lines.join('\n');
  }
  
  /**
   * Generate separate at-home options document
   * @param {DocumentDraft} draft - Optional draft to use (defaults to current)
   * @returns {string}
   */
  function generateAtHomeDocument(draft = null) {
    const doc = draft || _currentDraft;
    if (!doc) {
      console.error('No draft to generate at-home document');
      return '';
    }
    
    const atHomePrograms = doc.phases.atHome || [];
    if (atHomePrograms.length === 0) {
      return '';
    }

    const lines = [];
    const prefs = window.ccPreferences?.get() || {};
    const style = prefs.writeUpLength || 'standard';
    const programs = window.ccPrograms;
    
    if (!programs) {
      console.error('ccPrograms not available');
      return '';
    }

    // Header for at-home document
    lines.push(`Hello,

If extended residential or therapeutic care is not a viable option for ${doc.clientInitials}, below are clinical recommendations for continued support at home. These include local outpatient services, virtual therapy options, and community-based programs.

At-Home Options:`);
    lines.push('');
    lines.push('');

    atHomePrograms.forEach(id => {
      const program = _getProgramById(id);
      if (!program) return;

      lines.push(generateProgramWriteUp(program, style));
      lines.push('');
      lines.push('');
    });

    return lines.join('\n');
  }

  /**
   * Get file name for export
   * @param {string} extension - File extension ('docx' or 'pdf')
   * @param {string} docType - 'primary' or 'athome' 
   * @returns {string}
   */
  function getFileName(extension = 'pdf', docType = 'primary') {
    if (!_currentDraft) return `Aftercare_Document.${extension}`;

    const initials = _currentDraft.clientInitials || 'XX';
    let docName;
    
    if (docType === 'athome') {
      docName = 'At_Home_Options';
    } else {
      docName = _currentDraft.type === 'aftercare-plan' 
        ? 'Aftercare_Plan' 
        : 'Aftercare_Options';
    }
    
    const date = new Date().toISOString().split('T')[0];

    return `${initials}_${docName}_${date}.${extension}`;
  }

  /**
   * Get summary of current document
   * @returns {Object}
   */
  function getDocumentSummary() {
    if (!_currentDraft) return null;

    const programCount = 
      (_currentDraft.phases.simple?.length || 0) +
      (_currentDraft.phases.stabilize?.length || 0) +
      (_currentDraft.phases.bridge?.length || 0) +
      (_currentDraft.phases.sustain?.length || 0) +
      (_currentDraft.phases.atHome?.length || 0);

    return {
      type: _currentDraft.type,
      clientInitials: _currentDraft.clientInitials,
      scenario: _currentDraft.scenario,
      programCount,
      phases: {
        stabilize: _currentDraft.phases.stabilize?.length || 0,
        bridge: _currentDraft.phases.bridge?.length || 0,
        sustain: _currentDraft.phases.sustain?.length || 0,
        atHome: _currentDraft.phases.atHome?.length || 0,
      },
      alumni: { ..._currentDraft.alumni },
      status: _currentDraft.status,
      updatedAt: _currentDraft.updatedAt,
    };
  }

  // ============================================================================
  // LETTERHEAD PATHS
  // ============================================================================
  
  const LETTERHEAD = {
    header: 'assets/letterhead/ffas-letterhead-header.png',
    footer: 'assets/letterhead/ffas-letterhead-footer.jpg'
  };

  // ============================================================================
  // EXPORT FUNCTIONS
  // ============================================================================

  /**
   * Export document (triggers download)
   * @param {string} format - 'pdf' | 'docx' | 'both'
   * @returns {Promise<Object>} - Result with file paths
   */
  async function exportDocument(format = 'both') {
    if (!_currentDraft) {
      throw new Error('No draft to export');
    }

    const content = generateDocument();
    const results = {
      pdf: null,
      docx: null,
    };

    console.log('📄 Export requested:', format);
    console.log('Content length:', content.length, 'characters');
    
    if (format === 'pdf' || format === 'both') {
      const pdfFileName = getFileName('pdf');
      results.pdf = pdfFileName;
      await _generatePDFWithLetterhead(content, pdfFileName);
    }

    if (format === 'docx' || format === 'both') {
      const docxFileName = getFileName('docx');
      results.docx = docxFileName;
      // Generate DOCX with letterhead
      await _generateDOCXWithLetterhead(content, docxFileName);
    }

    // Update draft status
    _currentDraft.status = 'exported';
    _saveDraft();

    // Dispatch export event
    window.dispatchEvent(new CustomEvent('ccdocs:exported', {
      detail: { format, files: results }
    }));

    // Show outcome tracking modal for aftercare-plan documents
    if (_currentDraft.type === 'aftercare-plan' && _currentDraft.clientId) {
      setTimeout(() => {
        if (window.outcomeTrackingModal) {
          // Collect selected programs from all phases
          const selectedPrograms = {
            stabilize: _currentDraft.phases?.stabilize || [],
            bridge: _currentDraft.phases?.bridge || [],
            sustain: _currentDraft.phases?.sustain || []
          };
          
          window.outcomeTrackingModal.show({
            clientId: _currentDraft.clientId,
            clientInitials: _currentDraft.clientInitials || 'Client',
            selectedPrograms: selectedPrograms,
            documentId: _currentDraft.id,
            onComplete: (outcome) => {
              console.log('✅ Discharge outcome recorded:', outcome);
            }
          });
        }
      }, 1000); // Delay to let PDF download start
    }

    return results;
  }

  /**
   * Generate PDF with Family First letterhead
   * @param {string} content - Document content
   * @param {string} filename - Output filename
   */
  async function _generatePDFWithLetterhead(content, filename) {
    // Open a new window for print-to-PDF with letterhead
    const printWindow = window.open('', '_blank', 'width=850,height=1100');
    
    if (!printWindow) {
      console.error('Popup blocked - falling back to text download');
      _downloadTextFile(content, filename.replace('.pdf', '.txt'));
      return;
    }

    // Get absolute path to letterhead images
    const basePath = window.location.href.substring(0, window.location.href.lastIndexOf('/') + 1);
    const headerPath = basePath + LETTERHEAD.header;
    const footerPath = basePath + LETTERHEAD.footer;
    
    // Format content for HTML display
    const htmlContent = _formatContentForPrint(content);
    
    printWindow.document.write(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${filename}</title>
  <style>
    @page {
      size: letter;
      margin: 0.5in 0.75in 1in 0.75in;
    }
    
    * {
      box-sizing: border-box;
    }
    
    body {
      font-family: Calibri, 'Segoe UI', Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.5;
      color: #1a1a1a;
      margin: 0;
      padding: 0;
      background: white;
    }
    
    .document-container {
      max-width: 7in;
      margin: 0 auto;
      padding: 0;
    }
    
    .letterhead-header {
      width: 100%;
      max-width: 350px;
      height: auto;
      margin: 0 auto 24px auto;
      display: block;
    }
    
    .letterhead-footer {
      position: fixed;
      bottom: 0.25in;
      left: 0;
      right: 0;
      text-align: center;
    }
    
    .letterhead-footer img {
      max-width: 650px;
      width: 80%;
      height: auto;
    }
    
    .document-content {
      padding-bottom: 80px; /* Space for footer */
    }
    
    .greeting {
      margin-bottom: 16px;
    }
    
    .intro-paragraph {
      margin-bottom: 24px;
      text-align: justify;
    }
    
    .section-header {
      font-weight: bold;
      margin-top: 24px;
      margin-bottom: 8px;
      color: #1a365d;
    }
    
    .program-block {
      margin-bottom: 28px;
      page-break-inside: avoid;
    }
    
    .program-title {
      font-size: 11pt;
      font-weight: bold;
      color: #1a365d;
      margin-bottom: 8px;
    }
    
    .program-description {
      margin-bottom: 8px;
      text-align: justify;
    }
    
    .program-bullets {
      margin: 8px 0 8px 20px;
      padding: 0;
    }
    
    .program-bullets li {
      margin-bottom: 4px;
    }
    
    .program-contact {
      font-size: 10pt;
      color: #4a5568;
      margin-top: 8px;
    }
    
    .program-contact div {
      margin-bottom: 2px;
    }
    
    .at-home-header {
      font-weight: bold;
      font-style: italic;
      margin-top: 32px;
      margin-bottom: 16px;
      padding-top: 16px;
      border-top: 1px solid #cbd5e0;
      color: #2d3748;
    }
    
    .alumni-section {
      margin-top: 32px;
      padding-top: 16px;
      border-top: 1px solid #cbd5e0;
    }
    
    .alumni-title {
      font-weight: bold;
      color: #1a365d;
      margin-bottom: 12px;
    }
    
    .alumni-block {
      margin-bottom: 16px;
      font-size: 10pt;
    }
    
    @media print {
      body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
      
      .letterhead-footer {
        position: fixed;
        bottom: 0;
      }
      
      .no-print {
        display: none !important;
      }
    }
    
    /* Print button styles */
    .print-controls {
      position: fixed;
      top: 10px;
      right: 10px;
      z-index: 1000;
      display: flex;
      gap: 8px;
    }
    
    .print-btn {
      padding: 10px 20px;
      font-size: 14px;
      font-weight: 600;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .print-btn-primary {
      background: #1a365d;
      color: white;
    }
    
    .print-btn-primary:hover {
      background: #2d4a7c;
    }
    
    .print-btn-secondary {
      background: #e2e8f0;
      color: #1a365d;
    }
    
    .print-btn-secondary:hover {
      background: #cbd5e0;
    }
  </style>
</head>
<body>
  <div class="print-controls no-print">
    <button class="print-btn print-btn-primary" onclick="window.print()">🖨️ Print / Save as PDF</button>
    <button class="print-btn print-btn-secondary" onclick="window.close()">✕ Close</button>
  </div>
  
  <div class="document-container">
    <img src="${headerPath}" alt="Family First Adolescent Services" class="letterhead-header">
    
    <div class="document-content">
      ${htmlContent}
    </div>
  </div>
  
  <div class="letterhead-footer">
    <img src="${footerPath}" alt="Family First Contact Information">
  </div>
</body>
</html>
    `);
    
    printWindow.document.close();
    
    // Focus and print after images load
    printWindow.onload = function() {
      printWindow.focus();
    };
  }
  
  /**
   * Format plain text content for HTML print display
   * @param {string} content - Raw document content
   * @returns {string} - HTML formatted content
   */
  function _formatContentForPrint(content) {
    const lines = content.split('\n');
    let html = '';
    let inBullets = false;
    let currentSection = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines but close bullet list if open
      if (!line) {
        if (inBullets) {
          html += '</ul>';
          inBullets = false;
        }
        continue;
      }
      
      // Check for greeting (Hello,)
      if (line.startsWith('Hello,') || line.startsWith('Hello ')) {
        html += `<p class="greeting">${_escapeHtml(line)}</p>`;
        continue;
      }
      
      // Check for section headers
      if (line === 'Aftercare Options:' || line === 'Aftercare Plan:' || line === 'At-Home Options:') {
        html += `<p class="section-header">${_escapeHtml(line)}</p>`;
        continue;
      }
      
      // Check for AT HOME header
      if (line.startsWith('AT HOME Recommendation:') || line.startsWith('AT-HOME')) {
        html += `<p class="at-home-header">${_escapeHtml(line)}</p>`;
        continue;
      }
      
      // Check for ALUMNI SERVICES
      if (line === 'ALUMNI SERVICES') {
        html += `<div class="alumni-section"><p class="alumni-title">${_escapeHtml(line)}</p>`;
        continue;
      }
      
      // Check for program title (Name – Location pattern)
      if (line.includes(' – ') && !line.startsWith('•') && !line.startsWith('Phone:') && !line.startsWith('Email:')) {
        if (inBullets) {
          html += '</ul>';
          inBullets = false;
        }
        html += `<div class="program-block"><p class="program-title">${_escapeHtml(line)}</p>`;
        continue;
      }
      
      // Check for bullets
      if (line.startsWith('•') || line.startsWith('-')) {
        if (!inBullets) {
          html += '<ul class="program-bullets">';
          inBullets = true;
        }
        html += `<li>${_escapeHtml(line.substring(1).trim())}</li>`;
        continue;
      }
      
      // Check for contact info
      if (line.startsWith('Phone:') || line.startsWith('Email:') || line.startsWith('Website:') || 
          line.startsWith('Address:') || line.startsWith('Location:')) {
        if (inBullets) {
          html += '</ul>';
          inBullets = false;
        }
        if (!html.includes('program-contact') || html.lastIndexOf('</div>') > html.lastIndexOf('program-contact')) {
          html += '<div class="program-contact">';
        }
        html += `<div>${_escapeHtml(line)}</div>`;
        
        // Check if next line is also contact info
        const nextLine = (lines[i + 1] || '').trim();
        if (!nextLine.startsWith('Phone:') && !nextLine.startsWith('Email:') && 
            !nextLine.startsWith('Website:') && !nextLine.startsWith('Address:') && 
            !nextLine.startsWith('Location:')) {
          html += '</div></div>'; // Close contact and program block
        }
        continue;
      }
      
      // Check for alumni content (zoom links, etc.)
      if (line.includes('zoom.us') || line.includes('Meeting ID:') || line.includes('Passcode:')) {
        html += `<div class="alumni-block">${_escapeHtml(line)}</div>`;
        continue;
      }
      
      // Check for alumni service headers
      if (line.endsWith(':') && (line.includes('Focus Group') || line.includes('Alumni') || line.includes('NEST'))) {
        html += `<p class="section-header" style="font-size: 10pt; margin-top: 16px;">${_escapeHtml(line)}</p>`;
        continue;
      }
      
      // Regular paragraph (intro text or description)
      if (inBullets) {
        html += '</ul>';
        inBullets = false;
      }
      html += `<p class="program-description">${_escapeHtml(line)}</p>`;
    }
    
    // Close any open tags
    if (inBullets) {
      html += '</ul>';
    }
    
    return html;
  }
  
  /**
   * Escape HTML special characters
   * @param {string} text
   * @returns {string}
   */
  function _escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Generate DOCX with Family First letterhead
   * @param {string} content - Document content
   * @param {string} filename - Output filename
   */
  async function _generateDOCXWithLetterhead(content, filename) {
    // For DOCX, we'll create an HTML file that can be opened in Word
    // Word can import HTML with images
    const basePath = window.location.href.substring(0, window.location.href.lastIndexOf('/') + 1);
    const headerPath = basePath + LETTERHEAD.header;
    const footerPath = basePath + LETTERHEAD.footer;
    
    const htmlContent = _formatContentForPrint(content);
    
    const docHtml = `
<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" 
      xmlns:w="urn:schemas-microsoft-com:office:word">
<head>
  <meta charset="UTF-8">
  <title>${filename}</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    body {
      font-family: Calibri, sans-serif;
      font-size: 11pt;
      line-height: 1.5;
      margin: 0.5in 0.75in;
    }
    .letterhead-header {
      width: 300px;
      margin-bottom: 24px;
    }
    .letterhead-footer {
      text-align: center;
      margin-top: 32px;
      padding-top: 16px;
      border-top: 1px solid #ccc;
    }
    .letterhead-footer img {
      width: 400px;
    }
    .program-title {
      font-weight: bold;
      color: #1a365d;
      margin-top: 16px;
    }
    .program-description {
      text-align: justify;
    }
    .program-bullets {
      margin-left: 20px;
    }
    .program-contact {
      font-size: 10pt;
      color: #666;
    }
    .at-home-header {
      font-weight: bold;
      font-style: italic;
      margin-top: 24px;
      padding-top: 12px;
      border-top: 1px solid #ccc;
    }
  </style>
</head>
<body>
  <img src="${headerPath}" class="letterhead-header">
  ${htmlContent}
  <div class="letterhead-footer">
    <img src="${footerPath}">
  </div>
</body>
</html>`;

    // Download as .doc (Word can open HTML files)
    const blob = new Blob([docHtml], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.replace('.docx', '.doc');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Download text file (fallback)
   * @param {string} content
   * @param {string} filename
   */
  function _downloadTextFile(content, filename) {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Get Kipu upload URL
   * @returns {string}
   */
  function getKipuUrl() {
    return 'https://ffa11088.kipuworks.com/users/sign_in';
  }

  /**
   * Mark document as uploaded to Kipu
   * @param {string} clientId
   */
  function markAsUploaded(clientId) {
    if (_currentDraft) {
      _currentDraft.status = 'finalized';
      _saveDraft();
    }

    // TODO: Update client tracker field via clientManager
    if (window.clientManager && clientId) {
      const updateField = _currentDraft?.type === 'aftercare-plan' 
        ? 'aftercarePlanUploaded' 
        : 'aftercareOptionsUploaded';
      // window.clientManager.updateClient(clientId, { [updateField]: new Date() });
      console.log(`Would update client ${clientId} field: ${updateField}`);
    }

    window.dispatchEvent(new CustomEvent('ccdocs:uploaded', {
      detail: { clientId }
    }));
  }

  // ============================================================================
  // EXPOSE API
  // ============================================================================

  window.ccDocumentModel = {
    // Constants
    DOC_TYPES,
    ALUMNI_SERVICES,
    AT_HOME_HEADER,

    // Draft Management
    createDraft,
    getCurrentDraft,
    loadDraft,
    clearDraft,

    // Draft Modification
    addProgram,
    removeProgram,
    moveProgram,
    reorderPrograms,
    setProgramNote,
    setDocumentType,
    setScenario,
    setAtHomeMode,
    setAlumniService,
    setClient,

    // Generation
    generateProgramWriteUp,
    generateDocument,
    generateAtHomeDocument,
    getFileName,
    getDocumentSummary,

    // Export
    exportDocument,
    getKipuUrl,
    markAsUploaded,
  };

  console.log('✅ Document Model loaded');

})();

