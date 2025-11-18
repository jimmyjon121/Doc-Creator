/**
 * Onboarding Practice Mode
 * Sandbox environment with sample clients and guided tasks.
 */

class OnboardingPractice {
    constructor(manager) {
        this.manager = manager;
        this.sampleClients = [];
        this.currentTask = 0;
        this.completedTasks = [];
        this.container = null;
        this.practiceState = this.createEmptyState();
    }

    createEmptyState() {
        return {
            completedMilestones: [],
            bulkUpdateUsed: false,
            itemsUpdated: 0,
            checklistViewed: false
        };
    }

    start() {
        return new Promise((resolve) => {
            this.resolve = resolve;
            this.practiceState = this.createEmptyState();
            this.generateSampleData();
            this.showIntro().then(() => {
                this.createPracticeEnvironment();
                this.startTask(0);
            });
        });
    }

    showIntro() {
        return new Promise((resolve) => {
            const intro = window.OnboardingContent.practice.intro;
            const modal = document.createElement('div');
            modal.className = 'onboarding-modal-overlay';
            modal.innerHTML = `
                <div class="onboarding-modal practice-intro">
                    <div class="modal-icon">🎯</div>
                    <h2>${intro.title}</h2>
                    <p>${intro.content}</p>
                    <div class="sample-clients-preview">
                        <div class="sample-client">
                            <div class="client-icon">👤</div>
                            <div class="client-info">
                                <strong>Client A</strong>
                                <span>Day 2 – Admission requirements due</span>
                            </div>
                        </div>
                        <div class="sample-client">
                            <div class="client-icon">👤</div>
                            <div class="client-info">
                                <strong>Client B</strong>
                                <span>Day 15 – Aftercare thread overdue</span>
                            </div>
                        </div>
                        <div class="sample-client">
                            <div class="client-icon">👤</div>
                            <div class="client-info">
                                <strong>Client C</strong>
                                <span>Day 28 – Discharge checklist pending</span>
                            </div>
                        </div>
                    </div>
                    <button class="btn-primary btn-large" data-role="start">${intro.action}</button>
                </div>
            `;

            document.body.appendChild(modal);
            modal.querySelector('[data-role="start"]').addEventListener('click', () => {
                modal.remove();
                resolve();
            });
        });
    }

    generateSampleData() {
        const today = new Date();
        const day = 24 * 60 * 60 * 1000;

        const clientA = {
            id: 'practice_client_a',
            initials: 'JD',
            firstName: 'Jane',
            lastName: 'Doe',
            houseId: 'Practice House',
            admissionDate: new Date(today.getTime() - 2 * day).toISOString(),
            dischargeDate: new Date(today.getTime() + 28 * day).toISOString(),
            caseManagerInitials: 'YOU',
            needsAssessment: false,
            healthPhysical: false,
            gadCompleted: false,
            phqCompleted: false,
            aftercareThreadSent: false,
            optionsDocUploaded: false,
            isPractice: true
        };

        const clientB = {
            id: 'practice_client_b',
            initials: 'SM',
            firstName: 'Sam',
            lastName: 'Miller',
            houseId: 'Practice House',
            admissionDate: new Date(today.getTime() - 15 * day).toISOString(),
            dischargeDate: new Date(today.getTime() + 15 * day).toISOString(),
            caseManagerInitials: 'YOU',
            needsAssessment: true,
            healthPhysical: true,
            gadCompleted: true,
            phqCompleted: true,
            aftercareThreadSent: false,
            optionsDocUploaded: false,
            isPractice: true
        };

        const clientC = {
            id: 'practice_client_c',
            initials: 'TW',
            firstName: 'Taylor',
            lastName: 'West',
            houseId: 'Practice House',
            admissionDate: new Date(today.getTime() - 28 * day).toISOString(),
            dischargeDate: new Date(today.getTime() + 2 * day).toISOString(),
            caseManagerInitials: 'YOU',
            needsAssessment: true,
            healthPhysical: true,
            gadCompleted: true,
            phqCompleted: true,
            aftercareThreadSent: true,
            optionsDocUploaded: true,
            dischargePacketUploaded: false,
            dischargeSummary: false,
            dischargeAsam: false,
            isPractice: true
        };

        this.sampleClients = [clientA, clientB, clientC];
    }

