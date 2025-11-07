/**
 * Aftercare Options Cascade
 * Visual flow showing aftercare options and family decisions
 */

class AftercareCascade {
    constructor() {
        this.currentClient = null;
        this.modal = null;
    }
    
    /**
     * Open aftercare cascade for a client
     */
    async open(clientId) {
        try {
            this.currentClient = await window.clientManager.getClient(clientId);
            if (!this.currentClient) {
                throw new Error('Client not found');
            }
            
            this.render();
            
        } catch (error) {
            console.error('[AftercareCascade] Error opening:', error);
            alert('Error loading aftercare options');
        }
    }
    
    /**
     * Render the cascade visualization
     */
    render() {
        // Get aftercare options or initialize empty array
        const options = this.currentClient.aftercareOptions || [];
        const score = window.trackerEngine?.getCompletionScore(this.currentClient) || {};
        
        // Create modal
        const modal = document.createElement('div');
        modal.className = 'aftercare-cascade-overlay';
        modal.innerHTML = `
            <div class="aftercare-cascade-modal">
                <div class="cascade-header">
                    <div class="header-info">
                        <h3>🏥 Aftercare Options: ${this.currentClient.initials}</h3>
                        <div class="header-stats">
                            <span>Day ${score.daysInCare || 0}</span>
                            <span>${options.length} Options</span>
                            <span>${this.getAcceptedCount(options)} Accepted</span>
                        </div>
                    </div>
                    <button class="close-btn" onclick="aftercareCascade.close()">×</button>
                </div>
                
                <div class="cascade-content">
                    <div class="cascade-timeline">
                        <div class="timeline-header">
                            <div class="timeline-label">Options Provided</div>
                            <div class="timeline-label">Family Response</div>
                            <div class="timeline-label">Next Steps</div>
                        </div>
                        
                        <div class="cascade-options">
                            ${options.length > 0 ? 
                                options.map((opt, index) => this.renderOption(opt, index + 1)).join('') :
                                this.renderEmptyState()
                            }
                        </div>
                        
                        <div class="add-option-section">
                            <button class="btn-add-option" onclick="aftercareCascade.addOption()">
                                + Add Aftercare Option
                            </button>
                        </div>
                    </div>
                    
                    <div class="cascade-summary">
                        ${this.renderSummary(options)}
                    </div>
                    
                    <div class="cascade-actions">
                        <button class="btn-primary" onclick="aftercareCascade.exportOptions()">
                            Export Options Report
                        </button>
                        <button class="btn-secondary" onclick="aftercareCascade.sendUpdate()">
                            Send Family Update
                        </button>
                        <button class="btn-secondary" onclick="aftercareCascade.viewPrograms()">
                            Browse Programs
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.modal = modal;
        
        // Close on overlay click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.close();
        });
    }
    
    /**
     * Render individual aftercare option
     */
    renderOption(option, number) {
        const statusClass = this.getStatusClass(option.status);
        const statusIcon = this.getStatusIcon(option.status);
        const timeline = this.getOptionTimeline(option);
        
        return `
            <div class="cascade-option ${statusClass}">
                <div class="option-number">${number}</div>
                
                <div class="option-stage option-provided">
                    <div class="stage-content">
                        <h4>${option.programName || 'Unnamed Program'}</h4>
                        <div class="option-details">
                            ${option.location ? `<span class="detail-item">📍 ${option.location}</span>` : ''}
                            ${option.bedAvailable ? '<span class="detail-item">🛏️ Bed Available</span>' : ''}
                            ${option.insuranceApproved ? '<span class="detail-item">✅ Insurance OK</span>' : ''}
                        </div>
                        ${option.dateProvided ? 
                            `<div class="date-label">Sent: ${new Date(option.dateProvided).toLocaleDateString()}</div>` : 
                            ''
                        }
                    </div>
                    <div class="stage-actions">
                        <button class="btn-icon" title="Edit Option" onclick="aftercareCascade.editOption('${option.programId}')">
                            ✏️
                        </button>
                    </div>
                </div>
                
                <div class="option-connector ${statusClass}">
                    <div class="connector-line"></div>
                    <div class="connector-icon">${statusIcon}</div>
                </div>
                
                <div class="option-stage option-response">
                    <div class="stage-content">
                        <div class="response-status ${statusClass}">
                            ${this.getStatusLabel(option.status)}
                        </div>
                        ${option.familyResponse ? 
                            `<div class="response-text">"${option.familyResponse}"</div>` : 
                            ''
                        }
                        ${option.responseDate ? 
                            `<div class="date-label">${new Date(option.responseDate).toLocaleDateString()}</div>` : 
                            ''
                        }
                    </div>
                    <div class="stage-actions">
                        <button class="btn-small" onclick="aftercareCascade.updateResponse('${option.programId}')">
                            Update
                        </button>
                    </div>
                </div>
                
                <div class="option-connector next">
                    <div class="connector-line"></div>
                    <div class="connector-icon">→</div>
                </div>
                
                <div class="option-stage option-next">
                    <div class="stage-content">
                        ${this.getNextSteps(option)}
                    </div>
                </div>
                
                ${timeline.length > 0 ? `
                    <div class="option-timeline">
                        ${timeline.map(event => `
                            <div class="timeline-event">
                                <span class="event-date">${event.date}</span>
                                <span class="event-text">${event.text}</span>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    /**
     * Render empty state
     */
    renderEmptyState() {
        return `
            <div class="cascade-empty">
                <div class="empty-icon">🏥</div>
                <h4>No Aftercare Options Yet</h4>
                <p>Start by adding aftercare program options for the family to consider.</p>
            </div>
        `;
    }
    
    /**
     * Render summary section
     */
    renderSummary(options) {
        const accepted = options.filter(o => o.status === 'accepted');
        const pending = options.filter(o => o.status === 'sent' || o.status === 'pending');
        const declined = options.filter(o => o.status === 'declined');
        
        const hasAccepted = accepted.length > 0;
        const primaryOption = accepted[0] || pending[0];
        
        return `
            <div class="summary-section">
                <h4>Summary</h4>
                <div class="summary-stats">
                    <div class="stat accepted">${accepted.length} Accepted</div>
                    <div class="stat pending">${pending.length} Pending</div>
                    <div class="stat declined">${declined.length} Declined</div>
                </div>
                
                ${hasAccepted ? `
                    <div class="primary-selection">
                        <h5>✅ Primary Selection</h5>
                        <div class="selection-details">
                            <strong>${primaryOption.programName}</strong>
                            ${primaryOption.admissionDate ? 
                                `<span>Admission: ${new Date(primaryOption.admissionDate).toLocaleDateString()}</span>` :
                                '<span>Admission date pending</span>'
                            }
                        </div>
                    </div>
                ` : pending.length > 0 ? `
                    <div class="waiting-response">
                        <h5>⏳ Awaiting Response</h5>
                        <p>Family is reviewing ${pending.length} option${pending.length > 1 ? 's' : ''}</p>
                    </div>
                ` : ''}
                
                ${options.length >= 3 && !hasAccepted ? `
                    <div class="recommendation">
                        <h5>💡 Recommendation</h5>
                        <p>Consider following up with family or exploring additional options</p>
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    /**
     * Get status class
     */
    getStatusClass(status) {
        const classes = {
            accepted: 'status-accepted',
            declined: 'status-declined',
            sent: 'status-pending',
            pending: 'status-pending',
            waitlist: 'status-waitlist'
        };
        return classes[status] || '';
    }
    
    /**
     * Get status icon
     */
    getStatusIcon(status) {
        const icons = {
            accepted: '✅',
            declined: '❌',
            sent: '📤',
            pending: '⏳',
            waitlist: '📋'
        };
        return icons[status] || '○';
    }
    
    /**
     * Get status label
     */
    getStatusLabel(status) {
        const labels = {
            accepted: 'Family Accepted',
            declined: 'Family Declined',
            sent: 'Sent to Family',
            pending: 'Awaiting Response',
            waitlist: 'On Waitlist'
        };
        return labels[status] || status;
    }
    
    /**
     * Get next steps for an option
     */
    getNextSteps(option) {
        if (option.status === 'accepted') {
            return `
                <h5>Next Steps:</h5>
                <ul class="next-steps-list">
                    <li>Confirm admission date</li>
                    <li>Complete intake paperwork</li>
                    <li>Coordinate transportation</li>
                </ul>
            `;
        } else if (option.status === 'declined') {
            return `
                <div class="declined-note">
                    Option declined - explore alternatives
                </div>
            `;
        } else if (option.status === 'waitlist') {
            return `
                <div class="waitlist-note">
                    On waitlist - check availability weekly
                </div>
            `;
        } else {
            return `
                <div class="pending-note">
                    Follow up in 24-48 hours
                </div>
            `;
        }
    }
    
    /**
     * Get option timeline
     */
    getOptionTimeline(option) {
        const events = [];
        
        if (option.dateProvided) {
            events.push({
                date: new Date(option.dateProvided).toLocaleDateString(),
                text: 'Option provided to family'
            });
        }
        
        if (option.responseDate) {
            events.push({
                date: new Date(option.responseDate).toLocaleDateString(),
                text: `Family ${option.status}`
            });
        }
        
        return events;
    }
    
    /**
     * Get count of accepted options
     */
    getAcceptedCount(options) {
        return options.filter(o => o.status === 'accepted').length;
    }
    
    /**
     * Add new aftercare option
     */
    async addOption() {
        const programName = prompt('Enter program name:');
        if (!programName) return;
        
        const location = prompt('Enter location (optional):');
        const bedAvailable = confirm('Is a bed currently available?');
        const insuranceApproved = confirm('Is insurance pre-approved?');
        
        const newOption = {
            programId: `prog_${Date.now()}`,
            programName,
            location,
            bedAvailable,
            insuranceApproved,
            status: 'pending',
            dateProvided: new Date().toISOString()
        };
        
        try {
            await window.clientManager.addAftercareOption(this.currentClient.id, newOption);
            
            // Refresh
            this.currentClient = await window.clientManager.getClient(this.currentClient.id);
            this.modal.remove();
            this.render();
            
            this.showNotification('Aftercare option added', 'success');
            
        } catch (error) {
            console.error('[AftercareCascade] Error adding option:', error);
            this.showNotification('Error adding option', 'error');
        }
    }
    
    /**
     * Edit aftercare option
     */
    editOption(programId) {
        alert(`Edit option: ${programId}\n(In real implementation, would open edit form)`);
    }
    
    /**
     * Update response for an option
     */
    async updateResponse(programId) {
        const option = this.currentClient.aftercareOptions.find(o => o.programId === programId);
        if (!option) return;
        
        const status = prompt('Update status (accepted/declined/pending/waitlist):', option.status);
        if (!status) return;
        
        const familyResponse = prompt('Family response/notes (optional):', option.familyResponse || '');
        
        try {
            await window.clientManager.updateAftercareProgress(this.currentClient.id, programId, {
                status,
                familyResponse,
                responseDate: new Date().toISOString()
            });
            
            // Refresh
            this.currentClient = await window.clientManager.getClient(this.currentClient.id);
            this.modal.remove();
            this.render();
            
            this.showNotification('Response updated', 'success');
            
        } catch (error) {
            console.error('[AftercareCascade] Error updating response:', error);
            this.showNotification('Error updating response', 'error');
        }
    }
    
    /**
     * Export options report
     */
    exportOptions() {
        const options = this.currentClient.aftercareOptions || [];
        let report = `Aftercare Options Report\n`;
        report += `Client: ${this.currentClient.initials}\n`;
        report += `Date: ${new Date().toLocaleDateString()}\n\n`;
        
        options.forEach((opt, index) => {
            report += `Option ${index + 1}: ${opt.programName}\n`;
            report += `Status: ${this.getStatusLabel(opt.status)}\n`;
            if (opt.location) report += `Location: ${opt.location}\n`;
            if (opt.familyResponse) report += `Family Response: ${opt.familyResponse}\n`;
            report += '\n';
        });
        
        alert(report);
    }
    
    /**
     * Send family update
     */
    sendUpdate() {
        alert('Send family update functionality coming soon!');
    }
    
    /**
     * View programs
     */
    viewPrograms() {
        alert('Browse programs functionality coming soon!');
    }
    
    /**
     * Close modal
     */
    close() {
        if (this.modal) {
            this.modal.remove();
            this.modal = null;
        }
    }
    
    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `cascade-notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('visible');
        }, 10);
        
        setTimeout(() => {
            notification.classList.remove('visible');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Create singleton instance
window.aftercareCascade = new AftercareCascade();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AftercareCascade;
}
