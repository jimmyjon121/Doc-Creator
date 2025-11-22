/**
 * Client Task Service
 * Bridges TaskSchema metadata with ClientManager persistence
 */

(function registerTaskService() {
    if (typeof window === 'undefined') {
        return;
    }

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
    }

    window.ClientTaskService = ClientTaskService;
})();

