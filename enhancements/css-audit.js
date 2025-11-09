/**
 * CSS Audit Enhancement
 * Removes conflicting widget styles to rely on unified design system
 */

(function() {
    'use strict';
    
    // CSS conflicts to remove
    const conflictsToRemove = [
        // Duplicate card styles
        {
            selector: '.dashboard-widget .card',
            properties: ['background', 'border-radius', 'box-shadow', 'padding'],
            reason: 'Use unified card styles from unified-design.css'
        },
        
        // Duplicate button styles
        {
            selector: '.dashboard-widget .btn',
            properties: ['background', 'border', 'border-radius', 'padding', 'font-weight'],
            reason: 'Use unified button styles from unified-design.css'
        },
        
        // Conflicting colors
        {
            selector: '.zone-red, .zone-purple, .zone-yellow, .zone-green',
            properties: ['background', 'color'],
            reason: 'Keep zone colors but ensure they use design tokens'
        },
        
        // Duplicate spacing
        {
            selector: '.widget-header, .widget-body',
            properties: ['padding', 'margin'],
            reason: 'Use consistent spacing from unified design'
        }
    ];
    
    // Audit and clean CSS
    function auditCSS() {
        // Get all style sheets
        const styleSheets = Array.from(document.styleSheets);
        const removals = [];
        
        styleSheets.forEach((sheet, sheetIndex) => {
            try {
                const rules = Array.from(sheet.cssRules || sheet.rules || []);
                
                rules.forEach((rule, ruleIndex) => {
                    if (rule.style) {
                        conflictsToRemove.forEach(conflict => {
                            if (rule.selectorText && rule.selectorText.includes(conflict.selector)) {
                                conflict.properties.forEach(prop => {
                                    if (rule.style[prop]) {
                                        removals.push({
                                            sheet: sheetIndex,
                                            rule: ruleIndex,
                                            selector: rule.selectorText,
                                            property: prop,
                                            reason: conflict.reason
                                        });
                                    }
                                });
                            }
                        });
                    }
                });
            } catch (e) {
                // Cross-origin stylesheets can't be accessed
                console.warn('Cannot audit stylesheet:', e);
            }
        });
        
        // Log removals (for debugging)
        if (removals.length > 0) {
            console.log(`Found ${removals.length} potential CSS conflicts:`, removals);
        }
        
        return removals;
    }
    
    // Remove specific conflicting styles
    function removeConflicts() {
        // Add override styles that ensure unified design takes precedence
        const overrideStyles = `
            /* CSS Audit Overrides - Ensure unified design takes precedence */
            
            /* Widget cards */
            .dashboard-widget > .card,
            .dashboard-widget > div[class*="card"] {
                background: var(--ccp-card-bg, white) !important;
                border-radius: var(--ccp-radius-lg, 12px) !important;
                box-shadow: var(--ccp-shadow-md, 0 4px 12px rgba(0,0,0,0.1)) !important;
                padding: var(--ccp-spacing-lg, 20px) !important;
            }
            
            /* Buttons */
            .dashboard-widget .btn,
            .dashboard-widget button[class*="btn"] {
                font-weight: var(--ccp-font-weight-medium, 500) !important;
                border-radius: var(--ccp-radius-md, 8px) !important;
                transition: all var(--ccp-transition, 0.2s) !important;
            }
            
            /* Consistent spacing */
            .widget-header,
            .widget-body,
            .widget-footer {
                padding: var(--ccp-spacing-md, 16px) !important;
            }
            
            /* Zone colors - keep but ensure consistency */
            .zone-red {
                border-left-color: var(--ccp-danger-500, #ef4444) !important;
            }
            
            .zone-purple {
                border-left-color: var(--ccp-primary-700, #a855f7) !important;
            }
            
            .zone-yellow {
                border-left-color: var(--ccp-warning-500, #eab308) !important;
            }
            
            .zone-green {
                border-left-color: var(--ccp-success-500, #22c55e) !important;
            }
            
            /* Remove duplicate animations */
            .dashboard-widget * {
                animation-duration: var(--ccp-animation-duration, 0.3s) !important;
            }
            
            /* Ensure consistent typography */
            .dashboard-widget h1,
            .dashboard-widget h2,
            .dashboard-widget h3,
            .dashboard-widget h4 {
                font-family: var(--ccp-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif) !important;
                font-weight: var(--ccp-font-weight-semibold, 600) !important;
            }
            
            /* Consistent borders */
            .dashboard-widget .border,
            .dashboard-widget [class*="border"] {
                border-color: var(--ccp-border-color, #e5e7eb) !important;
            }
        `;
        
        // Inject override styles
        if (!document.querySelector('#css-audit-overrides')) {
            const style = document.createElement('style');
            style.id = 'css-audit-overrides';
            style.textContent = overrideStyles;
            document.head.appendChild(style);
        }
    }
    
    // Ensure unified design CSS loads last
    function ensureUnifiedDesignPriority() {
        const unifiedDesignLink = document.querySelector('link[href*="unified-design"], style[id*="unified-design"]');
        if (unifiedDesignLink) {
            // Move to end of head to ensure it loads last
            document.head.appendChild(unifiedDesignLink);
        }
    }
    
    // Remove inline styles that conflict
    function removeInlineConflicts() {
        // Find elements with inline styles that might conflict
        const elementsWithInlineStyles = document.querySelectorAll('[style*="background"], [style*="border-radius"], [style*="box-shadow"]');
        
        elementsWithInlineStyles.forEach(el => {
            // Check if it's a widget element
            if (el.closest('.dashboard-widget')) {
                const style = el.getAttribute('style');
                
                // Remove conflicting properties if they match unified design
                if (style) {
                    const newStyle = style
                        .replace(/background:\s*white;?/gi, '')
                        .replace(/border-radius:\s*\d+px;?/gi, '')
                        .replace(/box-shadow:\s*[^;]+;?/gi, '');
                    
                    if (newStyle !== style) {
                        el.setAttribute('style', newStyle.trim() || '');
                    }
                }
            }
        });
    }
    
    // Initialize
    function initialize() {
        // Run audit
        const conflicts = auditCSS();
        
        // Remove conflicts
        removeConflicts();
        
        // Ensure unified design priority
        ensureUnifiedDesignPriority();
        
        // Remove inline conflicts after DOM is ready
        setTimeout(() => {
            removeInlineConflicts();
        }, 1000);
        
        // Re-audit after dashboard loads
        if (window.eventBus) {
            window.eventBus.on('dashboard:loaded', () => {
                setTimeout(() => {
                    removeInlineConflicts();
                }, 500);
            });
        }
        
        console.log(`✅ CSS audit complete. Found ${conflicts.length} potential conflicts.`);
    }
    
    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
})();
