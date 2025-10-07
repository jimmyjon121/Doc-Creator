/**
 * Security Utilities for CareConnect
 * Provides XSS prevention, input validation, and secure authentication
 */

// HTML Escape function to prevent XSS
function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') return unsafe;
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Validate and sanitize program data
function sanitizeProgramData(program) {
    return {
        id: String(program.id || '').substring(0, 50),
        name: escapeHtml(String(program.name || '').substring(0, 200)),
        location: escapeHtml(String(program.location || '').substring(0, 200)),
        phone: sanitizePhone(program.phone || program.contact?.phone || ''),
        website: sanitizeUrl(program.website || program.contact?.website || ''),
        levelOfCare: escapeHtml(String(program.levelOfCare || '').substring(0, 100)),
        features: Array.isArray(program.features) ? 
            program.features.map(f => escapeHtml(String(f).substring(0, 500))) : [],
        clinicalDetails: program.clinicalDetails ? {
            ageRange: escapeHtml(String(program.clinicalDetails.ageRange || '').substring(0, 50)),
            specializedTherapies: escapeHtml(String(program.clinicalDetails.specializedTherapies || '').substring(0, 500)),
            primaryIssues: escapeHtml(String(program.clinicalDetails.primaryIssues || '').substring(0, 500))
        } : {}
    };
}

// Validate phone number format
function sanitizePhone(phone) {
    const cleaned = String(phone).replace(/\D/g, '');
    if (cleaned.length === 10) {
        return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
    } else if (cleaned.length === 11 && cleaned[0] === '1') {
        return cleaned.replace(/1(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
    }
    return escapeHtml(phone);
}

// Validate and sanitize URLs
function sanitizeUrl(url) {
    if (!url) return '';
    
    // Remove dangerous protocols
    const dangerous = ['javascript:', 'data:', 'vbscript:', 'file:'];
    const lowerUrl = url.toLowerCase();
    
    for (const protocol of dangerous) {
        if (lowerUrl.startsWith(protocol)) {
            return '';
        }
    }
    
    // Ensure http/https
    if (!url.match(/^https?:\/\//i)) {
        url = 'https://' + url.replace(/^\/\//, '');
    }
    
    try {
        const parsed = new URL(url);
        return parsed.href;
    } catch (e) {
        return '';
    }
}

// Validate client name (first name only)
function validateClientName(name) {
    // Remove any HTML tags
    name = String(name).replace(/<[^>]*>/g, '');
    
    // Check for multiple words (likely includes last name)
    if (name.includes(' ')) {
        return { valid: false, error: 'Enter first name only - no spaces' };
    }
    
    // Check for numbers (likely DOB or ID)
    if (/\d/.test(name)) {
        return { valid: false, error: 'Name cannot contain numbers' };
    }
    
    // Check for special characters that might indicate PHI
    if (/[^\w\-']/.test(name)) {
        return { valid: false, error: 'Name contains invalid characters' };
    }
    
    // Check length
    if (name.length < 2) {
        return { valid: false, error: 'Name too short' };
    }
    
    if (name.length > 50) {
        return { valid: false, error: 'Name too long' };
    }
    
    return { valid: true, sanitized: escapeHtml(name) };
}

// Hash password for storage (not for real security, but better than plaintext)
function hashPassword(password) {
    // This is a simple hash for client-side use only
    // In production, use server-side bcrypt or similar
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash.toString(36);
}

// Validate session
function validateSession() {
    const session = sessionStorage.getItem('docCreatorSession');
    if (!session) return false;
    
    try {
        const data = JSON.parse(session);
        const now = Date.now();
        const fourHours = 4 * 60 * 60 * 1000;
        
        // Check if session is expired
        if (now - data.timestamp > fourHours) {
            sessionStorage.removeItem('docCreatorSession');
            return false;
        }
        
        // Validate session structure
        if (!data.timestamp || !data.token) {
            sessionStorage.removeItem('docCreatorSession');
            return false;
        }
        
        return true;
    } catch (e) {
        sessionStorage.removeItem('docCreatorSession');
        return false;
    }
}

// Create secure session
function createSecureSession() {
    const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
    const session = {
        timestamp: Date.now(),
        token: token,
        // Add browser fingerprint for additional security
        fingerprint: navigator.userAgent + navigator.language + screen.width + screen.height
    };
    sessionStorage.setItem('docCreatorSession', JSON.stringify(session));
    return token;
}

// Rate limiting for login attempts
const loginAttempts = new Map();

function checkLoginRateLimit(username) {
    const now = Date.now();
    const attempts = loginAttempts.get(username) || [];
    
    // Remove attempts older than 15 minutes
    const recentAttempts = attempts.filter(time => now - time < 15 * 60 * 1000);
    
    // Check if too many attempts
    if (recentAttempts.length >= 5) {
        const oldestAttempt = recentAttempts[0];
        const timeLeft = Math.ceil((15 * 60 * 1000 - (now - oldestAttempt)) / 60000);
        return { allowed: false, timeLeft };
    }
    
    // Add new attempt
    recentAttempts.push(now);
    loginAttempts.set(username, recentAttempts);
    
    return { allowed: true };
}

// Validate imported data schema
function validateImportedData(data) {
    if (!data || typeof data !== 'object') {
        return { valid: false, error: 'Invalid data format' };
    }
    
    // Check for required fields
    if (data.templates && !Array.isArray(data.templates)) {
        return { valid: false, error: 'Templates must be an array' };
    }
    
    if (data.programs && !Array.isArray(data.programs)) {
        return { valid: false, error: 'Programs must be an array' };
    }
    
    // Validate each program
    if (data.programs) {
        for (const program of data.programs) {
            if (!program.name || typeof program.name !== 'string') {
                return { valid: false, error: 'Invalid program name' };
            }
            if (program.name.length > 200) {
                return { valid: false, error: 'Program name too long' };
            }
        }
    }
    
    return { valid: true };
}

// Global error handler
function setupGlobalErrorHandler() {
    window.addEventListener('error', function(event) {
        console.error('Global error:', event.error);
        
        // Log to local storage for debugging
        const errors = JSON.parse(localStorage.getItem('appErrors') || '[]');
        errors.push({
            timestamp: Date.now(),
            message: event.message,
            source: event.filename,
            line: event.lineno,
            column: event.colno,
            stack: event.error?.stack
        });
        
        // Keep only last 50 errors
        if (errors.length > 50) {
            errors.shift();
        }
        
        localStorage.setItem('appErrors', JSON.stringify(errors));
        
        // Show user-friendly error message
        if (typeof showNotification === 'function') {
            showNotification('An error occurred. Please refresh the page if issues persist.', 'error');
        }
        
        // Prevent default error handling
        event.preventDefault();
    });
    
    // Handle promise rejections
    window.addEventListener('unhandledrejection', function(event) {
        console.error('Unhandled promise rejection:', event.reason);
        
        // Log to local storage
        const errors = JSON.parse(localStorage.getItem('appErrors') || '[]');
        errors.push({
            timestamp: Date.now(),
            type: 'unhandledRejection',
            reason: String(event.reason),
            promise: String(event.promise)
        });
        
        if (errors.length > 50) {
            errors.shift();
        }
        
        localStorage.setItem('appErrors', JSON.stringify(errors));
        
        // Prevent default handling
        event.preventDefault();
    });
}

// Export functions for use in main app
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        escapeHtml,
        sanitizeProgramData,
        sanitizePhone,
        sanitizeUrl,
        validateClientName,
        hashPassword,
        validateSession,
        createSecureSession,
        checkLoginRateLimit,
        validateImportedData,
        setupGlobalErrorHandler
    };
}
