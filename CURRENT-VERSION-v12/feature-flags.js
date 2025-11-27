/**
 * Feature Flag System for CareConnect Pro
 * Manages progressive disclosure and feature rollout
 * @version 2.0.0
 */

// Feature configuration with categories and backend requirements
const FEATURE_FLAGS = {
    // ═══════════════════════════════════════════════════════════════════════════
    // CORE MODULES - Always available
    // ═══════════════════════════════════════════════════════════════════════════
    programsV2Core: {
        name: 'Programs V2 Module',
        description: 'Modern Programs & Docs module with filters and document builder',
        enabled: true,
        category: 'core',
        dependencies: [],
        risk: 'low',
        requiresBackend: false,
        icon: '📋'
    },
    devMode: {
        name: 'Developer Mode',
        description: 'Enable developer tools, debug logging, and console utilities',
        enabled: false,
        category: 'core',
        dependencies: [],
        risk: 'low',
        requiresBackend: false,
        icon: '🛠️'
    },
    
    // ═══════════════════════════════════════════════════════════════════════════
    // CLIENT MANAGEMENT FEATURES
    // ═══════════════════════════════════════════════════════════════════════════
    enableDischargeWorkflow: {
        name: 'Discharge Workflow',
        description: 'Automated discharge alerts, packet validation, and outcome tracking',
        enabled: true,
        category: 'clients',
        dependencies: [],
        risk: 'low',
        requiresBackend: false,
        icon: '📤'
    },
    enableDischargedArchive: {
        name: 'Discharged Clients Archive',
        description: 'Browse and search historical client records with filters',
        enabled: true,
        category: 'clients',
        dependencies: [],
        risk: 'low',
        requiresBackend: false,
        icon: '📁'
    },
    enableOutcomeTracking: {
        name: 'Outcome Tracking Modal',
        description: 'Capture discharge outcomes when completing aftercare plans',
        enabled: true,
        category: 'clients',
        dependencies: [],
        risk: 'low',
        requiresBackend: false,
        icon: '🎯'
    },
    
    // ═══════════════════════════════════════════════════════════════════════════
    // ANALYTICS & REPORTING
    // ═══════════════════════════════════════════════════════════════════════════
    enableHouseOccupancy: {
        name: 'House Occupancy Dashboard',
        description: 'Real-time census tracking with capacity visualization',
        enabled: true,
        category: 'analytics',
        dependencies: [],
        risk: 'low',
        requiresBackend: false,
        icon: '🏠'
    },
    enableOutcomeAnalytics: {
        name: 'Discharge Outcome Analytics',
        description: 'Charts and metrics for placement success rates',
        enabled: true,
        category: 'analytics',
        dependencies: [],
        risk: 'low',
        requiresBackend: false,
        icon: '📊'
    },
    enableAdvancedVisualizations: {
        name: 'Advanced Visualizations',
        description: 'Interactive charts, graphs, and data visualizations',
        enabled: false,
        category: 'analytics',
        dependencies: [],
        risk: 'medium',
        requiresBackend: false,
        icon: '📈'
    },
    enablePredictiveAnalytics: {
        name: 'Predictive Analytics',
        description: 'Trend analysis, forecasting, and predictions',
        enabled: false,
        category: 'analytics',
        dependencies: ['enableAdvancedVisualizations'],
        risk: 'high',
        requiresBackend: true,
        backendNote: 'Requires ML model endpoint',
        icon: '🔮'
    },
    
    // ═══════════════════════════════════════════════════════════════════════════
    // PROGRAMS & SEARCH FEATURES
    // ═══════════════════════════════════════════════════════════════════════════
    enableAdvancedFilters: {
        name: 'Advanced Filters',
        description: 'Enhanced filter system with insurance, cost, gender, age',
        enabled: false,
        category: 'programs',
        dependencies: [],
        risk: 'low',
        requiresBackend: false,
        icon: '🔍'
    },
    enableMapView: {
        name: 'Map View',
        description: 'Interactive map with program locations and clustering',
        enabled: false,
        category: 'programs',
        dependencies: ['enableAdvancedFilters'],
        risk: 'medium',
        requiresBackend: false,
        icon: '🗺️'
    },
    enableRadiusSearch: {
        name: 'Radius Search',
        description: 'Search programs within distance from client ZIP code',
        enabled: false,
        category: 'programs',
        dependencies: ['enableMapView'],
        risk: 'medium',
        requiresBackend: false,
        icon: '📍'
    },
    enableProgramInsights: {
        name: 'Program Insights',
        description: 'Detailed analytics and success metrics for each program',
        enabled: false,
        category: 'programs',
        dependencies: ['enableAdvancedFilters'],
        risk: 'low',
        requiresBackend: false,
        icon: '💡'
    },
    
    // ═══════════════════════════════════════════════════════════════════════════
    // AI & INTELLIGENCE (Requires Backend)
    // ═══════════════════════════════════════════════════════════════════════════
    enableIntelligentMatching: {
        name: 'Intelligent Matching',
        description: 'AI-powered program recommendations based on ASAM and client needs',
        enabled: false,
        category: 'ai',
        dependencies: ['enableAdvancedFilters'],
        risk: 'high',
        requiresBackend: true,
        backendNote: 'Requires AI matching API',
        icon: '🤖'
    },
    enableNaturalLanguageSearch: {
        name: 'Natural Language Search',
        description: 'Search using plain English queries like "PHP near Miami for teens"',
        enabled: false,
        category: 'ai',
        dependencies: ['enableAdvancedFilters'],
        risk: 'high',
        requiresBackend: true,
        backendNote: 'Requires NLP processing API',
        icon: '💬'
    },
    enableAutoDocumentation: {
        name: 'Auto Documentation',
        description: 'AI-assisted clinical documentation and note generation',
        enabled: false,
        category: 'ai',
        dependencies: [],
        risk: 'high',
        requiresBackend: true,
        backendNote: 'Requires LLM API integration',
        icon: '✨'
    },
    
    // ═══════════════════════════════════════════════════════════════════════════
    // SYNC & COLLABORATION (Requires Backend)
    // ═══════════════════════════════════════════════════════════════════════════
    enableCloudSync: {
        name: 'Cloud Sync',
        description: 'Sync data across devices and team members',
        enabled: false,
        category: 'sync',
        dependencies: [],
        risk: 'high',
        requiresBackend: true,
        backendNote: 'Requires sync server infrastructure',
        icon: '☁️'
    },
    enableMultiUserCollab: {
        name: 'Multi-User Collaboration',
        description: 'Real-time collaboration with team members',
        enabled: false,
        category: 'sync',
        dependencies: ['enableCloudSync'],
        risk: 'high',
        requiresBackend: true,
        backendNote: 'Requires WebSocket server',
        icon: '👥'
    },
    enableKipuIntegration: {
        name: 'Kipu EMR Integration',
        description: 'Direct integration with Kipu EMR for client data',
        enabled: false,
        category: 'sync',
        dependencies: [],
        risk: 'high',
        requiresBackend: true,
        backendNote: 'Requires Kipu API credentials',
        icon: '🔗'
    },
    
    // ═══════════════════════════════════════════════════════════════════════════
    // OFFLINE & PERFORMANCE
    // ═══════════════════════════════════════════════════════════════════════════
    enableOfflineMode: {
        name: 'Enhanced Offline Mode',
        description: 'Full functionality without internet, with smart sync',
        enabled: false,
        category: 'performance',
        dependencies: [],
        risk: 'medium',
        requiresBackend: false,
        icon: '📴'
    },
    enableMultiClientWorkflow: {
        name: 'Multi-Client Workflow',
        description: 'Manage multiple client documents simultaneously',
        enabled: false,
        category: 'performance',
        dependencies: [],
        risk: 'medium',
        requiresBackend: false,
        icon: '📑'
    }
};

