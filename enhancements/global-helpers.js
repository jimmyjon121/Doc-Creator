/**
 * Global Helper Functions for CareConnect Pro
 * Ensures all commonly used functions are available globally
 */

(function() {
    'use strict';
    
    // Ensure window object exists
    if (typeof window === 'undefined') return;
    
    // ============= NOTIFICATION SYSTEM =============
    
    /**
     * Show notification message to user
     * @param {string} message - The message to display
     * @param {string} type - Type of notification: 'success', 'error', 'warning', 'info'
     * @param {string} title - Optional title for the notification
     * @param {number} duration - Duration in milliseconds (default: 3000)
     */
    window.showNotification = window.showNotification || function(message, type = 'info', title = '', duration = 3000) {
        console.log(`[${type.toUpperCase()}] ${title ? title + ': ' : ''}${message}`);
        
        // Remove any existing notification
        const existingNotification = document.querySelector('.global-notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `global-notification notification-${type}`;
        
        // Icon mapping
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        
        // Build notification HTML
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${icons[type] || icons.info}</span>
                <div class="notification-text">
                    ${title ? `<strong>${title}</strong><br>` : ''}
                    <span>${message}</span>
                </div>
                <button class="notification-close" onclick="this.closest('.global-notification').remove()">×</button>
            </div>
        `;
        
        // Add to document
        document.body.appendChild(notification);
        
        // Auto-remove after duration
        if (duration > 0) {
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.classList.add('fade-out');
                    setTimeout(() => notification.remove(), 300);
                }
            }, duration);
        }
    };
    
    // ============= MODAL SYSTEM =============
    
    /**
     * Show modal dialog
     * @param {Object} options - Modal configuration
     * @param {string} options.title - Modal title
     * @param {string} options.content - HTML content
     * @param {Array} options.buttons - Array of button objects {text, action, primary}
     * @param {boolean} options.closeOnOverlay - Close when clicking overlay (default: true)
     * @param {string} options.size - Modal size: 'small', 'medium', 'large' (default: 'medium')
     */
    window.showModal = window.showModal || function(options = {}) {
        // Remove any existing modal
        window.closeModal();
        
        // Default options
        const defaults = {
            title: 'Modal',
            content: '',
            buttons: [{text: 'Close', action: () => window.closeModal()}],
            closeOnOverlay: true,
            size: 'medium'
        };
        
        const config = Object.assign({}, defaults, options);
        
        // Create modal elements
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay global-modal-overlay';
        overlay.id = 'globalModal';
        
        const modal = document.createElement('div');
        modal.className = `modal-content global-modal-content modal-${config.size}`;
        
        // Build modal HTML
        modal.innerHTML = `
            <div class="modal-header">
                <h3 class="modal-title">${config.title}</h3>
                <button class="modal-close" onclick="window.closeModal()">&times;</button>
            </div>
            <div class="modal-body">
                ${config.content}
            </div>
            ${config.buttons.length > 0 ? `
                <div class="modal-footer">
                    ${config.buttons.map(btn => `
                        <button class="btn ${btn.primary ? 'btn-primary' : 'btn-secondary'}" 
                                onclick="(${btn.action.toString()})()">${btn.text}</button>
                    `).join('')}
                </div>
            ` : ''}
        `;
        
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        
        // Close on overlay click if enabled
        if (config.closeOnOverlay) {
            overlay.addEventListener('click', function(e) {
                if (e.target === overlay) {
                    window.closeModal();
                }
            });
        }
        
        // Focus management
        modal.focus();
        
        // Trap focus within modal
        const focusableElements = modal.querySelectorAll('button, input, select, textarea, a[href]');
        if (focusableElements.length > 0) {
            focusableElements[0].focus();
        }
    };
    
    /**
     * Close the currently open modal
     */
    window.closeModal = window.closeModal || function() {
        const modal = document.getElementById('globalModal');
        if (modal) {
            modal.classList.add('fade-out');
            setTimeout(() => modal.remove(), 200);
        }
    };
    
    // ============= NAVIGATION HELPERS =============
    
    /**
     * View client details
     * @param {string|Object} clientOrId - Client ID or client object
     */
    window.viewClientDetails = window.viewClientDetails || async function(clientOrId) {
        try {
            let client;
            
            // Handle both ID and object
            if (typeof clientOrId === 'string') {
                if (!window.clientManager) {
                    window.showNotification('Client manager not available', 'error');
                    return;
                }
                client = await window.clientManager.getClient(clientOrId);
            } else {
                client = clientOrId;
            }
            
            if (!client) {
                window.showNotification('Client not found', 'error');
                return;
            }
            
            // Switch to clients tab
            if (window.switchTab) {
                window.switchTab('clients');
            }
            
            // Show client details after a short delay
            setTimeout(() => {
                if (window.showClientDetailsModal) {
                    window.showClientDetailsModal(client);
                } else {
                    console.log('Client details modal not available, client:', client);
                    window.showNotification(`Viewing client: ${client.initials}`, 'info');
                }
            }, 100);
        } catch (error) {
            console.error('Error viewing client details:', error);
            window.showNotification('Failed to view client details', 'error');
        }
    };
    
    /**
     * Switch to a specific house view
     * @param {string} houseId - House ID to switch to
     */
    window.switchToHouse = window.switchToHouse || async function(houseId) {
        try {
            // Switch to clients tab first
            if (window.switchTab) {
                window.switchTab('clients');
            }
            
            // Wait for tab to load
            await new Promise(resolve => setTimeout(resolve, 200));
            
            // Find and click house filter button
            const houseButtons = document.querySelectorAll('.house-filter-btn');
            for (const btn of houseButtons) {
                if (btn.textContent.includes(houseId) || btn.dataset.house === houseId) {
                    btn.click();
                    window.showNotification(`Switched to ${houseId}`, 'success');
                    return;
                }
            }
            
            console.warn('House not found:', houseId);
            window.showNotification(`House ${houseId} not found`, 'warning');
        } catch (error) {
            console.error('Error switching house:', error);
            window.showNotification('Failed to switch house', 'error');
        }
    };
    
    // ============= UTILITY HELPERS =============
    
    /**
     * Debounce function execution
     * @param {Function} func - Function to debounce
     * @param {number} wait - Milliseconds to wait
     * @param {boolean} immediate - Execute immediately
     */
    window.debounce = window.debounce || function(func, wait, immediate) {
        let timeout;
        return function() {
            const context = this;
            const args = arguments;
            const later = function() {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    };
    
    /**
     * Format date for display
     * @param {string|Date} date - Date to format
     * @param {boolean} includeTime - Include time in format
     */
    window.formatDate = window.formatDate || function(date, includeTime = false) {
        if (!date) return '';
        
        const d = new Date(date);
        if (isNaN(d.getTime())) return '';
        
        const options = {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        };
        
        if (includeTime) {
            options.hour = '2-digit';
            options.minute = '2-digit';
        }
        
        return d.toLocaleDateString('en-US', options);
    };
    
    /**
     * Calculate days between dates
     * @param {string|Date} date1 - First date
     * @param {string|Date} date2 - Second date (defaults to today)
     */
    window.daysBetween = window.daysBetween || function(date1, date2 = new Date()) {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        const diffTime = Math.abs(d2 - d1);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };
    
    /**
     * Deep clone an object
     * @param {*} obj - Object to clone
     */
    window.deepClone = window.deepClone || function(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => window.deepClone(item));
        if (obj instanceof Object) {
            const cloned = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    cloned[key] = window.deepClone(obj[key]);
                }
            }
            return cloned;
        }
    };
    
    // ============= STYLES FOR NOTIFICATIONS AND MODALS =============
    
    if (!document.querySelector('#global-helpers-styles')) {
        const styles = document.createElement('style');
        styles.id = 'global-helpers-styles';
        styles.textContent = `
            /* Global Notification Styles */
            .global-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                max-width: 400px;
                background: white;
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                z-index: 100000;
                animation: slideInRight 0.3s ease;
                border-left: 4px solid;
            }
            
            .global-notification.fade-out {
                animation: slideOutRight 0.3s ease;
            }
            
            .notification-content {
                display: flex;
                align-items: flex-start;
                padding: 16px;
                gap: 12px;
            }
            
            .notification-icon {
                font-size: 20px;
                flex-shrink: 0;
            }
            
            .notification-text {
                flex: 1;
                font-size: 14px;
                line-height: 1.5;
            }
            
            .notification-close {
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                opacity: 0.5;
                transition: opacity 0.2s;
            }
            
            .notification-close:hover {
                opacity: 1;
            }
            
            /* Notification Types */
            .notification-success {
                border-left-color: #22c55e;
            }
            
            .notification-error {
                border-left-color: #ef4444;
            }
            
            .notification-warning {
                border-left-color: #f59e0b;
            }
            
            .notification-info {
                border-left-color: #3b82f6;
            }
            
            /* Global Modal Styles */
            .global-modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 99999;
                animation: fadeIn 0.2s ease;
            }
            
            .global-modal-overlay.fade-out {
                animation: fadeOut 0.2s ease;
            }
            
            .global-modal-content {
                background: white;
                border-radius: 12px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                max-height: 90vh;
                display: flex;
                flex-direction: column;
                animation: modalSlideIn 0.3s ease;
            }
            
            .global-modal-content.modal-small {
                width: 400px;
            }
            
            .global-modal-content.modal-medium {
                width: 600px;
            }
            
            .global-modal-content.modal-large {
                width: 800px;
            }
            
            .modal-header {
                padding: 20px;
                border-bottom: 1px solid #e5e7eb;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .modal-title {
                margin: 0;
                font-size: 20px;
                font-weight: 600;
            }
            
            .modal-close {
                background: none;
                border: none;
                font-size: 28px;
                cursor: pointer;
                opacity: 0.5;
                transition: opacity 0.2s;
                line-height: 1;
            }
            
            .modal-close:hover {
                opacity: 1;
            }
            
            .modal-body {
                padding: 20px;
                overflow-y: auto;
                flex: 1;
            }
            
            .modal-footer {
                padding: 20px;
                border-top: 1px solid #e5e7eb;
                display: flex;
                justify-content: flex-end;
                gap: 10px;
            }
            
            /* Animations */
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            @keyframes slideOutRight {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
            
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            @keyframes fadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }
            
            @keyframes modalSlideIn {
                from {
                    transform: translateY(-20px);
                    opacity: 0;
                }
                to {
                    transform: translateY(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(styles);
    }
    
    console.log('✅ Global helpers loaded successfully');
})();