    createPracticeEnvironment() {
        this.container = document.createElement('div');
        this.container.className = 'practice-environment';
        this.container.innerHTML = `
            <div class="practice-header">
                <div class="practice-badge">
                    <span class="badge-icon">🎯</span>
                    <span class="badge-text">Practice Mode</span>
                </div>
                <div class="practice-progress" id="practice-task-count">Task 1 of 3</div>
                <button class="practice-exit" id="exit-practice">Exit Practice</button>
            </div>
            <div class="practice-content">
                <div class="practice-task-panel">
                    <div class="task-instruction">
                        <h3 id="task-title"></h3>
                        <p id="task-instruction"></p>
                        <div class="task-hint hidden" id="task-hint">
                            <span class="hint-icon">💡</span>
                            <span class="hint-text"></span>
                        </div>
                        <button class="btn-secondary btn-small" id="show-hint">Show Hint</button>
                    </div>
                    <div class="task-validation hidden" id="task-validation">
                        <div class="validation-icon">✓</div>
                        <p>Great job! You completed this task.</p>
                        <button class="btn-primary" id="next-task">Next Task →</button>
                    </div>
                </div>
                <div class="practice-dashboard">
                    <div class="practice-clients" id="practice-clients"></div>
                </div>
            </div>
        `;

        document.body.appendChild(this.container);
        this.container.querySelector('#exit-practice').addEventListener('click', () => this.exit());
        this.container.querySelector('#show-hint').addEventListener('click', () => this.showHint());
        this.container.querySelector('#next-task').addEventListener('click', () => this.nextTask());

        this.renderSampleClients();
    }

    renderSampleClients() {
        const list = this.container.querySelector('#practice-clients');
        list.innerHTML = '';

        this.sampleClients.forEach((client) => {
            const score = this.calculateCompletionScore(client);
            const card = document.createElement('div');
            card.className = 'practice-client-card';
            card.innerHTML = `
                <div class="client-header">
                    <div class="client-initials">${client.initials}</div>
                    <div class="client-info">
                        <div class="client-name">${client.firstName} ${client.lastName}</div>
                        <div class="client-meta">Day ${this.calculateDaysInCare(client.admissionDate)} • ${client.houseId}</div>
                    </div>
                </div>
                <div class="client-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width:${score.percentage}%"></div>
                    </div>
                    <span class="progress-text">${score.percentage}% complete</span>
                </div>
                <div class="client-actions">
                    <button class="btn-small" data-action="timeline" data-client="${client.id}">Timeline</button>
                    <button class="btn-small" data-action="bulk" data-client="${client.id}">Bulk Update</button>
                    <button class="btn-small" data-action="checklist" data-client="${client.id}">Checklist</button>
                </div>
            `;

            card.querySelector('[data-action="timeline"]').addEventListener('click', () => this.openTimeline(client.id));
            card.querySelector('[data-action="bulk"]').addEventListener('click', () => this.openBulkUpdate(client.id));
            card.querySelector('[data-action="checklist"]').addEventListener('click', () => this.openChecklist(client.id));

            list.appendChild(card);
        });
    }

    calculateCompletionScore(client) {
        const fields = [
            'needsAssessment',
            'healthPhysical',
            'gadCompleted',
            'phqCompleted',
            'aftercareThreadSent',
            'optionsDocUploaded',
            'dischargePacketUploaded',
            'dischargeSummary',
            'dischargeAsam'
        ];

        const total = fields.length;
        const completed = fields.filter((field) => client[field]).length;

        return {
            completed,
            total,
            percentage: Math.round((completed / total) * 100)
        };
    }

    calculateDaysInCare(admissionDate) {
        const admission = new Date(admissionDate);
        return Math.ceil((Date.now() - admission.getTime()) / (1000 * 60 * 60 * 24));
    }

    startTask(index) {
        const tasks = window.OnboardingContent.practice.tasks;
        if (index >= tasks.length) {
            this.complete();
            return;
        }

        this.currentTask = index;
        const task = tasks[index];

        this.container.querySelector('#practice-task-count').textContent = `Task ${index + 1} of ${tasks.length}`;
        this.container.querySelector('#task-title').textContent = task.title;
        this.container.querySelector('#task-instruction').textContent = task.instruction;
        this.container.querySelector('#task-hint .hint-text').textContent = task.hint;
        this.container.querySelector('#task-hint').classList.add('hidden');
        this.container.querySelector('#show-hint').classList.remove('hidden');
        this.container.querySelector('#task-validation').classList.add('hidden');

        this.startValidation(task);
    }

