/**
 * CareConnect Pro - Analytics Export Module
 *
 * Generates structured JSON export packages for data aggregation.
 * Exports are designed to be machine-readable and easily merged.
 *
 * @version 1.0.0
 */

const analyticsExport = {
  /**
   * Generate a complete export package
   */
  async generateExport(options = {}) {
    if (!window.analyticsDB?.db) {
      await window.analyticsDB.init();
    }

    const currentUser = window.dataCapture.getCurrentUser();
    const deviceId = window.dataCapture.getDeviceId();

    console.log('[Export] Generating export package...');

    // Build export package
    let exportPackage = {
      // ═══════════════════════════════════════════════════════════════
      // METADATA - Critical for aggregation and identification
      // ═══════════════════════════════════════════════════════════════
      meta: {
        exportId: window.dataCapture.generateId('exp_'),
        exportDate: new Date().toISOString(),

        // Source identification
        exportedBy: {
          userId: currentUser.id,
          userName: currentUser.name,
          userEmail: currentUser.email,
          userRole: currentUser.role
        },
        deviceId: deviceId,

        // App info
        appVersion: window.APP_VERSION || '4.1.0',
        schemaVersion: '1.0.0',

        // Facility info
        facilityId: 'family-first-pbg',
        facilityName: 'Family First Adolescent Services',

        // Export parameters
        exportType: options.type || 'full', // full, analytics_only, incremental
        dateRange: options.dateRange || null,
        includeClients: options.includeClients !== false,
        anonymizeClients: options.anonymizeClients || false,

        // Record counts (filled below)
        recordCounts: {}
      },

      // ═══════════════════════════════════════════════════════════════
      // DATA COLLECTIONS
      // ═══════════════════════════════════════════════════════════════
      users: [],
      clients: [],
      referrals: [],
      clinicalDocuments: [],
      authorizations: [],
      programRelationships: [],
      tasks: [],
      analyticsEvents: []
    };

    try {
      // Collect data from each store
      exportPackage.users = await window.analyticsDB.getAll('users');
      exportPackage.referrals = await window.analyticsDB.getAll('referrals');
      exportPackage.clinicalDocuments = await window.analyticsDB.getAll('clinical_documents');
      exportPackage.authorizations = await window.analyticsDB.getAll('authorizations');
      exportPackage.programRelationships = await window.analyticsDB.getAll('program_relationships');
      exportPackage.tasks = await window.analyticsDB.getAll('tasks');
      exportPackage.analyticsEvents = await window.analyticsDB.getAll('analytics_events');

      // Get clients from main database if available
      if (options.includeClients !== false) {
        exportPackage.clients = await this.getClients(options.anonymizeClients);
      }

      // Apply date range filter if specified
      if (options.dateRange) {
        exportPackage = this.applyDateFilter(exportPackage, options.dateRange);
      }

      // Calculate record counts
      exportPackage.meta.recordCounts = {
        users: exportPackage.users.length,
        clients: exportPackage.clients.length,
        referrals: exportPackage.referrals.length,
        clinicalDocuments: exportPackage.clinicalDocuments.length,
        authorizations: exportPackage.authorizations.length,
        programRelationships: exportPackage.programRelationships.length,
        tasks: exportPackage.tasks.length,
        analyticsEvents: exportPackage.analyticsEvents.length
      };

      // Log export to history
      await this.logExportToHistory(exportPackage.meta);

      console.log('[Export] Package generated successfully:', exportPackage.meta.recordCounts);
      return exportPackage;
    } catch (err) {
      console.error('[Export] Failed to generate export:', err);
      throw err;
    }
  },

  /**
   * Get clients from main database, optionally anonymized
   */
  async getClients(anonymize = false) {
    try {
      // Try to get from existing client store
      // Adjust this based on your actual client storage
      let clients = [];

      if (window.db?.clients) {
        clients = await window.db.clients.toArray();
      } else if (window.clientManager?.getAllClients) {
        clients = await window.clientManager.getAllClients();
      }

      if (anonymize) {
        clients = clients.map(client => ({
          id: client.id,

          // Anonymized identifiers
          initials: client.firstName?.charAt(0) + client.lastName?.charAt(0) || 'XX',
          clientCode: client.id.slice(-6),

          // Keep analytics-relevant fields
          admissionDate: client.admissionDate,
          projectedDischargeDate: client.projectedDischargeDate,
          actualDischargeDate: client.actualDischargeDate,
          dischargeType: client.dischargeType,
          dischargeDestination: client.dischargeDestination,
          admissionSource: client.admissionSource,
          insurancePayer: client.insurancePayer,
          aftercareStatus: client.aftercareStatus,

          // Remove PII
          firstName: '[REDACTED]',
          lastName: '[REDACTED]',
          dateOfBirth: null,
          ssn: null,
          address: null,
          phone: null,
          email: null,
          emergencyContact: null,
          guardianInfo: null
        }));
      }

      return clients;
    } catch (err) {
      console.warn('[Export] Could not retrieve clients:', err);
      return [];
    }
  },

  /**
   * Apply date range filter to export data
   */
  applyDateFilter(exportPackage, dateRange) {
    const { startDate, endDate } = dateRange;

    const withinRange = (dateStr) => {
      if (!dateStr) return false;
      const date = dateStr.split('T')[0];
      return date >= startDate && date <= endDate;
    };

    // Filter each collection by their primary date field
    exportPackage.referrals = exportPackage.referrals.filter(r =>
      withinRange(r.referralDate) || withinRange(r.createdAt)
    );

    exportPackage.clinicalDocuments = exportPackage.clinicalDocuments.filter(d =>
      withinRange(d.dueDate) || withinRange(d.createdAt)
    );

    exportPackage.authorizations = exportPackage.authorizations.filter(a =>
      withinRange(a.requestDate) || withinRange(a.createdAt)
    );

    exportPackage.tasks = exportPackage.tasks.filter(t =>
      withinRange(t.dueDate) || withinRange(t.createdAt)
    );

    exportPackage.analyticsEvents = exportPackage.analyticsEvents.filter(e =>
      withinRange(e.timestamp)
    );

    return exportPackage;
  },

  /**
   * Log export to history for tracking
   */
  async logExportToHistory(meta) {
    const historyRecord = {
      id: meta.exportId,
      exportDate: meta.exportDate,
      exportedBy: meta.exportedBy.userId,
      exportedByName: meta.exportedBy.userName,
      exportType: meta.exportType,
      recordCounts: meta.recordCounts,
      dateRange: meta.dateRange
    };

    try {
      await window.analyticsDB.add('export_history', historyRecord);
    } catch (err) {
      console.warn('[Export] Could not log to history:', err);
    }
  },

  /**
   * Download export as JSON file
   */
  async downloadExport(options = {}) {
    const exportPackage = await this.generateExport(options);

    const filename = `careconnect-export-${exportPackage.meta.exportedBy.userId}-${Date.now()}.json`;
    const blob = new Blob(
      [JSON.stringify(exportPackage, null, 2)],
      { type: 'application/json' }
    );

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log('[Export] Downloaded:', filename);
    return exportPackage;
  },

  /**
   * Generate summary statistics for quick review
   */
  async generateSummary() {
    if (!window.analyticsDB?.db) {
      await window.analyticsDB.init();
    }

    const referrals = await window.analyticsDB.getAll('referrals');
    const documents = await window.analyticsDB.getAll('clinical_documents');
    const authorizations = await window.analyticsDB.getAll('authorizations');
    const tasks = await window.analyticsDB.getAll('tasks');

    // Calculate date ranges
    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
    const ninetyDaysAgo = new Date(now - 90 * 24 * 60 * 60 * 1000).toISOString();

    // Referral stats
    const recentReferrals = referrals.filter(r => r.createdAt >= thirtyDaysAgo);
    const admittedReferrals = referrals.filter(r => r.status === 'admitted');

    // Document stats
    const completedDocs = documents.filter(d => d.status === 'completed');
    const overdueDocs = documents.filter(d =>
      d.status !== 'completed' && d.dueDate < now.toISOString().split('T')[0]
    );

    // Authorization stats
    const approvedAuths = authorizations.filter(a => a.decision === 'approved');
    const deniedAuths = authorizations.filter(a => a.decision === 'denied');

    // Task stats
    const completedTasks = tasks.filter(t => t.status === 'completed');
    const overdueTasks = tasks.filter(t =>
      t.status !== 'completed' && t.dueDate < now.toISOString().split('T')[0]
    );

    return {
      generatedAt: now.toISOString(),

      referrals: {
        total: referrals.length,
        last30Days: recentReferrals.length,
        admitted: admittedReferrals.length,
        pending: referrals.filter(r => r.status === 'pending').length,
        declined: referrals.filter(r => r.status === 'declined').length,
        conversionRate: referrals.length > 0
          ? (admittedReferrals.length / referrals.length * 100).toFixed(1) + '%'
          : 'N/A',
        byProgram: this.countBy(referrals, 'programName'),
        byStatus: this.countBy(referrals, 'status')
      },

      documents: {
        total: documents.length,
        completed: completedDocs.length,
        pending: documents.filter(d => d.status === 'pending').length,
        overdue: overdueDocs.length,
        uploaded: documents.filter(d => d.uploadedToEMR).length,
        completionRate: documents.length > 0
          ? (completedDocs.length / documents.length * 100).toFixed(1) + '%'
          : 'N/A',
        byType: this.countBy(documents, 'documentType')
      },

      authorizations: {
        total: authorizations.length,
        approved: approvedAuths.length,
        denied: deniedAuths.length,
        pending: authorizations.filter(a => a.decision === 'pending').length,
        approvalRate: authorizations.filter(a => a.decision !== 'pending').length > 0
          ? (approvedAuths.length / authorizations.filter(a => a.decision !== 'pending').length * 100).toFixed(1) + '%'
          : 'N/A',
        byPayer: this.countBy(authorizations, 'payerName')
      },

      tasks: {
        total: tasks.length,
        completed: completedTasks.length,
        pending: tasks.filter(t => t.status === 'pending').length,
        overdue: overdueTasks.length,
        completionRate: tasks.length > 0
          ? (completedTasks.length / tasks.length * 100).toFixed(1) + '%'
          : 'N/A',
        byCategory: this.countBy(tasks, 'category')
      }
    };
  },

  /**
   * Helper: Count items by a field
   */
  countBy(array, field) {
    return array.reduce((acc, item) => {
      const key = item[field] || 'Unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  },

  /**
   * Get export history
   */
  async getExportHistory() {
    return window.analyticsDB.getAll('export_history');
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // NEW METHODS FOR ENHANCED ADMIN COMMAND CENTER DASHBOARD
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get program performance data with conversion rates
   * Groups referrals by programName, returns top programs sorted by total referrals
   */
  async getProgramPerformance() {
    const referrals = await window.analyticsDB.getAll('referrals');
    const byProgram = {};
    
    referrals.forEach(r => {
      const key = r.programName || 'Unknown Program';
      if (!byProgram[key]) {
        byProgram[key] = {
          name: key,
          type: r.programType || 'unknown',
          state: r.programState || '',
          total: 0,
          admitted: 0,
          pending: 0,
          declined: 0,
          estimatedValue: 0
        };
      }
      byProgram[key].total++;
      if (r.status === 'admitted') {
        byProgram[key].admitted++;
        // Estimate value: assume $500/day average, 30-day average stay
        byProgram[key].estimatedValue += (r.estimatedDailyRate || 500) * (r.estimatedLOS || 30);
      } else if (r.status === 'pending') {
        byProgram[key].pending++;
      } else if (r.status === 'declined') {
        byProgram[key].declined++;
      }
    });
    
    return Object.values(byProgram)
      .map(p => ({
        ...p,
        conversionRate: p.total > 0 ? Math.round(p.admitted / p.total * 100) : 0
      }))
      .sort((a, b) => b.total - a.total);
  },

  /**
   * Get authorization performance grouped by payer
   * Returns approval rates and average decision times per payer
   */
  async getAuthorizationsByPayer() {
    const auths = await window.analyticsDB.getAll('authorizations');
    const byPayer = {};
    
    auths.forEach(a => {
      const key = a.payerName || 'Unknown Payer';
      if (!byPayer[key]) {
        byPayer[key] = {
          payer: key,
          total: 0,
          approved: 0,
          denied: 0,
          pending: 0,
          decisionDays: []
        };
      }
      byPayer[key].total++;
      if (a.decision === 'approved') byPayer[key].approved++;
      else if (a.decision === 'denied') byPayer[key].denied++;
      else byPayer[key].pending++;
      
      // Calculate decision time if both dates exist
      if (a.decisionDate && a.requestDate) {
        const days = (new Date(a.decisionDate) - new Date(a.requestDate)) / (1000 * 60 * 60 * 24);
        if (days >= 0) byPayer[key].decisionDays.push(days);
      }
    });
    
    return Object.values(byPayer).map(p => ({
      ...p,
      approvalRate: p.total > 0 ? Math.round(p.approved / p.total * 100) : 0,
      avgDecisionDays: p.decisionDays.length > 0
        ? (p.decisionDays.reduce((a, b) => a + b, 0) / p.decisionDays.length).toFixed(1)
        : 'N/A'
    })).sort((a, b) => b.total - a.total);
  },

  /**
   * Get actionable alerts for the dashboard
   * Returns overdue ASAMs, stale pending referrals, and expiring authorizations
   */
  async getAlerts() {
    const today = new Date().toISOString().split('T')[0];
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const fiveDaysAhead = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const docs = await window.analyticsDB.getAll('clinical_documents');
    const referrals = await window.analyticsDB.getAll('referrals');
    const auths = await window.analyticsDB.getAll('authorizations');
    
    return {
      overdueASAMs: docs.filter(d => 
        d.documentType?.toLowerCase().includes('asam') && 
        d.status !== 'completed' && 
        d.dueDate && d.dueDate < today
      ),
      overdueDocuments: docs.filter(d => 
        d.status !== 'completed' && 
        d.dueDate && d.dueDate < today
      ),
      pendingReferrals: referrals.filter(r => 
        r.status === 'pending' && 
        r.referralDate && r.referralDate < sevenDaysAgo
      ),
      expiringAuths: auths.filter(a => 
        a.decision === 'approved' && 
        a.authEndDate && 
        a.authEndDate <= fiveDaysAhead && 
        a.authEndDate >= today
      )
    };
  },

  /**
   * Get decline reasons breakdown
   * Groups declined referrals by reason
   */
  async getDeclineReasons() {
    const referrals = await window.analyticsDB.getAll('referrals');
    const reasons = {};
    
    referrals.filter(r => r.status === 'declined').forEach(r => {
      const key = r.declineReason || 'Unspecified';
      reasons[key] = (reasons[key] || 0) + 1;
    });
    
    // Convert to array sorted by count
    return Object.entries(reasons)
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count);
  },

  /**
   * Get relationship health for program partnerships
   * Returns programs with days since last contact and status classification
   */
  async getRelationshipHealth() {
    const rels = await window.analyticsDB.getAll('program_relationships');
    const today = new Date();
    
    return rels.map(r => {
      const lastContact = r.lastContactDate ? new Date(r.lastContactDate) : null;
      const daysSince = lastContact 
        ? Math.floor((today - lastContact) / (1000 * 60 * 60 * 24)) 
        : 999;
      
      let status = 'inactive';
      if (r.relationshipStatus === 'preferred') status = 'preferred';
      else if (daysSince <= 30) status = 'active';
      else if (daysSince <= 60) status = 'stale';
      
      return {
        programName: r.programName || 'Unknown Program',
        programId: r.programId,
        status,
        daysSinceContact: daysSince,
        lastContactDate: r.lastContactDate,
        notes: r.notes
      };
    }).sort((a, b) => a.daysSinceContact - b.daysSinceContact);
  },

  /**
   * Get time-to-admission statistics
   * Returns average, median, min, and max days from referral to admission
   */
  async getTimeToAdmission() {
    const referrals = await window.analyticsDB.getAll('referrals');
    const admittedReferrals = referrals.filter(r => 
      r.status === 'admitted' && r.referralDate && r.admissionDate
    );
    
    if (admittedReferrals.length === 0) {
      return { avg: null, median: null, min: null, max: null, count: 0 };
    }
    
    const days = admittedReferrals.map(r => {
      return Math.round((new Date(r.admissionDate) - new Date(r.referralDate)) / (1000 * 60 * 60 * 24));
    }).filter(d => d >= 0);
    
    if (days.length === 0) {
      return { avg: null, median: null, min: null, max: null, count: 0 };
    }
    
    days.sort((a, b) => a - b);
    const sum = days.reduce((a, b) => a + b, 0);
    const avg = Math.round(sum / days.length);
    const median = days.length % 2 === 0
      ? Math.round((days[days.length / 2 - 1] + days[days.length / 2]) / 2)
      : days[Math.floor(days.length / 2)];
    
    return {
      avg,
      median,
      min: days[0],
      max: days[days.length - 1],
      count: days.length
    };
  },

  /**
   * Get document compliance breakdown
   * Returns on-time, late, and overdue counts plus breakdown by document type
   */
  async getDocumentCompliance() {
    const docs = await window.analyticsDB.getAll('clinical_documents');
    const today = new Date().toISOString().split('T')[0];
    
    let onTime = 0;
    let late = 0;
    let overdue = 0;
    const byType = {};
    
    docs.forEach(d => {
      // Count by type
      const type = d.documentType || 'Other';
      if (!byType[type]) byType[type] = { total: 0, completed: 0 };
      byType[type].total++;
      if (d.status === 'completed') byType[type].completed++;
      
      // Compliance status
      if (d.status === 'completed') {
        if (d.completedDate && d.dueDate) {
          if (d.completedDate <= d.dueDate) onTime++;
          else late++;
        } else {
          onTime++; // Assume on-time if no dates
        }
      } else {
        if (d.dueDate && d.dueDate < today) overdue++;
      }
    });
    
    return {
      total: docs.length,
      completed: docs.filter(d => d.status === 'completed').length,
      onTime,
      late,
      overdue,
      byType: Object.entries(byType).map(([type, data]) => ({
        type,
        ...data,
        rate: data.total > 0 ? Math.round(data.completed / data.total * 100) : 0
      })).sort((a, b) => b.total - a.total)
    };
  },

  /**
   * Get discharge packet metrics
   * Returns completion and upload statistics
   */
  async getDischargePackets() {
    const docs = await window.analyticsDB.getAll('clinical_documents');
    const packets = docs.filter(d => 
      d.documentType?.toLowerCase().includes('discharge') ||
      d.documentType?.toLowerCase().includes('packet') ||
      d.documentType?.toLowerCase().includes('aftercare')
    );
    
    const completed = packets.filter(d => d.status === 'completed');
    const uploaded = completed.filter(d => d.uploadedToEMR);
    const pending = packets.filter(d => d.status !== 'completed');
    
    // Calculate average completion time
    const completionTimes = completed
      .filter(d => d.createdAt && d.completedDate)
      .map(d => {
        const created = new Date(d.createdAt);
        const completed = new Date(d.completedDate);
        return Math.round((completed - created) / (1000 * 60 * 60 * 24));
      })
      .filter(d => d >= 0);
    
    const avgTime = completionTimes.length > 0
      ? Math.round(completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length)
      : null;
    
    return {
      total: packets.length,
      completed: completed.length,
      uploaded: uploaded.length,
      pending: pending.length,
      uploadRate: completed.length > 0 
        ? Math.round(uploaded.length / completed.length * 100) 
        : 0,
      avgCompletionDays: avgTime
    };
  },

  /**
   * Get client journey metrics
   * Returns census, average length of stay, and discharge destinations
   */
  async getClientJourney() {
    // Try to get from main app's client data
    let activeClients = 0;
    let losValues = [];
    const destinations = {};
    
    // Check if we have access to client manager
    if (window.clientManager && typeof window.clientManager.getAllClients === 'function') {
      try {
        const clients = await window.clientManager.getAllClients();
        activeClients = clients.filter(c => c.status === 'active').length;
        
        // Calculate LOS for discharged clients
        const discharged = clients.filter(c => c.status === 'discharged' && c.admissionDate && c.dischargeDate);
        losValues = discharged.map(c => {
          const days = Math.round((new Date(c.dischargeDate) - new Date(c.admissionDate)) / (1000 * 60 * 60 * 24));
          return days >= 0 ? days : 0;
        });
        
        // Count discharge destinations
        discharged.forEach(c => {
          const dest = c.dischargeDestination || 'Unknown';
          destinations[dest] = (destinations[dest] || 0) + 1;
        });
      } catch (e) {
        console.warn('Could not access client manager for journey metrics:', e);
      }
    }
    
    const avgLOS = losValues.length > 0
      ? Math.round(losValues.reduce((a, b) => a + b, 0) / losValues.length)
      : null;
    
    return {
      census: activeClients,
      avgLOS,
      totalDischarged: losValues.length,
      destinations: Object.entries(destinations)
        .map(([destination, count]) => ({ destination, count }))
        .sort((a, b) => b.count - a.count)
    };
  },

  /**
   * Get all store counts for the data summary panel
   */
  async getStoreCounts() {
    const counts = {
      referrals: 0,
      documents: 0,
      authorizations: 0,
      tasks: 0,
      events: 0,
      programs: 0
    };
    
    try {
      counts.referrals = await window.analyticsDB.count('referrals');
      counts.documents = await window.analyticsDB.count('clinical_documents');
      counts.authorizations = await window.analyticsDB.count('authorizations');
      counts.tasks = await window.analyticsDB.count('tasks');
      counts.events = await window.analyticsDB.count('analytics_events');
      counts.programs = await window.analyticsDB.count('program_relationships');
    } catch (e) {
      console.warn('Error getting store counts:', e);
    }
    
    return counts;
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // DISCHARGE OUTCOME ANALYTICS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get breakdown of discharge outcomes
   * @param {Object} dateRange - { start, end } ISO date strings
   * @returns {Object} { program, homeWithSupports, clinicianRecommended, ama, noOutcomeRecorded, total }
   */
  async getOutcomeBreakdown(dateRange = null) {
    try {
      let discharged = [];
      
      if (window.clientManager) {
        discharged = await window.clientManager.getDischargedClients();
      }
      
      // Apply date range filter
      if (dateRange) {
        const startDate = dateRange.start ? new Date(dateRange.start) : null;
        const endDate = dateRange.end ? new Date(dateRange.end) : null;
        
        discharged = discharged.filter(client => {
          if (!client.dischargeDate) return false;
          const dcDate = new Date(client.dischargeDate);
          if (startDate && dcDate < startDate) return false;
          if (endDate && dcDate > endDate) return false;
          return true;
        });
      }
      
      const breakdown = {
        program: 0,
        homeWithSupports: 0,
        clinicianRecommended: 0,
        ama: 0,
        noOutcomeRecorded: 0,
        total: discharged.length
      };
      
      discharged.forEach(client => {
        const outcome = client.dischargeOutcome?.outcomeType;
        if (outcome === 'program') breakdown.program++;
        else if (outcome === 'home-with-supports') breakdown.homeWithSupports++;
        else if (outcome === 'clinician-recommended') breakdown.clinicianRecommended++;
        else if (outcome === 'ama' || outcome === 'family-override') breakdown.ama++;
        else breakdown.noOutcomeRecorded++;
      });
      
      // Calculate percentages
      const successfulPlacements = breakdown.program + breakdown.homeWithSupports;
      breakdown.placementRate = breakdown.total > 0 
        ? Math.round((successfulPlacements / breakdown.total) * 100) 
        : 0;
      
      return breakdown;
    } catch (error) {
      console.error('Failed to get outcome breakdown:', error);
      return { program: 0, homeWithSupports: 0, clinicianRecommended: 0, ama: 0, noOutcomeRecorded: 0, total: 0, placementRate: 0 };
    }
  },

  /**
   * Get top placement destinations
   * @param {number} limit - Max number of results
   * @returns {Array} [{ name, type, count, isCustom }]
   */
  async getTopPlacements(limit = 10) {
    try {
      let discharged = [];
      
      if (window.clientManager) {
        discharged = await window.clientManager.getDischargedClients();
      }
      
      const placements = {};
      
      discharged.forEach(client => {
        const placement = client.dischargeOutcome?.primaryPlacement;
        if (!placement?.programName) return;
        
        const key = placement.programId || placement.programName;
        if (!placements[key]) {
          placements[key] = {
            name: placement.programName,
            type: placement.programType || 'Unknown',
            isCustom: placement.isCustomEntry || false,
            count: 0
          };
        }
        placements[key].count++;
      });
      
      return Object.values(placements)
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
    } catch (error) {
      console.error('Failed to get top placements:', error);
      return [];
    }
  },

  /**
   * Get at-home resource usage frequency
   * @returns {Array} [{ type, label, count, percentage }]
   */
  async getAtHomeResourceUsage() {
    try {
      let discharged = [];
      
      if (window.clientManager) {
        discharged = await window.clientManager.getDischargedClients();
      }
      
      const resources = {};
      let totalResources = 0;
      
      const resourceLabels = {
        'therapist': 'Outpatient Therapist',
        'psychiatrist': 'Psychiatrist',
        'support-group': 'Support Group',
        'school-counselor': 'School Counselor',
        'case-manager': 'Case Manager',
        'other': 'Other Resource'
      };
      
      discharged.forEach(client => {
        const atHome = client.dischargeOutcome?.atHomeResources || [];
        atHome.forEach(resource => {
          const type = resource.type || 'other';
          resources[type] = (resources[type] || 0) + 1;
          totalResources++;
        });
      });
      
      return Object.entries(resources)
        .map(([type, count]) => ({
          type,
          label: resourceLabels[type] || type,
          count,
          percentage: totalResources > 0 ? Math.round((count / totalResources) * 100) : 0
        }))
        .sort((a, b) => b.count - a.count);
    } catch (error) {
      console.error('Failed to get at-home resource usage:', error);
      return [];
    }
  },

  /**
   * Get average length of stay
   * @returns {Object} { overall, byHouse, byOutcome }
   */
  async getAverageLengthOfStay() {
    try {
      let discharged = [];
      
      if (window.clientManager) {
        discharged = await window.clientManager.getDischargedClients();
      }
      
      const losData = discharged
        .filter(c => c.admissionDate && c.dischargeDate)
        .map(c => {
          const los = Math.round(
            (new Date(c.dischargeDate) - new Date(c.admissionDate)) / (1000 * 60 * 60 * 24)
          );
          return { 
            los, 
            house: c.houseId || c.house, 
            outcome: c.dischargeOutcome?.outcomeType 
          };
        });
      
      // Overall average
      const overall = losData.length > 0 
        ? Math.round(losData.reduce((sum, d) => sum + d.los, 0) / losData.length)
        : 0;
      
      // By house
      const byHouse = {};
      const houseGroups = {};
      losData.forEach(d => {
        if (!d.house) return;
        if (!houseGroups[d.house]) houseGroups[d.house] = [];
        houseGroups[d.house].push(d.los);
      });
      Object.entries(houseGroups).forEach(([house, losArray]) => {
        byHouse[house] = Math.round(losArray.reduce((sum, los) => sum + los, 0) / losArray.length);
      });
      
      // By outcome
      const byOutcome = {};
      const outcomeGroups = {};
      losData.forEach(d => {
        const outcome = d.outcome || 'unknown';
        if (!outcomeGroups[outcome]) outcomeGroups[outcome] = [];
        outcomeGroups[outcome].push(d.los);
      });
      Object.entries(outcomeGroups).forEach(([outcome, losArray]) => {
        byOutcome[outcome] = Math.round(losArray.reduce((sum, los) => sum + los, 0) / losArray.length);
      });
      
      return { overall, byHouse, byOutcome, totalClients: losData.length };
    } catch (error) {
      console.error('Failed to get average LOS:', error);
      return { overall: 0, byHouse: {}, byOutcome: {}, totalClients: 0 };
    }
  },

  /**
   * Get real-time house occupancy
   * @returns {Array} [{ houseId, name, current, capacity, percentage, subUnits }]
   */
  async getHouseOccupancy() {
    try {
      // Try to get from housesManager first
      if (window.housesManager && typeof window.housesManager.getTotalCensus === 'function') {
        const census = await window.housesManager.getTotalCensus();
        return census.byHouse || [];
      }
      
      // Fallback: calculate manually
      const activeClients = window.clientManager ? await window.clientManager.getActiveClients() : [];
      
      const defaultHouses = [
        { id: 'house_nest', name: 'NEST', capacity: 20, programType: 'neurodivergent' },
        { id: 'house_cove', name: 'Cove', capacity: 15, programType: 'residential' },
        { id: 'house_hedge', name: 'Hedge', capacity: 12, programType: 'residential' },
        { id: 'house_meridian', name: 'Meridian', capacity: 10, programType: 'residential' },
        { id: 'house_banyan', name: 'Banyan', capacity: 10, programType: 'residential' }
      ];
      
      return defaultHouses.map(house => {
        const clients = activeClients.filter(c => c.houseId === house.id || c.house === house.id);
        const current = clients.length;
        const percentage = Math.round((current / house.capacity) * 100);
        
        return {
          houseId: house.id,
          name: house.name,
          programType: house.programType,
          current,
          capacity: house.capacity,
          available: house.capacity - current,
          percentage,
          status: percentage >= 100 ? 'full' : percentage >= 90 ? 'critical' : percentage >= 75 ? 'warning' : 'available'
        };
      });
    } catch (error) {
      console.error('Failed to get house occupancy:', error);
      return [];
    }
  },

  /**
   * Get clinical assessments due/overdue summary
   * Uses MilestonesManager to calculate status for key assessments
   * @returns {Object} { total, completed, dueSoon, overdue, byType: [...] }
   */
  async getAssessmentsDue(daysAhead = 3) {
    try {
      if (!window.clientManager || !window.milestonesManager) {
        return { total: 0, completed: 0, dueSoon: 0, overdue: 0, byType: [] };
      }

      const clients = await window.clientManager.getAllClients();
      const activeClients = clients.filter(c => c.status === 'active' && c.admissionDate);

      const milestoneTypes = window.milestonesManager.milestoneTypes || {};
      const statusTypes = window.milestonesManager.statusTypes || {};

      // Focus on the core clinical assessments we care about
      const assessmentKeys = [
        'HEALTH_PHYSICAL',
        'GAD_ASSESSMENT',
        'PHQ_ASSESSMENT',
        'SATISFACTION_SURVEY'
      ];

      const assessments = assessmentKeys
        .map(key => milestoneTypes[key])
        .filter(Boolean);

      const byType = {};
      let total = 0;
      let completed = 0;
      let dueSoon = 0;
      let overdue = 0;

      const MS_PER_DAY = 1000 * 60 * 60 * 24;
      const today = new Date();

      for (const client of activeClients) {
        const milestones = await window.milestonesManager.getClientMilestones(client.id);
        const admission = new Date(client.admissionDate);
        const daysInCare = Math.floor((today - admission) / MS_PER_DAY);

        for (const assessment of assessments) {
          const record = milestones.find(m => m.milestone === assessment.id);
          if (!byType[assessment.id]) {
            byType[assessment.id] = {
              id: assessment.id,
              label: assessment.displayName || assessment.name || assessment.id,
              total: 0,
              completed: 0,
              dueSoon: 0,
              overdue: 0
            };
          }

          const bucket = byType[assessment.id];
          bucket.total += 1;
          total += 1;

          if (record && record.status === statusTypes.COMPLETE) {
            bucket.completed += 1;
            completed += 1;
            continue;
          }

          if (typeof assessment.daysDue === 'number') {
            if (daysInCare > assessment.daysDue) {
              bucket.overdue += 1;
              overdue += 1;
            } else if (assessment.daysDue - daysInCare <= daysAhead) {
              bucket.dueSoon += 1;
              dueSoon += 1;
            }
          }
        }
      }

      return {
        total,
        completed,
        dueSoon,
        overdue,
        byType: Object.values(byType).sort((a, b) => b.total - a.total)
      };
    } catch (error) {
      console.error('Failed to get assessments due summary:', error);
      return { total: 0, completed: 0, dueSoon: 0, overdue: 0, byType: [] };
    }
  },

  /**
   * Get aftercare progress summary across active clients
   * @returns {Object} { totalActive, threadStarted, optionsUploaded, packetUploaded, outcomeRecorded, rates... }
   */
  async getAftercareProgress() {
    try {
      if (!window.clientManager) {
        return {
          totalActive: 0,
          threadStarted: 0,
          optionsUploaded: 0,
          packetUploaded: 0,
          outcomeRecorded: 0,
          threadRate: 0,
          optionsRate: 0,
          packetRate: 0,
          outcomeRate: 0
        };
      }

      const clients = await window.clientManager.getAllClients();
      const activeClients = clients.filter(c => c.status === 'active');

      let threadStarted = 0;
      let optionsUploaded = 0;
      let packetUploaded = 0;
      let outcomeRecorded = 0;

      activeClients.forEach(client => {
        if (client.aftercareThreadSent || client.aftercareThread) threadStarted += 1;
        if (client.optionsDocUploaded) optionsUploaded += 1;
        if (client.dischargePacketUploaded || client.dischargePacket?.status === 'uploaded') packetUploaded += 1;
        if (client.dischargeOutcome?.outcomeType) outcomeRecorded += 1;
      });

      const totalActive = activeClients.length;
      const pct = (num) => totalActive > 0 ? Math.round((num / totalActive) * 100) : 0;

      return {
        totalActive,
        threadStarted,
        optionsUploaded,
        packetUploaded,
        outcomeRecorded,
        threadRate: pct(threadStarted),
        optionsRate: pct(optionsUploaded),
        packetRate: pct(packetUploaded),
        outcomeRate: pct(outcomeRecorded)
      };
    } catch (error) {
      console.error('Failed to get aftercare progress summary:', error);
      return {
        totalActive: 0,
        threadStarted: 0,
        optionsUploaded: 0,
        packetUploaded: 0,
        outcomeRecorded: 0,
        threadRate: 0,
        optionsRate: 0,
        packetRate: 0,
        outcomeRate: 0
      };
    }
  },

  /**
   * Get discharge readiness summary for clients discharging in the next 7 days
   * @returns {Object} { totalUpcoming, readyCount, blockedCount, ready, blocked }
   */
  async getDischargeReadiness(daysAhead = 7) {
    try {
      if (!window.clientManager || typeof window.clientManager.getUpcomingDischarges !== 'function') {
        return { totalUpcoming: 0, readyCount: 0, blockedCount: 0, ready: [], blocked: [] };
      }

      const hoursAhead = daysAhead * 24;
      const upcoming = window.clientManager.getUpcomingDischarges(hoursAhead) || [];

      const ready = [];
      const blocked = [];

      upcoming.forEach(client => {
        const readiness = window.clientManager.validateDischargeReadiness(client.id);
        const summary = {
          id: client.id,
          initials: client.initials || client.name || 'Client',
          house: client.houseId || client.house || 'Unknown',
          dischargeDate: client.dischargeDate || null,
          missingCount: readiness.missingItems?.length || 0,
          missingItems: readiness.missingItems || [],
          warnings: readiness.warnings || []
        };

        if (readiness.canDischarge) {
          ready.push(summary);
        } else {
          blocked.push(summary);
        }
      });

      return {
        totalUpcoming: upcoming.length,
        readyCount: ready.length,
        blockedCount: blocked.length,
        ready,
        blocked
      };
    } catch (error) {
      console.error('Failed to get discharge readiness summary:', error);
      return { totalUpcoming: 0, readyCount: 0, blockedCount: 0, ready: [], blocked: [] };
    }
  },

  /**
   * Get clients with custom program entries used frequently
   * @param {number} minCount - Minimum usage count to be considered frequent
   * @returns {Array} [{ name, type, count, clients }]
   */
  async getFrequentCustomPrograms(minCount = 3) {
    try {
      let discharged = [];
      
      if (window.clientManager) {
        discharged = await window.clientManager.getDischargedClients();
      }
      
      const customPrograms = {};
      
      discharged.forEach(client => {
        const placement = client.dischargeOutcome?.primaryPlacement;
        if (!placement?.isCustomEntry || !placement?.programName) return;
        
        const key = placement.programName.toLowerCase().trim();
        if (!customPrograms[key]) {
          customPrograms[key] = {
            name: placement.programName,
            type: placement.programType || 'Unknown',
            count: 0,
            clients: []
          };
        }
        customPrograms[key].count++;
        customPrograms[key].clients.push(client.initials);
      });
      
      return Object.values(customPrograms)
        .filter(p => p.count >= minCount)
        .sort((a, b) => b.count - a.count);
    } catch (error) {
      console.error('Failed to get frequent custom programs:', error);
      return [];
    }
  }
};

// Expose globally
window.analyticsExport = analyticsExport;

