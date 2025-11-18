// session-manager.js - HIPAA-compliant session management for clinical workflow
// No PHI is persisted - all data clears when session ends

class SessionManager {
    constructor() {
        this.currentSession = null;
        this.sessionTimer = null;
        this.WARNING_TIME = 25 * 60 * 1000; // 25 minutes
        this.TIMEOUT_TIME = 30 * 60 * 1000; // 30 minutes
        this.initializeSession();
    }
    
    initializeSession() {
        // Check for existing session
        const existingSession = sessionStorage.getItem('clinical_session');
        if (existingSession) {
            this.currentSession = JSON.parse(existingSession);
            this.resumeSession();
        }
    }
    
    createNewSession(clinicianName = '') {
        const sessionId = this.generateSessionId();
        
        this.currentSession = {
            sessionId: sessionId,
            date: new Date().toISOString(),
            clinician: clinicianName,
            startTime: Date.now(),
            criteria: {
                age: '',
                ageGroup: '',
                primaryConcern: '',
                secondaryConcerns: [],
                levelOfCare: '',
                insurance: '',
                geographic: '',
                specialNeeds: []
            },
            programsViewed: [],
            programsCompared: [],
            programsSelected: [],
            documents: [],
            notes: '',
            lastActivity: Date.now()
        };
        
        this.saveSession();
        this.startSessionTimer();
        this.displaySessionHeader();
        
        return this.currentSession;
    }
    
    generateSessionId() {
        // Generate HIPAA-compliant ID (no PHI)
        const prefix = 'CC';
        const year = new Date().getFullYear();
        const randomCode = Math.random().toString(36).substring(2, 6).toUpperCase();
        const timestamp = Date.now().toString(36).substring(-4).toUpperCase();
        
        return `${prefix}-${year}-${randomCode}${timestamp}`;
    }
    
    updateCriteria(criteria) {
        if (!this.currentSession) return;
        
        this.currentSession.criteria = {
            ...this.currentSession.criteria,
            ...criteria
        };
        
        this.currentSession.lastActivity = Date.now();
        this.saveSession();
    }
    
    addProgramViewed(programId) {
        if (!this.currentSession) return;
        
        if (!this.currentSession.programsViewed.includes(programId)) {
            this.currentSession.programsViewed.push(programId);
            this.currentSession.lastActivity = Date.now();
            this.saveSession();
        }
    }
    
    addProgramToCompare(programId) {
        if (!this.currentSession) return;
        
        if (!this.currentSession.programsCompared.includes(programId)) {
            this.currentSession.programsCompared.push(programId);
            this.currentSession.lastActivity = Date.now();
            this.saveSession();
        }
    }
    
    selectProgram(programId) {
        if (!this.currentSession) return;
        
        if (!this.currentSession.programsSelected.includes(programId)) {
            this.currentSession.programsSelected.push(programId);
            this.currentSession.lastActivity = Date.now();
            this.saveSession();
        }
    }
    
    addDocument(documentInfo) {
        if (!this.currentSession) return;
        
        this.currentSession.documents.push({
            type: documentInfo.type,
            timestamp: Date.now(),
            programs: documentInfo.programs || []
        });
        
        this.currentSession.lastActivity = Date.now();
        this.saveSession();
    }
    
    saveSession() {
        if (this.currentSession) {
            // Only save to sessionStorage (clears when browser closes)
            sessionStorage.setItem('clinical_session', JSON.stringify(this.currentSession));
        }
    }
    
    startSessionTimer() {
        // Clear any existing timer
        this.clearSessionTimer();
        
        // Warning at 25 minutes
        setTimeout(() => {
            this.showSessionWarning();
        }, this.WARNING_TIME);
        
        // Auto-end session at 30 minutes
        this.sessionTimer = setTimeout(() => {
            this.endSession(true);
        }, this.TIMEOUT_TIME);
    }
    
    clearSessionTimer() {
        if (this.sessionTimer) {
            clearTimeout(this.sessionTimer);
            this.sessionTimer = null;
        }
    }
    
