(function initAnalyticsHooks() {
  'use strict';

  if (typeof window === 'undefined') {
    return;
  }

  async function callAnalytics(method, ...args) {
    const analytics = window.CareConnectAnalytics;
    if (!analytics) return;
    const fn = analytics[method];
    if (typeof fn !== 'function') return;
    try {
      await fn(...args);
    } catch (error) {
      console.warn(`[AnalyticsHooks] ${method} failed`, error);
    }
  }

  function safeId(sourceId, fallback) {
    return sourceId || fallback || null;
  }

  const analyticsHooks = {
    logReferral(referralData) {
      if (!referralData) return;
      return callAnalytics('logReferral', referralData);
    },

    updateReferralStatus(referralId, status, details = {}) {
      if (!referralId || !status) return;
      return callAnalytics('updateReferralStatus', referralId, status, details);
    },

    logDocumentGenerated(documentData) {
      if (!documentData) return;
      return callAnalytics('logDocument', documentData);
    },

    completeDocument(documentId, details = {}) {
      if (!documentId) return;
      return callAnalytics('completeDocument', documentId, details);
    },

    logAuthorization(payload) {
      if (!payload) return;
      return callAnalytics('logAuthorization', payload);
    },

    updateAuthorizationDecision(authId, decision, details = {}) {
      if (!authId || !decision) return;
      return callAnalytics('updateAuthorizationDecision', authId, decision, details);
    },

    logTask(taskData) {
      if (!taskData) return;
      return callAnalytics('logTask', taskData);
    },

    completeTask(taskId, notes = '') {
      if (!taskId) return;
      return callAnalytics('completeTask', taskId, notes);
    },

    logProgramContact(programId, contactData) {
      if (!programId || !contactData) return;
      return callAnalytics('logProgramContact', programId, contactData);
    },

    updateProgramRelationshipStatus(programId, status, notes = '') {
      if (!programId || !status) return;
      return callAnalytics('updateProgramRelationshipStatus', programId, status, notes);
    },

    logClientAdmission(clientId, details = {}) {
      if (!clientId) return;
      return callAnalytics('logClientAdmission', clientId, details);
    },

    logClientDischarge(clientId, details = {}) {
      if (!clientId) return;
      return callAnalytics('logClientDischarge', clientId, details);
    },

    registerUserProfile(userData) {
      if (!userData) return;
      return callAnalytics('registerUser', {
        id: safeId(userData.id, userData.username),
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        email: userData.email || '',
        role: userData.role || 'coach',
        department: userData.department || 'case_management'
      });
    }
  };

  window.analyticsHooks = analyticsHooks;
})();

