/**
 * @fileoverview Utility Helpers
 * @module js/utils/helpers
 * @status @canonical
 *
 * EXTRACTED FROM:
 *   CareConnect-Pro.html (lines 1147-1226)
 *   Extraction Date: December 2025
 *
 * PURPOSE:
 *   Common utility functions used throughout the application.
 *
 * DEPENDENCIES:
 *   - None (standalone module)
 *
 * EXPORTS TO WINDOW:
 *   - window.debounce(func, wait, immediate) - Debounce function calls
 *   - window.formatDate(date, includeTime) - Format dates for display
 *   - window.daysBetween(date1, date2) - Calculate days between dates
 *   - window.deepClone(obj) - Deep clone an object
 *
 * NOTE: For date calculations, prefer DateHelpers.calculateDaysInCare()
 * over daysBetween() - see js/utils/date-helpers.js
 */

(function() {
    'use strict';

    /**
     * Debounce function execution
     * @param {Function} func - Function to debounce
     * @param {number} wait - Milliseconds to wait
     * @param {boolean} [immediate=false] - Execute immediately on first call
     * @returns {Function} Debounced function
     *
     * @example
     * const debouncedSearch = debounce(() => performSearch(), 300);
     * input.addEventListener('input', debouncedSearch);
     */
    function debounce(func, wait, immediate) {
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
    }

    /**
     * Format date for display
     * @param {string|Date} date - Date to format
     * @param {boolean} [includeTime=false] - Include time in format
     * @returns {string} Formatted date string
     *
     * @example
     * formatDate('2025-12-01') // "Dec 1, 2025"
     * formatDate(new Date(), true) // "Dec 7, 2025, 5:30 PM"
     */
    function formatDate(date, includeTime = false) {
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
    }

    /**
     * Calculate days between dates
     * @param {string|Date} date1 - First date
     * @param {string|Date} [date2=new Date()] - Second date (defaults to today)
     * @returns {number} Days between dates
     *
     * @deprecated Prefer DateHelpers.calculateDaysInCare() for consistency
     */
    function daysBetween(date1, date2 = new Date()) {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        const diffTime = Math.abs(d2 - d1);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }

    /**
     * Deep clone an object
     * @param {*} obj - Object to clone
     * @returns {*} Cloned object
     *
     * @example
     * const copy = deepClone({ a: 1, b: { c: 2 } });
     */
    function deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => deepClone(item));
        if (obj instanceof Object) {
            const cloned = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    cloned[key] = deepClone(obj[key]);
                }
            }
            return cloned;
        }
    }

    // ═══════════════════════════════════════════════════════════
    // WINDOW EXPORTS
    // ═══════════════════════════════════════════════════════════
    window.debounce = window.debounce || debounce;
    window.formatDate = window.formatDate || formatDate;
    window.daysBetween = window.daysBetween || daysBetween;
    window.deepClone = window.deepClone || deepClone;

})();


