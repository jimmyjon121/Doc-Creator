/**
 * Feature Flag System for CareConnect Pro
 * Manages progressive disclosure and feature rollout
 */

// Feature configuration with granular control
const FEATURE_FLAGS = {
    // Core module flags (enabled by default)
    programsV2Core: {
        name: 'Programs V2 Module',
        description: 'Modern Programs & Docs module with filters and document builder',
        enabled: true,
        dependencies: [],
        risk: 'low'
    },
    devMode: {
        name: 'Developer Mode',
        description: 'Enable developer tools and debug logging',
        enabled: false,
        dependencies: [],
        risk: 'low'
    },
    
    // Core features
    enableAdvancedFilters: {
        name: 'Advanced Filters',
        description: 'Enhanced filter system with insurance, cost, gender, age',
        enabled: false,
        dependencies: [],
        risk: 'low'
    },
    enableMapView: {
        name: 'Map View',
        description: 'Interactive map with program locations',
        enabled: false,
        dependencies: ['enableAdvancedFilters'],
        risk: 'medium'
    },
    enableRadiusSearch: {
        name: 'Radius Search',
        description: 'Search programs within distance from ZIP code',
        enabled: false,
        dependencies: ['enableMapView'],
        risk: 'medium'
    },
    
    // 10x enhancements
    enableIntelligentMatching: {
        name: 'Intelligent Matching',
        description: 'AI-powered program recommendations',
        enabled: false,
        dependencies: ['enableAdvancedFilters'],
        risk: 'high'
    },
    enableNaturalLanguageSearch: {
        name: 'Natural Language Search',
        description: 'Search using plain English queries',
        enabled: false,
        dependencies: ['enableAdvancedFilters'],
        risk: 'high'
    },
    enableAdvancedVisualizations: {
        name: 'Advanced Visualizations',
        description: 'Charts, graphs, and data visualizations',
        enabled: false,
        dependencies: ['enableMapView'],
        risk: 'medium'
    },
    enablePredictiveAnalytics: {
        name: 'Predictive Analytics',
        description: 'Trend analysis and predictions',
        enabled: false,
        dependencies: ['enableIntelligentMatching'],
        risk: 'high'
    },
    enableOfflineMode: {
        name: 'Offline Mode',
        description: 'Work without internet connection',
        enabled: false,
        dependencies: [],
        risk: 'high'
    },
    enableMultiClientWorkflow: {
        name: 'Multi-Client Workflow',
        description: 'Manage multiple clients simultaneously',
        enabled: false,
        dependencies: [],
        risk: 'medium'
    },
    enableProgramInsights: {
        name: 'Program Insights',
        description: 'Detailed analytics for each program',
        enabled: false,
        dependencies: ['enableAdvancedFilters'],
        risk: 'low'
    }
};

// Feature flag management class
class FeatureFlagManager {
    constructor() {
        this.flags = { ...FEATURE_FLAGS };
        this.loadFromStorage();
        this.setupEventListeners();
    }
    
