/**
 * Multi-Client Workflow System for CareConnect Pro
 * Manages multiple client sessions and batch operations
 */

class MultiClientWorkflow {
    constructor() {
        this.clients = new Map();
        this.activeClientId = null;
        this.maxClients = 10;
        this.templates = new Map();
        this.batchOperations = [];
    }
    
    /**
     * Create a new client session
     */
    createClient(data = {}) {
        const clientId = this.generateClientId();
        const client = {
            id: clientId,
            name: data.name || `Client ${this.clients.size + 1}`,
            profile: data.profile || null,
            selectedPrograms: new Set(),
            filters: data.filters || {},
            document: {
                type: data.documentType || 'aftercare',
                content: '',
                lastModified: Date.now()
            },
            notes: data.notes || '',
            created: Date.now(),
            lastAccessed: Date.now()
        };
        
        this.clients.set(clientId, client);
        
        // Set as active if first client
        if (this.clients.size === 1) {
            this.activeClientId = clientId;
        }
        
        this.saveToStorage();
        return client;
    }
    
    /**
     * Generate unique client ID
     */
    generateClientId() {
        return 'client_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    /**
     * Switch active client
     */
    switchClient(clientId) {
        if (!this.clients.has(clientId)) {
            throw new Error('Client not found');
        }
        
        this.activeClientId = clientId;
        const client = this.clients.get(clientId);
        client.lastAccessed = Date.now();
        
        this.saveToStorage();
        this.notifyClientSwitch(client);
        
        return client;
    }
    
    /**
     * Get active client
     */
    getActiveClient() {
        if (!this.activeClientId) return null;
        return this.clients.get(this.activeClientId);
    }
    
    /**
     * Get all clients
     */
    getAllClients() {
        return Array.from(this.clients.values())
            .sort((a, b) => b.lastAccessed - a.lastAccessed);
    }
    
    /**
     * Update client data
     */
    updateClient(clientId, updates) {
        const client = this.clients.get(clientId);
        if (!client) throw new Error('Client not found');
        
        Object.assign(client, updates);
        client.lastAccessed = Date.now();
        
        this.saveToStorage();
        return client;
    }
    
    /**
     * Delete client
     */
    deleteClient(clientId) {
        if (!this.clients.has(clientId)) return false;
        
        this.clients.delete(clientId);
        
        // Switch to another client if deleted was active
        if (this.activeClientId === clientId) {
            const remaining = this.getAllClients();
            this.activeClientId = remaining.length > 0 ? remaining[0].id : null;
        }
        
        this.saveToStorage();
        return true;
    }
    
    /**
     * Add program to client
     */
    addProgramToClient(clientId, programId) {
        const client = this.clients.get(clientId);
        if (!client) throw new Error('Client not found');
        
        client.selectedPrograms.add(programId);
        client.lastAccessed = Date.now();
        
        this.saveToStorage();
        return client;
    }
    
    /**
     * Remove program from client
     */
    removeProgramFromClient(clientId, programId) {
        const client = this.clients.get(clientId);
        if (!client) throw new Error('Client not found');
        
        client.selectedPrograms.delete(programId);
        client.lastAccessed = Date.now();
        
        this.saveToStorage();
        return client;
    }
    
    /**
     * Batch add program to multiple clients
     */
    batchAddProgram(clientIds, programId) {
        const results = {
            success: [],
            failed: []
        };
        
        clientIds.forEach(clientId => {
            try {
                this.addProgramToClient(clientId, programId);
                results.success.push(clientId);
            } catch (error) {
                results.failed.push({ clientId, error: error.message });
            }
        });
        
        this.recordBatchOperation('addProgram', { programId, clientIds, results });
        return results;
    }
    
    /**
     * Batch remove program from multiple clients
     */
    batchRemoveProgram(clientIds, programId) {
        const results = {
            success: [],
            failed: []
        };
        
        clientIds.forEach(clientId => {
            try {
                this.removeProgramFromClient(clientId, programId);
                results.success.push(clientId);
            } catch (error) {
                results.failed.push({ clientId, error: error.message });
            }
        });
        
        this.recordBatchOperation('removeProgram', { programId, clientIds, results });
        return results;
    }
    
    /**
     * Compare clients side by side
     */
    compareClients(clientIds) {
        const comparison = {
            clients: [],
            commonPrograms: [],
            uniquePrograms: {},
            filters: {},
            profiles: {}
        };
        
        // Get client data
        clientIds.forEach(clientId => {
            const client = this.clients.get(clientId);
            if (client) {
                comparison.clients.push({
                    id: client.id,
                    name: client.name,
                    programCount: client.selectedPrograms.size,
                    profile: client.profile,
                    filters: client.filters
                });
                
                comparison.uniquePrograms[clientId] = Array.from(client.selectedPrograms);
            }
        });
        
        // Find common programs
        if (comparison.clients.length > 1) {
            const programSets = comparison.clients.map(c => 
                new Set(comparison.uniquePrograms[c.id])
            );
            
            // Intersection of all sets
            comparison.commonPrograms = Array.from(programSets[0]).filter(prog =>
                programSets.every(set => set.has(prog))
            );
            
            // Remove common from unique
            Object.keys(comparison.uniquePrograms).forEach(clientId => {
                comparison.uniquePrograms[clientId] = comparison.uniquePrograms[clientId]
                    .filter(prog => !comparison.commonPrograms.includes(prog));
            });
        }
        
        return comparison;
    }
    
    /**
     * Create client template
     */
    createTemplate(name, clientData) {
        const template = {
            name,
            profile: clientData.profile,
            filters: clientData.filters,
            documentType: clientData.document?.type,
            created: Date.now()
        };
        
        this.templates.set(name, template);
        this.saveTemplates();
        
        return template;
    }
    
    /**
     * Apply template to new client
     */
    applyTemplate(templateName, clientName) {
        const template = this.templates.get(templateName);
        if (!template) throw new Error('Template not found');
        
        const client = this.createClient({
            name: clientName,
            profile: { ...template.profile },
            filters: { ...template.filters },
            documentType: template.documentType
        });
        
        return client;
    }
    
    /**
     * Get all templates
     */
    getTemplates() {
        return Array.from(this.templates.values());
    }
    
    /**
     * Delete template
     */
    deleteTemplate(name) {
        const deleted = this.templates.delete(name);
        if (deleted) {
            this.saveTemplates();
        }
        return deleted;
    }
    
    /**
     * Export client data
     */
    exportClient(clientId) {
        const client = this.clients.get(clientId);
        if (!client) throw new Error('Client not found');
        
        // Convert Set to Array for JSON
        const exportData = {
            ...client,
            selectedPrograms: Array.from(client.selectedPrograms)
        };
        
        return {
            data: exportData,
            json: JSON.stringify(exportData, null, 2)
        };
    }
    
    /**
     * Import client data
     */
    importClient(jsonData) {
        try {
            const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
            
            // Convert Array back to Set
            if (Array.isArray(data.selectedPrograms)) {
                data.selectedPrograms = new Set(data.selectedPrograms);
            }
            
            // Generate new ID to avoid conflicts
            const newId = this.generateClientId();
            data.id = newId;
            data.name = data.name + ' (Imported)';
            
            this.clients.set(newId, data);
            this.saveToStorage();
            
            return this.clients.get(newId);
        } catch (error) {
            throw new Error('Failed to import client: ' + error.message);
        }
    }
    
    /**
     * Batch export all clients
     */
    exportAllClients() {
        const allClients = this.getAllClients().map(client => ({
            ...client,
            selectedPrograms: Array.from(client.selectedPrograms)
        }));
        
        return {
            clients: allClients,
            templates: Array.from(this.templates.entries()),
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
    }
    
    /**
     * Record batch operation
     */
    recordBatchOperation(type, data) {
        this.batchOperations.push({
            type,
            data,
            timestamp: Date.now()
        });
        
        // Keep only last 100 operations
        if (this.batchOperations.length > 100) {
            this.batchOperations = this.batchOperations.slice(-100);
        }
    }
    
    /**
     * Get batch operation history
     */
    getBatchHistory() {
        return this.batchOperations.slice().reverse();
    }
    
    /**
     * Save to localStorage
     */
    saveToStorage() {
        const data = {
            clients: Array.from(this.clients.entries()).map(([id, client]) => [
                id,
                {
                    ...client,
                    selectedPrograms: Array.from(client.selectedPrograms)
                }
            ]),
            activeClientId: this.activeClientId,
            batchOperations: this.batchOperations
        };
        
        localStorage.setItem('careconnect_clients', JSON.stringify(data));
    }
    
    /**
     * Load from localStorage
     */
    loadFromStorage() {
        const stored = localStorage.getItem('careconnect_clients');
        if (!stored) return;
        
        try {
            const data = JSON.parse(stored);
            
            // Restore clients
            this.clients.clear();
            data.clients.forEach(([id, client]) => {
                client.selectedPrograms = new Set(client.selectedPrograms);
                this.clients.set(id, client);
            });
            
            this.activeClientId = data.activeClientId;
            this.batchOperations = data.batchOperations || [];
            
            // Load templates separately
            this.loadTemplates();
        } catch (error) {
            console.error('Failed to load clients:', error);
        }
    }
    
    /**
     * Save templates
     */
    saveTemplates() {
        const data = Array.from(this.templates.entries());
        localStorage.setItem('careconnect_templates', JSON.stringify(data));
    }
    
    /**
     * Load templates
     */
    loadTemplates() {
        const stored = localStorage.getItem('careconnect_templates');
        if (!stored) return;
        
        try {
            const data = JSON.parse(stored);
            this.templates = new Map(data);
        } catch (error) {
            console.error('Failed to load templates:', error);
        }
    }
    
    /**
     * Notify client switch (for UI updates)
     */
    notifyClientSwitch(client) {
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('clientSwitch', { 
                detail: { client } 
            }));
        }
    }
    
