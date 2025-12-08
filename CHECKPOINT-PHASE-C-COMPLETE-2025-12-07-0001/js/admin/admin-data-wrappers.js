/**
 * @fileoverview Admin Data Management Wrappers
 * @module admin/AdminDataWrappers
 * @status @canonical
 * 
 * PURPOSE:
 *   Provides admin-only access wrappers for data management operations.
 *   Ensures admin role verification before allowing sensitive operations.
 * 
 * EXTRACTED FROM:
 *   CareConnect-Pro.html (lines 29119-29203)
 *   Extraction Date: December 2025
 * 
 * DEPENDENCIES:
 *   - window.ccConfig.currentUser (optional) - Current user context
 *   - localStorage.userRole - Fallback role check
 *   - window.importData - Data import function
 *   - window.openProgramManager - Program manager function
 *   - window.clearAllPrograms - Program clear function
 *   - window.switchTab - Tab navigation fallback
 * 
 * EXPORTS TO WINDOW:
 *   - window.adminImportData - Admin-protected data import
 *   - window.adminOpenProgramManager - Admin-protected program manager
 *   - window.adminClearAllPrograms - Admin-protected program clear
 * 
 * SECURITY:
 *   All functions verify admin role before execution.
 *   Non-admin users receive an alert and operation is blocked.
 */

(function() {
    'use strict';
    
    console.log('[AdminDataWrappers] Initializing admin data wrappers...');
    
    /**
     * Check if current user has admin access
     * @returns {boolean} True if user has admin role
     */
    function hasAdminAccess() {
        try {
            const ccUserRole = (window.ccConfig && window.ccConfig.currentUser && window.ccConfig.currentUser.role) || null;
            const storedRole = localStorage.getItem('userRole');
            const role = (ccUserRole || storedRole || '').toString().toLowerCase();
            return role === 'admin';
        } catch (e) {
            console.warn('[AdminData] Failed to resolve admin role', e);
            return false;
        }
    }
    
    /**
     * Verify admin access or show alert
     * @returns {boolean} True if admin, false otherwise
     */
    function ensureAdminOrAlert() {
        if (!hasAdminAccess()) {
            alert('Admin access required to use Data Management tools.');
            return false;
        }
        return true;
    }
    
    /**
     * Admin-protected data import
     * Calls window.importData if available and user is admin
     */
    window.adminImportData = function() {
        if (!ensureAdminOrAlert()) return;
        
        try {
            const fn = window.importData;
            if (typeof fn === 'function') {
                fn();
            } else {
                console.warn('[AdminData] importData() not found on window');
                alert('Import function is not available in this build.');
            }
        } catch (error) {
            console.error('[AdminData] adminImportData failed', error);
            alert('Unable to import data. Please check the console for details.');
        }
    };
    
    /**
     * Admin-protected program manager opener
     * Calls window.openProgramManager or falls back to switchTab
     */
    window.adminOpenProgramManager = function() {
        if (!ensureAdminOrAlert()) return;
        
        try {
            if (typeof window.openProgramManager === 'function') {
                window.openProgramManager();
                return;
            }
            
            // Fallback: try to switch to Programs tab
            if (typeof window.switchTab === 'function') {
                window.switchTab('programs');
            } else {
                console.warn('[AdminData] openProgramManager() and switchTab() not available');
                alert('Program manager is not available in this build.');
            }
        } catch (error) {
            console.error('[AdminData] adminOpenProgramManager failed', error);
            alert('Unable to open program manager. Please check the console for details.');
        }
    };
    
    /**
     * Admin-protected program clear
     * Clears all locally stored program selections after confirmation
     */
    window.adminClearAllPrograms = function() {
        if (!ensureAdminOrAlert()) return;
        
        const confirmed = window.confirm(
            'This will clear all locally stored program selections and drafts on this device. ' +
            'This action cannot be undone. Do you want to continue?'
        );
        if (!confirmed) return;
        
        try {
            if (typeof window.clearAllPrograms === 'function') {
                window.clearAllPrograms();
            } else {
                console.warn('[AdminData] clearAllPrograms() not found on window');
                alert('Clear All Programs is not available in this build.');
            }
        } catch (error) {
            console.error('[AdminData] adminClearAllPrograms failed', error);
            alert('Unable to clear programs. Please check the console for details.');
        }
    };
    
    console.log('[AdminDataWrappers] ✅ Admin data wrappers initialized');
    
})();

