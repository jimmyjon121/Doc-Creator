/**
 * Discharged Clients View
 * Archive browser for viewing past clients with search and filtering
 * @file discharged-clients-view.js
 */

(function() {
    'use strict';

    // ============================================================================
    // DISCHARGED CLIENTS VIEW CLASS
    // ============================================================================

    class DischargedClientsView {
        constructor() {
            this.container = null;
            this.clients = [];
            this.filteredClients = [];
            this.currentPage = 1;
            this.pageSize = 20;
            
            this.filters = {
                dateRange: { start: null, end: null },
                outcomeType: 'all', // 'all' | 'program' | 'home-with-supports' | 'clinician-recommended' | 'ama'
                house: 'all',
                searchQuery: ''
            };
            
            this.sortBy = 'dischargeDate';
            this.sortOrder = 'desc';
        }

        // ========================================================================
        // INITIALIZATION
        // ========================================================================

        /**
         * Initialize the view with a container element
         * @param {HTMLElement|string} container - Container element or selector
         */
        async init(container) {
            if (typeof container === 'string') {
                this.container = document.querySelector(container);
            } else {
                this.container = container;
            }
            
            if (!this.container) {
                console.error('DischargedClientsView: Container not found');
                return;
            }
            
            // Load clients
            await this.loadClients();
            
            // Render the view
            this.render();
            
            console.log('✅ Discharged Clients View initialized');
        }

        /**
         * Load discharged clients from ClientManager
         */
        async loadClients() {
            try {
                if (window.clientManager) {
                    this.clients = await window.clientManager.getDischargedClients();
                } else {
                    this.clients = [];
                }
                this.applyFilters();
            } catch (error) {
                console.error('Failed to load discharged clients:', error);
                this.clients = [];
                this.filteredClients = [];
            }
        }

        // ========================================================================
        // FILTERING & SORTING
        // ========================================================================

        /**
         * Apply current filters to the client list
         */
        applyFilters() {
            let filtered = [...this.clients];
            
            // Search filter
            if (this.filters.searchQuery) {
                const query = this.filters.searchQuery.toLowerCase();
                filtered = filtered.filter(client => 
                    client.initials?.toLowerCase().includes(query) ||
                    client.kipuId?.toLowerCase().includes(query)
                );
            }
            
            // Date range filter
            if (this.filters.dateRange.start) {
                const startDate = new Date(this.filters.dateRange.start);
                filtered = filtered.filter(client => 
                    client.dischargeDate && new Date(client.dischargeDate) >= startDate
                );
            }
            if (this.filters.dateRange.end) {
                const endDate = new Date(this.filters.dateRange.end);
                endDate.setHours(23, 59, 59, 999);
                filtered = filtered.filter(client => 
                    client.dischargeDate && new Date(client.dischargeDate) <= endDate
                );
            }
            
            // Outcome type filter
            if (this.filters.outcomeType !== 'all') {
                filtered = filtered.filter(client => 
                    client.dischargeOutcome?.outcomeType === this.filters.outcomeType
                );
            }
            
            // House filter
            if (this.filters.house !== 'all') {
                filtered = filtered.filter(client => 
                    client.houseId === this.filters.house || client.house === this.filters.house
                );
            }
            
            // Apply sorting
            filtered.sort((a, b) => {
                let aVal, bVal;
                
                switch (this.sortBy) {
                    case 'dischargeDate':
                        aVal = new Date(a.dischargeDate || 0);
                        bVal = new Date(b.dischargeDate || 0);
                        break;
                    case 'admissionDate':
                        aVal = new Date(a.admissionDate || 0);
                        bVal = new Date(b.admissionDate || 0);
                        break;
                    case 'initials':
                        aVal = a.initials || '';
                        bVal = b.initials || '';
                        break;
                    case 'los':
                        aVal = this.calculateLOS(a);
                        bVal = this.calculateLOS(b);
                        break;
                    default:
                        aVal = a[this.sortBy] || '';
                        bVal = b[this.sortBy] || '';
                }
                
                if (typeof aVal === 'string') {
                    return this.sortOrder === 'asc' 
                        ? aVal.localeCompare(bVal) 
                        : bVal.localeCompare(aVal);
                }
                
                return this.sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
            });
            
            this.filteredClients = filtered;
            this.currentPage = 1;
        }

        /**
         * Calculate length of stay in days
         */
        calculateLOS(client) {
            if (!client.admissionDate || !client.dischargeDate) return 0;
            const admission = new Date(client.admissionDate);
            const discharge = new Date(client.dischargeDate);
            return Math.round((discharge - admission) / (1000 * 60 * 60 * 24));
        }

        // ========================================================================
        // RENDERING
        // ========================================================================

        /**
         * Render the complete view
         */
        render() {
            if (!this.container) return;
            
            this.container.innerHTML = `
                <div class="dcv-container">
                    ${this.renderHeader()}
                    ${this.renderFilters()}
                    ${this.renderTable()}
                    ${this.renderPagination()}
                </div>
            `;
            
            this.bindEvents();
        }

        renderHeader() {
            return `
                <div class="dcv-header">
                    <div class="dcv-header__title">
                        <span class="dcv-header__icon">📁</span>
                        <h2>Discharged Clients Archive</h2>
                    </div>
                    <div class="dcv-header__stats">
                        <span class="dcv-stat">
                            <span class="dcv-stat__value">${this.filteredClients.length}</span>
                            <span class="dcv-stat__label">Total Records</span>
                        </span>
                    </div>
                </div>
            `;
        }

        renderFilters() {
            const houses = this.getUniqueHouses();
            
            return `
                <div class="dcv-filters">
                    <div class="dcv-search">
                        <span class="dcv-search__icon">🔍</span>
                        <input type="text" 
                            class="dcv-search__input" 
                            id="dcvSearch"
                            placeholder="Search by initials or Kipu ID..."
                            value="${this.filters.searchQuery}">
                    </div>
                    
                    <div class="dcv-filter-group">
                        <label class="dcv-filter-label">Date Range</label>
                        <div class="dcv-date-range">
                            <input type="date" 
                                class="dcv-date-input" 
                                id="dcvDateStart"
                                value="${this.filters.dateRange.start || ''}">
                            <span>to</span>
                            <input type="date" 
                                class="dcv-date-input" 
                                id="dcvDateEnd"
                                value="${this.filters.dateRange.end || ''}">
                        </div>
                    </div>
                    
                    <div class="dcv-filter-group">
                        <label class="dcv-filter-label">Outcome</label>
                        <select class="dcv-select" id="dcvOutcome">
                            <option value="all" ${this.filters.outcomeType === 'all' ? 'selected' : ''}>All Outcomes</option>
                            <option value="program" ${this.filters.outcomeType === 'program' ? 'selected' : ''}>Program Placement</option>
                            <option value="home-with-supports" ${this.filters.outcomeType === 'home-with-supports' ? 'selected' : ''}>Home with Supports</option>
                            <option value="clinician-recommended" ${this.filters.outcomeType === 'clinician-recommended' ? 'selected' : ''}>Clinician Recommended</option>
                            <option value="ama" ${this.filters.outcomeType === 'ama' ? 'selected' : ''}>AMA / No Plan</option>
                        </select>
                    </div>
                    
                    <div class="dcv-filter-group">
                        <label class="dcv-filter-label">House</label>
                        <select class="dcv-select" id="dcvHouse">
                            <option value="all" ${this.filters.house === 'all' ? 'selected' : ''}>All Houses</option>
                            ${houses.map(h => `
                                <option value="${h.id}" ${this.filters.house === h.id ? 'selected' : ''}>${h.name}</option>
                            `).join('')}
                        </select>
                    </div>
                    
                    <button class="dcv-btn dcv-btn--secondary" onclick="window.dischargedClientsView.clearFilters()">
                        Clear Filters
                    </button>
                    
                    <button class="dcv-btn dcv-btn--primary" onclick="window.dischargedClientsView.exportCSV()">
                        📥 Export CSV
                    </button>
                </div>
            `;
        }

        renderTable() {
            const start = (this.currentPage - 1) * this.pageSize;
            const end = start + this.pageSize;
            const pageClients = this.filteredClients.slice(start, end);
            
            if (pageClients.length === 0) {
                return `
                    <div class="dcv-empty">
                        <span class="dcv-empty__icon">📭</span>
                        <p>No discharged clients found matching your filters.</p>
                    </div>
                `;
            }
            
            return `
                <div class="dcv-table-wrapper">
                    <table class="dcv-table">
                        <thead>
                            <tr>
                                <th class="dcv-th dcv-th--sortable" onclick="window.dischargedClientsView.sort('initials')">
                                    Initials ${this.getSortIcon('initials')}
                                </th>
                                <th class="dcv-th">Kipu ID</th>
                                <th class="dcv-th dcv-th--sortable" onclick="window.dischargedClientsView.sort('admissionDate')">
                                    Admitted ${this.getSortIcon('admissionDate')}
                                </th>
                                <th class="dcv-th dcv-th--sortable" onclick="window.dischargedClientsView.sort('dischargeDate')">
                                    Discharged ${this.getSortIcon('dischargeDate')}
                                </th>
                                <th class="dcv-th dcv-th--sortable" onclick="window.dischargedClientsView.sort('los')">
                                    LOS ${this.getSortIcon('los')}
                                </th>
                                <th class="dcv-th">House</th>
                                <th class="dcv-th">Outcome</th>
                                <th class="dcv-th">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${pageClients.map(client => this.renderTableRow(client)).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }

        renderTableRow(client) {
            const los = this.calculateLOS(client);
            const outcome = this.getOutcomeDisplay(client);
            const houseName = this.getHouseName(client.houseId || client.house);
            
            return `
                <tr class="dcv-tr">
                    <td class="dcv-td dcv-td--initials">${client.initials || '--'}</td>
                    <td class="dcv-td">${client.kipuId || '--'}</td>
                    <td class="dcv-td">${this.formatDate(client.admissionDate)}</td>
                    <td class="dcv-td">${this.formatDate(client.dischargeDate)}</td>
                    <td class="dcv-td">${los}d</td>
                    <td class="dcv-td">${houseName}</td>
                    <td class="dcv-td">
                        <span class="dcv-outcome dcv-outcome--${outcome.type}">
                            ${outcome.icon} ${outcome.label}
                        </span>
                    </td>
                    <td class="dcv-td">
                        <button class="dcv-action-btn" onclick="window.dischargedClientsView.viewClient('${client.id}')" title="View Profile">
                            👁
                        </button>
                    </td>
                </tr>
            `;
        }

        renderPagination() {
            const totalPages = Math.ceil(this.filteredClients.length / this.pageSize);
            
            if (totalPages <= 1) return '';
            
            return `
                <div class="dcv-pagination">
                    <button class="dcv-page-btn" 
                        onclick="window.dischargedClientsView.goToPage(${this.currentPage - 1})"
                        ${this.currentPage === 1 ? 'disabled' : ''}>
                        ← Previous
                    </button>
                    <span class="dcv-page-info">
                        Page ${this.currentPage} of ${totalPages}
                    </span>
                    <button class="dcv-page-btn" 
                        onclick="window.dischargedClientsView.goToPage(${this.currentPage + 1})"
                        ${this.currentPage === totalPages ? 'disabled' : ''}>
                        Next →
                    </button>
                </div>
            `;
        }

        // ========================================================================
        // HELPERS
        // ========================================================================

        getUniqueHouses() {
            const houseMap = new Map();
            
            // Add default houses
            const defaultHouses = [
                { id: 'house_nest', name: 'NEST' },
                { id: 'house_cove', name: 'Cove' },
                { id: 'house_hedge', name: 'Hedge' },
                { id: 'house_meridian', name: 'Meridian' },
                { id: 'house_banyan', name: 'Banyan' },
                { id: 'house_preserve', name: 'Preserve' },
                { id: 'house_prosperity', name: 'Prosperity' }
            ];
            
            defaultHouses.forEach(h => houseMap.set(h.id, h));
            
            // Add any houses from client data
            this.clients.forEach(client => {
                const houseId = client.houseId || client.house;
                if (houseId && !houseMap.has(houseId)) {
                    houseMap.set(houseId, { id: houseId, name: this.getHouseName(houseId) });
                }
            });
            
            return Array.from(houseMap.values());
        }

        getHouseName(houseId) {
            const map = {
                'house_nest': 'NEST',
                'house_cove': 'Cove',
                'house_hedge': 'Hedge',
                'house_meridian': 'Meridian',
                'house_banyan': 'Banyan',
                'house_preserve': 'Preserve',
                'house_prosperity': 'Prosperity'
            };
            return map[houseId] || houseId || 'Unknown';
        }

        getOutcomeDisplay(client) {
            const outcomeType = client.dischargeOutcome?.outcomeType;
            
            switch (outcomeType) {
                case 'program':
                    return { 
                        type: 'success', 
                        icon: '✓', 
                        label: client.dischargeOutcome?.primaryPlacement?.programType || 'Program' 
                    };
                case 'home-with-supports':
                    return { type: 'success', icon: '✓', label: 'Home' };
                case 'clinician-recommended':
                    return { type: 'warning', icon: '⚠️', label: 'Clin. Rec' };
                case 'ama':
                case 'family-override':
                    return { type: 'danger', icon: '❌', label: 'AMA' };
                default:
                    return { type: 'unknown', icon: '?', label: 'Unknown' };
            }
        }

        formatDate(dateStr) {
            if (!dateStr) return '--';
            const date = new Date(dateStr);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
        }

        getSortIcon(column) {
            if (this.sortBy !== column) return '';
            return this.sortOrder === 'asc' ? '↑' : '↓';
        }

        // ========================================================================
        // ACTIONS
        // ========================================================================

        sort(column) {
            if (this.sortBy === column) {
                this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
            } else {
                this.sortBy = column;
                this.sortOrder = 'desc';
            }
            this.applyFilters();
            this.render();
        }

        goToPage(page) {
            const totalPages = Math.ceil(this.filteredClients.length / this.pageSize);
            if (page < 1 || page > totalPages) return;
            this.currentPage = page;
            this.render();
        }

        clearFilters() {
            this.filters = {
                dateRange: { start: null, end: null },
                outcomeType: 'all',
                house: 'all',
                searchQuery: ''
            };
            this.applyFilters();
            this.render();
        }

        viewClient(clientId) {
            // Open in read-only mode
            if (window.clientProfileManager) {
                window.clientProfileManager.open(clientId, 'tracking', { readOnly: true });
            } else if (window.viewClientDetails) {
                window.viewClientDetails(clientId);
            } else {
                alert('Client profile viewer not available');
            }
        }

        async exportCSV() {
            const headers = ['Initials', 'Kipu ID', 'Admitted', 'Discharged', 'LOS (days)', 'House', 'Outcome', 'Outcome Type'];
            
            const rows = this.filteredClients.map(client => {
                const outcome = this.getOutcomeDisplay(client);
                return [
                    client.initials || '',
                    client.kipuId || '',
                    this.formatDate(client.admissionDate),
                    this.formatDate(client.dischargeDate),
                    this.calculateLOS(client),
                    this.getHouseName(client.houseId || client.house),
                    outcome.label,
                    client.dischargeOutcome?.outcomeType || 'unknown'
                ];
            });
            
            const csv = [headers, ...rows]
                .map(row => row.map(cell => `"${cell}"`).join(','))
                .join('\n');
            
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `discharged-clients-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        }

        // ========================================================================
        // EVENT BINDING
        // ========================================================================

        bindEvents() {
            // Search input
            const searchInput = document.getElementById('dcvSearch');
            if (searchInput) {
                searchInput.addEventListener('input', (e) => {
                    this.filters.searchQuery = e.target.value;
                    this.applyFilters();
                    this.render();
                });
            }
            
            // Date range
            const dateStart = document.getElementById('dcvDateStart');
            const dateEnd = document.getElementById('dcvDateEnd');
            if (dateStart) {
                dateStart.addEventListener('change', (e) => {
                    this.filters.dateRange.start = e.target.value || null;
                    this.applyFilters();
                    this.render();
                });
            }
            if (dateEnd) {
                dateEnd.addEventListener('change', (e) => {
                    this.filters.dateRange.end = e.target.value || null;
                    this.applyFilters();
                    this.render();
                });
            }
            
            // Outcome filter
            const outcomeSelect = document.getElementById('dcvOutcome');
            if (outcomeSelect) {
                outcomeSelect.addEventListener('change', (e) => {
                    this.filters.outcomeType = e.target.value;
                    this.applyFilters();
                    this.render();
                });
            }
            
            // House filter
            const houseSelect = document.getElementById('dcvHouse');
            if (houseSelect) {
                houseSelect.addEventListener('change', (e) => {
                    this.filters.house = e.target.value;
                    this.applyFilters();
                    this.render();
                });
            }
        }
    }

    // ============================================================================
    // STYLES
    // ============================================================================

    function injectStyles() {
        if (document.getElementById('dcv-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'dcv-styles';
        style.textContent = `
            .dcv-container {
                padding: 1.5rem;
                max-width: 1400px;
                margin: 0 auto;
            }
            
            .dcv-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1.5rem;
            }
            
            .dcv-header__title {
                display: flex;
                align-items: center;
                gap: 0.75rem;
            }
            
            .dcv-header__title h2 {
                margin: 0;
                font-size: 1.5rem;
                font-weight: 600;
                color: #f1f5f9;
            }
            
            .dcv-header__icon {
                font-size: 1.75rem;
            }
            
            .dcv-stat {
                display: flex;
                flex-direction: column;
                align-items: flex-end;
            }
            
            .dcv-stat__value {
                font-size: 1.5rem;
                font-weight: 700;
                color: #6366f1;
            }
            
            .dcv-stat__label {
                font-size: 0.8rem;
                color: #94a3b8;
            }
            
            .dcv-filters {
                display: flex;
                flex-wrap: wrap;
                gap: 1rem;
                align-items: flex-end;
                margin-bottom: 1.5rem;
                padding: 1rem;
                background: #1e293b;
                border-radius: 12px;
                border: 1px solid #334155;
            }
            
            .dcv-search {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                flex: 1;
                min-width: 200px;
            }
            
            .dcv-search__icon {
                color: #64748b;
            }
            
            .dcv-search__input {
                flex: 1;
                padding: 0.6rem 1rem;
                background: #0f172a;
                border: 1px solid #334155;
                border-radius: 8px;
                color: #f1f5f9;
                font-size: 0.9rem;
            }
            
            .dcv-search__input:focus {
                outline: none;
                border-color: #6366f1;
            }
            
            .dcv-filter-group {
                display: flex;
                flex-direction: column;
                gap: 0.25rem;
            }
            
            .dcv-filter-label {
                font-size: 0.75rem;
                color: #94a3b8;
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }
            
            .dcv-date-range {
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            
            .dcv-date-input, .dcv-select {
                padding: 0.6rem 0.75rem;
                background: #0f172a;
                border: 1px solid #334155;
                border-radius: 8px;
                color: #f1f5f9;
                font-size: 0.85rem;
            }
            
            .dcv-date-input:focus, .dcv-select:focus {
                outline: none;
                border-color: #6366f1;
            }
            
            .dcv-btn {
                padding: 0.6rem 1rem;
                border-radius: 8px;
                font-size: 0.85rem;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s;
                border: none;
            }
            
            .dcv-btn--primary {
                background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
                color: white;
            }
            
            .dcv-btn--primary:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
            }
            
            .dcv-btn--secondary {
                background: #334155;
                color: #e2e8f0;
            }
            
            .dcv-btn--secondary:hover {
                background: #475569;
            }
            
            .dcv-table-wrapper {
                overflow-x: auto;
                border-radius: 12px;
                border: 1px solid #334155;
            }
            
            .dcv-table {
                width: 100%;
                border-collapse: collapse;
                background: #1e293b;
            }
            
            .dcv-th {
                padding: 1rem;
                text-align: left;
                font-size: 0.75rem;
                font-weight: 600;
                color: #94a3b8;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                background: #0f172a;
                border-bottom: 1px solid #334155;
            }
            
            .dcv-th--sortable {
                cursor: pointer;
                user-select: none;
            }
            
            .dcv-th--sortable:hover {
                color: #f1f5f9;
            }
            
            .dcv-tr {
                border-bottom: 1px solid #334155;
                transition: background 0.2s;
            }
            
            .dcv-tr:hover {
                background: rgba(99, 102, 241, 0.05);
            }
            
            .dcv-td {
                padding: 1rem;
                color: #e2e8f0;
                font-size: 0.9rem;
            }
            
            .dcv-td--initials {
                font-weight: 600;
                color: #f1f5f9;
            }
            
            .dcv-outcome {
                display: inline-flex;
                align-items: center;
                gap: 0.35rem;
                padding: 0.25rem 0.6rem;
                border-radius: 6px;
                font-size: 0.8rem;
                font-weight: 500;
            }
            
            .dcv-outcome--success {
                background: rgba(34, 197, 94, 0.15);
                color: #86efac;
            }
            
            .dcv-outcome--warning {
                background: rgba(245, 158, 11, 0.15);
                color: #fcd34d;
            }
            
            .dcv-outcome--danger {
                background: rgba(239, 68, 68, 0.15);
                color: #fca5a5;
            }
            
            .dcv-outcome--unknown {
                background: rgba(100, 116, 139, 0.15);
                color: #94a3b8;
            }
            
            .dcv-action-btn {
                background: none;
                border: none;
                cursor: pointer;
                font-size: 1.1rem;
                padding: 0.25rem;
                border-radius: 4px;
                transition: background 0.2s;
            }
            
            .dcv-action-btn:hover {
                background: rgba(99, 102, 241, 0.2);
            }
            
            .dcv-pagination {
                display: flex;
                justify-content: center;
                align-items: center;
                gap: 1rem;
                padding: 1rem;
            }
            
            .dcv-page-btn {
                padding: 0.5rem 1rem;
                background: #334155;
                border: none;
                border-radius: 6px;
                color: #e2e8f0;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .dcv-page-btn:hover:not(:disabled) {
                background: #475569;
            }
            
            .dcv-page-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
            
            .dcv-page-info {
                color: #94a3b8;
                font-size: 0.9rem;
            }
            
            .dcv-empty {
                text-align: center;
                padding: 3rem;
                color: #64748b;
            }
            
            .dcv-empty__icon {
                font-size: 3rem;
                display: block;
                margin-bottom: 1rem;
            }
        `;
        document.head.appendChild(style);
    }

    // ============================================================================
    // INITIALIZATION
    // ============================================================================

    // Inject styles on load
    injectStyles();

    // Create global instance
    window.dischargedClientsView = new DischargedClientsView();
    window.DischargedClientsView = DischargedClientsView;

    // ============================================================================
    // VIEW SWITCHING FUNCTIONS (Global)
    // ============================================================================
    
    /**
     * Show active clients view
     */
    window.showActiveClientsView = function() {
        const activeView = document.getElementById('activeClientsView');
        const dischargedView = document.getElementById('dischargedClientsView');
        const activeTab = document.getElementById('activeClientsTab');
        const dischargedTab = document.getElementById('dischargedClientsTab');
        
        if (activeView) activeView.style.display = 'block';
        if (dischargedView) dischargedView.style.display = 'none';
        
        if (activeTab) {
            activeTab.classList.add('clients-view-tab--active');
        }
        if (dischargedTab) {
            dischargedTab.classList.remove('clients-view-tab--active');
        }
    };
    
    /**
     * Show discharged clients view
     */
    window.showDischargedClientsView = async function() {
        const activeView = document.getElementById('activeClientsView');
        const dischargedView = document.getElementById('dischargedClientsView');
        const activeTab = document.getElementById('activeClientsTab');
        const dischargedTab = document.getElementById('dischargedClientsTab');
        
        if (activeView) activeView.style.display = 'none';
        if (dischargedView) dischargedView.style.display = 'block';
        
        if (activeTab) {
            activeTab.classList.remove('clients-view-tab--active');
        }
        if (dischargedTab) {
            dischargedTab.classList.add('clients-view-tab--active');
        }
        
        // Initialize the discharged view if not already done
        if (window.dischargedClientsView && dischargedView) {
            await window.dischargedClientsView.init(dischargedView);
        }
    };
    
    /**
     * Update client counts in tabs
     */
    window.updateClientCounts = async function() {
        try {
            if (window.clientManager) {
                const activeClients = await window.clientManager.getActiveClients();
                const dischargedClients = await window.clientManager.getDischargedClients();
                
                const activeCount = document.getElementById('activeClientCount');
                const dischargedCount = document.getElementById('dischargedClientCount');
                
                if (activeCount) activeCount.textContent = activeClients.length;
                if (dischargedCount) dischargedCount.textContent = dischargedClients.length;
            }
        } catch (error) {
            console.error('Failed to update client counts:', error);
        }
    };
    
    // Update counts when page loads
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(window.updateClientCounts, 2000);
    });

    console.log('✅ Discharged Clients View loaded');

})();