    /**
     * Create client switcher UI
     */
    createClientSwitcherUI() {
        const clients = this.getAllClients();
        const activeClient = this.getActiveClient();
        
        let html = `
            <div class="client-switcher" style="
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 8px 12px;
                background: #f9fafb;
                border-radius: 8px;
                border: 1px solid #e5e7eb;
            ">
                <span style="font-size: 14px; color: #6b7280;">Client:</span>
                <select id="clientSelector" style="
                    padding: 6px 10px;
                    border: 1px solid #d1d5db;
                    border-radius: 6px;
                    background: white;
                    font-size: 14px;
                    min-width: 150px;
                " onchange="window.multiClientWorkflow.switchClient(this.value)">
        `;
        
        clients.forEach(client => {
            const programCount = client.selectedPrograms.size;
            html += `
                <option value="${client.id}" ${client.id === activeClient?.id ? 'selected' : ''}>
                    ${client.name} (${programCount} programs)
                </option>
            `;
        });
        
        html += `
                </select>
                <button onclick="window.multiClientWorkflow.showNewClientDialog()" style="
                    padding: 6px 12px;
                    background: #6366f1;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    font-size: 14px;
                    cursor: pointer;
                ">+ New</button>
                <button onclick="window.multiClientWorkflow.showComparisonView()" style="
                    padding: 6px 12px;
                    background: white;
                    color: #6366f1;
                    border: 1px solid #6366f1;
                    border-radius: 6px;
                    font-size: 14px;
                    cursor: pointer;
                ">Compare</button>
            </div>
        `;
        
        return html;
    }
    
    /**
     * Show new client dialog
     */
    showNewClientDialog() {
        // This would show a modal for creating a new client
        const name = prompt('Enter client name (no PHI):');
        if (name) {
            const client = this.createClient({ name });
            this.switchClient(client.id);
            location.reload(); // Refresh to update UI
        }
    }
    
    /**
     * Show comparison view
     */
    showComparisonView() {
        // This would show a modal for comparing clients
        const clients = this.getAllClients();
        if (clients.length < 2) {
            alert('Need at least 2 clients to compare');
            return;
        }
        
        // For now, just compare first two
        const comparison = this.compareClients(clients.slice(0, 2).map(c => c.id));
        console.log('Comparison:', comparison);
        alert('Comparison logged to console');
    }
}

// Export for use in browser
if (typeof window !== 'undefined') {
    window.MultiClientWorkflow = MultiClientWorkflow;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MultiClientWorkflow;
}

