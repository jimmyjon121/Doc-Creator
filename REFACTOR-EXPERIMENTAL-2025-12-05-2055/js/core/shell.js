/**
 * @fileoverview App Shell & Navigation Controller
 * @module core/shell
 * @status @canonical
 * 
 * EXTRACTED FROM: CareConnect-Pro.html (lines 21405-21629)
 * Extraction Date: December 7, 2025
 * 
 * PURPOSE:
 *   Controls the app header, section headers, and navigation drawer.
 *   Exports window.ccShell with utility methods.
 * 
 * EXPORTS TO WINDOW:
 *   - window.ccShell.setSectionState(section)
 *   - window.ccShell.setActiveNavItem(item)
 *   - window.ccShell.openNav() / closeNav() / toggleNav()
 *   - window.ccShell.updateTopOffset()
 */
(function() {
    const state = {
        header: document.getElementById('appHeader'),
        section: document.getElementById('appSectionHeader'),
        navDrawer: document.getElementById('appNavDrawer'),
        navOverlay: document.getElementById('appNavOverlay'),
        navToggle: document.getElementById('appNavToggle'),
        navClose: document.getElementById('appNavClose'),
        activeSection: null,
        lastFocus: null
    };

    const templates = {
        dashboard: `
            <div class="section-header__content">
                <div>
                    <p class="section-eyebrow">Coach overview</p>
                    <div class="section-header__title">Dashboard</div>
                </div>
            </div>
            <div class="section-header__actions">
                <button type="button" class="section-chip" onclick="window.refreshDashboard && window.refreshDashboard(true)">Refresh</button>
            </div>
        `,
        clients: `
            <div class="section-header__content">
                <div>
                    <p class="section-eyebrow">Client workspace</p>
                    <div class="section-header__title">Clients</div>
                </div>
            </div>
            <div class="section-header__actions">
                <button type="button" class="section-chip" onclick="window.refreshClientsList && window.refreshClientsList()">Refresh</button>
                <button type="button" class="section-chip is-primary" onclick="window.showAddClientModal && window.showAddClientModal()">New Client</button>
            </div>
        `,
        'programs-loading': `
            <div class="section-header__content">
                <div>
                    <p class="section-eyebrow">Programs workspace</p>
                    <div class="section-header__title">Programs &amp; Docs</div>
                </div>
                <div class="section-status">Loading latest module…</div>
            </div>
        `,
        'programs-error': `
            <div class="section-header__content">
                <div>
                    <p class="section-eyebrow">Programs workspace</p>
                    <div class="section-header__title">Programs &amp; Docs</div>
                </div>
                <div class="section-status">Module unavailable. Try again.</div>
            </div>
            <div class="section-header__actions">
                <button type="button" class="section-chip is-primary" onclick="window.mountProgramsDocsModule && window.mountProgramsDocsModule(true)">Retry</button>
            </div>
        `,
        'programs': `
            <!-- Programs section uses its own toolbar, so hide this header -->
        `,
        'admin': `
            <div class="section-header__content">
                <div>
                    <p class="section-eyebrow">Administration</p>
                    <div class="section-header__title">Command Center</div>
                </div>
                <div class="section-status">Admin access required</div>
            </div>
            <div class="section-header__actions">
                <button type="button" class="section-chip" onclick="window.featureFlags && window.featureFlags.showPanel()">Feature Flags</button>
                <button type="button" class="section-chip" onclick="window.refreshAdminAnalytics && window.refreshAdminAnalytics()">Refresh</button>
            </div>
        `,
        default: `
            <div class="section-header__content">
                <div>
                    <p class="section-eyebrow">Workspace</p>
                    <div class="section-header__title">CareConnect</div>
                </div>
                <div class="section-status">Ready</div>
            </div>
        `
    };
    const drawerFocusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

    function updateTopOffset() {
        const topRow = state.header?.querySelector('.app-header__top');
        if (topRow) {
            const height = Math.round(topRow.getBoundingClientRect().height);
            document.documentElement.style.setProperty('--app-shell-top-offset', `${height}px`);
        }
        if (state.header) {
            const totalHeight = Math.round(state.header.getBoundingClientRect().height);
            document.documentElement.style.setProperty('--app-shell-total-header', `${totalHeight}px`);
        }
    }

    function setSectionState(section) {
        if (!state.section) return;
        state.activeSection = section;
        const templateKey = templates[section] ? section : 'default';
        const bodySection = section || 'default';
        document.body.dataset.ccSection = bodySection;
        document.body.classList.toggle('cc-section-programs', section === 'programs');
        state.section.dataset.section = bodySection;

        if (section === 'programs') {
            state.section.classList.add('is-hidden');
            state.section.innerHTML = '';
        } else {
            state.section.innerHTML = templates[templateKey];
            state.section.classList.remove('is-hidden');
        }

        updateTopOffset();
    }

    function setActiveNavItem(target) {
        const buttons = state.navDrawer?.querySelectorAll('[data-nav-target]');
        if (!buttons) return;
        buttons.forEach(btn => {
            const isMatch = btn.getAttribute('data-nav-target') === target;
            btn.classList.toggle('is-active', isMatch);
        });
    }

    function openNav() {
        document.body.classList.add('app-nav-open');
        state.navDrawer?.setAttribute('aria-hidden', 'false');
        state.navOverlay?.setAttribute('aria-hidden', 'false');
        state.navToggle?.setAttribute('aria-expanded', 'true');
        state.lastFocus = document.activeElement;
        setTimeout(() => {
            const firstItem = state.navDrawer?.querySelector('[data-nav-target]');
            firstItem?.focus();
        }, 10);
    }

    function closeNav() {
        document.body.classList.remove('app-nav-open');
        state.navDrawer?.setAttribute('aria-hidden', 'true');
        state.navOverlay?.setAttribute('aria-hidden', 'true');
        state.navToggle?.setAttribute('aria-expanded', 'false');
        state.lastFocus?.focus?.();
    }

    function toggleNav() {
        if (document.body.classList.contains('app-nav-open')) {
            closeNav();
        } else {
            openNav();
        }
    }

    state.navToggle?.addEventListener('click', toggleNav);
    state.navClose?.addEventListener('click', closeNav);
    state.navOverlay?.addEventListener('click', closeNav);

    state.navDrawer?.addEventListener('click', (event) => {
        const target = event.target.closest('[data-nav-target]');
        if (!target) return;
        const tab = target.getAttribute('data-nav-target');
        if (tab) {
            if (typeof window.switchTab === 'function') {
                window.switchTab(tab);
            } else {
                console.warn('switchTab not available yet, will retry...');
                setTimeout(() => {
                    if (typeof window.switchTab === 'function') {
                        window.switchTab(tab);
                    } else {
                        console.error('switchTab still not available');
                    }
                }, 100);
            }
        }
        closeNav();
    });

    state.navDrawer?.addEventListener('keydown', (event) => {
        if (event.key !== 'Tab' || !document.body.classList.contains('app-nav-open')) {
            return;
        }
        const focusableItems = state.navDrawer.querySelectorAll(drawerFocusableSelector);
        if (!focusableItems.length) return;
        const first = focusableItems[0];
        const last = focusableItems[focusableItems.length - 1];
        if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        } else if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeNav();
        } else if ((event.ctrlKey || event.metaKey) && (event.key === 'm' || event.key === 'M')) {
            event.preventDefault();
            toggleNav();
        }
    });

    window.addEventListener('resize', () => window.requestAnimationFrame(updateTopOffset));

    window.ccShell = {
        setSectionState,
        setActiveNavItem,
        openNav,
        closeNav,
        toggleNav,
        updateTopOffset
    };

    // Default to dashboard for stability; only restore last tab after login confirmed
    const initialTab = 'dashboard';
    setActiveNavItem(initialTab);
    setSectionState(initialTab);
    window.__pendingInitialTab = null; // Don't auto-switch until login completes
    updateTopOffset();
})();
