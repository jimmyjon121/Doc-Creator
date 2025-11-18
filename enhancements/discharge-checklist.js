/**
 * Discharge Checklist UI Enhancement
 * Adds discharge checklist button to client cards and integrates with dashboard
 */

(function() {
    'use strict';
    
    // Wait for dashboard to be ready
    function waitForDashboard() {
        if (!window.dashboardWidgets || !window.dischargeChecklistManager) {
            setTimeout(waitForDashboard, 100);
            return;
        }
        
        enhanceClientCards();
    }
    
    /**
     * Add discharge checklist button to client cards
     */
    function enhanceClientCards() {
        // Override the renderClientCard method to add discharge checklist button
        const originalRenderCard = window.dashboardWidgets.renderClientCard;
        
        window.dashboardWidgets.renderClientCard = function(client) {
            const cardHtml = originalRenderCard.call(this, client);
            
            // Calculate days to discharge
            const daysToDischarge = client.dischargeDate ? 
                Math.ceil((new Date(client.dischargeDate) - new Date()) / (1000 * 60 * 60 * 24)) : null;
            
            // Only show discharge checklist button if discharge is within 7 days or past
            if (daysToDischarge !== null && daysToDischarge <= 7) {
                // Insert discharge checklist button before the closing client-actions div
                const insertPoint = '</div>\n            </div>';
                const dischargeButton = `
                    <button class="btn-discharge-checklist" 
                            onclick="dischargeChecklistManager.renderChecklistModal('${client.id}')"
                            title="Open FFAS Discharge Checklist">
                        📋 Discharge Checklist
                    </button>
                `;
                
                return cardHtml.replace(insertPoint, dischargeButton + insertPoint);
            }
            
            return cardHtml;
        };
        
        // Also add to the discharge prep alerts
        const originalRenderPriority = window.dashboardWidgets.renderPriorityItem;
        
        window.dashboardWidgets.renderPriorityItem = function(item, zoneColor) {
            const html = originalRenderPriority.call(this, item, zoneColor);
            
            // If this is a discharge prep item, add a link to the checklist
            if (item.type === 'discharge_prep') {
                const checklistLink = `
                    <button class="btn-link" 
                            onclick="dischargeChecklistManager.renderChecklistModal('${item.client.id}')"
                            style="margin-left: 8px; color: #7c3aed; text-decoration: underline; background: none; border: none; cursor: pointer;">
                        📋 Open Full Checklist
                    </button>
                `;
                
                // Insert after the action button
                return html.replace('</div>\n                </div>', checklistLink + '</div>\n                </div>');
            }
            
            return html;
        };
    }
    
    // Initialize when ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', waitForDashboard);
    } else {
        waitForDashboard();
    }
})();
