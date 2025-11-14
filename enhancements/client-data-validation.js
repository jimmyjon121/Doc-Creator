/**
 * Client Data Validation Enhancement
 * Adds validation for client creation/updates, duplicate checking, date validation, and error display
 */

(function() {
    'use strict';
    
    // Validation rules
    const validationRules = {
        initials: {
            required: true,
            minLength: 2,
            maxLength: 10,
            pattern: /^[A-Z]{2,10}$/,
            message: 'Initials must be 2-10 uppercase letters'
        },
        houseId: {
            required: false,
            pattern: /^[A-Z0-9\s-]+$/i,
            message: 'House ID can only contain letters, numbers, spaces, and hyphens'
        },
        admissionDate: {
            required: true,
            validate: (date) => {
                const d = new Date(date);
                if (isNaN(d.getTime())) return 'Invalid date';
                if (d > new Date()) return 'Admission date cannot be in the future';
                return null;
            }
        },
        dischargeDate: {
            required: false,
            validate: (date, client) => {
                if (!date) return null;
                const d = new Date(date);
                if (isNaN(d.getTime())) return 'Invalid date';
                if (client.admissionDate) {
                    const admission = new Date(client.admissionDate);
                    if (d < admission) return 'Discharge date must be after admission date';
                }
                return null;
            }
        },
        status: {
            required: true,
            allowedValues: ['active', 'discharged', 'archived'],
            message: 'Status must be active, discharged, or archived'
        }
    };
    
    // Validation engine
    window.clientValidator = {
        /**
         * Validate client data
         * @param {Object} clientData - Client data to validate
         * @param {Object} existingClient - Existing client data (for updates)
         * @returns {Object} Validation result { valid: boolean, errors: Object }
         */
        validate(clientData, existingClient = null) {
            const errors = {};
            let isValid = true;
            
            // Check for duplicates (initials + houseId)
            if (clientData.initials && clientData.houseId) {
                const duplicate = this.checkDuplicate(clientData.initials, clientData.houseId, existingClient?.id);
                if (duplicate) {
                    errors.duplicate = `Client with initials "${clientData.initials}" already exists in ${clientData.houseId}`;
                    isValid = false;
                }
            }
            
            // Validate each field
            for (const [field, rules] of Object.entries(validationRules)) {
                const value = clientData[field];
                
                // Required check
                if (rules.required && (!value || value === '')) {
                    errors[field] = `${field} is required`;
                    isValid = false;
                    continue;
                }
                
                // Skip if empty and not required
                if (!value || value === '') continue;
                
                // Min length check
                if (rules.minLength && value.length < rules.minLength) {
                    errors[field] = `${field} must be at least ${rules.minLength} characters`;
                    isValid = false;
                    continue;
                }
                
                // Max length check
                if (rules.maxLength && value.length > rules.maxLength) {
                    errors[field] = `${field} must be no more than ${rules.maxLength} characters`;
                    isValid = false;
                    continue;
                }
                
                // Pattern check
                if (rules.pattern && !rules.pattern.test(value)) {
                    errors[field] = rules.message || `${field} format is invalid`;
                    isValid = false;
                    continue;
                }
                
                // Custom validation
                if (rules.validate) {
                    const customError = rules.validate(value, clientData);
                    if (customError) {
                        errors[field] = customError;
                        isValid = false;
                    }
                }
                
                // Allowed values check
                if (rules.allowedValues && !rules.allowedValues.includes(value)) {
                    errors[field] = rules.message || `${field} must be one of: ${rules.allowedValues.join(', ')}`;
                    isValid = false;
                }
            }
            
            return { valid: isValid, errors };
        },
        
        /**
         * Check for duplicate client
         * @param {string} initials - Client initials
         * @param {string} houseId - House ID
         * @param {string} excludeId - Client ID to exclude (for updates)
         * @returns {boolean} True if duplicate exists
         */
        async checkDuplicate(initials, houseId, excludeId = null) {
            if (!window.clientManager) return false;
            
            try {
                const clients = await window.clientManager.getAllClients();
                return clients.some(client => 
                    client.id !== excludeId &&
                    client.initials === initials &&
                    client.houseId === houseId
                );
            } catch (error) {
                console.error('Error checking duplicate:', error);
                return false;
            }
        },
        
        /**
         * Validate date range
         * @param {string} startDate - Start date
         * @param {string} endDate - End date
         * @returns {string|null} Error message or null
         */
        validateDateRange(startDate, endDate) {
            if (!startDate || !endDate) return null;
            
            const start = new Date(startDate);
            const end = new Date(endDate);
            
            if (isNaN(start.getTime())) return 'Invalid start date';
            if (isNaN(end.getTime())) return 'Invalid end date';
            if (end < start) return 'End date must be after start date';
            
            return null;
        },
        
        /**
         * Format validation errors for display
         * @param {Object} errors - Validation errors
         * @returns {string} Formatted error message
         */
        formatErrors(errors) {
            if (!errors || Object.keys(errors).length === 0) return '';
            
            return Object.entries(errors)
                .map(([field, message]) => `${field}: ${message}`)
                .join('\n');
        }
    };
    
    // Enhance clientManager with validation
    function enhanceClientManager() {
        if (!window.clientManager) return;
        
        // Wrap createClient
        const originalCreateClient = window.clientManager.createClient;
        window.clientManager.createClient = async function(clientData) {
            // Validate
            const validation = window.clientValidator.validate(clientData);
            
            if (!validation.valid) {
                const errorMsg = window.clientValidator.formatErrors(validation.errors);
                throw new Error(`Validation failed:\n${errorMsg}`);
            }
            
            // Check duplicate
            if (clientData.initials && clientData.houseId) {
                const isDuplicate = await window.clientValidator.checkDuplicate(
                    clientData.initials,
                    clientData.houseId
                );
                
                if (isDuplicate) {
                    throw new Error(`Client with initials "${clientData.initials}" already exists in ${clientData.houseId}`);
                }
            }
            
            // Call original
            return originalCreateClient.call(this, clientData);
        };
        
        // Wrap updateClient
        const originalUpdateClient = window.clientManager.updateClient;
        window.clientManager.updateClient = async function(clientId, updates) {
            // Get existing client
            const existingClient = await this.getClient(clientId);
            if (!existingClient) {
                throw new Error('Client not found');
            }
            
            // Merge updates with existing data for validation
            const mergedData = { ...existingClient, ...updates };
            
            // Validate
            const validation = window.clientValidator.validate(mergedData, existingClient);
            
            if (!validation.valid) {
                const errorMsg = window.clientValidator.formatErrors(validation.errors);
                throw new Error(`Validation failed:\n${errorMsg}`);
            }
            
            // Check duplicate if initials or houseId changed
            if (updates.initials || updates.houseId) {
                const newInitials = updates.initials || existingClient.initials;
                const newHouseId = updates.houseId || existingClient.houseId;
                
                const isDuplicate = await window.clientValidator.checkDuplicate(
                    newInitials,
                    newHouseId,
                    clientId
                );
                
                if (isDuplicate) {
                    throw new Error(`Client with initials "${newInitials}" already exists in ${newHouseId}`);
                }
            }
            
            // Call original
            return originalUpdateClient.call(this, clientId, updates);
        };
    }
    
    // Add validation UI helpers
    window.showValidationErrors = function(errors, container) {
        if (!container) return;
        
        // Remove existing errors
        container.querySelectorAll('.validation-error').forEach(el => el.remove());
        
        // Add error messages
        for (const [field, message] of Object.entries(errors)) {
            const errorEl = document.createElement('div');
            errorEl.className = 'validation-error';
            errorEl.textContent = `${field}: ${message}`;
            container.appendChild(errorEl);
        }
    };
    
    window.clearValidationErrors = function(container) {
        if (!container) return;
        container.querySelectorAll('.validation-error').forEach(el => el.remove());
    };
    
    // Enhance showAddClientModal with validation
    function enhanceAddClientModal() {
        const originalShowAddClientModal = window.showAddClientModal;
        if (!originalShowAddClientModal) return;
        
        window.showAddClientModal = async function() {
            // Call original
            await originalShowAddClientModal.call(this);
            
            // Wait for modal to render
            setTimeout(() => {
                addValidationToModal();
            }, 100);
        };
        
        function addValidationToModal() {
            const modal = document.getElementById('globalModal');
            if (!modal) return;
            
            const form = modal.querySelector('form') || modal.querySelector('.client-form');
            if (!form) return;
            
            // Add real-time validation
            const inputs = form.querySelectorAll('input, select, textarea');
            inputs.forEach(input => {
                input.addEventListener('blur', () => {
                    validateField(input);
                });
                
                input.addEventListener('input', () => {
                    clearFieldError(input);
                });
            });
            
            // Enhance submit handler
            const submitBtn = form.querySelector('button[type="submit"]') || 
                            form.querySelector('.btn-primary');
            
            if (submitBtn) {
                const originalClick = submitBtn.onclick;
                submitBtn.onclick = async function(e) {
                    e.preventDefault();
                    
                    // Validate all fields
                    const formData = new FormData(form);
                    const clientData = Object.fromEntries(formData.entries());
                    
                    // Convert dates
                    if (clientData.admissionDate) {
                        clientData.admissionDate = new Date(clientData.admissionDate).toISOString();
                    }
                    if (clientData.dischargeDate) {
                        clientData.dischargeDate = new Date(clientData.dischargeDate).toISOString();
                    }
                    
                    const validation = window.clientValidator.validate(clientData);
                    
                    if (!validation.valid) {
                        showValidationErrors(validation.errors, form);
                        window.showNotification('Please fix validation errors', 'error');
                        return;
                    }
                    
                    // Check duplicate
                    try {
                        const isDuplicate = await window.clientValidator.checkDuplicate(
                            clientData.initials,
                            clientData.houseId
                        );
                        
                        if (isDuplicate) {
                            window.showNotification(
                                `Client with initials "${clientData.initials}" already exists in ${clientData.houseId}`,
                                'error'
                            );
                            return;
                        }
                    } catch (error) {
                        console.error('Error checking duplicate:', error);
                    }
                    
                    // Call original handler
                    if (originalClick) {
                        originalClick.call(this, e);
                    }
                };
            }
        }
        
        function validateField(input) {
            const field = input.name || input.id;
            const value = input.value;
            
            const rules = validationRules[field];
            if (!rules) return;
            
            const clientData = { [field]: value };
            const validation = window.clientValidator.validate(clientData);
            
            if (validation.errors[field]) {
                showFieldError(input, validation.errors[field]);
            } else {
                clearFieldError(input);
            }
        }
        
        function showFieldError(input, message) {
            clearFieldError(input);
            
            input.classList.add('validation-error-field');
            
            const errorEl = document.createElement('div');
            errorEl.className = 'validation-error-message';
            errorEl.textContent = message;
            
            input.parentNode.insertBefore(errorEl, input.nextSibling);
        }
        
        function clearFieldError(input) {
            input.classList.remove('validation-error-field');
            const errorMsg = input.parentNode.querySelector('.validation-error-message');
            if (errorMsg) {
                errorMsg.remove();
            }
        }
    }
    
    // Add styles
    if (!document.querySelector('#client-data-validation-styles')) {
        const styles = document.createElement('style');
        styles.id = 'client-data-validation-styles';
        styles.textContent = `
            /* Validation Errors */
            .validation-error {
                padding: 8px 12px;
                margin: 8px 0;
                background: #fef2f2;
                border: 1px solid #fecaca;
                border-left: 4px solid #ef4444;
                border-radius: 4px;
                color: #991b1b;
                font-size: 14px;
            }
            
            .validation-error-field {
                border-color: #ef4444 !important;
                box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1) !important;
            }
            
            .validation-error-message {
                margin-top: 4px;
                font-size: 12px;
                color: #ef4444;
            }
            
            /* Success state */
            .validation-success-field {
                border-color: #22c55e !important;
                box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1) !important;
            }
        `;
        document.head.appendChild(styles);
    }
    
    // Initialize
    function initialize() {
        enhanceClientManager();
        enhanceAddClientModal();
        
        console.log('✅ Client data validation initialized');
    }
    
    // Wait for dependencies
    if (window.clientManager) {
        initialize();
    } else {
        const checkInterval = setInterval(() => {
            if (window.clientManager) {
                clearInterval(checkInterval);
                initialize();
            }
        }, 100);
        
        setTimeout(() => clearInterval(checkInterval), 10000);
    }
})();



