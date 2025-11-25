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
     * Check if we should auto-show morning or afternoon review
     * Morning: 8:00 AM - first login of the day after 8am
     * Afternoon: 3:30 PM - day review, once per day
     */
    function checkAutoShowMorningReview() {
        const now = new Date();
        const hour = now.getHours();
        const minutes = now.getMinutes();
        const today = now.toDateString();
        
        const lastMorningShown = localStorage.getItem('lastMorningReviewDate');
        const lastAfternoonShown = localStorage.getItem('lastAfternoonReviewDate');
        
        // Morning review: Show once per day, starting at 8am (until noon)
        // Only shows on first login after 8am if not already shown today
        if (hour >= 8 && hour < 12 && lastMorningShown !== today) {
            // Set localStorage IMMEDIATELY to prevent multiple triggers on refresh
            localStorage.setItem('lastMorningReviewDate', today);
            // Wait for dashboard to load before showing
            setTimeout(() => {
                if (window.morningReview) {
                    window.morningReview.renderMorningReview();
                }
            }, 3000);
        }
        
        // Afternoon/Day review: Show once per day at 3:30 PM (15:30) or after
        // Only shows on first login after 3:30pm if not already shown today
        if (hour >= 15 && (hour > 15 || minutes >= 30) && lastAfternoonShown !== today) {
            // Set localStorage IMMEDIATELY to prevent multiple triggers on refresh
            localStorage.setItem('lastAfternoonReviewDate', today);
            // Wait for dashboard to load before showing
            setTimeout(() => {
                if (window.morningReview) {
                    window.morningReview.renderMorningReview();
                }
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
