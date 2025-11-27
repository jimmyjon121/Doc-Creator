/**
 * CareConnect Pro - Analytics Data Capture Module
 *
 * Provides functions to capture and log analytics data throughout the app.
 * All data is stored locally in IndexedDB for future aggregation.
 *
 * @version 1.0.0
 */

const dataCapture = {
  // ═══════════════════════════════════════════════════════════════════════
  // UTILITY FUNCTIONS
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Get current user ID from session
   */
  getCurrentUserId() {
    try {
      const stored = localStorage.getItem('currentUser');
      if (stored) {
        const user = JSON.parse(stored);
        if (user && user.id) return user.id;
      }
    } catch (e) {
      console.warn('[Analytics] Failed to parse currentUser for ID:', e);
    }
    // Fallback to legacy keys
    return localStorage.getItem('currentUserId') ||
           localStorage.getItem('username') ||
           'unknown';
  },

  /**
   * Get current user object
   */
  getCurrentUser() {
    try {
      const stored = localStorage.getItem('currentUser');
      if (stored) {
        const user = JSON.parse(stored);
        if (user && user.id) {
          return {
            id: user.id,
            name: user.fullName || user.username || 'Unknown User',
            email: user.email || '',
            role: user.role || 'coach'
          };
        }
      }
    } catch (e) {
      console.warn('[Analytics] Failed to parse currentUser:', e);
    }

    // Fallback to legacy individual keys
    return {
      id: localStorage.getItem('currentUserId') ||
          localStorage.getItem('username') ||
          'unknown',
      name: localStorage.getItem('currentUserName') ||
            localStorage.getItem('fullName') ||
            'Unknown User',
      email: localStorage.getItem('currentUserEmail') || '',
      role: localStorage.getItem('currentUserRole') ||
            localStorage.getItem('userRole') ||
            'coach'
    };
  },

  /**
   * Get or initialize device ID for this installation
   */
  getDeviceId() {
    let deviceId = localStorage.getItem('analyticsDeviceId');
    if (!deviceId) {
      deviceId = this.generateRandomString(12);
      localStorage.setItem('analyticsDeviceId', deviceId);
    }
    return deviceId;
  },

  /**
   * Generate a globally unique ID that won't collide across devices
   * Format: {prefix}_{timestamp36}-{random}-{deviceId4}
   */
  generateId(prefix = '') {
    const timestamp = Date.now().toString(36);
    const random = this.generateRandomString(8);
    const deviceId = this.getDeviceId().substring(0, 4);
    return `${prefix}${timestamp}-${random}-${deviceId}`;
  },

  /**
   * Generate random alphanumeric string
   */
  generateRandomString(length) {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },

  /**
   * Get current ISO timestamp
   */
  now() {
    return new Date().toISOString();
  },

  /**
   * Get current date in YYYY-MM-DD format
   */
  today() {
    return new Date().toISOString().split('T')[0];
  },

  // ═══════════════════════════════════════════════════════════════════════
  // EVENT LOGGING (Audit Trail)
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Log an analytics event
   * This is the core audit trail - all significant actions should log here
   */
  async logEvent(eventType, entityType, entityId, eventData = {}) {
    const event = {
      id: this.generateId('evt_'),
      eventType,
      entityType,
      entityId,
      clientId: eventData.clientId || null,
      programId: eventData.programId || null,
      eventData,
      userId: this.getCurrentUserId(),
      timestamp: this.now()
    };

    try {
      await window.analyticsDB.add('analytics_events', event);
      console.log(`[Analytics] Event logged: ${eventType}`, event);
      return event;
    } catch (err) {
      console.error('[Analytics] Failed to log event:', err);
      return null;
    }
  },

  // ═══════════════════════════════════════════════════════════════════════
  // REFERRAL TRACKING
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Log a new program referral
   */
  async logReferral(data) {
    const referral = {
      id: this.generateId('ref_'),

      // Client info
      clientId: data.clientId,
      clientInitials: data.clientInitials || null,

      // Program info
      programId: data.programId || null,
      programName: data.programName,
      programType: data.programType, // RTC, TBS, Wilderness, IOP, PHP, Sober Living
      programState: data.programState,
      programCity: data.programCity || null,

      // Referral details
      referralDate: data.referralDate || this.today(),
      referralMethod: data.referralMethod || 'phone', // phone, email, portal, fax
      contactedPerson: data.contactedPerson || null,

      // Status tracking
      status: 'pending', // pending, admitted, declined, withdrawn, no_response
      statusDate: this.now(),
      declineReason: null,
      declineNotes: '',

      // Admission details (filled when status = admitted)
      admissionDate: null,
      estimatedLOS: data.estimatedLOS || null,
      estimatedDailyRate: data.estimatedDailyRate || null,

      // Notes
      notes: data.notes || '',

      // Metadata
      createdBy: this.getCurrentUserId(),
      createdAt: this.now(),
      updatedAt: this.now()
    };

    try {
      await window.analyticsDB.add('referrals', referral);
      await this.logEvent('referral_created', 'referral', referral.id, {
        clientId: referral.clientId,
        programId: referral.programId,
        programName: referral.programName,
        programType: referral.programType
      });
      console.log('[Analytics] Referral logged:', referral.id);
      return referral;
    } catch (err) {
      console.error('[Analytics] Failed to log referral:', err);
      throw err;
    }
  },

  /**
   * Update referral status
   */
  async updateReferralStatus(referralId, status, details = {}) {
    const referral = await window.analyticsDB.get('referrals', referralId);
    if (!referral) throw new Error('Referral not found');

    const previousStatus = referral.status;

    referral.status = status;
    referral.statusDate = this.now();
    referral.updatedAt = this.now();

    if (status === 'declined') {
      referral.declineReason = details.reason || null;
      referral.declineNotes = details.notes || '';
    }

    if (status === 'admitted') {
      referral.admissionDate = details.admissionDate || this.today();
      referral.estimatedLOS = details.estimatedLOS || referral.estimatedLOS;
      referral.estimatedDailyRate = details.estimatedDailyRate || referral.estimatedDailyRate;
    }

    if (details.notes) {
      referral.notes = details.notes;
    }

    await window.analyticsDB.put('referrals', referral);
    await this.logEvent('referral_status_changed', 'referral', referralId, {
      clientId: referral.clientId,
      programId: referral.programId,
      programName: referral.programName,
      previousStatus,
      newStatus: status,
      declineReason: referral.declineReason
    });

    return referral;
  },

  /**
   * Get referrals with optional filters
   */
  async getReferrals(filters = {}) {
    let referrals = await window.analyticsDB.getAll('referrals');

    if (filters.clientId) {
      referrals = referrals.filter(r => r.clientId === filters.clientId);
    }
    if (filters.programId) {
      referrals = referrals.filter(r => r.programId === filters.programId);
    }
    if (filters.status) {
      referrals = referrals.filter(r => r.status === filters.status);
    }
    if (filters.startDate) {
      referrals = referrals.filter(r => r.referralDate >= filters.startDate);
    }
    if (filters.endDate) {
      referrals = referrals.filter(r => r.referralDate <= filters.endDate);
    }
    if (filters.createdBy) {
      referrals = referrals.filter(r => r.createdBy === filters.createdBy);
    }

    return referrals;
  },

  // ═══════════════════════════════════════════════════════════════════════
  // CLINICAL DOCUMENT TRACKING
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Log a clinical document (ASAM, discharge packet, etc.)
   */
  async logDocument(data) {
    const doc = {
      id: this.generateId('doc_'),

      // Client info
      clientId: data.clientId,
      clientInitials: data.clientInitials || null,

      // Document info
      documentType: data.documentType, // initial_asam, continued_stay_asam, discharge_asam, discharge_packet, aftercare_plan, treatment_plan
      title: data.title || this.getDocumentTitle(data.documentType, data.periodLabel),
      periodLabel: data.periodLabel || null, // e.g., "November 2025" for continued stay

      // Timing
      dueDate: data.dueDate,
      completedDate: null,

      // Status
      status: 'pending', // pending, in_progress, completed, overdue, waived

      // Upload tracking
      uploadedToEMR: false,
      uploadDate: null,
      emrDocumentId: null,

      // Review
      reviewedBy: null,
      reviewDate: null,

      // Notes
      notes: data.notes || '',

      // Metadata
      createdBy: this.getCurrentUserId(),
      createdAt: this.now(),
      updatedAt: this.now()
    };

    try {
      await window.analyticsDB.add('clinical_documents', doc);
      await this.logEvent('document_created', 'document', doc.id, {
        clientId: doc.clientId,
        documentType: doc.documentType,
        dueDate: doc.dueDate
      });
      console.log('[Analytics] Document logged:', doc.id);
      return doc;
    } catch (err) {
      console.error('[Analytics] Failed to log document:', err);
      throw err;
    }
  },

  /**
   * Mark document as completed
   */
  async completeDocument(documentId, details = {}) {
    const doc = await window.analyticsDB.get('clinical_documents', documentId);
    if (!doc) throw new Error('Document not found');

    doc.status = 'completed';
    doc.completedDate = details.completedDate || this.now();
    doc.updatedAt = this.now();

    if (details.uploadedToEMR) {
      doc.uploadedToEMR = true;
      doc.uploadDate = this.now();
      doc.emrDocumentId = details.emrDocumentId || null;
    }

    await window.analyticsDB.put('clinical_documents', doc);

    const wasOnTime = doc.completedDate.split('T')[0] <= doc.dueDate;
    await this.logEvent('document_completed', 'document', documentId, {
      clientId: doc.clientId,
      documentType: doc.documentType,
      dueDate: doc.dueDate,
      completedDate: doc.completedDate,
      wasOnTime,
      uploadedToEMR: doc.uploadedToEMR
    });

    return doc;
  },

  /**
   * Mark document as uploaded to EMR
   */
  async markDocumentUploaded(documentId, emrDocumentId = null) {
    const doc = await window.analyticsDB.get('clinical_documents', documentId);
    if (!doc) throw new Error('Document not found');

    doc.uploadedToEMR = true;
    doc.uploadDate = this.now();
    doc.emrDocumentId = emrDocumentId;
    doc.updatedAt = this.now();

    await window.analyticsDB.put('clinical_documents', doc);
    await this.logEvent('document_uploaded', 'document', documentId, {
      clientId: doc.clientId,
      documentType: doc.documentType,
      emrDocumentId
    });

    return doc;
  },

  /**
   * Get document title based on type
   */
  getDocumentTitle(type, periodLabel = null) {
    const titles = {
      initial_asam: 'Initial ASAM Assessment',
      continued_stay_asam: `Continued Stay ASAM${periodLabel ? ' - ' + periodLabel : ''}`,
      discharge_asam: 'Discharge ASAM Assessment',
      discharge_packet: 'Discharge Packet',
      aftercare_plan: 'Aftercare Plan',
      treatment_plan: 'Treatment Plan',
      progress_note: 'Progress Note',
      incident_report: 'Incident Report'
    };
    return titles[type] || type;
  },

  // ═══════════════════════════════════════════════════════════════════════
  // AUTHORIZATION TRACKING
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Log an insurance authorization request
   */
  async logAuthorization(data) {
    const auth = {
      id: this.generateId('auth_'),

      // Client info
      clientId: data.clientId,
      clientInitials: data.clientInitials || null,

      // Payer info
      payerId: data.payerId || null,
      payerName: data.payerName,
      memberId: data.memberId || null,

      // Request details
      authorizationType: data.authorizationType || 'concurrent', // initial, concurrent, retrospective
      requestDate: data.requestDate || this.today(),
      daysRequested: data.daysRequested,

      // Decision (filled when resolved)
      decisionDate: null,
      decision: 'pending', // pending, approved, denied, partially_approved, withdrawn
      daysApproved: null,

      // Coverage period
      authStartDate: data.authStartDate,
      authEndDate: data.authEndDate || null,

      // Denial details
      denialReason: null, // medical_necessity, out_of_network, missing_documentation, exhausted_benefits, other
      denialNotes: '',

      // Appeal tracking
      appealFiled: false,
      appealDate: null,
      appealOutcome: null,

      // Notes
      notes: data.notes || '',

      // Metadata
      submittedBy: this.getCurrentUserId(),
      createdBy: this.getCurrentUserId(),
      createdAt: this.now(),
      updatedAt: this.now()
    };

    try {
      await window.analyticsDB.add('authorizations', auth);
      await this.logEvent('auth_submitted', 'authorization', auth.id, {
        clientId: auth.clientId,
        payerName: auth.payerName,
        authorizationType: auth.authorizationType,
        daysRequested: auth.daysRequested
      });
      console.log('[Analytics] Authorization logged:', auth.id);
      return auth;
    } catch (err) {
      console.error('[Analytics] Failed to log authorization:', err);
      throw err;
    }
  },

  /**
   * Update authorization with decision
   */
  async updateAuthorizationDecision(authId, decision, details = {}) {
    const auth = await window.analyticsDB.get('authorizations', authId);
    if (!auth) throw new Error('Authorization not found');

    auth.decision = decision;
    auth.decisionDate = details.decisionDate || this.today();
    auth.updatedAt = this.now();

    if (decision === 'approved' || decision === 'partially_approved') {
      auth.daysApproved = details.daysApproved || auth.daysRequested;
      auth.authEndDate = details.authEndDate || auth.authEndDate;
    }

    if (decision === 'denied') {
      auth.denialReason = details.denialReason || null;
      auth.denialNotes = details.denialNotes || '';
    }

    await window.analyticsDB.put('authorizations', auth);
    await this.logEvent('auth_decided', 'authorization', authId, {
      clientId: auth.clientId,
      payerName: auth.payerName,
      decision,
      daysApproved: auth.daysApproved,
      denialReason: auth.denialReason
    });

    return auth;
  },

  // ═══════════════════════════════════════════════════════════════════════
  // TASK TRACKING
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Log a task
   */
  async logTask(data) {
    const task = {
      id: this.generateId('task_'),

      // Linkage
      clientId: data.clientId || null,
      linkedDocumentId: data.linkedDocumentId || null,
      linkedReferralId: data.linkedReferralId || null,
      linkedAuthId: data.linkedAuthId || null,

      // Task info
      taskType: data.taskType, // asam_due, auth_expiring, discharge_prep, follow_up, documentation, outreach, custom
      category: data.category || 'clinical', // clinical, administrative, business_dev, compliance
      title: data.title,
      description: data.description || '',

      // Timing
      dueDate: data.dueDate,
      completedDate: null,

      // Status
      status: 'pending', // pending, in_progress, completed, overdue, cancelled
      priority: data.priority || 'medium', // low, medium, high, urgent

      // Assignment
      assignedTo: data.assignedTo || this.getCurrentUserId(),

      // Metadata
      createdBy: this.getCurrentUserId(),
      createdAt: this.now(),
      updatedAt: this.now()
    };

    try {
      await window.analyticsDB.add('tasks', task);
      console.log('[Analytics] Task logged:', task.id);
      return task;
    } catch (err) {
      console.error('[Analytics] Failed to log task:', err);
      throw err;
    }
  },

  /**
   * Complete a task
   */
  async completeTask(taskId, notes = '') {
    const task = await window.analyticsDB.get('tasks', taskId);
    if (!task) throw new Error('Task not found');

    task.status = 'completed';
    task.completedDate = this.now();
    task.updatedAt = this.now();

    if (notes) {
      task.description = task.description ? `${task.description}\n\nCompletion notes: ${notes}` : notes;
    }

    await window.analyticsDB.put('tasks', task);

    const wasOnTime = task.completedDate.split('T')[0] <= task.dueDate;
    await this.logEvent('task_completed', 'task', taskId, {
      clientId: task.clientId,
      taskType: task.taskType,
      category: task.category,
      wasOnTime
    });

    return task;
  },

  // ═══════════════════════════════════════════════════════════════════════
  // PROGRAM RELATIONSHIP TRACKING
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Log or update a program relationship/contact
   */
  async logProgramContact(programId, data) {
    let relationship = await window.analyticsDB.get('program_relationships', programId);

    if (!relationship) {
      // Create new relationship record
      relationship = {
        id: programId,
        programId: programId,
        programName: data.programName,
        programType: data.programType || null,
        programState: data.programState || null,

        // Status
        relationshipStatus: 'active', // active, preferred, paused, under_review, inactive

        // Contract
        contractStatus: 'none', // none, pending, active, expired
        contractStartDate: null,
        contractEndDate: null,

        // Contact tracking
        lastContactDate: null,
        lastContactType: null,
        lastContactPerson: null,
        lastContactNotes: '',
        totalContacts: 0,

        // Primary contact
        primaryContactName: data.primaryContactName || '',
        primaryContactEmail: data.primaryContactEmail || '',
        primaryContactPhone: data.primaryContactPhone || '',
        primaryContactRole: data.primaryContactRole || '',

        // Tour
        tourCompleted: false,
        tourDate: null,
        tourNotes: '',

        // Internal
        internalNotes: '',
        tags: [],

        // Metadata
        createdBy: this.getCurrentUserId(),
        createdAt: this.now(),
        updatedAt: this.now()
      };
    }

    // Update with new contact
    relationship.lastContactDate = data.contactDate || this.today();
    relationship.lastContactType = data.contactType; // call, email, tour, conference, meeting
    relationship.lastContactPerson = data.contactPerson || null;
    relationship.lastContactNotes = data.notes || '';
    relationship.totalContacts = (relationship.totalContacts || 0) + 1;
    relationship.updatedAt = this.now();

    // Update primary contact if provided
    if (data.primaryContactName) relationship.primaryContactName = data.primaryContactName;
    if (data.primaryContactEmail) relationship.primaryContactEmail = data.primaryContactEmail;
    if (data.primaryContactPhone) relationship.primaryContactPhone = data.primaryContactPhone;

    // Handle tour
    if (data.contactType === 'tour') {
      relationship.tourCompleted = true;
      relationship.tourDate = relationship.lastContactDate;
      relationship.tourNotes = data.notes || '';
    }

    await window.analyticsDB.put('program_relationships', relationship);
    await this.logEvent('program_contact_logged', 'program_relationship', programId, {
      programName: relationship.programName,
      contactType: data.contactType,
      contactDate: relationship.lastContactDate
    });

    return relationship;
  },

  /**
   * Update program relationship status
   */
  async updateProgramRelationshipStatus(programId, status, notes = '') {
    const relationship = await window.analyticsDB.get('program_relationships', programId);
    if (!relationship) throw new Error('Program relationship not found');

    const previousStatus = relationship.relationshipStatus;
    relationship.relationshipStatus = status;
    relationship.updatedAt = this.now();

    if (notes) {
      relationship.internalNotes = relationship.internalNotes
        ? `${relationship.internalNotes}\n\n[${this.today()}] Status changed to ${status}: ${notes}`
        : `[${this.today()}] Status changed to ${status}: ${notes}`;
    }

    await window.analyticsDB.put('program_relationships', relationship);
    await this.logEvent('program_status_changed', 'program_relationship', programId, {
      programName: relationship.programName,
      previousStatus,
      newStatus: status
    });

    return relationship;
  },

  // ═══════════════════════════════════════════════════════════════════════
  // CLIENT JOURNEY EVENTS
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Log client admission
   */
  async logClientAdmission(clientId, data) {
    await this.logEvent('client_admitted', 'client', clientId, {
      clientId,
      admissionDate: data.admissionDate || this.today(),
      admissionSource: data.admissionSource, // self, hospital, wilderness, rtc, court, other
      referringProgramId: data.referringProgramId || null,
      referringProgramName: data.referringProgramName || null,
      insurancePayer: data.insurancePayer || null
    });
  },

  /**
   * Log client discharge
   */
  async logClientDischarge(clientId, data) {
    await this.logEvent('client_discharged', 'client', clientId, {
      clientId,
      dischargeDate: data.dischargeDate || this.today(),
      dischargeType: data.dischargeType, // planned, ama, administrative, step_up, step_down
      dischargeDestination: data.dischargeDestination, // home, rtc, tbs, php, iop, sober_living, wilderness, hospital, other
      dischargeDestinationProgramId: data.dischargeDestinationProgramId || null,
      dischargeDestinationProgramName: data.dischargeDestinationProgramName || null,
      lengthOfStay: data.lengthOfStay,
      aftercarePlanFinalized: data.aftercarePlanFinalized || false
    });
  },

  // ═══════════════════════════════════════════════════════════════════════
  // USER MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Register or update current user profile
   */
  async registerUser(userData) {
    const user = {
      id: userData.id || this.generateId('user_'),
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      role: userData.role || 'coach', // coach, supervisor, admin, clinical_director
      department: userData.department || 'case_management',
      status: 'active',
      lastLoginAt: this.now(),
      createdAt: this.now(),
      updatedAt: this.now()
    };

    // Check if user exists
    const existing = await window.analyticsDB.get('users', user.id);
    if (existing) {
      user.createdAt = existing.createdAt;
    }

    await window.analyticsDB.put('users', user);

    // Store in localStorage for quick access
    localStorage.setItem('currentUserId', user.id);
    localStorage.setItem('currentUserName', `${user.firstName} ${user.lastName}`);
    localStorage.setItem('currentUserEmail', user.email);
    localStorage.setItem('currentUserRole', user.role);

    console.log('[Analytics] User registered:', user.id);
    return user;
  }
};

// Expose globally
window.dataCapture = dataCapture;