    /**
     * Load feature flags from localStorage
     */
    loadFromStorage() {
        const stored = localStorage.getItem('careconnect_feature_flags');
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
        localStorage.setItem('careconnect_feature_flags', JSON.stringify(toSave));
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
     * Check if a feature can be enabled
     */
    canEnable(featureName) {
        const feature = this.flags[featureName];
        if (!feature) return false;
        
        // Check if all dependencies are enabled
        return feature.dependencies.every(dep => this.isEnabled(dep));
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
     * Create admin panel HTML
     */
    createAdminPanel() {
        const features = this.getAllFeatures();
        const riskColors = {
            low: '#10b981',
            medium: '#f59e0b',
            high: '#ef4444'
        };
        
        let html = `
            <div id="featureFlagPanel" style="
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                border-radius: 16px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                padding: 30px;
                max-width: 600px;
                max-height: 80vh;
                overflow-y: auto;
                z-index: 20000;
                display: none;
            ">
                <h2 style="margin-bottom: 20px; color: #1f2937;">Feature Flags</h2>
                <div style="margin-bottom: 20px;">
                    <p style="color: #6b7280; font-size: 14px;">
                        Enable or disable features. Dependencies will be managed automatically.
                    </p>
                </div>
                <div style="display: flex; flex-direction: column; gap: 12px;">
        `;
        
        features.forEach(feature => {
            const isEnabled = feature.enabled;
            const canToggle = isEnabled || feature.canEnable;
            
            html += `
                <div style="
                    border: 1px solid #e5e7eb;
                    border-radius: 12px;
                    padding: 16px;
                    background: ${isEnabled ? '#f0f9ff' : '#ffffff'};
                    transition: all 0.2s;
                ">
                    <div style="display: flex; justify-content: space-between; align-items: start;">
                        <div style="flex: 1;">
                            <h3 style="
                                font-size: 16px;
                                font-weight: 600;
                                color: #1f2937;
                                margin-bottom: 4px;
                            ">${feature.name}</h3>
                            <p style="
                                font-size: 14px;
                                color: #6b7280;
                                margin-bottom: 8px;
                            ">${feature.description}</p>
                            <div style="display: flex; gap: 8px; align-items: center;">
                                <span style="
                                    font-size: 12px;
                                    padding: 2px 8px;
                                    border-radius: 4px;
                                    background: ${riskColors[feature.risk]}20;
                                    color: ${riskColors[feature.risk]};
                                    font-weight: 600;
                                ">Risk: ${feature.risk}</span>
                                ${feature.dependencies.length > 0 ? `
                                    <span style="
                                        font-size: 12px;
                                        color: #6b7280;
                                    ">Requires: ${feature.dependencies.join(', ')}</span>
                                ` : ''}
                            </div>
                        </div>
                        <button
                            onclick="window.featureFlags.toggleFeature('${feature.id}')"
                            style="
                                padding: 8px 16px;
                                border-radius: 8px;
                                border: none;
                                background: ${isEnabled ? '#ef4444' : '#10b981'};
                                color: white;
                                font-weight: 600;
                                cursor: ${canToggle ? 'pointer' : 'not-allowed'};
                                opacity: ${canToggle ? '1' : '0.5'};
                                transition: all 0.2s;
                            "
                            ${!canToggle ? 'disabled' : ''}
                        >${isEnabled ? 'Disable' : 'Enable'}</button>
                    </div>
                </div>
            `;
        });
        
        html += `
                </div>
                <div style="margin-top: 20px; display: flex; justify-content: space-between;">
                    <button onclick="window.featureFlags.resetAll()" style="
                        padding: 10px 20px;
                        border-radius: 8px;
                        border: 1px solid #e5e7eb;
                        background: white;
                        color: #6b7280;
                        font-weight: 600;
                        cursor: pointer;
                    ">Reset All</button>
                    <button onclick="window.featureFlags.closePanel()" style="
                        padding: 10px 20px;
                        border-radius: 8px;
                        border: none;
                        background: #6366f1;
                        color: white;
                        font-weight: 600;
                        cursor: pointer;
                    ">Close</button>
                </div>
            </div>
        `;
        
        return html;
    }
    
    /**
     * Show admin panel
     */
    showPanel() {
        let panel = document.getElementById('featureFlagPanel');
        if (!panel) {
            document.body.insertAdjacentHTML('beforeend', this.createAdminPanel());
            panel = document.getElementById('featureFlagPanel');
        } else {
            // Update panel content
            panel.outerHTML = this.createAdminPanel();
            panel = document.getElementById('featureFlagPanel');
        }
        panel.style.display = 'block';
    }
    
    /**
     * Close admin panel
     */
    closePanel() {
        const panel = document.getElementById('featureFlagPanel');
        if (panel) {
            panel.style.display = 'none';
        }
    }
    
    /**
     * Reset all features
     */
    resetAll() {
        Object.keys(this.flags).forEach(key => {
            this.flags[key].enabled = false;
        });
        this.saveToStorage();
        location.reload();
    }
}

// Export for use in browser
if (typeof window !== 'undefined') {
    window.FeatureFlagManager = FeatureFlagManager;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FeatureFlagManager, FEATURE_FLAGS };
}

