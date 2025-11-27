/**
 * CareConnect Pro - Analytics System Initialization
 *
 * Add this to the app initialization sequence in CareConnect-Pro.html
 */

async function initializeAnalytics() {
  console.log('[CareConnect] Initializing analytics system...');

  try {
    // 1. Initialize the analytics database
    await window.analyticsDB.init();

    // 2. Initialize device ID if not set
    window.dataCapture.getDeviceId();

    // 3. Check for registered user, prompt if needed
    const currentUserId = localStorage.getItem('currentUserId');
    if (!currentUserId || currentUserId === 'unknown') {
      console.log('[CareConnect] No user registered, will prompt on first action');
    }

    // 4. Expose quick access functions
    window.CareConnectAnalytics = {
      // Quick logging
      logReferral: (data) => window.dataCapture.logReferral(data),
      logDocument: (data) => window.dataCapture.logDocument(data),
      logAuthorization: (data) => window.dataCapture.logAuthorization(data),
      logTask: (data) => window.dataCapture.logTask(data),
      logProgramContact: (programId, data) => window.dataCapture.logProgramContact(programId, data),

      // Status updates
      updateReferralStatus: (id, status, details) => window.dataCapture.updateReferralStatus(id, status, details),
      completeDocument: (id, details) => window.dataCapture.completeDocument(id, details),
      completeTask: (id, notes) => window.dataCapture.completeTask(id, notes),

      // Export
      exportData: (options) => window.analyticsExport.downloadExport(options),
      getSummary: () => window.analyticsExport.generateSummary(),

      // User management
      registerUser: (data) => window.dataCapture.registerUser(data)
    };

    console.log('[CareConnect] Analytics system ready');
    console.log('[CareConnect] Access via window.CareConnectAnalytics');
  } catch (err) {
    console.error('[CareConnect] Analytics initialization failed:', err);
  }
}

// Run on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeAnalytics);
} else {
  initializeAnalytics();
}


