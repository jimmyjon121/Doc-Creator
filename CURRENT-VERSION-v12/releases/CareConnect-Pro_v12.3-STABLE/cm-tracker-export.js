/**
 * CM Tracker Export Module
 * Exports client data matching exact Google Sheets column structure
 */

class CMTrackerExport {
    constructor() {
        // Define exact column mapping matching Google Sheets
        this.columnMap = {
            'A': { field: 'initials', header: 'Name' },
            'B': { field: 'dischargeDate', header: 'D/C' },
            'C': { field: 'needs_assessment', header: 'Needs Assessment' },
            'D': { field: 'health_physical', header: 'Health & Physical' },
            'E': { field: 'aftercare_thread', header: 'Aftercare Thread Sent' },
            'F': { field: 'gad_assessment', header: 'GAD' },
            'G': { field: 'phq_assessment', header: 'PHQ' },
            'H': { field: 'satisfaction_survey', header: 'Sat Survey' },
            'I': { field: 'referral_closure', header: 'Referral Closure' },
            'J': { field: 'options_doc', header: 'Options Doc Uploaded' },
            'K': { field: 'discharge_packet', header: 'Discharge Packet Uploaded' },
            'L': { field: 'discharge_summary', header: 'Discharge Summary' },
            'M': { field: 'final_planning_note', header: 'Final Planning Note' },
            'N': { field: 'discharge_asam', header: 'Discharge ASAM' },
            'O': { field: 'caseManager', header: 'Case Manager' },
            'P': { field: 'primaryFamilyAmbassador', header: 'Primary Family Ambassador' },
            'Q': { field: 'secondaryFamilyAmbassador', header: '2nd Family Ambassador' },
            'R': { field: 'dateOptionsProvided', header: 'Date Options Provided' },
            // Aftercare options (7 sets)
            'S': { field: 'aftercare1_program', header: 'Aftercare Option 1' },
            'T': { field: 'aftercare1_status', header: 'Status 1' },
            'U': { field: 'aftercare2_program', header: 'Aftercare Option 2' },
            'V': { field: 'aftercare2_status', header: 'Status 2' },
            'W': { field: 'aftercare3_program', header: 'Aftercare Option 3' },
            'X': { field: 'aftercare3_status', header: 'Status 3' },
            'Y': { field: 'aftercare4_program', header: 'Aftercare Option 4' },
            'Z': { field: 'aftercare4_status', header: 'Status 4' },
            'AA': { field: 'aftercare5_program', header: 'Aftercare Option 5' },
            'AB': { field: 'aftercare5_status', header: 'Status 5' },
            'AC': { field: 'aftercare6_program', header: 'Aftercare Option 6' },
            'AD': { field: 'aftercare6_status', header: 'Status 6' },
            'AE': { field: 'aftercare7_program', header: 'Aftercare Option 7' },
            'AF': { field: 'aftercare7_status', header: 'Status 7' }
        };
    }

