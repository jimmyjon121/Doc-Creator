/**
 * Client Task Service
 * Bridges TaskSchema metadata with ClientManager persistence
 */

(function registerTaskService() {
    if (typeof window === 'undefined') {
        return;
    }

    const TASK_TO_MILESTONE_MAP = {
        needsAssessment: 'needs_assessment',
        healthPhysical: 'health_physical',
        aftercareThreadSent: 'aftercare_thread',
        optionsDocUploaded: 'options_doc',
        dischargePacketUploaded: 'discharge_packet',
        referralClosureCorrespondence: 'referral_closure',
        gadCompleted: 'gad_assessment',
        phqCompleted: 'phq_assessment',
        satisfactionSurvey: 'satisfaction_survey',
        dischargeSummary: 'discharge_summary',
        dischargePlanningNote: 'final_planning_note',
        dischargeASAM: 'discharge_asam'
    };

    class ClientTaskService {
        constructor(clientManager, schema) {
            this.clientManager = clientManager;
            this.schema = schema || window.TaskSchema || { tasks: {} };
        }

        async initialize() {
            if (!this.clientManager) {
                console.warn('TaskService: client manager not ready yet');
                return;
            }

            try {
                const clients = await this.clientManager.getAllClients();
                for (const client of clients) {
                    const changed = this.clientManager.ensureTaskSchema(client);
                    if (changed) {
                        await this.clientManager.updateClient(client.id, { taskState: client.taskState });
                    }
                    await this.syncClientMilestones(client);
                }
                console.log(`✅ Task service initialized (${clients.length} clients normalized)`);
            } catch (error) {
                console.error('TaskService initialization failed:', error);
            }
        }

        getSchema() {
            return this.schema;
        }

        getTaskConfig(taskId) {
            return this.schema?.tasks?.[taskId] || null;
        }

        groupTasksByCategory() {
            const result = {};
            const tasks = this.schema?.tasks || {};
            Object.values(tasks).forEach(task => {
                const category = task.category || 'misc';
                if (!result[category]) {
                    result[category] = [];
                }
                result[category].push(task);
            });
            return result;
        }

        async getClientTaskState(clientId) {
            const client = await this.clientManager.getClient(clientId);
            if (!client) return null;
            this.clientManager.ensureTaskSchema(client);
            return client.taskState;
        }

        async updateTask(clientId, taskId, updates = {}) {
            const taskConfig = this.getTaskConfig(taskId);
            if (!taskConfig) {
                throw new Error(`Task ${taskId} is not defined in TaskSchema`);
            }

            const client = await this.clientManager.getClient(clientId);
            if (!client) {
                throw new Error('Client not found');
            }

            this.clientManager.ensureTaskSchema(client);
            const currentState = client.taskState[taskId] || {};
            const nextState = {
                ...currentState,
                ...updates,
                id: taskId,
                lastUpdated: new Date().toISOString()
            };

            if (updates.status) {
                nextState.status = updates.status;
            }

            if (typeof updates.completed !== 'undefined') {
                nextState.completed = Boolean(updates.completed);
                if (nextState.completed && !nextState.completedDate) {
                    nextState.completedDate = updates.completedDate || new Date().toISOString();
                }
                if (!nextState.completed) {
                    nextState.completedDate = null;
                }
            }

            if (nextState.completed && !nextState.status) {
                nextState.status = 'complete';
            }

            const updatePayload = { taskState: { ...client.taskState, [taskId]: nextState } };

            if (taskConfig.legacyField) {
                updatePayload[taskConfig.legacyField] = nextState.completed;
            }
            if (taskConfig.legacyDateField && nextState.completed) {
                updatePayload[taskConfig.legacyDateField] = nextState.completedDate;
            }

            const updatedClient = await this.clientManager.updateClient(clientId, updatePayload);
            await this.syncMilestoneStatus(clientId, taskId, nextState.completed);
            return updatedClient.taskState?.[taskId];
        }

        async appendEvidence(clientId, taskId, entry) {
            const client = await this.clientManager.getClient(clientId);
            if (!client) throw new Error('Client not found');
            this.clientManager.ensureTaskSchema(client);

            const record = client.taskState[taskId] || {};
            const evidence = Array.isArray(record.evidence) ? [...record.evidence] : [];
            const normalizedEntry = {
                id: entry.id || `evi-${Date.now()}`,
                type: entry.type || (entry.docId ? 'document' : 'note'),
                note: entry.note || '',
                docId: entry.docId || null,
                author: entry.author || window.ccConfig?.currentUser?.initials || 'UNK',
                timestamp: new Date().toISOString()
            };
            evidence.unshift(normalizedEntry);

            return await this.updateTask(clientId, taskId, { evidence, notes: entry.note || record.notes });
        }

        evaluateTaskStatus(record) {
            if (!record) return { state: 'pending', severity: 'low' };
            if (record.completed) {
                return { state: 'complete', severity: 'none' };
            }
            const dueInfo = this.getDueState(record);
            return dueInfo;
        }

        getDueState(record) {
            if (!record?.dueDate) {
                return { state: 'pending', severity: 'low' };
            }
            const today = new Date();
            const dueDate = new Date(record.dueDate);
            if (Number.isNaN(dueDate.getTime())) {
                return { state: 'pending', severity: 'low' };
            }
            const diffDays = Math.floor((dueDate - today) / (1000 * 60 * 60 * 24));
            if (diffDays < 0) {
                return { state: 'overdue', severity: diffDays < -3 ? 'critical' : 'high', days: diffDays };
            }
            if (diffDays <= 2) {
                return { state: 'dueSoon', severity: 'medium', days: diffDays };
            }
            return { state: 'pending', severity: 'low', days: diffDays };
        }

        async syncMilestoneStatus(clientId, taskId, completed) {
            const milestoneId = TASK_TO_MILESTONE_MAP[taskId];
            if (!milestoneId) return;
            const milestonesManager = window.milestonesManager;
            if (!milestonesManager || typeof milestonesManager.updateMilestoneStatus !== 'function') return;

            try {
                const statusMap = milestonesManager.statusTypes || {};
                const status = completed
                    ? statusMap.COMPLETE || 'complete'
                    : statusMap.NOT_STARTED || 'not_started';
                await milestonesManager.updateMilestoneStatus(
                    clientId,
                    milestoneId,
                    status,
                    '',
                    window.ccConfig?.currentUser?.initials || 'UNK'
                );
            } catch (error) {
                console.warn(`Failed to sync milestone for ${taskId}`, error);
            }
        }

        async syncClientMilestones(client) {
            if (!client || !client.id) return;
            const tasks = Object.keys(TASK_TO_MILESTONE_MAP);
            for (const taskId of tasks) {
                const legacyValue = typeof client[taskId] === 'boolean' ? client[taskId] : undefined;
                const taskStateCompleted = client.taskState?.[taskId]?.completed;
                const completed = typeof legacyValue === 'boolean' ? legacyValue : Boolean(taskStateCompleted);
                await this.syncMilestoneStatus(client.id, taskId, completed);
            }
        }
    }

    window.ClientTaskService = ClientTaskService;
})();

