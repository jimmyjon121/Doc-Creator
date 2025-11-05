// Dashboard Visibility Fix
(function() {
    console.log('🔧 Applying Dashboard Visibility Fix...');
    
    // Force dashboard container to be visible
    const dashboardContainer = document.querySelector('.dashboard-container');
    if (dashboardContainer) {
        dashboardContainer.style.cssText += `
            background: #f8f9fa !important;
            min-height: 600px !important;
            padding: 20px !important;
            display: block !important;
            visibility: visible !important;
        `;
        console.log('✅ Dashboard container styled');
    }
    
    // Ensure main content is visible
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.style.cssText += `
            display: block !important;
            visibility: visible !important;
            background: white !important;
            min-height: 800px !important;
        `;
        console.log('✅ Main content styled');
    }
    
    // Fix programs panel if it's overlaying
    const programsPanel = document.querySelector('.programs-panel');
    if (programsPanel) {
        programsPanel.style.cssText += `
            position: relative !important;
            z-index: 1 !important;
        `;
        console.log('✅ Programs panel positioned');
    }
    
    // Ensure tab content is visible
    const dashboardTab = document.getElementById('dashboardTab');
    if (dashboardTab) {
        dashboardTab.style.cssText += `
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            position: relative !important;
            z-index: 10 !important;
            background: transparent !important;
        `;
        console.log('✅ Dashboard tab styled');
    }
    
    // Make sure all text is visible
    const allElements = document.querySelectorAll('.dashboard-container *');
    allElements.forEach(el => {
        const styles = window.getComputedStyle(el);
        if (styles.color === 'rgb(255, 255, 255)' || styles.color === 'white') {
            el.style.color = '#1a1a1a !important';
        }
    });
    console.log(`✅ Fixed text color for ${allElements.length} elements`);
    
    // Check if selection panel is covering dashboard
    const selectionPanel = document.querySelector('.selection-panel');
    if (selectionPanel) {
        const styles = window.getComputedStyle(selectionPanel);
        console.log('Selection panel:', {
            display: styles.display,
            position: styles.position,
            zIndex: styles.zIndex
        });
        
        // Hide selection panel when dashboard is active
        if (dashboardTab && dashboardTab.classList.contains('active')) {
            selectionPanel.style.display = 'none !important';
            console.log('✅ Selection panel hidden');
        }
    }
    
    // Fix widget visibility
    const widgets = document.querySelectorAll('.dashboard-widget');
    widgets.forEach(widget => {
        widget.style.cssText += `
            background: white !important;
            border: 1px solid #e0e0e0 !important;
            visibility: visible !important;
            opacity: 1 !important;
            position: relative !important;
        `;
    });
    console.log(`✅ Fixed ${widgets.length} widgets`);
    
    // Check container hierarchy
    let parent = dashboardContainer;
    while (parent && parent !== document.body) {
        const styles = window.getComputedStyle(parent);
        if (styles.display === 'none' || styles.visibility === 'hidden' || styles.opacity === '0') {
            console.warn('Found hidden parent:', parent.className || parent.id);
            parent.style.display = 'block !important';
            parent.style.visibility = 'visible !important';
            parent.style.opacity = '1 !important';
        }
        parent = parent.parentElement;
    }
    
    // Force container to have content
    const container = document.querySelector('.container');
    if (container) {
        container.style.cssText += `
            background: white !important;
            display: block !important;
            visibility: visible !important;
            min-height: 100vh !important;
        `;
        console.log('✅ Container fixed');
    }
    
    // Log current state
    console.log('Dashboard state after fix:', {
        containerVisible: !!document.querySelector('.dashboard-container'),
        tabActive: dashboardTab?.classList.contains('active'),
        widgetCount: document.querySelectorAll('.dashboard-widget').length,
        mainContentDisplay: mainContent ? window.getComputedStyle(mainContent).display : 'not found'
    });
    
})();
