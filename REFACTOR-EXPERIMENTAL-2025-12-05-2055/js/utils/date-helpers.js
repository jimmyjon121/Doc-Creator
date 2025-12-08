/**
 * DateHelpers - Centralized date/timeline utilities for CareConnect Pro
 * 
 * PURPOSE: Single source of truth for all date calculations to ensure
 * consistent behavior across dashboard, trackers, and client profiles.
 * 
 * USAGE: Access via window.DateHelpers in browser context.
 * 
 * NOTE: All day calculations use ceiling (partial days count as full days)
 * to match the existing behavioral expectations throughout the app.
 */

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * Calculate days in care from admission to end date (or today)
 * @param {string|Date} admissionDate - Client admission date
 * @param {string|Date|null} endDate - End date (defaults to today)
 * @returns {number} Days in care (minimum 0)
 */
function calculateDaysInCare(admissionDate, endDate = null) {
    if (!admissionDate) return 0;
    const start = new Date(admissionDate);
    const finish = endDate ? new Date(endDate) : new Date();
    if (Number.isNaN(start.getTime()) || Number.isNaN(finish.getTime())) return 0;
    const diff = Math.abs(finish - start);
    return Math.max(0, Math.ceil(diff / MS_PER_DAY));
}

/**
 * Calculate days until a target date (positive = future, negative = past)
 * @param {string|Date} targetDate - Target date
 * @returns {number|null} Days until target, or null if invalid
 */
function calculateDaysUntil(targetDate) {
    if (!targetDate) return null;
    const target = new Date(targetDate);
    if (Number.isNaN(target.getTime())) return null;
    const now = new Date();
    const diff = target - now;
    return Math.ceil(diff / MS_PER_DAY);
}

/**
 * Format date for display (localized short format)
 * @param {string|Date} value - Date to format
 * @returns {string} Formatted date string or 'TBD' if invalid
 */
function formatDate(value) {
    if (!value) return 'TBD';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString();
}

/**
 * Format date for completion timestamps (e.g., "Completed Dec 5, 2025")
 * @param {string|Date} value - Date to format
 * @returns {string} Formatted completion date
 */
function formatCompletionDate(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Format date with month/day/year-short (e.g., "Dec 5, '25")
 * @param {string|Date} value - Date to format
 * @returns {string} Short formatted date
 */
function formatDateShort(value) {
    if (!value) return 'TBD';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
}

/**
 * Check if a date is in the past
 * @param {string|Date} value - Date to check
 * @returns {boolean} True if date is before today
 */
function isPastDate(value) {
    if (!value) return false;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return false;
    return date < new Date();
}

/**
 * Add days to a date
 * @param {string|Date} date - Starting date
 * @param {number} days - Days to add (can be negative)
 * @returns {string} ISO date string (YYYY-MM-DD)
 */
function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result.toISOString().split('T')[0];
}

const DateHelpers = {
    calculateDaysInCare,
    calculateDaysUntil,
    formatDate,
    formatCompletionDate,
    formatDateShort,
    isPastDate,
    addDays,
    MS_PER_DAY
};

// Browser global - attached to window for universal access
if (typeof window !== 'undefined') {
    window.DateHelpers = DateHelpers;
}

// Node.js / CommonJS export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DateHelpers;
}