    /**
     * Export clients data to CSV format
     */
    async exportToCSV(options = {}) {
        try {
            const {
                houseId = null,
                includeArchived = false,
                startDate = null,
                endDate = null
            } = options;

            // Get clients based on filters
            let clients = await this.getClientsForExport(houseId, includeArchived);
            
            // Apply date filters if provided
            if (startDate || endDate) {
                clients = this.filterByDateRange(clients, startDate, endDate);
            }

            // Sort clients by house and then by admission date
            clients.sort((a, b) => {
                if (a.houseId !== b.houseId) {
                    return a.houseId.localeCompare(b.houseId);
                }
                return new Date(a.admissionDate) - new Date(b.admissionDate);
            });

            // Generate CSV rows
            const rows = await this.generateCSVRows(clients);
            
            // Create CSV content
            const csvContent = this.createCSVContent(rows);
            
            // Download the file
            this.downloadCSV(csvContent, this.generateFilename(options));
            
            return { success: true, rowCount: rows.length };

        } catch (error) {
            console.error('Export failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get clients for export based on filters
     */
    async getClientsForExport(houseId, includeArchived) {
        let clients = [];
        
        if (houseId) {
            clients = await window.clientManager.getClientsByHouse(houseId, !includeArchived);
        } else {
            clients = includeArchived 
                ? await window.clientManager.getAllClients()
                : await window.clientManager.getActiveClients();
        }
        
        return clients;
    }

    /**
     * Filter clients by date range
     */
    filterByDateRange(clients, startDate, endDate) {
        return clients.filter(client => {
            const admissionDate = client.admissionDate ? new Date(client.admissionDate) : null;
            
            if (!admissionDate) return false;
            
            if (startDate && admissionDate < new Date(startDate)) return false;
            if (endDate && admissionDate > new Date(endDate)) return false;
            
            return true;
        });
    }

    /**
     * Generate CSV rows from client data
     */
    async generateCSVRows(clients) {
        const rows = [];
        
        // Add header row
        const headers = Object.values(this.columnMap).map(col => col.header);
        rows.push(headers);
        
        // Process each client
        for (const client of clients) {
            const row = await this.createClientRow(client);
            rows.push(row);
        }
        
        return rows;
    }

    /**
     * Create a single row for a client
     */
    async createClientRow(client) {
        const row = [];
        
        // Get milestones for this client
        const milestones = await window.milestonesManager.getClientMilestones(client.id);
        
        // Get aftercare options
        const aftercareOptions = await window.aftercareManager.getClientAftercareOptions(client.id);
        
        // Build row based on column mapping
        for (const [col, config] of Object.entries(this.columnMap)) {
            const value = await this.getCellValue(client, config.field, milestones, aftercareOptions);
            row.push(value);
        }
        
        return row;
    }

    /**
     * Get cell value based on field type
     */
    async getCellValue(client, field, milestones, aftercareOptions) {
        // Handle direct client fields
        if (field === 'initials') return client.initials || '';
        if (field === 'dischargeDate') return this.formatDate(client.dischargeDate);
        if (field === 'caseManager') return client.caseManagerInitials || '';
        if (field === 'primaryFamilyAmbassador') return client.familyAmbassadorPrimaryInitials || '';
        if (field === 'secondaryFamilyAmbassador') return client.familyAmbassadorSecondaryInitials || '';
        if (field === 'dateOptionsProvided') return this.formatDate(client.dateOptionsProvided);
        
        // Handle milestone fields
        const milestoneFields = [
            'needs_assessment', 'health_physical', 'aftercare_thread',
            'gad_assessment', 'phq_assessment', 'satisfaction_survey',
            'referral_closure', 'options_doc', 'discharge_packet',
            'discharge_summary', 'final_planning_note', 'discharge_asam'
        ];
        
        if (milestoneFields.includes(field)) {
            const milestone = milestones.find(m => m.milestone === field);
            if (milestone && milestone.status === 'complete') {
                // Return checkmark or completed date
                return milestone.completedDate ? this.formatDate(milestone.completedDate) : '✓';
            }
            return '';
        }
        
        // Handle aftercare fields
        if (field.startsWith('aftercare')) {
            const match = field.match(/aftercare(\d+)_(program|status)/);
            if (match) {
                const optionIndex = parseInt(match[1]) - 1;
                const fieldType = match[2];
                
                if (aftercareOptions[optionIndex]) {
                    if (fieldType === 'program') {
                        return aftercareOptions[optionIndex].programName || '';
                    } else {
                        return aftercareOptions[optionIndex].status || '';
                    }
                }
            }
        }
        
        return '';
    }

    /**
     * Format date for export
     */
    formatDate(date) {
        if (!date) return '';
        
        const d = new Date(date);
        if (isNaN(d.getTime())) return '';
        
        // Format as MM/DD/YYYY to match Google Sheets
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const day = d.getDate().toString().padStart(2, '0');
        const year = d.getFullYear();
        
        return `${month}/${day}/${year}`;
    }

    /**
     * Create CSV content from rows
     */
    createCSVContent(rows) {
        return rows.map(row => {
            return row.map(cell => {
                // Escape quotes and wrap in quotes if contains comma or quotes
                const value = String(cell);
                if (value.includes(',') || value.includes('"') || value.includes('\n')) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
            }).join(',');
        }).join('\n');
    }

    /**
     * Download CSV file
     */
    downloadCSV(content, filename) {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (navigator.msSaveBlob) {
            // IE 10+
            navigator.msSaveBlob(blob, filename);
        } else {
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    /**
     * Generate filename based on export options
     */
    generateFilename(options) {
        const date = new Date();
        const dateStr = date.toISOString().split('T')[0];
        
        let filename = `CM_Tracker_Export_${dateStr}`;
        
        if (options.houseId) {
            const house = window.housesManager.getHouseById(options.houseId);
            if (house) {
                filename += `_${house.name.replace(/\s+/g, '_')}`;
            }
        }
        
        filename += '.csv';
        
        return filename;
    }

    /**
     * Export to Excel format (.xlsx)
     * Requires SheetJS library
     */
    async exportToExcel(options = {}) {
        try {
            // Check if XLSX library is available
            if (typeof XLSX === 'undefined') {
                throw new Error('Excel export requires SheetJS library. Please include it in your HTML.');
            }

            const rows = await this.generateCSVRows(
                await this.getClientsForExport(options.houseId, options.includeArchived)
            );

            // Create workbook
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.aoa_to_sheet(rows);

            // Apply column widths
            const colWidths = this.getColumnWidths();
            ws['!cols'] = colWidths;

            // Add worksheet to workbook
            XLSX.utils.book_append_sheet(wb, ws, 'CM Tracker');

            // Generate filename
            const filename = this.generateFilename(options).replace('.csv', '.xlsx');

            // Write file
            XLSX.writeFile(wb, filename);

            return { success: true, rowCount: rows.length - 1 };

        } catch (error) {
            console.error('Excel export failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get column widths for Excel export
     */
    getColumnWidths() {
        return [
            { wch: 10 }, // Name
            { wch: 12 }, // D/C
            { wch: 8 },  // Needs Assessment
            { wch: 8 },  // Health & Physical
            { wch: 8 },  // Aftercare Thread
            { wch: 8 },  // GAD
            { wch: 8 },  // PHQ
            { wch: 8 },  // Sat Survey
            { wch: 8 },  // Referral Closure
            { wch: 8 },  // Options Doc
            { wch: 8 },  // Discharge Packet
            { wch: 8 },  // Discharge Summary
            { wch: 8 },  // Final Planning Note
            { wch: 8 },  // Discharge ASAM
            { wch: 10 }, // Case Manager
            { wch: 10 }, // Primary Family Ambassador
            { wch: 10 }, // 2nd Family Ambassador
            { wch: 15 }, // Date Options Provided
            // Aftercare options
            { wch: 20 }, { wch: 15 }, // Option 1
            { wch: 20 }, { wch: 15 }, // Option 2
            { wch: 20 }, { wch: 15 }, // Option 3
            { wch: 20 }, { wch: 15 }, // Option 4
            { wch: 20 }, { wch: 15 }, // Option 5
            { wch: 20 }, { wch: 15 }, // Option 6
            { wch: 20 }, { wch: 15 }  // Option 7
        ];
    }
}

// Export for use in browser
if (typeof window !== 'undefined') {
    window.CMTrackerExport = CMTrackerExport;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CMTrackerExport;
}