    showSessionWarning() {
        const modal = document.createElement('div');
        modal.className = 'session-warning-modal';
        modal.innerHTML = `
            <div class="session-warning-content">
                <h3>⚠️ Session Timeout Warning</h3>
                <p>Your session will expire in 5 minutes.</p>
                <p>Please save any documents you need before the session ends.</p>
                <div class="session-warning-actions">
                    <button onclick="sessionManager.extendSession()" class="btn btn-primary">
                        Extend Session (30 min)
                    </button>
                    <button onclick="sessionManager.endSession()" class="btn btn-secondary">
                        End Session Now
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Auto-remove warning after 30 seconds
        setTimeout(() => {
            modal.remove();
        }, 30000);
    }
    
    extendSession() {
        this.currentSession.lastActivity = Date.now();
        this.saveSession();
        this.startSessionTimer();
        
        // Remove warning modal if present
        const modal = document.querySelector('.session-warning-modal');
        if (modal) modal.remove();
        
        this.showNotification('Session extended for 30 minutes', 'success');
    }
    
    resumeSession() {
        // Check if session is still valid (less than 30 min old)
        const sessionAge = Date.now() - this.currentSession.lastActivity;
        
        if (sessionAge > this.TIMEOUT_TIME) {
            this.endSession(true);
            return false;
        }
        
        // Resume timer with remaining time
        const remainingTime = this.TIMEOUT_TIME - sessionAge;
        this.sessionTimer = setTimeout(() => {
            this.endSession(true);
        }, remainingTime);
        
        this.displaySessionHeader();
        return true;
    }
    
    endSession(timeout = false) {
        if (this.currentSession) {
            // Generate session summary
            const summary = this.generateSessionSummary();
            
            if (!timeout && summary.hasUnsavedWork) {
                if (!confirm('You have unsaved work. Are you sure you want to end this session?')) {
                    return;
                }
            }
            
            // Clear all session data
            sessionStorage.removeItem('clinical_session');
            this.currentSession = null;
            this.clearSessionTimer();
            
            // Clear any temporary UI elements
            this.clearSessionUI();
            
            // Show completion message
            if (timeout) {
                this.showNotification('Session expired. All temporary data has been cleared.', 'warning');
            } else {
                this.showNotification('Session ended. All temporary data has been cleared.', 'info');
            }
            
            // Redirect to start page
            setTimeout(() => {
                location.reload();
            }, 2000);
        }
    }
    
    generateSessionSummary() {
        if (!this.currentSession) return null;
        
        const duration = Date.now() - this.currentSession.startTime;
        const minutes = Math.floor(duration / 60000);
        
        return {
            sessionId: this.currentSession.sessionId,
            duration: `${minutes} minutes`,
            programsViewed: this.currentSession.programsViewed.length,
            programsCompared: this.currentSession.programsCompared.length,
            programsSelected: this.currentSession.programsSelected.length,
            documentsGenerated: this.currentSession.documents.length,
            hasUnsavedWork: this.currentSession.documents.length > 0 && 
                           this.currentSession.documents.some(d => !d.exported)
        };
    }
    
    displaySessionHeader() {
        if (!this.currentSession) return;
        
        const header = document.getElementById('session-header');
        if (header) {
            const elapsed = Math.floor((Date.now() - this.currentSession.startTime) / 60000);
            
            header.innerHTML = `
                <div class="session-info">
                    <span class="session-id">Session: ${this.currentSession.sessionId}</span>
                    <span class="session-clinician">${this.currentSession.clinician || 'Clinician'}</span>
                    <span class="session-timer">${elapsed} min</span>
                    <button class="btn-end-session" onclick="sessionManager.endSession()">
                        End Session
                    </button>
                </div>
                <div class="session-warning">
                    ⚠️ Session data is temporary and will be cleared when you close this tab
                </div>
            `;
        }
    }
    
    clearSessionUI() {
        // Clear all temporary UI elements
        const sessionElements = document.querySelectorAll('[data-session-temp]');
        sessionElements.forEach(el => {
            el.value = '';
            el.textContent = '';
        });
        
        // Clear comparison selections
        const compareCheckboxes = document.querySelectorAll('.compare-checkbox');
        compareCheckboxes.forEach(cb => cb.checked = false);
        
        // Hide session-dependent sections
        const sessionSections = document.querySelectorAll('.session-only');
        sessionSections.forEach(section => section.style.display = 'none');
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    exportSessionData() {
        if (!this.currentSession) return null;
        
        // Create a safe export without any PHI
        const exportData = {
            sessionId: this.currentSession.sessionId,
            date: this.currentSession.date,
            programsReviewed: this.currentSession.programsViewed,
            programsCompared: this.currentSession.programsCompared,
            selectedPrograms: this.currentSession.programsSelected,
            criteria: {
                levelOfCare: this.currentSession.criteria.levelOfCare,
                ageGroup: this.currentSession.criteria.ageGroup,
                primaryConcern: this.currentSession.criteria.primaryConcern
            }
        };
        
        return exportData;
    }
}

// Initialize session manager globally
window.sessionManager = new SessionManager();
