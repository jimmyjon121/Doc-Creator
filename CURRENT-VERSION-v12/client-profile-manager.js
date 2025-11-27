/**
 * Client Profile Manager
 * Handles the modernized, spacious client profile modal
 */

class ClientProfileManager {
    constructor() {
        this.activeClient = null;
        this.activeTab = 'tracking';
    }

    async open(clientId) {
        console.log(`Opening profile for client: ${clientId}`);
        
        try {
            let client = await window.clientManager.getClient(clientId);
            if (!client) {
                console.error('Client not found');
                return;
            }
            
            if (window.taskService) {
                const state = await window.taskService.getClientTaskState(client.id);
                client.taskState = state || client.taskState || {};
            }
            
            this.activeClient = client;
            this.renderModal();
            this.loadTab(this.activeTab);
            
        } catch (error) {
            console.error('Failed to open profile:', error);
        }
    }

    close() {
        const modal = document.getElementById('clientProfileModal');
        if (modal) {
            modal.remove();
            this.activeClient = null;
        }
    }

    renderModal() {
        // Remove existing if any
        this.close();

        const modal = document.createElement('div');
        modal.id = 'clientProfileModal';
        modal.className = 'profile-modal-overlay';
        
        const metrics = this.calculateMetrics(this.activeClient);
        const risk = metrics.risk;
        
        modal.innerHTML = `
            <div class="profile-modal">
                <!-- Sidebar -->
                <div class="profile-sidebar">
                    <button class="profile-nav-item ${this.activeTab === 'tracking' ? 'active' : ''}" onclick="window.clientProfileManager.switchTab('tracking')">
                        <svg class="profile-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        <span>Tracking</span>
                    </button>
                    <button class="profile-nav-item ${this.activeTab === 'assessments' ? 'active' : ''}" onclick="window.clientProfileManager.switchTab('assessments')">
                        <svg class="profile-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        <span>Assessments</span>
                    </button>
                    <button class="profile-nav-item ${this.activeTab === 'aftercare' ? 'active' : ''}" onclick="window.clientProfileManager.switchTab('aftercare')">
                        <svg class="profile-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        <span>Aftercare</span>
                    </button>
                    <button class="profile-nav-item ${this.activeTab === 'team' ? 'active' : ''}" onclick="window.clientProfileManager.switchTab('team')">
                        <svg class="profile-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        <span>Care Team</span>
                    </button>
                    <button class="profile-nav-item ${this.activeTab === 'timeline' ? 'active' : ''}" onclick="window.clientProfileManager.switchTab('timeline')">
                        <svg class="profile-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        <span>Timeline</span>
                    </button>
                    <button class="profile-nav-item ${this.activeTab === 'notes' ? 'active' : ''}" onclick="window.clientProfileManager.switchTab('notes')">
                        <svg class="profile-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        <span>Notes</span>
                    </button>
                </div>

                <!-- Main Area -->
                <div class="profile-main">
                    <!-- Header -->
                    <div class="profile-header">
                        <div class="profile-hero">
                            <div class="profile-hero-content">
                                <div class="header-left">
                                    <div class="header-top-row">
                                        <h2 class="client-name-large">${this.activeClient.initials}</h2>
                                        <span class="client-kipu-badge">${this.activeClient.kipuId}</span>
                                        ${this.getStatusBadge(this.activeClient)}
                                    </div>
                                    <p style="color:rgba(255,255,255,0.85);margin-top:14px;font-size:15px;">
                                        ${this.activeClient.fullName || 'Client Overview'} · Updated ${new Date().toLocaleDateString()}
                                    </p>
                                </div>
                                <div class="header-actions">
                                    <button class="action-btn btn-primary" onclick="window.documentGenerator.showDocumentSelection('${this.activeClient.id}')">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
                                        Create Document
                                    </button>
                                    <button class="btn-close" onclick="window.clientProfileManager.close()">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 18L18 6M6 6l12 12" stroke-linecap="round" stroke-linejoin="round"/></svg>
                                    </button>
                                </div>
                            </div>
                            <div class="hero-stats">
                                <div class="hero-stat-card">
                                    <div class="hero-stat-label">
                                        Days in Care
                                        <span class="metric-info" data-metric="client_days_in_care">i</span>
                                    </div>
                                    <div class="hero-stat-value">${metrics.daysInCare}<span class="hero-stat-sub">days</span></div>
                                    <div class="hero-stat-sub">Active since ${metrics.startDateLabel}</div>
                                </div>
                                <div class="hero-stat-card">
                                    <div class="hero-stat-label">House</div>
                                    <div class="hero-stat-value">${metrics.houseName}</div>
                                    <div class="hero-stat-sub">Case Manager · ${this.activeClient.caseManagerInitials || 'Unassigned'}</div>
                                </div>
                                <div class="hero-stat-card">
                                    <div class="hero-stat-label">
                                        Checklist Completion
                                        <span class="metric-info" data-metric="client_completion_pct">i</span>
                                    </div>
                                    <div class="hero-stat-value">${metrics.completion}%</div>
                                    <div class="hero-stat-sub">${metrics.completed}/${metrics.total} complete</div>
                                </div>
                                <div class="hero-stat-card">
                                    <div class="hero-stat-label">Risk Pulse</div>
                                    <div class="hero-stat-value">${risk.label}</div>
                                    <div class="hero-stat-sub">${risk.detail}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Content -->
                    <div id="clientProfileContent" class="profile-content">
                        <!-- Dynamic Content Loaded Here -->
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        if (window.attachMetricTooltips) {
            window.attachMetricTooltips(modal);
        }
        
        // Close on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.close();
        });
    }

    switchTab(tabId) {
        this.activeTab = tabId;
        
        // Update sidebar
        document.querySelectorAll('.profile-nav-item').forEach(el => {
            el.classList.remove('active');
        });
        event.currentTarget.classList.add('active');
        
        this.loadTab(tabId);
    }

    loadTab(tabId) {
        const container = document.getElementById('clientProfileContent');
        if (!container) return;
        
        container.innerHTML = '';
        
        switch(tabId) {
            case 'tracking':
                this.renderTrackingTab(container);
                break;
            case 'assessments':
                this.renderAssessmentsTab(container);
                break;
            case 'aftercare':
                this.renderAftercareTab(container);
                break;
            case 'team':
                this.renderTeamTab(container);
                break;
            case 'timeline':
                this.renderTimelineTab(container);
                break;
            case 'notes':
                this.renderNotesTab(container);
                break;
        }
    }

    renderTrackingTab(container) {
        const schema = window.TaskSchema;
        const client = this.activeClient;
        
        if (!schema || !schema.tasks || !client) {
            container.innerHTML = `<div class="profile-card"><p>Task schema not loaded.</p></div>`;
            return;
        }
        
        const sections = [
            {
                title: 'Admission & Assessment',
                subtitle: '48-Hour Critical Window',
                icon: '📋',
                id: 'admission',
                tasks: ['needsAssessment', 'healthPhysical']
            },
            {
                title: 'Aftercare Planning',
                subtitle: 'Sequence to discharge readiness',
                icon: '🎯',
                id: 'aftercare',
                tasks: ['aftercareThreadSent', 'optionsDocUploaded', 'dischargePacketUploaded', 'referralClosureCorrespondence']
            },
            {
                title: 'ASAM & LOC Readiness',
                subtitle: 'Insurance compliance checkpoints',
                icon: '🏥',
                id: 'asam',
                tasks: ['asamAdmission', 'asamContinued', 'asamStepDown', 'dischargeASAM']
            }
        ];
        
        container.innerHTML = sections.map(section => `
            <div class="profile-card">
                <div class="card-header">
                    <div class="card-header-main">
                        <h3 class="card-title">
                            <span style="font-size: 24px">${section.icon}</span>
                            ${section.title}
                        </h3>
                        ${section.subtitle ? `<span class="card-subtitle">${section.subtitle}</span>` : ''}
                    </div>
                    ${section.id === 'asam' ? `
                        <div class="card-header-actions">
                            <button class="action-pill" onclick="window.clientProfileManager.openLocChangePanel()">Record LOC Change</button>
                        </div>
                    ` : ''}
                </div>
                ${section.id === 'asam' ? this.renderLocChangePanel() : ''}
                <div class="checklist-grid">
                    ${section.tasks.map(taskId => this.renderTaskItem(taskId)).join('')}
                </div>
            </div>
        `).join('');
    }

    renderAssessmentsTab(container) {
        const schema = window.TaskSchema;
        if (!schema || !schema.tasks) {
            container.innerHTML = `<div class="profile-card"><p>Assessment schema missing.</p></div>`;
            return;
        }
        
        const assessmentTasks = ['gadCompleted', 'phqCompleted', 'satisfactionSurvey'];
        
        container.innerHTML = `
            <div class="profile-card">
                <div class="card-header">
                    <h3 class="card-title">📊 Clinical Assessments</h3>
                </div>
                <div class="checklist-grid">
                    ${assessmentTasks.map(taskId => this.renderTaskItem(taskId)).join('')}
                </div>
            </div>
        `;
    }

    renderLocChangePanel() {
        const today = new Date().toISOString().split('T')[0];
        const currentEpisodes = this.activeClient?.asamEpisodes || [];
        const activeEpisode = currentEpisodes.find(ep => !ep.endDate) || null;
        const currentLoc = activeEpisode?.levelOfCare || '';

        return `
            <div id="locChangePanel" class="loc-change-panel">
                <div class="loc-panel-header">
                    <div>
                        <div class="loc-panel-title">Record Level of Care Change</div>
                        <div class="loc-panel-subtitle">Use after you complete the ASAM in Kipu.</div>
                    </div>
                    <button type="button" class="loc-panel-close" onclick="window.clientProfileManager.closeLocChangePanel()">×</button>
                </div>
                <div class="loc-panel-body">
                    <div class="loc-panel-row">
                        <label class="loc-label">Level of Care</label>
                        <div class="loc-chip-group">
                            ${['RL','PHP','IOP','MH'].map(code => `
                                <button type="button"
                                    class="loc-chip ${currentLoc === code ? 'is-selected' : ''}"
                                    data-loc="${code}"
                                    onclick="window.clientProfileManager.selectLocChip('${code}')">
                                    ${code}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                    <div class="loc-panel-row">
                        <label class="loc-label">LOC Change Date</label>
                        <input type="date" id="loc-change-date" value="${today}">
                    </div>
                    <div class="loc-panel-row loc-inline">
                        <label class="loc-checkbox">
                            <input type="checkbox" id="loc-change-mh">
                            <span>MH Primary</span>
                        </label>
                    </div>
                    <div class="loc-panel-row">
                        <label class="loc-label">Kipu Doc ID (optional)</label>
                        <input type="text" id="loc-change-kipu" placeholder="ASAM note ID in Kipu">
                    </div>
                    <div class="loc-panel-row">
                        <label class="loc-label">Note</label>
                        <textarea id="loc-change-note" placeholder="e.g. Email from Sarah – stepped to PHP, MH primary"></textarea>
                    </div>
                </div>
                <div class="loc-panel-footer">
                    <button type="button" class="btn-secondary" onclick="window.clientProfileManager.closeLocChangePanel()">Cancel</button>
                    <button type="button" class="btn-primary" onclick="window.clientProfileManager.saveLocChange()">Save LOC Change</button>
                </div>
            </div>
        `;
    }

    // Helpers for other tabs
    renderAftercareTab(container) {
        const schema = window.TaskSchema;
        const client = this.activeClient;
        
        if (!schema || !schema.tasks || !client) {
            container.innerHTML = `<div class="profile-card"><p>Aftercare configuration missing.</p></div>`;
            return;
        }
        
        const aftercareTasks = ['aftercareThreadSent', 'optionsDocUploaded', 'dischargePacketUploaded', 'referralClosureCorrespondence'];
        const totalSteps = aftercareTasks.length;
        let completedSteps = 0;
        let currentStepIndex = 0;

        aftercareTasks.forEach((taskId, index) => {
            if (client.taskState?.[taskId]?.completed) {
                completedSteps++;
            }
            if (!client.taskState?.[taskId]?.completed && currentStepIndex === 0) {
                // Find the first incomplete task to determine "Current Stage"
                // But we need to check if previous are done.
                // Actually, simplified:
                if (index > 0 && client.taskState?.[aftercareTasks[index-1]]?.completed) {
                   currentStepIndex = index;
                } else if (index === 0) {
                   currentStepIndex = 0;
                }
            }
        });
        
        // If all complete
        if (completedSteps === totalSteps) {
            currentStepIndex = totalSteps - 1;
        }

        const progressPercent = Math.round((completedSteps / totalSteps) * 100);
        
        container.innerHTML = `
            <div class="profile-card">
                <div class="card-header">
                    <div class="card-header-main">
                        <h3 class="card-title">🚀 Aftercare Roadmap</h3>
                        <span class="card-subtitle">Step-by-step discharge planning workflow</span>
                    </div>
                    <div class="card-header-actions">
                        <div style="text-align: right;">
                            <div style="font-size: 24px; font-weight: 700; color: #4f46e5;">${progressPercent}%</div>
                            <div style="font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Ready for Discharge</div>
                        </div>
                    </div>
                </div>
                
                <div style="margin-bottom: 32px; position: relative; padding: 0 10px;">
                    <div style="height: 4px; background: #e2e8f0; border-radius: 2px; position: absolute; top: 50%; left: 0; right: 0; z-index: 0; transform: translateY(-50%);"></div>
                    <div style="height: 4px; background: #4f46e5; border-radius: 2px; position: absolute; top: 50%; left: 0; width: ${progressPercent}%; z-index: 0; transform: translateY(-50%); transition: width 0.5s ease;"></div>
                    
                    <div style="display: flex; justify-content: space-between; position: relative; z-index: 1;">
                        ${aftercareTasks.map((taskId, index) => {
                            const isComplete = client.taskState?.[taskId]?.completed;
                            const isCurrent = !isComplete && (index === 0 || client.taskState?.[aftercareTasks[index-1]]?.completed);
                            const isLocked = !isComplete && !isCurrent;
                            
                            let icon = '●';
                            let color = '#cbd5e1'; // gray
                            let labelColor = '#94a3b8';
                            
                            if (isComplete) {
                                icon = '✓';
                                color = '#10b981'; // green
                                labelColor = '#0f172a';
                            } else if (isCurrent) {
                                icon = '◎';
                                color = '#4f46e5'; // indigo
                                labelColor = '#4f46e5';
                            } else if (isLocked) {
                                icon = '🔒';
                            }
                            
                            return `
                                <div style="display: flex; flex-direction: column; align-items: center; gap: 8px; width: 80px;">
                                    <div style="width: 32px; height: 32px; border-radius: 50%; background: white; border: 2px solid ${color}; display: flex; align-items: center; justify-content: center; font-weight: bold; color: ${color}; transition: all 0.3s ease;">
                                        ${icon}
                                    </div>
                                    <div style="font-size: 11px; font-weight: 600; text-align: center; color: ${labelColor}; line-height: 1.2;">
                                        ${index + 1}. ${index === 0 ? 'Thread' : index === 1 ? 'Options' : index === 2 ? 'Packet' : 'Closure'}
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>

                <div class="checklist-grid">
                    ${aftercareTasks.map(taskId => this.renderTaskItem(taskId)).join('')}
                </div>
            </div>

            <div class="profile-card">
                <div class="card-header">
                    <h3 class="card-title">📂 Document Resources</h3>
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 16px;">
                    <button class="action-btn btn-secondary" onclick="window.documentGenerator?.showDocumentSelection('${client.id}')" style="justify-content: flex-start; height: auto; padding: 16px;">
                        <div style="width: 40px; height: 40px; background: #eef2ff; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-right: 12px; flex-shrink: 0;">
                            <span style="font-size: 20px;">📄</span>
                        </div>
                        <div style="text-align: left;">
                            <div style="font-weight: 600; color: #0f172a;">Aftercare Options</div>
                            <div style="font-size: 12px; color: #64748b;">Generate PDF Template</div>
                        </div>
                    </button>
                    <button class="action-btn btn-secondary" onclick="window.documentGenerator?.showDocumentSelection('${client.id}')" style="justify-content: flex-start; height: auto; padding: 16px;">
                        <div style="width: 40px; height: 40px; background: #fff7ed; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-right: 12px; flex-shrink: 0;">
                            <span style="font-size: 20px;">📦</span>
                        </div>
                        <div style="text-align: left;">
                            <div style="font-weight: 600; color: #0f172a;">Discharge Packet</div>
                            <div style="font-size: 12px; color: #64748b;">Compile Final Docs</div>
                        </div>
                    </button>
                </div>
            </div>
        `;
    }
    
    renderTeamTab(container) {
        const client = this.activeClient;
        container.innerHTML = `
            <div class="profile-card">
                <div class="card-header">
                    <h3 class="card-title">👥 Care Team</h3>
                </div>
                <div class="checklist-grid">
                    <div class="check-item" style="cursor: default;">
                        <div class="check-content">
                            <span class="check-label">Case Manager</span>
                            <span class="check-meta" style="font-size: 16px; color: #0f172a;">${client.caseManagerInitials || 'Unassigned'}</span>
                        </div>
                    </div>
                    <div class="check-item" style="cursor: default;">
                        <div class="check-content">
                            <span class="check-label">Clinical Coach</span>
                            <span class="check-meta" style="font-size: 16px; color: #0f172a;">${client.clinicalCoachInitials || 'Unassigned'}</span>
                        </div>
                    </div>
                    <div class="check-item" style="cursor: default;">
                        <div class="check-content">
                            <span class="check-label">Primary Therapist</span>
                            <span class="check-meta" style="font-size: 16px; color: #0f172a;">${client.primaryTherapistInitials || 'Unassigned'}</span>
                        </div>
                    </div>
                    <div class="check-item" style="cursor: default;">
                        <div class="check-content">
                            <span class="check-label">Family Ambassador</span>
                            <span class="check-meta" style="font-size: 16px; color: #0f172a;">${client.familyAmbassadorPrimaryInitials || 'Unassigned'}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    renderTimelineTab(container) {
        const events = this.buildTimelineEvents();
        const timelineHtml = events.length
            ? events.map(event => this.renderTimelineItem(event)).join('')
            : '<p style="color:#94a3b8;">No activity recorded yet.</p>';
        container.innerHTML = `
            <div class="profile-card">
                <div class="card-header">
                    <h3 class="card-title">🕒 Smart Timeline Rail</h3>
                    <div class="timeline-actions">
                        <button class="action-pill" onclick="window.clientProfileManager.runNextTaskSuggestion()">Suggest Next Task</button>
                        <button class="action-pill" onclick="window.clientProfileManager.openDocumentWizard()">Pre-fill Document</button>
                    </div>
                </div>
                <div class="timeline-container">
                    ${timelineHtml}
                </div>
            </div>
        `;
    }

    buildTimelineEvents() {
        const events = [];
        const schema = window.TaskSchema?.tasks || {};
        const taskState = this.activeClient?.taskState || {};

        Object.entries(taskState).forEach(([taskId, record]) => {
            const config = schema[taskId];
            if (record.completed && record.completedDate) {
                events.push({
                    id: `${taskId}-complete`,
                    type: 'task-complete',
                    icon: '✅',
                    title: `${config?.label || taskId} complete`,
                    subtitle: record.assignedTo ? `Completed by ${record.assignedTo}` : 'Marked complete',
                    date: record.completedDate
                });
            } else if (!record.completed && record.dueDate) {
                events.push({
                    id: `${taskId}-due`,
                    type: 'task-due',
                    icon: '⏳',
                    title: `${config?.label || taskId} due`,
                    subtitle: `Target date (${this.formatDate(record.dueDate)})`,
                    date: record.dueDate,
                    canReschedule: true,
                    taskId
                });
            }
        });

        (this.activeClient?.documentHistory || []).forEach(doc => {
            events.push({
                id: doc.id || `doc-${doc.createdAt}`,
                type: 'document',
                icon: '📄',
                title: `${doc.name || doc.type}`,
                subtitle: `Generated ${doc.createdBy || 'team'}`,
                date: doc.createdAt || doc.generatedDate || new Date().toISOString()
            });
        });

        (this.activeClient?.asamEpisodes || []).forEach((episode, index) => {
            events.push({
                id: `asam-${index}`,
                type: 'asam',
                icon: '🏥',
                title: `${episode.levelOfCare || 'LOC'} start`,
                subtitle: episode.source ? `Source: ${episode.source}` : 'Recorded',
                date: episode.startDate
            });
            if (episode.endDate) {
                events.push({
                    id: `asam-end-${index}`,
                    type: 'asam',
                    icon: '⬇️',
                    title: `Step-down to ${episode.nextLevel || episode.levelOfCare}`,
                    subtitle: episode.notes || 'IU notified',
                    date: episode.endDate
                });
            }
        });

        if (this.hasCompletedTask('aftercareThreadSent') && !this.hasCompletedTask('optionsDocUploaded')) {
            events.push({
                id: 'automation-options',
                type: 'automation',
                icon: '✨',
                title: 'Pre-fill Options Document',
                subtitle: 'Aftercare thread sent • ready for automation',
                date: new Date().toISOString(),
                action: 'prefill'
            });
        }

        return events
            .filter(event => event.date)
            .sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    renderTimelineItem(event) {
        const dateLabel = this.formatDateTime(event.date);
        const rescheduleControl = event.canReschedule && event.taskId ? `
            <div class="timeline-reschedule">
                <label>Shift due date</label>
                <input type="range" min="-5" max="5" value="0"
                    onmousedown="event.stopPropagation();" onclick="event.stopPropagation();"
                    onchange="window.clientProfileManager.commitReschedule('${event.taskId}', this.value, this)">
                <small>Drag to nudge ±5 days</small>
            </div>
        ` : '';
        const actionButton = event.action === 'prefill'
            ? `<button class="timeline-cta" onclick="window.clientProfileManager.openDocumentWizard()">Launch Doc Builder</button>`
            : '';

        return `
            <div class="timeline-item ${event.type}">
                <div class="timeline-dot">${event.icon || '•'}</div>
                <div class="timeline-content">
                    <div class="timeline-title-row">
                        <span class="timeline-title">${this.sanitize(event.title)}</span>
                        <span class="timeline-date">${dateLabel}</span>
                    </div>
                    <p class="timeline-subtitle">${this.sanitize(event.subtitle || '')}</p>
                    ${rescheduleControl}
                    ${actionButton}
                </div>
            </div>
        `;
    }

    runNextTaskSuggestion() {
        const taskState = this.activeClient?.taskState || {};
        const pending = Object.entries(taskState)
            .filter(([, record]) => !record.completed)
            .sort((a, b) => {
                const dateA = a[1].dueDate ? new Date(a[1].dueDate) : new Date('9999-12-31');
                const dateB = b[1].dueDate ? new Date(b[1].dueDate) : new Date('9999-12-31');
                return dateA - dateB;
            });
        if (!pending.length) {
            window.showNotification?.('All tasks are complete', 'success');
            return;
        }
        const [taskId] = pending[0];
        const label = window.TaskSchema?.tasks?.[taskId]?.label || taskId;
        window.showNotification?.(`Focus next on ${label}`, 'info');
    }

    openDocumentWizard() {
        if (!this.activeClient) return;
        if (!window.documentGenerator || !window.documentGenerator.showDocumentSelection) {
            window.showNotification?.('Document builder not available', 'warning');
            return;
        }
        window.documentGenerator.showDocumentSelection(this.activeClient.id);
    }

    async commitReschedule(taskId, offsetValue, sliderEl) {
        if (!this.activeClient || !window.taskService) return;
        const offset = parseInt(offsetValue, 10);
        if (!Number.isFinite(offset) || offset === 0) return;
        const record = this.activeClient.taskState?.[taskId];
        if (!record) return;
        const baseDate = record.dueDate || new Date().toISOString().split('T')[0];
        const newDate = this.shiftDate(baseDate, offset);
        try {
            await window.taskService.updateTask(this.activeClient.id, taskId, { dueDate: newDate });
            this.activeClient = await window.clientManager.getClient(this.activeClient.id);
            window.showNotification?.(`Due date moved to ${this.formatDate(newDate)}`, 'success');
            this.loadTab(this.activeTab);
        } catch (error) {
            console.error('Failed to reschedule task', error);
            window.showNotification?.('Unable to reschedule task', 'error');
        } finally {
            if (sliderEl) sliderEl.value = 0;
        }
    }

    shiftDate(dateInput, days) {
        if (!dateInput) return new Date().toISOString().split('T')[0];
        const date = new Date(dateInput);
        if (Number.isNaN(date.getTime())) return dateInput;
        date.setDate(date.getDate() + days);
        return date.toISOString().split('T')[0];
    }

    hasCompletedTask(taskId) {
        return Boolean(this.activeClient?.taskState?.[taskId]?.completed);
    }
    
    renderNotesTab(container) {
        const client = this.activeClient;
        container.innerHTML = `
            <div class="profile-card">
                <div class="card-header">
                    <h3 class="card-title">📝 Clinical Notes</h3>
                </div>
                <textarea 
                    style="width: 100%; min-height: 300px; padding: 16px; border: 1px solid #e2e8f0; border-radius: 12px; font-family: inherit; resize: vertical;"
                    placeholder="Add notes here..."
                    onchange="window.clientProfileManager.updateField('notes', this.value)"
                >${client.notes || ''}</textarea>
            </div>
        `;
    }


    getTaskActionConfig(taskId) {
        const map = {
            'needsAssessment': { label: 'Log Assessment', icon: '📋', mode: 'doc' },
            'healthPhysical': { label: 'Log H&P', icon: '🩺', mode: 'doc' },
            'aftercareThreadSent': { label: 'Log Thread', icon: '✉️', mode: 'note' },
            'optionsDocUploaded': { label: 'Link Document', icon: '📎', mode: 'doc' },
            'dischargePacketUploaded': { label: 'Link Packet', icon: '📦', mode: 'doc' },
            'referralClosureCorrespondence': { label: 'Log Closure', icon: '📪', mode: 'note' },
            'gadCompleted': { label: 'Record Score', icon: '📊', mode: 'note' },
            'phqCompleted': { label: 'Record Score', icon: '📉', mode: 'note' },
            'satisfactionSurvey': { label: 'Log Survey', icon: '📝', mode: 'doc' },
            'asamAdmission': { label: 'Log ASAM', icon: '🏥', mode: 'doc' },
            'asamContinued': { label: 'Log ASAM', icon: '🏥', mode: 'doc' },
            'dischargeASAM': { label: 'Log ASAM', icon: '🏥', mode: 'doc' }
        };
        return map[taskId] || { label: 'Quick Actions', icon: '⚡', mode: 'default' };
    }

    renderTaskItem(taskId) {
        const meta = this.getTaskMetadata(taskId);
        if (!meta) {
            return `
                <div class="check-item heatmap-idle missing-config">
                    <div class="check-content">
                        <span class="check-label">${taskId}</span>
                        <span class="check-meta">Task not found in schema</span>
                    </div>
                </div>
            `;
        }

        const { config, record, status } = meta;
        const completed = Boolean(record?.completed);
        const locked = this.isTaskLocked(taskId);
        const heatmapClass = this.getHeatmapClass(status, completed);
        const statusPill = this.renderStatusPill(status, completed);
        const dueLabel = this.formatDueLabel(record, status, config);
        const dependencyBadge = this.renderDependencyBadge(config, locked);
        const lockIndicator = locked ? '<span class="lock-indicator" title="Complete prerequisites first">🔒</span>' : '';
        const drawerId = this.getTaskDrawerId(taskId);
        const ownerValue = record?.assignedTo ? this.sanitize(record.assignedTo) : '';
        const ownerChip = ownerValue
            ? `<span class="owner-chip">Owner · ${ownerValue}</span>`
            : '<span class="owner-chip owner-chip--empty">Owner · Unassigned</span>';
        const contributorBadges = this.renderContributorBadges(record);
        const taskLabel = this.sanitize(config.label);
        const description = this.sanitize(config.description || 'Tracked milestone');
        
        const actionConfig = this.getTaskActionConfig(taskId);

        return `
            <label class="check-item ${heatmapClass} ${completed ? 'checked' : ''} ${locked ? 'locked' : ''}">
                <input type="checkbox" hidden 
                    onchange="window.clientProfileManager.toggleTask('${taskId}', this.checked)"
                    ${completed ? 'checked' : ''}
                    ${locked ? 'disabled' : ''}>
                <div class="custom-checkbox">${lockIndicator}</div>
                <div class="check-content">
                    <span class="check-label">
                        ${taskLabel}
                        ${statusPill}
                    </span>
                    <span class="check-meta">${description}</span>
                    <span class="task-due-meta">${dueLabel}</span>
                    ${dependencyBadge}
                    <div class="task-inline-actions">
                        <div class="owner-chip-group">
                            ${ownerChip}
                            ${contributorBadges}
                        </div>
                        <button type="button" class="task-inline-trigger" onclick="event.stopPropagation();window.clientProfileManager.toggleTaskDrawer('${drawerId}')">
                            ${actionConfig.icon} ${actionConfig.label}
                        </button>
                    </div>
                </div>
            </label>
            <div class="task-inline-drawer" id="${drawerId}">
                ${this.renderTaskDrawer(taskId, record, actionConfig.mode)}
            </div>
        `;
    }

    getTaskMetadata(taskId) {
        const schema = window.TaskSchema;
        if (!schema || !schema.tasks?.[taskId]) return null;
        const record = this.activeClient?.taskState?.[taskId];
        let status = { state: record?.completed ? 'complete' : 'pending', severity: 'low' };
        if (window.taskService && record) {
            status = window.taskService.evaluateTaskStatus(record);
        }
        return {
            config: schema.tasks[taskId],
            record,
            status
        };
    }

    renderStatusPill(status, completed) {
        const state = completed ? 'complete' : status?.state || 'pending';
        const labels = {
            complete: 'Complete',
            overdue: 'Overdue',
            dueSoon: 'Due Soon',
            pending: 'Pending'
        };
        const classes = {
            complete: 'status-complete',
            overdue: 'status-overdue',
            dueSoon: 'status-due',
            pending: 'status-pending'
        };
        return `<span class="task-status-pill ${classes[state] || classes.pending}">${labels[state] || labels.pending}</span>`;
    }

    getHeatmapClass(status, completed) {
        if (completed) return 'heatmap-complete';
        switch (status?.state) {
            case 'overdue':
                return 'heatmap-critical';
            case 'dueSoon':
                return 'heatmap-warning';
            default:
                return 'heatmap-idle';
        }
    }

    formatDueLabel(record, status, config) {
        if (status?.state === 'overdue') {
            const days = Math.abs(status.days || 0);
            return `Overdue ${days ? `${days}d` : ''}`;
        }
        if (status?.state === 'dueSoon') {
            const days = status.days ?? 0;
            return `Due in ${days}d`;
        }
        if (record?.dueDate) {
            return `Due ${this.formatDate(record.dueDate)}`;
        }
        if (config?.due?.type === 'atAdmission') {
            return 'Record at admission';
        }
        return 'No due date';
    }

    formatDate(dateStr) {
        if (!dateStr) return 'TBD';
        const date = new Date(dateStr);
        if (Number.isNaN(date.getTime())) return dateStr;
        return date.toLocaleDateString();
    }

    formatDateTime(value) {
        if (!value) return 'Just now';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return value;
        return date.toLocaleString();
    }

    sanitize(text = '') {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        };
        return text.replace(/[&<>"']/g, char => map[char] || char);
    }

    renderDependencyBadge(config, locked) {
        if (!config?.dependsOn || config.dependsOn.length === 0) return '';
        const deps = config.dependsOn.map(depId => window.TaskSchema?.tasks?.[depId]?.label || depId);
        return `
            <span class="task-dependency ${locked ? 'is-locked' : ''}">
                <span class="dependency-arrow">↳</span>
                ${locked ? 'Waiting on' : 'Follows'} ${deps.join(', ')}
            </span>
        `;
    }

    openLocChangePanel() {
        const panel = document.getElementById('locChangePanel');
        if (!panel) return;
        panel.classList.add('is-open');
        
        // Default date to today if empty
        const dateInput = panel.querySelector('#loc-change-date');
        if (dateInput && !dateInput.value) {
            dateInput.value = new Date().toISOString().split('T')[0];
        }
    }

    closeLocChangePanel() {
        const panel = document.getElementById('locChangePanel');
        if (!panel) return;
        panel.classList.remove('is-open');
    }

    selectLocChip(code) {
        const panel = document.getElementById('locChangePanel');
        if (!panel) return;
        panel.querySelectorAll('.loc-chip').forEach(btn => {
            btn.classList.toggle('is-selected', btn.dataset.loc === code);
        });
    }

    async saveLocChange() {
        if (!this.activeClient || !window.clientManager) return;
        const panel = document.getElementById('locChangePanel');
        if (!panel) return;

        const selectedChip = panel.querySelector('.loc-chip.is-selected');
        const levelOfCare = selectedChip?.dataset.loc || '';
        const dateInput = panel.querySelector('#loc-change-date');
        const isMhPrimary = panel.querySelector('#loc-change-mh')?.checked || false;
        const kipuDocId = panel.querySelector('#loc-change-kipu')?.value.trim() || '';
        const note = panel.querySelector('#loc-change-note')?.value.trim() || '';

        if (!levelOfCare) {
            window.showNotification?.('Select a level of care', 'warning');
            return;
        }

        const changeDate = dateInput?.value || new Date().toISOString().split('T')[0];

        try {
            const updatedClient = await window.clientManager.recordAsamEpisode(this.activeClient.id, {
                levelOfCare,
                changeDate,
                isMhPrimary,
                kipuDocId,
                notes: note
            });

            this.activeClient = updatedClient;
            window.showNotification?.('Level of care change recorded', 'success');

            this.closeLocChangePanel();
            // Re-render modal to refresh hero, tasks, and timeline with new ASAM due dates
            this.renderModal();
            this.loadTab(this.activeTab);
        } catch (error) {
            console.error('Failed to record LOC change', error);
            window.showNotification?.('Unable to save LOC change', 'error');
        }
    }

    getTaskDrawerId(taskId) {
        return `task-drawer-${this.activeClient?.id || 'client'}-${taskId}`;
    }

    renderTaskDrawer(taskId, record, mode = 'default') {
        const ownerValue = this.sanitize(record?.assignedTo || '');
        
        // Dynamic placeholder based on mode
        const notePlaceholder = mode === 'note' ? 'Add thread details or notes...' : 'Add quick note...';
        const docPlaceholder = mode === 'doc' ? 'Enter Kipu Document ID...' : 'Kipu Doc ID (optional)';
        
        const ownerSection = `
            <div class="drawer-field">
                <label>Assign Owner</label>
                <div class="drawer-row">
                    <input type="text" maxlength="4" data-task-owner="${taskId}" value="${ownerValue}" placeholder="CM"
                        onmousedown="event.stopPropagation();" onclick="event.stopPropagation();">
                    <button type="button" onclick="event.stopPropagation();window.clientProfileManager.saveTaskOwner('${taskId}')">Save</button>
                </div>
            </div>
        `;
        
        const evidenceSection = `
             <div class="drawer-field">
                <label>${mode === 'doc' ? 'Link Document' : (mode === 'note' ? 'Log Activity' : 'Log Evidence')}</label>
                ${mode === 'note' ? `
                    <textarea data-task-note="${taskId}" placeholder="${notePlaceholder}" style="margin-bottom:8px;"
                        onmousedown="event.stopPropagation();" onclick="event.stopPropagation();"></textarea>
                ` : ''}
                <div class="drawer-row">
                    ${mode !== 'note' ? `
                        <input type="text" data-task-doc="${taskId}" placeholder="${docPlaceholder}"
                            onmousedown="event.stopPropagation();" onclick="event.stopPropagation();">
                    ` : ''}
                    ${mode !== 'doc' && mode !== 'note' ? `
                        <textarea data-task-note="${taskId}" placeholder="${notePlaceholder}"
                            onmousedown="event.stopPropagation();" onclick="event.stopPropagation();"></textarea>
                    ` : ''}
                     <button type="button" onclick="event.stopPropagation();window.clientProfileManager.submitTaskEvidence('${taskId}')">
                        ${mode === 'doc' ? 'Link Doc' : 'Save Log'}
                    </button>
                </div>
                 ${mode === 'doc' ? `
                    <div style="margin-top:8px;">
                         <textarea data-task-note="${taskId}" placeholder="Add optional note..."
                            onmousedown="event.stopPropagation();" onclick="event.stopPropagation();" style="min-height:40px;"></textarea>
                    </div>
                ` : ''}
                 ${mode === 'note' ? `
                    <div style="margin-top:8px;" class="drawer-row">
                         <input type="text" data-task-doc="${taskId}" placeholder="Kipu Doc ID (optional)"
                            onmousedown="event.stopPropagation();" onclick="event.stopPropagation();">
                    </div>
                ` : ''}
            </div>
        `;

        return `
            ${ownerSection}
            ${evidenceSection}
            ${this.renderEvidenceList(record)}
        `;
    }

    renderEvidenceList(record) {
        if (!record?.evidence || record.evidence.length === 0) return '';
        const rows = record.evidence.slice(0, 4).map(entry => {
            const type = entry.type === 'document' ? 'DOC' : 'NOTE';
            const badgeClass = entry.type === 'document' ? 'doc' : 'note';
            const body = this.sanitize(entry.note || entry.docId || 'Attached');
            const author = this.sanitize(entry.author || 'STAFF');
            const timestamp = this.formatDateTime(entry.timestamp);
            return `
                <div class="evidence-row">
                    <span class="evidence-type ${badgeClass}">${type}</span>
                    <div class="evidence-body">
                        <p>${body}</p>
                        <small>${author} · ${timestamp}</small>
                    </div>
                </div>
            `;
        }).join('');
        return `<div class="evidence-list">${rows}</div>`;
    }

    renderContributorBadges(record) {
        if (!record?.evidence || record.evidence.length === 0) return '';
        const unique = [];
        record.evidence.forEach(entry => {
            const initials = (entry.author || '').toUpperCase().slice(0, 4);
            if (initials && !unique.includes(initials)) {
                unique.push(initials);
            }
        });
        if (unique.length === 0) return '';
        const badges = unique.slice(0, 3).map(initials => 
            `<span class="contributor-badge">${this.sanitize(initials)}</span>`
        ).join('');
        return `<span class="owner-chip contributors" title="Recent contributors">${badges}</span>`;
    }

    toggleTaskDrawer(drawerId) {
        document.querySelectorAll('.task-inline-drawer.is-open').forEach(drawer => {
            if (drawer.id !== drawerId) {
                drawer.classList.remove('is-open');
            }
        });
        const drawer = document.getElementById(drawerId);
        if (drawer) {
            drawer.classList.toggle('is-open');
        }
    }

    async saveTaskOwner(taskId) {
        if (!this.activeClient || !window.taskService) return;
        const input = document.querySelector(`[data-task-owner="${taskId}"]`);
        if (!input) return;
        const value = input.value.trim().toUpperCase();
        if (!value) {
            window.showNotification?.('Enter initials to assign owner', 'warning');
            return;
        }
        try {
            await window.taskService.updateTask(this.activeClient.id, taskId, { assignedTo: value });
            this.activeClient = await window.clientManager.getClient(this.activeClient.id);
            window.showNotification?.('Owner updated', 'success');
            this.loadTab(this.activeTab);
        } catch (error) {
            console.error('Failed to assign owner', error);
            window.showNotification?.('Unable to assign owner', 'error');
        }
    }

    async submitTaskEvidence(taskId) {
        if (!this.activeClient || !window.taskService) return;
        const noteField = document.querySelector(`[data-task-note="${taskId}"]`);
        const docField = document.querySelector(`[data-task-doc="${taskId}"]`);
        const note = noteField?.value.trim() || '';
        const docId = docField?.value.trim() || '';
        if (!note && !docId) {
            window.showNotification?.('Add a note or document reference first', 'warning');
            return;
        }
        try {
            await window.taskService.appendEvidence(this.activeClient.id, taskId, {
                note,
                docId,
                author: window.ccConfig?.currentUser?.initials || 'DEV'
            });
            this.activeClient = await window.clientManager.getClient(this.activeClient.id);
            if (noteField) noteField.value = '';
            if (docField) docField.value = '';
            window.showNotification?.('Evidence logged', 'success');
            this.loadTab(this.activeTab);
        } catch (error) {
            console.error('Failed to append evidence', error);
            window.showNotification?.('Unable to log evidence', 'error');
        }
    }

    isTaskLocked(taskId) {
        const config = window.TaskSchema?.tasks?.[taskId];
        if (!config?.dependsOn || config.dependsOn.length === 0) {
            return false;
        }
        return config.dependsOn.some(depId => {
            const dependency = this.activeClient?.taskState?.[depId];
            return !dependency || !dependency.completed;
        });
    }

    async toggleTask(taskId, isChecked) {
        if (!this.activeClient) return;
        if (this.isTaskLocked(taskId) && isChecked) {
            window.showNotification?.('Complete prerequisite tasks first', 'warning');
            this.loadTab(this.activeTab);
            return;
        }

        try {
            if (window.taskService) {
                await window.taskService.updateTask(this.activeClient.id, taskId, {
                    completed: isChecked,
                    status: isChecked ? 'complete' : 'pending'
                });
            } else {
                await this.updateField(taskId, isChecked);
            }
            
            // Refresh active client data
            this.activeClient = await window.clientManager.getClient(this.activeClient.id);
            this.loadTab(this.activeTab);
        } catch (error) {
            console.error('Failed to update task', taskId, error);
            window.showNotification?.('Unable to update task', 'error');
        }
    }

    // Actions
    async updateField(field, value) {
        if (!this.activeClient) return;
        
        try {
            console.log(`Updating ${field} to ${value}`);
            
            // Update local state
            this.activeClient[field] = value;
            
            // Update UI immediately
            this.loadTab(this.activeTab);
            
            // Save to DB
            await window.clientManager.updateClient(this.activeClient.id, { [field]: value });
            
            // Notify others
            window.clientManager.notifyListeners();
            
            // Show toast
            if (window.showNotification) {
                window.showNotification('Profile updated', 'success');
            }
            
        } catch (error) {
            console.error('Failed to update client:', error);
            if (window.showNotification) {
                window.showNotification('Failed to save changes', 'error');
            }
        }
    }

    // Helpers
    getStatusBadge(client) {
        if (client.dischargeDate) return '<span class="client-status-pill status-discharged">Discharged</span>';
        if (!client.houseId) return '<span class="client-status-pill status-pre-admission">Pre-Admission</span>';
        return '<span class="client-status-pill status-active">Active</span>';
    }

    calculateDaysInCare(client) {
        if (!client.admissionDate) return 0;
        const start = new Date(client.admissionDate);
        const end = client.dischargeDate ? new Date(client.dischargeDate) : new Date();
        const diff = end - start;
        return Math.floor(diff / (1000 * 60 * 60 * 24));
    }

    getHouseName(houseId) {
        const map = {
            // Family First Houses (with house_ prefix)
            'house_meridian': 'Meridian',
            'house_cove': 'Cove',
            'house_preserve': 'Preserve',
            'house_hedge': 'Hedge',
            'house_banyan': 'Banyan',
            'house_prosperity': 'Prosperity',
            // Without prefix
            'meridian': 'Meridian',
            'cove': 'Cove',
            'preserve': 'Preserve',
            'hedge': 'Hedge',
            'banyan': 'Banyan',
            'prosperity': 'Prosperity'
        };
        return map[houseId] || map[houseId?.toLowerCase()] || houseId || 'N/A';
    }

    calculateMetrics(client) {
        const days = this.calculateDaysInCare(client);
        // Check both houseId and house fields for compatibility
        const houseName = this.getHouseName(client.houseId || client.house);
        const schema = window.TaskSchema;
        let completed = 0;
        let total = 0;

        if (schema?.tasks && client.taskState) {
            Object.keys(schema.tasks).forEach(taskId => {
                total += 1;
                if (client.taskState[taskId]?.completed) {
                    completed += 1;
                }
            });
        } else {
            const legacyTasks = [
                client.needsAssessment,
                client.healthPhysical,
                client.aftercareThreadSent,
                client.optionsDocUploaded,
                client.dischargePacketUploaded,
                client.referralClosureCorrespondence
            ];
            completed = legacyTasks.filter(Boolean).length;
            total = legacyTasks.length;
        }

        const completion = total ? Math.round((completed / total) * 100) : 0;
        return {
            daysInCare: days,
            houseName,
            completed,
            total,
            completion,
            startDateLabel: client.admissionDate ? new Date(client.admissionDate).toLocaleDateString() : 'Not admitted',
            risk: this.getRiskLevel(client)
        };
    }

    getRiskLevel(client) {
        const criticalTasks = ['needsAssessment', 'healthPhysical', 'aftercareThreadSent', 'asamContinued'];
        if (window.taskService && client.taskState) {
            for (const taskId of criticalTasks) {
                const record = client.taskState[taskId];
                if (!record) continue;
                const status = window.taskService.evaluateTaskStatus(record);
                if (status.state === 'overdue') {
                    return { label: 'Critical', detail: `${window.TaskSchema?.tasks?.[taskId]?.label || taskId} overdue` };
                }
                if (status.state === 'dueSoon') {
                    return { label: 'Warning', detail: `${window.TaskSchema?.tasks?.[taskId]?.label || taskId} due soon` };
                }
            }
            return { label: 'Stable', detail: 'All critical milestones on track' };
        }

        const days = this.calculateDaysInCare(client);
        if (!client.needsAssessment && days >= 1) {
            return { label: 'Critical', detail: 'Needs assessment overdue' };
        }
        if (!client.healthPhysical && days >= 2) {
            return { label: 'High', detail: 'Health & Physical pending' };
        }
        if (!client.aftercareThreadSent && days >= 14) {
            return { label: 'Escalate', detail: 'Aftercare not started' };
        }
        return { label: 'Stable', detail: 'All critical milestones on track' };
    }
}

// Initialize and export
window.clientProfileManager = new ClientProfileManager();
console.log('✅ Client Profile Manager loaded');

// Override the legacy viewClientDetails function
window.viewClientDetails = function(clientOrId) {
    const clientId = typeof clientOrId === 'string' ? clientOrId : clientOrId.id;
    if (window.clientProfileManager) {
        window.clientProfileManager.open(clientId);
    } else {
        console.error('Client Profile Manager not ready');
    }
};