// Category metadata
const CATEGORIES = {
    core: { name: 'Core Modules', icon: '⚙️', description: 'Essential application features' },
    clients: { name: 'Client Management', icon: '👤', description: 'Client tracking and discharge workflow' },
    analytics: { name: 'Analytics & Reporting', icon: '📊', description: 'Data visualization and insights' },
    programs: { name: 'Programs & Search', icon: '🔍', description: 'Program discovery and filtering' },
    ai: { name: 'AI & Intelligence', icon: '🤖', description: 'AI-powered features (requires backend)' },
    sync: { name: 'Sync & Collaboration', icon: '☁️', description: 'Cloud sync and team features (requires backend)' },
    performance: { name: 'Performance & Offline', icon: '⚡', description: 'Performance optimizations' }
};

// Feature flag management class
class FeatureFlagManager {
    constructor() {
        this.flags = JSON.parse(JSON.stringify(FEATURE_FLAGS)); // Deep clone
        this.categories = CATEGORIES;
        this.loadFromStorage();
        this.setupEventListeners();
    }
    
    /**
     * Load feature flags from localStorage
     */
    loadFromStorage() {
        const stored = localStorage.getItem('careconnect_feature_flags_v2');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                Object.keys(parsed).forEach(key => {
                    if (this.flags[key]) {
                        this.flags[key].enabled = parsed[key].enabled;
                    }
                });
            } catch (e) {
                console.error('Failed to load feature flags:', e);
            }
        }
    }
    
    /**
     * Save feature flags to localStorage
     */
    saveToStorage() {
        const toSave = {};
        Object.keys(this.flags).forEach(key => {
            toSave[key] = { enabled: this.flags[key].enabled };
        });
        localStorage.setItem('careconnect_feature_flags_v2', JSON.stringify(toSave));
    }
    
    /**
     * Check if a feature is enabled
     */
    isEnabled(featureName) {
        const feature = this.flags[featureName];
        if (!feature) return false;
        
        // Check dependencies
        if (feature.dependencies.length > 0) {
            const depsEnabled = feature.dependencies.every(dep => this.isEnabled(dep));
            if (!depsEnabled) return false;
        }
        
        return feature.enabled;
    }
    
    /**
     * Enable a feature
     */
    enableFeature(featureName) {
        const feature = this.flags[featureName];
        if (!feature) return false;
        
        // Check dependencies
        if (feature.dependencies.length > 0) {
            feature.dependencies.forEach(dep => {
                if (!this.isEnabled(dep)) {
                    console.warn(`Enabling dependency: ${dep}`);
                    this.enableFeature(dep);
                }
            });
        }
        
        feature.enabled = true;
        this.saveToStorage();
        this.notifyChange(featureName, true);
        this.refreshPanel();
        return true;
    }
    
    /**
     * Disable a feature
     */
    disableFeature(featureName) {
        const feature = this.flags[featureName];
        if (!feature) return false;
        
        // Check if other features depend on this
        const dependents = this.getDependents(featureName);
        if (dependents.length > 0) {
            console.warn(`Disabling dependents: ${dependents.join(', ')}`);
            dependents.forEach(dep => this.disableFeature(dep));
        }
        
        feature.enabled = false;
        this.saveToStorage();
        this.notifyChange(featureName, false);
        this.refreshPanel();
        return true;
    }
    
    /**
     * Get features that depend on a given feature
     */
    getDependents(featureName) {
        const dependents = [];
        Object.keys(this.flags).forEach(key => {
            if (this.flags[key].dependencies.includes(featureName)) {
                dependents.push(key);
            }
        });
        return dependents;
    }
    
    /**
     * Toggle a feature
     */
    toggleFeature(featureName) {
        if (this.isEnabled(featureName)) {
            this.disableFeature(featureName);
        } else {
            this.enableFeature(featureName);
        }
    }
    
    /**
     * Get all features with their status
     */
    getAllFeatures() {
        const features = [];
        Object.keys(this.flags).forEach(key => {
            features.push({
                id: key,
                ...this.flags[key],
                canEnable: this.canEnable(key)
            });
        });
        return features;
    }
    
    /**
     * Get features by category
     */
    getFeaturesByCategory() {
        const byCategory = {};
        Object.keys(this.categories).forEach(cat => {
            byCategory[cat] = [];
        });
        
        Object.keys(this.flags).forEach(key => {
            const feature = this.flags[key];
            const cat = feature.category || 'core';
            if (!byCategory[cat]) byCategory[cat] = [];
            byCategory[cat].push({
                id: key,
                ...feature,
                canEnable: this.canEnable(key)
            });
        });
        
        return byCategory;
    }
    
    /**
     * Check if a feature can be enabled
     */
    canEnable(featureName) {
        const feature = this.flags[featureName];
        if (!feature) return false;
        
        // Check if all dependencies are enabled
        return feature.dependencies.every(dep => this.isEnabled(dep));
    }
    
    /**
     * Get count of enabled features
     */
    getEnabledCount() {
        return Object.values(this.flags).filter(f => f.enabled).length;
    }
    
    /**
     * Get count of features requiring backend
     */
    getBackendRequiredCount() {
        return Object.values(this.flags).filter(f => f.requiresBackend).length;
    }
    
    /**
     * Setup event listeners for feature changes
     */
    setupEventListeners() {
        this.listeners = {};
    }
    
    /**
     * Add listener for feature changes
     */
    on(featureName, callback) {
        if (!this.listeners[featureName]) {
            this.listeners[featureName] = [];
        }
        this.listeners[featureName].push(callback);
    }
    
    /**
     * Remove listener
     */
    off(featureName, callback) {
        if (this.listeners[featureName]) {
            this.listeners[featureName] = this.listeners[featureName]
                .filter(cb => cb !== callback);
        }
    }
    
    /**
     * Notify listeners of feature change
     */
    notifyChange(featureName, enabled) {
        if (this.listeners[featureName]) {
            this.listeners[featureName].forEach(callback => {
                callback(enabled);
            });
        }
        
        // Global change notification
        if (this.listeners['*']) {
            this.listeners['*'].forEach(callback => {
                callback(featureName, enabled);
            });
        }
    }
    
    /**
     * Create the modern admin panel HTML
     */
    createAdminPanel() {
        const byCategory = this.getFeaturesByCategory();
        const enabledCount = this.getEnabledCount();
        const totalCount = Object.keys(this.flags).length;
        const backendCount = this.getBackendRequiredCount();
        
        let html = `
            <div id="featureFlagOverlay" class="ff-overlay" onclick="window.featureFlags.closePanel()">
                <div id="featureFlagPanel" class="ff-panel" onclick="event.stopPropagation()">
                    <!-- Header -->
                    <div class="ff-header">
                        <div class="ff-header__left">
                            <div class="ff-header__icon">🎛️</div>
                            <div class="ff-header__text">
                                <h2 class="ff-header__title">Feature Flags</h2>
                                <p class="ff-header__subtitle">Enable or disable application features</p>
                            </div>
                        </div>
                        <button class="ff-close-btn" onclick="window.featureFlags.closePanel()">×</button>
                    </div>
                    
                    <!-- Stats Bar -->
                    <div class="ff-stats">
                        <div class="ff-stat">
                            <span class="ff-stat__value">${enabledCount}</span>
                            <span class="ff-stat__label">Enabled</span>
                        </div>
                        <div class="ff-stat">
                            <span class="ff-stat__value">${totalCount - enabledCount}</span>
                            <span class="ff-stat__label">Disabled</span>
                        </div>
                        <div class="ff-stat ff-stat--warning">
                            <span class="ff-stat__value">${backendCount}</span>
                            <span class="ff-stat__label">Need Backend</span>
                        </div>
                        <div class="ff-stat-divider"></div>
                        <div class="ff-risk-legend">
                            <span class="ff-risk-legend__title">Stability Risk:</span>
                            <div class="ff-risk-legend__items">
                                <span class="ff-risk-legend__item ff-risk-legend__item--low">
                                    <span class="ff-risk-dot"></span>LOW — Stable, tested
                                </span>
                                <span class="ff-risk-legend__item ff-risk-legend__item--medium">
                                    <span class="ff-risk-dot"></span>MED — Beta, may have bugs
                                </span>
                                <span class="ff-risk-legend__item ff-risk-legend__item--high">
                                    <span class="ff-risk-dot"></span>HIGH — Experimental
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Content -->
                    <div class="ff-content">
        `;
        
        // Render each category
        Object.keys(byCategory).forEach(catKey => {
            const category = this.categories[catKey];
            const features = byCategory[catKey];
            if (features.length === 0) return;
            
            const enabledInCat = features.filter(f => f.enabled).length;
            
            html += `
                <div class="ff-category">
                    <div class="ff-category__header">
                        <div class="ff-category__icon">${category.icon}</div>
                        <div class="ff-category__info">
                            <h3 class="ff-category__name">${category.name}</h3>
                            <p class="ff-category__desc">${category.description}</p>
                        </div>
                        <div class="ff-category__count">${enabledInCat}/${features.length}</div>
                    </div>
                    <div class="ff-category__features">
            `;
            
            features.forEach(feature => {
                const isEnabled = feature.enabled;
                const canToggle = isEnabled || feature.canEnable;
                const needsBackend = feature.requiresBackend;
                
                html += `
                    <div class="ff-feature ${isEnabled ? 'ff-feature--enabled' : ''} ${needsBackend ? 'ff-feature--backend' : ''}">
                        <div class="ff-feature__main">
                            <div class="ff-feature__icon">${feature.icon || '📦'}</div>
                            <div class="ff-feature__info">
                                <div class="ff-feature__name">
                                    ${feature.name}
                                    ${needsBackend ? '<span class="ff-badge ff-badge--backend">Backend Required</span>' : ''}
                                </div>
                                <div class="ff-feature__desc">${feature.description}</div>
                                ${feature.dependencies.length > 0 ? `
                                    <div class="ff-feature__deps">
                                        <span class="ff-deps-label">Requires:</span>
                                        ${feature.dependencies.map(d => `<span class="ff-dep">${this.flags[d]?.name || d}</span>`).join('')}
                                    </div>
                                ` : ''}
                                ${needsBackend && feature.backendNote ? `
                                    <div class="ff-feature__backend-note">
                                        <span class="ff-backend-icon">⚠️</span>
                                        ${feature.backendNote}
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                        <div class="ff-feature__controls">
                            <span class="ff-risk ff-risk--${feature.risk}">${feature.risk}</span>
                            <label class="ff-toggle ${!canToggle ? 'ff-toggle--disabled' : ''}">
                                <input type="checkbox" 
                                    ${isEnabled ? 'checked' : ''} 
                                    ${!canToggle ? 'disabled' : ''}
                                    onchange="window.featureFlags.toggleFeature('${feature.id}')"
                                >
                                <span class="ff-toggle__slider"></span>
                            </label>
                        </div>
                    </div>
                `;
            });
            
            html += `
                    </div>
                </div>
            `;
        });
        
        html += `
                    </div>
                    
                    <!-- Footer -->
                    <div class="ff-footer">
                        <button class="ff-btn ff-btn--ghost" onclick="window.featureFlags.resetAll()">
                            Reset All
                        </button>
                        <div class="ff-footer__right">
                            <button class="ff-btn ff-btn--secondary" onclick="window.featureFlags.enableAllSafe()">
                                Enable All (No Backend)
                            </button>
                            <button class="ff-btn ff-btn--primary" onclick="window.featureFlags.closePanel()">
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        return html;
    }
    
    /**
     * Inject styles for the panel
     */
    injectStyles() {
        if (document.getElementById('ff-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'ff-styles';
        style.textContent = `
            /* Feature Flags Panel Styles */
            .ff-overlay {
                position: fixed;
                inset: 0;
                background: rgba(0, 0, 0, 0.6);
                backdrop-filter: blur(8px);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 50000;
                padding: 2rem;
                animation: ffFadeIn 0.2s ease;
            }
            
            @keyframes ffFadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            .ff-panel {
                background: linear-gradient(145deg, #1a1f35 0%, #0f1219 100%);
                border-radius: 24px;
                box-shadow: 0 40px 80px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1);
                width: 100%;
                max-width: 800px;
                max-height: 90vh;
                display: flex;
                flex-direction: column;
                overflow: hidden;
                animation: ffSlideUp 0.3s ease;
            }
            
            @keyframes ffSlideUp {
                from { transform: translateY(20px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
            
            /* Header */
            .ff-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 1.5rem 2rem;
                background: linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.1) 100%);
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            .ff-header__left {
                display: flex;
                align-items: center;
                gap: 1rem;
            }
            
            .ff-header__icon {
                font-size: 2.5rem;
                line-height: 1;
            }
            
            .ff-header__title {
                margin: 0;
                font-size: 1.5rem;
                font-weight: 700;
                color: #f1f5f9;
            }
            
            .ff-header__subtitle {
                margin: 0.25rem 0 0 0;
                font-size: 0.9rem;
                color: #94a3b8;
            }
            
            .ff-close-btn {
                width: 40px;
                height: 40px;
                border-radius: 12px;
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
                color: #94a3b8;
                font-size: 1.5rem;
                cursor: pointer;
                transition: all 0.2s;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .ff-close-btn:hover {
                background: rgba(239, 68, 68, 0.2);
                border-color: rgba(239, 68, 68, 0.3);
                color: #ef4444;
            }
            
            /* Stats Bar */
            .ff-stats {
                display: flex;
                gap: 2rem;
                padding: 1rem 2rem;
                background: rgba(0, 0, 0, 0.2);
                border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            }
            
            .ff-stat {
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            
            .ff-stat__value {
                font-size: 1.5rem;
                font-weight: 700;
                color: #22c55e;
            }
            
            .ff-stat__label {
                font-size: 0.85rem;
                color: #64748b;
            }
            
            .ff-stat--warning .ff-stat__value {
                color: #f59e0b;
            }
            
            .ff-stat-divider {
                width: 1px;
                height: 32px;
                background: rgba(255, 255, 255, 0.15);
                margin: 0 0.5rem;
            }
            
            .ff-risk-legend {
                display: flex;
                flex-direction: column;
                gap: 0.35rem;
            }
            
            .ff-risk-legend__title {
                font-size: 0.7rem;
                font-weight: 600;
                color: #94a3b8;
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }
            
            .ff-risk-legend__items {
                display: flex;
                gap: 1rem;
                flex-wrap: wrap;
            }
            
            .ff-risk-legend__item {
                display: flex;
                align-items: center;
                gap: 0.35rem;
                font-size: 0.75rem;
                font-weight: 500;
            }
            
            .ff-risk-legend__item--low {
                color: #22c55e;
            }
            
            .ff-risk-legend__item--medium {
                color: #f59e0b;
            }
            
            .ff-risk-legend__item--high {
                color: #ef4444;
            }
            
            .ff-risk-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: currentColor;
            }
            
            /* Content */
            .ff-content {
                flex: 1;
                overflow-y: auto;
                padding: 1.5rem 2rem;
            }
            
            /* Category */
            .ff-category {
                margin-bottom: 2rem;
            }
            
            .ff-category:last-child {
                margin-bottom: 0;
            }
            
            .ff-category__header {
                display: flex;
                align-items: center;
                gap: 1rem;
                margin-bottom: 1rem;
                padding-bottom: 0.75rem;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            .ff-category__icon {
                font-size: 1.5rem;
            }
            
            .ff-category__info {
                flex: 1;
            }
            
            .ff-category__name {
                margin: 0;
                font-size: 1.1rem;
                font-weight: 600;
                color: #e2e8f0;
            }
            
            .ff-category__desc {
                margin: 0.15rem 0 0 0;
                font-size: 0.8rem;
                color: #64748b;
            }
            
            .ff-category__count {
                font-size: 0.85rem;
                font-weight: 600;
                color: #6366f1;
                background: rgba(99, 102, 241, 0.15);
                padding: 0.25rem 0.75rem;
                border-radius: 20px;
            }
            
            .ff-category__features {
                display: flex;
                flex-direction: column;
                gap: 0.75rem;
            }
            
            /* Feature Card */
            .ff-feature {
                display: flex;
                align-items: flex-start;
                justify-content: space-between;
                gap: 1rem;
                padding: 1rem 1.25rem;
                background: rgba(255, 255, 255, 0.03);
                border: 1px solid rgba(255, 255, 255, 0.06);
                border-radius: 12px;
                transition: all 0.2s;
            }
            
            .ff-feature:hover {
                background: rgba(255, 255, 255, 0.05);
                border-color: rgba(255, 255, 255, 0.1);
            }
            
            .ff-feature--enabled {
                background: rgba(34, 197, 94, 0.08);
                border-color: rgba(34, 197, 94, 0.2);
            }
            
            .ff-feature--backend {
                border-left: 3px solid #f59e0b;
            }
            
            .ff-feature__main {
                display: flex;
                gap: 1rem;
                flex: 1;
            }
            
            .ff-feature__icon {
                font-size: 1.5rem;
                line-height: 1;
                flex-shrink: 0;
            }
            
            .ff-feature__info {
                flex: 1;
            }
            
            .ff-feature__name {
                font-size: 0.95rem;
                font-weight: 600;
                color: #f1f5f9;
                display: flex;
                align-items: center;
                gap: 0.5rem;
                flex-wrap: wrap;
            }
            
            .ff-feature__desc {
                font-size: 0.85rem;
                color: #94a3b8;
                margin-top: 0.25rem;
                line-height: 1.4;
            }
            
            .ff-feature__deps {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                margin-top: 0.5rem;
                flex-wrap: wrap;
            }
            
            .ff-deps-label {
                font-size: 0.75rem;
                color: #64748b;
            }
            
            .ff-dep {
                font-size: 0.75rem;
                padding: 0.15rem 0.5rem;
                background: rgba(99, 102, 241, 0.15);
                color: #a5b4fc;
                border-radius: 4px;
            }
            
            .ff-feature__backend-note {
                display: flex;
                align-items: center;
                gap: 0.35rem;
                margin-top: 0.5rem;
                font-size: 0.75rem;
                color: #fbbf24;
                background: rgba(245, 158, 11, 0.1);
                padding: 0.35rem 0.6rem;
                border-radius: 6px;
                width: fit-content;
            }
            
            .ff-backend-icon {
                font-size: 0.85rem;
            }
            
            .ff-feature__controls {
                display: flex;
                align-items: center;
                gap: 1rem;
                flex-shrink: 0;
            }
            
            /* Badges */
            .ff-badge {
                font-size: 0.65rem;
                padding: 0.2rem 0.5rem;
                border-radius: 4px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.03em;
            }
            
            .ff-badge--backend {
                background: rgba(245, 158, 11, 0.2);
                color: #fbbf24;
            }
            
            /* Risk Indicator */
            .ff-risk {
                font-size: 0.7rem;
                padding: 0.2rem 0.6rem;
                border-radius: 4px;
                font-weight: 600;
                text-transform: uppercase;
            }
            
            .ff-risk--low {
                background: rgba(34, 197, 94, 0.15);
                color: #22c55e;
            }
            
            .ff-risk--medium {
                background: rgba(245, 158, 11, 0.15);
                color: #f59e0b;
            }
            
            .ff-risk--high {
                background: rgba(239, 68, 68, 0.15);
                color: #ef4444;
            }
            
            /* Toggle Switch */
            .ff-toggle {
                position: relative;
                display: inline-block;
                width: 52px;
                height: 28px;
                flex-shrink: 0;
            }
            
            .ff-toggle input {
                opacity: 0;
                width: 0;
                height: 0;
            }
            
            .ff-toggle__slider {
                position: absolute;
                cursor: pointer;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.15);
                transition: all 0.3s;
                border-radius: 28px;
            }
            
            .ff-toggle__slider:before {
                position: absolute;
                content: "";
                height: 20px;
                width: 20px;
                left: 3px;
                bottom: 3px;
                background: #64748b;
                transition: all 0.3s;
                border-radius: 50%;
            }
            
            .ff-toggle input:checked + .ff-toggle__slider {
                background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
                border-color: #22c55e;
            }
            
            .ff-toggle input:checked + .ff-toggle__slider:before {
                transform: translateX(24px);
                background: white;
            }
            
            .ff-toggle--disabled {
                opacity: 0.4;
                pointer-events: none;
            }
            
            .ff-toggle:hover .ff-toggle__slider {
                border-color: rgba(255, 255, 255, 0.25);
            }
            
            /* Footer */
            .ff-footer {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 1.25rem 2rem;
                background: rgba(0, 0, 0, 0.3);
                border-top: 1px solid rgba(255, 255, 255, 0.05);
            }
            
            .ff-footer__right {
                display: flex;
                gap: 0.75rem;
            }
            
            /* Buttons */
            .ff-btn {
                padding: 0.75rem 1.25rem;
                border-radius: 10px;
                font-size: 0.9rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
                border: none;
            }
            
            .ff-btn--primary {
                background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
                color: white;
                box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
            }
            
            .ff-btn--primary:hover {
                transform: translateY(-1px);
                box-shadow: 0 6px 16px rgba(99, 102, 241, 0.4);
            }
            
            .ff-btn--secondary {
                background: rgba(255, 255, 255, 0.1);
                color: #e2e8f0;
                border: 1px solid rgba(255, 255, 255, 0.15);
            }
            
            .ff-btn--secondary:hover {
                background: rgba(255, 255, 255, 0.15);
            }
            
            .ff-btn--ghost {
                background: transparent;
                color: #94a3b8;
            }
            
            .ff-btn--ghost:hover {
                color: #ef4444;
                background: rgba(239, 68, 68, 0.1);
            }
            
            /* Scrollbar */
            .ff-content::-webkit-scrollbar {
                width: 8px;
            }
            
            .ff-content::-webkit-scrollbar-track {
                background: rgba(0, 0, 0, 0.2);
                border-radius: 4px;
            }
            
            .ff-content::-webkit-scrollbar-thumb {
                background: rgba(255, 255, 255, 0.15);
                border-radius: 4px;
            }
            
            .ff-content::-webkit-scrollbar-thumb:hover {
                background: rgba(255, 255, 255, 0.25);
            }
            
            /* Responsive */
            @media (max-width: 640px) {
                .ff-overlay {
                    padding: 1rem;
                }
                
                .ff-panel {
                    max-height: 95vh;
                    border-radius: 16px;
                }
                
                .ff-header {
                    padding: 1rem 1.25rem;
                }
                
                .ff-header__icon {
                    font-size: 2rem;
                }
                
                .ff-stats {
                    padding: 0.75rem 1.25rem;
                    gap: 1rem;
                }
                
                .ff-content {
                    padding: 1rem 1.25rem;
                }
                
                .ff-feature {
                    flex-direction: column;
                    gap: 0.75rem;
                }
                
                .ff-feature__controls {
                    width: 100%;
                    justify-content: space-between;
                }
                
                .ff-footer {
                    flex-direction: column;
                    gap: 0.75rem;
                    padding: 1rem 1.25rem;
                }
                
                .ff-footer__right {
                    width: 100%;
                    justify-content: stretch;
                }
                
                .ff-footer__right .ff-btn {
                    flex: 1;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    /**
     * Show admin panel
     */
    showPanel() {
        this.injectStyles();
        
        // Remove existing panel
        const existing = document.getElementById('featureFlagOverlay');
        if (existing) existing.remove();
        
        // Add new panel
        document.body.insertAdjacentHTML('beforeend', this.createAdminPanel());
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
    }
    
    /**
     * Refresh panel content
     */
    refreshPanel() {
        const existing = document.getElementById('featureFlagOverlay');
        if (existing) {
            existing.outerHTML = this.createAdminPanel();
        }
    }
    
    /**
     * Close admin panel
     */
    closePanel() {
        const overlay = document.getElementById('featureFlagOverlay');
        if (overlay) {
            overlay.remove();
        }
        document.body.style.overflow = '';
    }
    
    /**
     * Enable all features that don't require backend
     */
    enableAllSafe() {
        Object.keys(this.flags).forEach(key => {
            const feature = this.flags[key];
            if (!feature.requiresBackend && this.canEnable(key)) {
                feature.enabled = true;
            }
        });
        this.saveToStorage();
        this.refreshPanel();
    }
    
    /**
     * Reset all features to defaults
     */
    resetAll() {
        if (!confirm('Reset all feature flags to default values?')) return;
        
        Object.keys(this.flags).forEach(key => {
            this.flags[key].enabled = FEATURE_FLAGS[key].enabled;
        });
        this.saveToStorage();
        this.refreshPanel();
    }
}

// Initialize and export
if (typeof window !== 'undefined') {
    window.FeatureFlagManager = FeatureFlagManager;
    
    // Auto-initialize
    document.addEventListener('DOMContentLoaded', () => {
        if (!window.featureFlags) {
            window.featureFlags = new FeatureFlagManager();
            console.log('✅ Feature Flags Manager initialized');
        }
    });
    
    // Also init immediately if DOM already loaded
    if (document.readyState !== 'loading') {
        if (!window.featureFlags) {
            window.featureFlags = new FeatureFlagManager();
            console.log('✅ Feature Flags Manager initialized');
        }
    }
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FeatureFlagManager, FEATURE_FLAGS, CATEGORIES };
}
