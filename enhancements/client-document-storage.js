/**
 * Client Document Storage Enhancement
 * Adds document storage to client records and document management features
 */

(function() {
    'use strict';
    
    // Wait for dependencies
    function waitForDependencies() {
        if (!window.clientManager || !window.documentGenerator) {
            setTimeout(waitForDependencies, 100);
            return;
        }
        
        enhanceClientStorage();
    }
    
    function enhanceClientStorage() {
        // Extend client schema to include documents
        const originalCreateClient = window.clientManager.createClient;
        window.clientManager.createClient = async function(clientData) {
            // Ensure documents array exists
            clientData.documents = clientData.documents || [];
            return originalCreateClient.call(this, clientData);
        };
        
        // Extend update to handle documents
        const originalUpdateClient = window.clientManager.updateClient;
        window.clientManager.updateClient = async function(clientId, updates) {
            // If documents are being updated, handle special logic
            if (updates.documents) {
                const client = await this.getClient(clientId);
                if (client) {
                    // Merge documents arrays if adding
                    if (updates.$addToDocuments) {
                        updates.documents = [...(client.documents || []), ...updates.$addToDocuments];
                        delete updates.$addToDocuments;
                    }
                }
            }
            
            return originalUpdateClient.call(this, clientId, updates);
        };
        
        // Add method to add document to client
        window.clientManager.addDocument = async function(clientId, document) {
            const client = await this.getClient(clientId);
            if (!client) {
                throw new Error('Client not found');
            }
            
            // Ensure documents array exists
            if (!client.documents) {
                client.documents = [];
            }
            
            // Add document
            client.documents.push({
                ...document,
                addedAt: new Date().toISOString()
            });
            
            // Update client
            await this.updateClient(clientId, { documents: client.documents });
            
            return document;
        };
        
        // Add method to get client documents
        window.clientManager.getClientDocuments = async function(clientId) {
            const client = await this.getClient(clientId);
            return client?.documents || [];
        };
        
        // Override document generator to store with client
        const originalGenerateDocument = window.documentGenerator.generateDocument;
        window.documentGenerator.generateDocument = async function() {
            // Call original
            await originalGenerateDocument.call(this);
            
            // Get the generated document
            const workflow = this.activeWorkflow;
            if (workflow && workflow.client) {
                const lastDocument = this.generatedDocuments[this.generatedDocuments.length - 1];
                if (lastDocument) {
                    // Store with client
                    await window.clientManager.addDocument(workflow.client.id, lastDocument);
                    
                    // Fire event
                    window.dispatchEvent(new CustomEvent('client:documentAdded', {
                        detail: {
                            clientId: workflow.client.id,
                            document: lastDocument
                        }
                    }));
                }
            }
        };
        
        // Override getClientDocuments to use client storage
        window.documentGenerator.getClientDocuments = function(clientId) {
            // First check in-memory storage
            const inMemory = this.generatedDocuments.filter(doc => doc.clientId === clientId);
            
            // Then check client storage (async, so return promise)
            return window.clientManager.getClientDocuments(clientId).then(stored => {
                // Merge and deduplicate by ID
                const allDocs = [...inMemory];
                stored.forEach(doc => {
                    if (!allDocs.find(d => d.id === doc.id)) {
                        allDocs.push(doc);
                    }
                });
                
                // Sort by date (newest first)
                allDocs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                
                return allDocs;
            }).catch(() => inMemory); // Fallback to in-memory if error
        };
        
        // Add document vault functionality
        window.documentVault = {
            async getAllDocuments() {
                const clients = await window.clientManager.getAllClients();
                const allDocuments = [];
                
                for (const client of clients) {
                    const documents = await window.clientManager.getClientDocuments(client.id);
                    documents.forEach(doc => {
                        allDocuments.push({
                            ...doc,
                            clientInitials: client.initials,
                            clientHouse: client.houseId,
                            clientStatus: client.status
                        });
                    });
                }
                
                // Sort by date (newest first)
                allDocuments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                
                return allDocuments;
            },
            
            async searchDocuments(searchTerm) {
                const allDocs = await this.getAllDocuments();
                const term = searchTerm.toLowerCase();
                
                return allDocs.filter(doc => 
                    doc.name.toLowerCase().includes(term) ||
                    doc.clientInitials.toLowerCase().includes(term) ||
                    doc.type.toLowerCase().includes(term) ||
                    (doc.clientHouse && doc.clientHouse.toLowerCase().includes(term))
                );
            },
            
            async getDocumentsByType(type) {
                const allDocs = await this.getAllDocuments();
                return allDocs.filter(doc => doc.type === type);
            },
            
            async getDocumentsByDateRange(startDate, endDate) {
                const allDocs = await this.getAllDocuments();
                const start = new Date(startDate);
                const end = new Date(endDate);
                
                return allDocs.filter(doc => {
                    const docDate = new Date(doc.createdAt);
                    return docDate >= start && docDate <= end;
                });
            },
            
            showVault() {
                window.showModal({
                    title: '🗃️ Document Vault',
                    content: '<div id="documentVaultContent">Loading...</div>',
                    size: 'large',
                    buttons: [
                        {
                            text: 'Export All',
                            action: () => this.exportAll()
                        },
                        {
                            text: 'Close',
                            primary: true,
                            action: () => window.closeModal()
                        }
                    ]
                });
                
                // Load vault content
                this.loadVaultContent();
            },
            
            async loadVaultContent() {
                const contentEl = document.getElementById('documentVaultContent');
                if (!contentEl) return;
                
                try {
                    const documents = await this.getAllDocuments();
                    
                    contentEl.innerHTML = `
                        <div class="vault-header">
                            <div class="vault-stats">
                                <span class="stat-item">📄 ${documents.length} Total Documents</span>
                            </div>
                            <div class="vault-search">
                                <input type="text" id="vaultSearch" placeholder="Search documents..." class="vault-search-input">
                                <select id="vaultTypeFilter" class="vault-filter">
                                    <option value="">All Types</option>
                                    <option value="aftercare-options">Aftercare Options</option>
                                    <option value="aftercare-plan">Aftercare Plan</option>
                                    <option value="discharge-packet">Discharge Packet</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="vault-documents" id="vaultDocumentsList">
                            ${documents.length > 0 ? documents.map(doc => `
                                <div class="vault-doc-item">
                                    <div class="vault-doc-icon">${window.documentGenerator.documentTypes[doc.type]?.icon || '📄'}</div>
                                    <div class="vault-doc-info">
                                        <div class="vault-doc-name">${doc.name}</div>
                                        <div class="vault-doc-meta">
                                            <span class="meta-item">👤 ${doc.clientInitials}</span>
                                            <span class="meta-item">🏠 ${doc.clientHouse || 'No House'}</span>
                                            <span class="meta-item">📅 ${window.formatDate(doc.createdAt)}</span>
                                            <span class="meta-item">✍️ ${doc.createdBy}</span>
                                        </div>
                                    </div>
                                    <div class="vault-doc-actions">
                                        <button class="btn btn-sm" onclick="window.documentGenerator.viewDocument('${doc.id}')">View</button>
                                        <button class="btn btn-sm" onclick="window.documentGenerator.printDocument('${doc.id}')">Print</button>
                                    </div>
                                </div>
                            `).join('') : '<p class="vault-empty">No documents in vault</p>'}
                        </div>
                    `;
                    
                    // Add search functionality
                    const searchInput = document.getElementById('vaultSearch');
                    const typeFilter = document.getElementById('vaultTypeFilter');
                    
                    const filterDocuments = async () => {
                        const searchTerm = searchInput.value;
                        const typeValue = typeFilter.value;
                        
                        let filtered = documents;
                        
                        if (searchTerm) {
                            filtered = await this.searchDocuments(searchTerm);
                        }
                        
                        if (typeValue) {
                            filtered = filtered.filter(doc => doc.type === typeValue);
                        }
                        
                        // Update list
                        const listEl = document.getElementById('vaultDocumentsList');
                        if (filtered.length > 0) {
                            listEl.innerHTML = filtered.map(doc => `
                                <div class="vault-doc-item">
                                    <div class="vault-doc-icon">${window.documentGenerator.documentTypes[doc.type]?.icon || '📄'}</div>
                                    <div class="vault-doc-info">
                                        <div class="vault-doc-name">${doc.name}</div>
                                        <div class="vault-doc-meta">
                                            <span class="meta-item">👤 ${doc.clientInitials}</span>
                                            <span class="meta-item">🏠 ${doc.clientHouse || 'No House'}</span>
                                            <span class="meta-item">📅 ${window.formatDate(doc.createdAt)}</span>
                                            <span class="meta-item">✍️ ${doc.createdBy}</span>
                                        </div>
                                    </div>
                                    <div class="vault-doc-actions">
                                        <button class="btn btn-sm" onclick="window.documentGenerator.viewDocument('${doc.id}')">View</button>
                                        <button class="btn btn-sm" onclick="window.documentGenerator.printDocument('${doc.id}')">Print</button>
                                    </div>
                                </div>
                            `).join('');
                        } else {
                            listEl.innerHTML = '<p class="vault-empty">No documents match your search</p>';
                        }
                    };
                    
                    searchInput.addEventListener('input', window.debounce(filterDocuments, 300));
                    typeFilter.addEventListener('change', filterDocuments);
                    
                } catch (error) {
                    console.error('Error loading vault:', error);
                    contentEl.innerHTML = '<p class="vault-error">Error loading documents</p>';
                }
            },
            
            async exportAll() {
                try {
                    const documents = await this.getAllDocuments();
                    
                    let csv = 'Document Name,Type,Client,House,Created Date,Created By\n';
                    
                    documents.forEach(doc => {
                        csv += `"${doc.name}","${doc.type}","${doc.clientInitials}",`;
                        csv += `"${doc.clientHouse || ''}","${window.formatDate(doc.createdAt)}","${doc.createdBy}"\n`;
                    });
                    
                    // Download CSV
                    const blob = new Blob([csv], { type: 'text/csv' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `document-vault-${new Date().toISOString().split('T')[0]}.csv`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    
                    window.showNotification('Document vault exported successfully', 'success');
                    
                } catch (error) {
                    console.error('Export error:', error);
                    window.showNotification('Failed to export document vault', 'error');
                }
            }
        };
        
        // Add styles
        if (!document.querySelector('#client-document-storage-styles')) {
            const styles = document.createElement('style');
            styles.id = 'client-document-storage-styles';
            styles.textContent = `
                /* Document Vault Styles */
                .vault-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    padding-bottom: 16px;
                    border-bottom: 2px solid #e5e7eb;
                }
                
                .vault-stats {
                    display: flex;
                    gap: 20px;
                }
                
                .stat-item {
                    font-size: 16px;
                    font-weight: 500;
                    color: #374151;
                }
                
                .vault-search {
                    display: flex;
                    gap: 12px;
                }
                
                .vault-search-input {
                    width: 250px;
                    padding: 8px 12px;
                    border: 1px solid #d1d5db;
                    border-radius: 6px;
                    font-size: 14px;
                }
                
                .vault-filter {
                    padding: 8px 12px;
                    border: 1px solid #d1d5db;
                    border-radius: 6px;
                    font-size: 14px;
                    background: white;
                }
                
                .vault-documents {
                    max-height: 500px;
                    overflow-y: auto;
                }
                
                .vault-doc-item {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    padding: 16px;
                    background: white;
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    margin-bottom: 8px;
                    transition: all 0.2s;
                }
                
                .vault-doc-item:hover {
                    background: #f9fafb;
                    border-color: #d1d5db;
                    transform: translateY(-1px);
                    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                }
                
                .vault-doc-icon {
                    font-size: 32px;
                    flex-shrink: 0;
                }
                
                .vault-doc-info {
                    flex: 1;
                }
                
                .vault-doc-name {
                    font-weight: 600;
                    font-size: 16px;
                    color: #1f2937;
                    margin-bottom: 4px;
                }
                
                .vault-doc-meta {
                    display: flex;
                    gap: 16px;
                    font-size: 13px;
                    color: #6b7280;
                }
                
                .meta-item {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }
                
                .vault-doc-actions {
                    display: flex;
                    gap: 8px;
                }
                
                .vault-empty {
                    text-align: center;
                    color: #6b7280;
                    font-style: italic;
                    padding: 40px;
                }
                
                .vault-error {
                    text-align: center;
                    color: #ef4444;
                    padding: 40px;
                }
            `;
            document.head.appendChild(styles);
        }
        
        console.log('✅ Client document storage enhanced');
    }
    
    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', waitForDependencies);
    } else {
        waitForDependencies();
    }
})();



