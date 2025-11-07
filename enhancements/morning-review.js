/**
 * Morning Review Dashboard UI Enhancement
 * Adds morning review button and functionality
 */

(function() {
    'use strict';
    
    // Wait for dependencies
    function waitForDependencies() {
        if (!window.morningReview || !window.dashboardManager) {
            setTimeout(waitForDependencies, 100);
            return;
        }
        
        addMorningReviewButton();
        checkAutoShowMorningReview();
    }
    
    /**
     * Add morning review button to dashboard
     */
    function addMorningReviewButton() {
        // Check every second for dashboard controls
        const checkInterval = setInterval(() => {
            const dashboardControls = document.querySelector('.dashboard-controls');
            if (dashboardControls) {
                clearInterval(checkInterval);
                
                // Check if button already exists
                if (document.querySelector('.btn-morning-review')) return;
                
                // Add the button
                const morningBtn = document.createElement('button');
                morningBtn.className = 'btn-morning-review';
                morningBtn.innerHTML = '☀️ Morning Review';
                morningBtn.onclick = () => window.morningReview.renderMorningReview();
                
                // Insert before other buttons
                const firstButton = dashboardControls.querySelector('button');
                if (firstButton) {
                    dashboardControls.insertBefore(morningBtn, firstButton);
                } else {
                    dashboardControls.appendChild(morningBtn);
                }
                
                // Add notification badge if tasks are overdue
                checkForNotificationBadge();
            }
        }, 1000);
        
        // Stop checking after 30 seconds
        setTimeout(() => clearInterval(checkInterval), 30000);
    }
    
    /**
     * Check if we should auto-show morning review
     */
    function checkAutoShowMorningReview() {
        const hour = new Date().getHours();
        const lastShown = localStorage.getItem('lastMorningReviewDate');
        const today = new Date().toDateString();
        
        // Show automatically once per day in the morning (6am - 10am)
        if (hour >= 6 && hour <= 10 && lastShown !== today) {
            // Wait for dashboard to load
            setTimeout(() => {
                window.morningReview.renderMorningReview();
                localStorage.setItem('lastMorningReviewDate', today);
            }, 3000);
        }
    }
    
    /**
     * Add notification badge if there are overdue items
     */
    async function checkForNotificationBadge() {
        try {
            const clients = await window.clientManager.getAllClients();
            let overdueCount = 0;
            
            for (const client of clients) {
                if (client.status !== 'active') continue;
                
                const score = window.trackerEngine?.getCompletionScore(client);
                if (score && score.missingCritical) {
                    const daysInCare = window.trackerEngine.calculateDaysInCare(client.admissionDate);
                    const overdue = score.missingCritical.filter(item => daysInCare > item.dueByDay);
                    overdueCount += overdue.length;
                }
            }
            
            if (overdueCount > 0) {
                const morningBtn = document.querySelector('.btn-morning-review');
                if (morningBtn && !morningBtn.querySelector('.notification-badge')) {
                    const badge = document.createElement('span');
                    badge.className = 'notification-badge';
                    badge.textContent = overdueCount;
                    morningBtn.appendChild(badge);
                }
            }
        } catch (error) {
            console.error('Error checking for overdue items:', error);
        }
    }
    
    /**
     * Add keyboard shortcut
     */
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + M for Morning Review
        if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
            e.preventDefault();
            if (window.morningReview) {
                window.morningReview.renderMorningReview();
            }
        }
    });
    
    // Initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', waitForDependencies);
    } else {
        waitForDependencies();
    }
})();

// Add notification badge styles
if (!document.querySelector('#morning-review-badge-styles')) {
    const style = document.createElement('style');
    style.id = 'morning-review-badge-styles';
    style.textContent = `
        .notification-badge {
            position: absolute;
            top: -8px;
            right: -8px;
            background: #ef4444;
            color: white;
            font-size: 11px;
            font-weight: 700;
            padding: 2px 6px;
            border-radius: 10px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0%, 100% {
                transform: scale(1);
                opacity: 1;
            }
            50% {
                transform: scale(1.1);
                opacity: 0.8;
            }
        }
        
        .btn-morning-review {
            position: relative;
        }
    `;
    document.head.appendChild(style);
}