    startValidation(task) {
        clearInterval(this.validationInterval);
        this.validationInterval = setInterval(() => {
            if (task.validation(this.getTaskState())) {
                this.taskCompleted();
            }
        }, 500);
    }

    getTaskState() {
        return { ...this.practiceState };
    }

    taskCompleted() {
        clearInterval(this.validationInterval);
        if (!this.completedTasks.includes(this.currentTask)) {
            this.completedTasks.push(this.currentTask);
        }

        const validation = this.container.querySelector('#task-validation');
        validation.classList.remove('hidden');
        this.container.querySelector('#show-hint').classList.add('hidden');
        this.celebrateTaskCompletion();
    }

    celebrateTaskCompletion() {
        const celebration = document.createElement('div');
        celebration.className = 'task-celebration';
        celebration.textContent = '🎉';
        this.container.querySelector('.practice-task-panel').appendChild(celebration);
        setTimeout(() => celebration.remove(), 1800);
    }

    showHint() {
        this.container.querySelector('#task-hint').classList.remove('hidden');
        this.container.querySelector('#show-hint').classList.add('hidden');
    }

    nextTask() {
        this.startTask(this.currentTask + 1);
    }

    openTimeline(clientId) {
        const client = this.sampleClients.find((c) => c.id === clientId);
        if (!client) return;

        alert(`Timeline opened for ${client.initials}. In the live system you would mark milestones complete right here.`);
        this.practiceState.completedMilestones.push('aftercare_thread');
        if (this.currentTask === 0) {
            this.taskCompleted();
        }
    }

    openBulkUpdate(clientId) {
        const client = this.sampleClients.find((c) => c.id === clientId);
        if (!client) return;

        alert(`Bulk update opened for ${client.initials}. In the live system you would select items and save.`);
        this.practiceState.bulkUpdateUsed = true;
        this.practiceState.itemsUpdated = Math.max(this.practiceState.itemsUpdated, 2);
        if (this.currentTask === 1) {
            this.taskCompleted();
        }
    }

    openChecklist(clientId) {
        const client = this.sampleClients.find((c) => c.id === clientId);
        if (!client) return;

        alert(`Discharge checklist opened for ${client.initials}. In the live system you would review every required item.`);
        this.practiceState.checklistViewed = true;
        if (this.currentTask === 2) {
            this.taskCompleted();
        }
    }

    exit() {
        if (!confirm('Exit practice mode? You can resume from the tutorial later.')) return;
        this.cleanup();
        this.resolve();
    }

    complete() {
        clearInterval(this.validationInterval);
        this.cleanup();
        this.showCompletionMessage().then(() => this.resolve());
    }

    showCompletionMessage() {
        return new Promise((resolve) => {
            const completion = window.OnboardingContent.practice.completion;
            const modal = document.createElement('div');
            modal.className = 'onboarding-modal-overlay';
            modal.innerHTML = `
                <div class="onboarding-modal practice-completion">
                    <div class="modal-icon">🏆</div>
                    <h2>${completion.title}</h2>
                    <p>${completion.content}</p>
                    <div class="achievements">
                        ${completion.achievements
                            .map(
                                (achievement, index) => `
                            <div class="achievement" style="animation-delay:${index * 0.15}s">
                                <span class="achievement-icon">🏅</span>
                                <span class="achievement-name">${achievement}</span>
                            </div>
                        `
                            )
                            .join('')}
                    </div>
                    <button class="btn-primary btn-large" data-role="finish">Continue</button>
                </div>
            `;
            document.body.appendChild(modal);
            modal.querySelector('[data-role="finish"]').addEventListener('click', () => {
                modal.remove();
                resolve();
            });
        });
    }

    cleanup() {
        this.container?.remove();
        this.container = null;
        clearInterval(this.validationInterval);
        this.practiceState = this.createEmptyState();
    }
}

if (typeof window !== 'undefined') {
    window.OnboardingPractice = OnboardingPractice;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = OnboardingPractice;
}



