/**
 * Demo Data Generator for CareConnect Pro
 * Development-only utility for consistent test data
 * Version 2.0 - Clean implementation
 */

(function() {
    'use strict';

    // Only allow in development environment
    const isDevelopment = window.location.hostname === 'localhost' || 
                         window.location.hostname === '127.0.0.1' ||
                         window.location.protocol === 'file:';

    if (!isDevelopment) {
        return;
    }

    const DemoDataGenerator = {
        firstNames: ['Alex', 'Jordan', 'Casey', 'Morgan', 'Riley', 'Taylor', 'Jamie', 'Drew', 'Avery', 'Quinn'],
        lastNames: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'],
        houses: ['house_nest', 'house_cove', 'house_hedge', 'house_meridian', 'house_banyan', 'house_preserve'],
        careRoles: ['CM', 'BHT', 'RN', 'MD', 'LCSW'],
        insuranceTypes: ['Private', 'Medicaid', 'Medicare', 'Self-Pay'],
        programCatalog: [
            { id: 'prog_sunrise', name: 'Sunrise Academy', type: 'TBS', state: 'UT', city: 'Provo', dailyRate: 1450 },
            { id: 'prog_cove', name: 'Cove Residential', type: 'RTC', state: 'FL', city: 'Jupiter', dailyRate: 1850 },
            { id: 'prog_meridian', name: 'Meridian Peaks', type: 'Wilderness', state: 'CO', city: 'Durango', dailyRate: 1200 },
            { id: 'prog_horizon', name: 'Horizon Steps', type: 'IOP', state: 'CA', city: 'San Diego', dailyRate: 950 },
            { id: 'prog_northstar', name: 'NorthStar Transition', type: 'Sober Living', state: 'WA', city: 'Seattle', dailyRate: 650 },
            { id: 'prog_oak', name: 'Oak River PHP', type: 'PHP', state: 'GA', city: 'Atlanta', dailyRate: 1100 }
        ],
        payerNames: ['Aetna', 'BCBS', 'Cigna', 'United Healthcare', 'Magellan', 'Tricare', 'Optum'],
        dischargeDestinations: ['Home', 'RTC', 'TBS', 'PHP', 'IOP', 'Sober Living', 'Hospital'],
        analyticsUnavailableLogged: false,

        scenarios: {
            balanced: {
                key: 'balanced',
                label: 'Balanced mix',
                description: 'Realistic spread of stages and mid‑range compliance',
                stageWeights: { 'pre-admission': 0.10, 'early': 0.20, 'mid': 0.40, 'late': 0.20, 'discharged': 0.10 },
                compliance: { core: 0.85, aftercare: 0.7, dischargeDocs: 0.7, assessments: 0.75 },
                admitProbability: 0.8
            },
            highCensus: {
                key: 'highCensus',
                label: 'High census / active caseload',
                description: 'More mid/late clients, fewer discharged',
                stageWeights: { 'pre-admission': 0.05, 'early': 0.20, 'mid': 0.45, 'late': 0.25, 'discharged': 0.05 },
                compliance: { core: 0.8, aftercare: 0.6, dischargeDocs: 0.55, assessments: 0.7 },
                admitProbability: 0.85
            },
            lowCompliance: {
                key: 'lowCompliance',
                label: 'Low compliance / red zone',
                description: 'Many overdue documents and assessments',
                stageWeights: { 'pre-admission': 0.10, 'early': 0.25, 'mid': 0.35, 'late': 0.20, 'discharged': 0.10 },
                compliance: { core: 0.5, aftercare: 0.35, dischargeDocs: 0.3, assessments: 0.4 },
                admitProbability: 0.7
            },
            dischargeHeavy: {
                key: 'dischargeHeavy',
                label: 'Discharge‑heavy week',
                description: 'More clients at late/discharged stages with strong aftercare',
                stageWeights: { 'pre-admission': 0.05, 'early': 0.10, 'mid': 0.25, 'late': 0.30, 'discharged': 0.30 },
                compliance: { core: 0.9, aftercare: 0.85, dischargeDocs: 0.8, assessments: 0.8 },
                admitProbability: 0.9
            }
        },

        currentScenarioKey: null,

        sleep(ms = 100) {
            return new Promise(resolve => setTimeout(resolve, ms));
        },

        randomFromArray(list, fallback = null) {
            if (!Array.isArray(list) || list.length === 0) return fallback;
            return list[Math.floor(Math.random() * list.length)];
        },

        sampleProgram() {
            return this.randomFromArray(this.programCatalog, {
                id: 'prog_demo', name: 'Demo Program', type: 'RTC', state: 'FL', city: 'Palm Beach', dailyRate: 1500
            });
        },

        samplePayer() {
            return this.randomFromArray(this.payerNames, 'Aetna');
        },

        normalizeDate(dateInput) {
            if (!dateInput) return null;
            const date = dateInput instanceof Date ? new Date(dateInput.getTime()) : new Date(dateInput);
            return Number.isNaN(date.getTime()) ? null : date;
        },

        shiftDate(dateInput, days = 0) {
            const base = this.normalizeDate(dateInput);
            if (!base) return null;
            base.setDate(base.getDate() + days);
            return base.toISOString().split('T')[0];
        },

        generateInitials(firstName, lastName) {
            return (firstName[0] + lastName[0]).toUpperCase();
        },

        getScenarioKey() {
            if (this.currentScenarioKey && this.scenarios[this.currentScenarioKey]) {
                return this.currentScenarioKey;
            }
            const stored = localStorage.getItem('demoScenarioKey');
            if (stored && this.scenarios[stored]) {
                this.currentScenarioKey = stored;
                return stored;
            }
            this.currentScenarioKey = 'balanced';
            return this.currentScenarioKey;
        },

        getScenarioConfig() {
            return this.scenarios[this.getScenarioKey()] || this.scenarios.balanced;
        },

        setScenario(key) {
            if (!this.scenarios[key]) return this.getScenarioKey();
            this.currentScenarioKey = key;
            try { localStorage.setItem('demoScenarioKey', key); } catch (e) {}
            const select = document.getElementById('demoScenarioSelect');
            if (select) select.value = key;
            return key;
        },

        randomDate(start, end) {
            return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
        },

        generateClient(index, stage = null) {
            const scenario = this.getScenarioConfig();
            const firstName = this.firstNames[Math.floor(Math.random() * this.firstNames.length)];
            const lastName = this.lastNames[Math.floor(Math.random() * this.lastNames.length)];
            const initials = this.generateInitials(firstName, lastName);
            const house = this.houses[Math.floor(Math.random() * this.houses.length)];
            
            const today = new Date();
            const sixMonthsAgo = new Date(today);
            sixMonthsAgo.setMonth(today.getMonth() - 6);
            const oneMonthFromNow = new Date(today);
            oneMonthFromNow.setMonth(today.getMonth() + 1);

            let admissionDate = null;
            let dischargeDate = null;
            let referralDate = null;
            let intakeScheduledDate = null;
            let daysInCare = 0;

            if (!stage) {
                const weights = (scenario && scenario.stageWeights) || {
                    'pre-admission': 0.1, 'early': 0.2, 'mid': 0.4, 'late': 0.2, 'discharged': 0.1
                };
                const order = ['pre-admission', 'early', 'mid', 'late', 'discharged'];
                const r = Math.random();
                let acc = 0;
                for (const key of order) {
                    acc += weights[key] || 0;
                    if (r <= acc) { stage = key; break; }
                }
                if (!stage) stage = 'mid';
            }

            switch (stage) {
                case 'pre-admission':
                    referralDate = this.randomDate(new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000), today);
                    intakeScheduledDate = new Date(referralDate.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000);
                    break;
                case 'early':
                    daysInCare = Math.floor(Math.random() * 7);
                    admissionDate = new Date(today.getTime() - daysInCare * 24 * 60 * 60 * 1000);
                    referralDate = new Date(admissionDate.getTime() - 7 * 24 * 60 * 60 * 1000);
                    intakeScheduledDate = new Date(admissionDate.getTime() - 3 * 24 * 60 * 60 * 1000);
                    break;
                case 'mid':
                    daysInCare = 8 + Math.floor(Math.random() * 13);
                    admissionDate = new Date(today.getTime() - daysInCare * 24 * 60 * 60 * 1000);
                    referralDate = new Date(admissionDate.getTime() - 7 * 24 * 60 * 60 * 1000);
                    intakeScheduledDate = new Date(admissionDate.getTime() - 3 * 24 * 60 * 60 * 1000);
                    break;
                case 'late':
                    daysInCare = 21 + Math.floor(Math.random() * 8);
                    admissionDate = new Date(today.getTime() - daysInCare * 24 * 60 * 60 * 1000);
                    referralDate = new Date(admissionDate.getTime() - 7 * 24 * 60 * 60 * 1000);
                    intakeScheduledDate = new Date(admissionDate.getTime() - 3 * 24 * 60 * 60 * 1000);
                    break;
                case 'discharged':
                    daysInCare = 14 + Math.floor(Math.random() * 21);
                    const dischargeDaysAgo = Math.floor(Math.random() * 30);
                    admissionDate = new Date(today.getTime() - (daysInCare + dischargeDaysAgo) * 24 * 60 * 60 * 1000);
                    dischargeDate = new Date(admissionDate.getTime() + daysInCare * 24 * 60 * 60 * 1000);
                    referralDate = new Date(admissionDate.getTime() - 7 * 24 * 60 * 60 * 1000);
                    intakeScheduledDate = new Date(admissionDate.getTime() - 3 * 24 * 60 * 60 * 1000);
                    break;
            }

            const currentCoachInitials = window.ccConfig?.currentUser?.initials || 'JH';
            const sampleZips = ['33101', '90210', '10001', '60601', '75201', '98101', '02101', '85001', '30301', '19101'];
            const randomZip = sampleZips[Math.floor(Math.random() * sampleZips.length)];
            const lgbtqAffirming = Math.random() < 0.2;
            
            const client = {
                initials: initials,
                kipuId: `KIPU${String(1000 + index).padStart(4, '0')}`,
                houseId: admissionDate ? house : null,
                admissionDate: admissionDate ? admissionDate.toISOString().split('T')[0] : null,
                dischargeDate: dischargeDate ? dischargeDate.toISOString().split('T')[0] : null,
                referralDate: referralDate ? referralDate.toISOString().split('T')[0] : null,
                intakeScheduledDate: intakeScheduledDate ? intakeScheduledDate.toISOString().split('T')[0] : null,
                insuranceVerified: stage !== 'pre-admission',
                bedAssignment: admissionDate ? `Room${Math.floor(Math.random() * 10) + 1}` : null,
                zip: randomZip,
                homeCity: null,
                homeState: null,
                lgbtqAffirming: lgbtqAffirming,
                caseManagerInitials: currentCoachInitials,
                clinicalCoachInitials: currentCoachInitials,
                primaryTherapistInitials: this.generateInitials(
                    this.firstNames[Math.floor(Math.random() * this.firstNames.length)],
                    this.lastNames[Math.floor(Math.random() * this.lastNames.length)]
                ),
                familyAmbassadorPrimaryInitials: currentCoachInitials,
                familyAmbassadorSecondaryInitials: this.generateInitials(
                    this.firstNames[Math.floor(Math.random() * this.firstNames.length)],
                    this.lastNames[Math.floor(Math.random() * this.lastNames.length)]
                ),
                insuranceType: this.insuranceTypes[Math.floor(Math.random() * this.insuranceTypes.length)],
                insuranceAuthDays: Math.floor(Math.random() * 30) + 10,
                insuranceAuthExpiry: oneMonthFromNow.toISOString().split('T')[0],
                lastProgressNote: admissionDate ? new Date(today.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : null,
                treatmentPlanDue: admissionDate ? new Date(today.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : null,
                nextReview: admissionDate ? new Date(today.getTime() + Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : null,
                tags: [],
                notes: `Demo client generated at ${stage} stage`,
                programHistory: [],
                documentHistory: [],
                createdAt: admissionDate ? admissionDate.toISOString() : (referralDate ? new Date(referralDate).toISOString() : today.toISOString()),
                updatedAt: today.toISOString(),
                lastModifiedBy: 'demo-generator',
                isDemo: true,
                _demoStage: stage
            };
            
            this.applyScenarioToClient(client, stage, scenario);
            return client;
        },

        applyScenarioToClient(client, stage, scenario) {
            if (!client || !client.admissionDate) return;

            const cfg = scenario || this.getScenarioConfig();
            const compliance = cfg && cfg.compliance ? cfg.compliance : {};

            const coreRate = typeof compliance.core === 'number' ? compliance.core : 0.8;
            const aftercareRate = typeof compliance.aftercare === 'number' ? compliance.aftercare : 0.65;
            const dischargeDocsRate = typeof compliance.dischargeDocs === 'number' ? compliance.dischargeDocs : 0.65;
            const assessmentsRate = typeof compliance.assessments === 'number' ? compliance.assessments : 0.7;

            const pick = (rate) => Math.random() < rate;

            const setFlag = (field, rate, baseKey = 'admissionDate', minOffsetDays = 0, maxOffsetDays = 21) => {
                const effectiveRate = typeof rate === 'number' ? rate : 0.7;
                if (!pick(effectiveRate)) return;

                const baseDateStr = client[baseKey] || client.admissionDate;
                const offset = minOffsetDays + Math.floor(Math.random() * Math.max(1, (maxOffsetDays - minOffsetDays + 1)));
                const dateStr = this.shiftDate(baseDateStr, offset);

                client[field] = true;
                if (dateStr) client[`${field}Date`] = dateStr;
            };

            if (stage !== 'pre-admission') {
                setFlag('needsAssessment', coreRate, 'admissionDate', 0, 2);
                setFlag('healthPhysical', coreRate, 'admissionDate', 0, 2);
            }

            if (stage === 'mid' || stage === 'late' || stage === 'discharged') {
                setFlag('gadCompleted', assessmentsRate, 'admissionDate', 3, 10);
                setFlag('phqCompleted', assessmentsRate, 'admissionDate', 3, 10);
                setFlag('satisfactionSurvey', assessmentsRate, client.dischargeDate ? 'dischargeDate' : 'admissionDate', 0, 5);
            }

            if (stage === 'mid' || stage === 'late' || stage === 'discharged') {
                if (pick(aftercareRate)) {
                    client.aftercareThreadSent = true;
                    setFlag('aftercareThreadSent', aftercareRate, 'admissionDate', 10, 20);
                    client.aftercareThread = true;
                    client.aftercareThreadDate = client.aftercareThreadSentDate || client.aftercareThreadDate;
                }

                if (client.aftercareThreadSent && pick(aftercareRate)) {
                    setFlag('optionsDocUploaded', aftercareRate, client.aftercareThreadSentDate ? 'aftercareThreadSentDate' : 'admissionDate', 5, 10);
                }

                if ((stage === 'late' || stage === 'discharged') && pick(aftercareRate)) {
                    setFlag('dischargePacketUploaded', aftercareRate, client.dischargeDate ? 'dischargeDate' : 'admissionDate', -2, 2);
                }
            }

            if (stage === 'late' || stage === 'discharged') {
                const baseKey = client.dischargeDate ? 'dischargeDate' : 'admissionDate';
                setFlag('dischargeSummary', dischargeDocsRate, baseKey, -2, 1);
                setFlag('dischargePlanningNote', dischargeDocsRate, baseKey, -2, 1);
                setFlag('dischargeASAM', dischargeDocsRate, baseKey, -2, 1);
            }
        },

        async ensureAnalyticsReady(timeoutMs = 5000) {
            const start = Date.now();
            while ((!window.CareConnectAnalytics || !window.analyticsHooks) && (Date.now() - start) < timeoutMs) {
                await this.sleep(100);
            }
            if (!window.CareConnectAnalytics || !window.analyticsHooks || !window.analyticsDB) {
                return false;
            }
            try {
                if (typeof window.analyticsDB.init === 'function' && !window.analyticsDB.db) {
                    await window.analyticsDB.init();
                }
            } catch (error) {
                return false;
            }
            return true;
        },

        async resetAnalyticsStores() {
            const ready = await this.ensureAnalyticsReady();
            if (!ready) return false;

            const stores = ['users', 'referrals', 'clinical_documents', 'authorizations', 'program_relationships', 'tasks', 'analytics_events', 'export_history'];

            for (const store of stores) {
                try {
                    if (typeof window.analyticsDB.clear === 'function') {
                        await window.analyticsDB.clear(store);
                    }
                } catch (error) {}
            }

            return true;
        },

        async ensureClientManagerReady(timeoutMs = 10000) {
            if (window.clientManager) return true;
            
            return new Promise((resolve) => {
                const onReady = () => {
                    clearTimeout(timer);
                    window.removeEventListener('clientManagerReady', onReady);
                    resolve(!!window.clientManager);
                };
                
                const timer = setTimeout(() => {
                    window.removeEventListener('clientManagerReady', onReady);
                    console.error('Timed out waiting for client manager');
                    resolve(false);
                }, timeoutMs);
                
                window.addEventListener('clientManagerReady', onReady, { once: true });
            });
        },

        async clearAllClients() {
            const ready = await this.ensureClientManagerReady();
            if (!ready || !window.clientManager) return false;
            
            try {
                const clients = await window.clientManager.getAllClients();
                for (const client of clients) {
                    await window.clientManager.deleteClient(client.id);
                }
                return true;
            } catch (error) {
                console.error('Error clearing clients:', error);
                return false;
            }
        },

        async generateDemoClients(count = 10) {
            const ready = await this.ensureClientManagerReady();
            if (!ready || !window.clientManager) {
                console.error('Client manager not available');
                return false;
            }

            const stages = ['pre-admission', 'early', 'mid', 'late', 'discharged'];
            const scenario = this.getScenarioConfig();
            const weights = (scenario && scenario.stageWeights) || {
                'pre-admission': 0.1, 'early': 0.2, 'mid': 0.3, 'late': 0.3, 'discharged': 0.1
            };

            const stageDistribution = {};
            stages.forEach(stage => {
                const w = typeof weights[stage] === 'number' ? weights[stage] : 0;
                stageDistribution[stage] = w > 0 ? Math.max(1, Math.floor(count * w)) : 0;
            });

            const totalDistributed = Object.values(stageDistribution).reduce((a, b) => a + b, 0);
            if (totalDistributed < count) {
                stageDistribution['mid'] = (stageDistribution['mid'] || 0) + (count - totalDistributed);
            }

            const generatedClients = [];
            let clientIndex = 1;
            
            try {
                for (const stage of stages) {
                    const stageCount = stageDistribution[stage];
                    let stageCreated = 0;
                    let stageAttempts = 0;
                    const maxAttempts = stageCount * 5;
                    
                    while (stageCreated < stageCount && stageAttempts < maxAttempts) {
                        stageAttempts++;
                        try {
                            const clientData = this.generateClient(clientIndex, stage);
                            if (!clientData.initials || !clientData.kipuId) {
                                throw new Error(`Invalid client data`);
                            }
                            const client = await window.clientManager.createClient(clientData);
                            if (!client || !client.id) {
                                throw new Error(`Failed to create client`);
                            }
                            generatedClients.push(client);
                            try {
                                await this.seedAnalyticsForClient(client);
                            } catch (seedError) {}
                            stageCreated++;
                            clientIndex++;
                        } catch (clientError) {
                            clientIndex++;
                        }
                    }
                }
                
                if (generatedClients.length === 0) {
                    throw new Error('Failed to create any clients');
                }
                
                if (window.clientManager && window.clientManager.notifyListeners) {
                    window.clientManager.notifyListeners();
                }
                
                if (window.refreshClientList) window.refreshClientList();
                if (window.initializeDashboard) setTimeout(() => window.initializeDashboard(true), 500);
                
                return generatedClients;
            } catch (error) {
                console.error('Error generating demo clients:', error);
                return false;
            }
        },

        async resetDemoData(count = 10) {
            const ready = await this.ensureClientManagerReady();
            if (!ready || !window.clientManager) {
                throw new Error('Client manager not available');
            }
            
            const cleared = await this.clearAllClients();
            if (!cleared) throw new Error('Failed to clear existing data');
            
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const generated = await this.generateDemoClients(count);
            if (!generated || !Array.isArray(generated) || generated.length === 0) {
                throw new Error(`Failed to generate demo data`);
            }
            
            return true;
        },

        async clearDemoData() {
            if (!confirm('Are you sure you want to clear ALL client data? This cannot be undone.')) return;

            const loadingMsg = document.createElement('div');
            loadingMsg.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0,0,0,0.9); color: white; padding: 20px 40px; border-radius: 8px; z-index: 10000; font-family: system-ui;';
            loadingMsg.textContent = 'Clearing all client data...';
            document.body.appendChild(loadingMsg);

            try {
                const cleared = await this.clearAllClients();
                if (!cleared) throw new Error('Failed to clear existing clients');

                if (window.clientManager && window.clientManager.notifyListeners) {
                    window.clientManager.notifyListeners();
                }
                if (window.refreshClientList) window.refreshClientList();
                if (window.initializeDashboard) await window.initializeDashboard(true);
                if (typeof window.initializeCMTracker === 'function') await window.initializeCMTracker();

                loadingMsg.textContent = 'All client data cleared!';
                loadingMsg.style.background = 'rgba(0,150,0,0.9)';
                
                setTimeout(() => {
                    if (document.body.contains(loadingMsg)) document.body.removeChild(loadingMsg);
                }, 2000);
            } catch (error) {
                console.error('Error clearing demo data:', error);
                loadingMsg.textContent = `Error: ${error.message}`;
                loadingMsg.style.background = 'rgba(150,0,0,0.9)';
                setTimeout(() => {
                    if (document.body.contains(loadingMsg)) document.body.removeChild(loadingMsg);
                }, 3000);
            }
        },

        async seedAnalyticsForClient(client) {
            if (!client || !window.analyticsHooks) return;
            const ready = await this.ensureAnalyticsReady();
            if (!ready) return;

            const stage = client._demoStage || 'mid';
            const program = this.sampleProgram();
            const referralDate = client.referralDate || this.shiftDate(client.admissionDate || new Date(), -10) || this.shiftDate(new Date(), -20);
            const shouldAdmit = stage !== 'pre-admission' && Math.random() > 0.15;

            let referralRecord = null;
            try {
                referralRecord = await window.analyticsHooks.logReferral({
                    clientId: client.id,
                    clientInitials: client.initials,
                    programId: program.id,
                    programName: program.name,
                    programType: program.type,
                    programState: program.state,
                    programCity: program.city,
                    referralDate,
                    referralMethod: 'phone',
                    notes: `Demo referral for ${stage} stage`
                });
            } catch (error) {}

            if (referralRecord?.id) {
                if (shouldAdmit) {
                    try {
                        await window.analyticsHooks.updateReferralStatus(referralRecord.id, 'admitted', {
                            admissionDate: client.admissionDate || referralDate,
                            programName: program.name,
                            estimatedLOS: 30 + Math.floor(Math.random() * 20),
                            estimatedDailyRate: program.dailyRate
                        });
                    } catch (error) {}
                } else if (Math.random() < 0.4) {
                    try {
                        await window.analyticsHooks.updateReferralStatus(referralRecord.id, 'declined', {
                            reason: 'family_selected_other',
                            notes: 'Demo decline'
                        });
                    } catch (error) {}
                }
            }

            if (shouldAdmit && window.analyticsHooks.logDocumentGenerated) {
                const docDueDate = this.shiftDate(client.admissionDate || referralDate, 10);
                try {
                    const document = await window.analyticsHooks.logDocumentGenerated({
                        clientId: client.id,
                        clientInitials: client.initials,
                        documentType: stage === 'late' || stage === 'discharged' ? 'aftercare_plan' : 'treatment_plan',
                        dueDate: docDueDate,
                        notes: 'Demo document'
                    });
                    if (document?.id && (stage === 'late' || stage === 'discharged')) {
                        await window.analyticsHooks.completeDocument(document.id, {
                            completedDate: this.shiftDate(docDueDate, 2),
                            uploadedToEMR: true,
                            emrDocumentId: `demo_doc_${document.id}`
                        });
                    }
                } catch (error) {}
            }

            if (shouldAdmit && window.analyticsHooks.logAuthorization) {
                const requestDate = this.shiftDate(client.admissionDate || referralDate, -2) || referralDate;
                try {
                    const authRecord = await window.analyticsHooks.logAuthorization({
                        clientId: client.id,
                        clientInitials: client.initials,
                        payerName: this.samplePayer(),
                        authorizationType: 'concurrent',
                        requestDate,
                        daysRequested: 30 + Math.floor(Math.random() * 15),
                        notes: 'Demo authorization'
                    });
                    if (authRecord?.id) {
                        const decision = Math.random() < 0.15 ? 'denied' : 'approved';
                        await window.analyticsHooks.updateAuthorizationDecision(authRecord.id, decision, {
                            decisionDate: this.shiftDate(requestDate, 5),
                            daysApproved: decision === 'approved' ? 30 : 0,
                            denialReason: decision === 'denied' ? 'medical_necessity' : null
                        });
                    }
                } catch (error) {}
            }

            if (window.analyticsHooks.logTask) {
                try {
                    const task = await window.analyticsHooks.logTask({
                        clientId: client.id,
                        taskType: stage === 'pre-admission' ? 'outreach' : 'documentation',
                        category: stage === 'pre-admission' ? 'business_dev' : 'clinical',
                        title: stage === 'pre-admission' ? 'Demo outreach' : 'Demo documentation',
                        description: 'Demo task',
                        dueDate: this.shiftDate(client.admissionDate || referralDate, stage === 'pre-admission' ? 2 : 5),
                        priority: Math.random() < 0.3 ? 'high' : 'medium'
                    });
                    if (task?.id && (stage === 'late' || stage === 'discharged' || Math.random() > 0.6)) {
                        await window.analyticsHooks.completeTask(task.id, 'Demo completion');
                    }
                } catch (error) {}
            }

            if (window.analyticsHooks.logProgramContact) {
                try {
                    await window.analyticsHooks.logProgramContact(program.id, {
                        programName: program.name,
                        contactType: Math.random() < 0.4 ? 'tour' : 'call',
                        contactDate: this.shiftDate(referralDate, 3),
                        contactPerson: 'Admissions',
                        notes: 'Demo contact'
                    });
                } catch (error) {}
            }

            if (shouldAdmit && client.admissionDate && window.analyticsHooks.logClientAdmission) {
                try {
                    await window.analyticsHooks.logClientAdmission(client.id, {
                        admissionDate: client.admissionDate,
                        admissionSource: 'demo',
                        insurancePayer: this.samplePayer(),
                        referringProgramName: program.name
                    });
                } catch (error) {}
            }

            if (client.dischargeDate && window.analyticsHooks.logClientDischarge) {
                try {
                    const lengthOfStay = client.admissionDate
                        ? Math.max(1, Math.round((new Date(client.dischargeDate) - new Date(client.admissionDate)) / (1000 * 60 * 60 * 24)))
                        : null;
                    await window.analyticsHooks.logClientDischarge(client.id, {
                        dischargeDate: client.dischargeDate,
                        dischargeType: Math.random() < 0.1 ? 'ama' : 'planned',
                        dischargeDestination: this.randomFromArray(this.dischargeDestinations, 'Home'),
                        lengthOfStay,
                        aftercarePlanFinalized: stage === 'discharged'
                    });
                } catch (error) {}
            }
        },

        async seedHistoricalAnalytics(count = 24) {
            if (!window.analyticsHooks) return;
            const ready = await this.ensureAnalyticsReady();
            if (!ready) return;

            const now = new Date();
            for (let i = 0; i < count; i++) {
                const monthsAgo = 2 + Math.floor(Math.random() * 9);
                const base = new Date(now);
                base.setMonth(base.getMonth() - monthsAgo);
                const referralDate = this.shiftDate(base, -7) || this.shiftDate(now, -90);
                const pseudoClientId = `historic_client_${monthsAgo}_${i}`;
                const pseudoInitials = `HC${(i % 26).toString(36).toUpperCase()}`;
                const program = this.sampleProgram();

                let referral = null;
                try {
                    referral = await window.analyticsHooks.logReferral({
                        clientId: pseudoClientId,
                        clientInitials: pseudoInitials,
                        programId: program.id,
                        programName: program.name,
                        programType: program.type,
                        programState: program.state,
                        referralDate,
                        referralMethod: 'email',
                        notes: `Historical referral (${monthsAgo} months ago)`
                    });
                } catch (error) {}

                if (!referral?.id) continue;

                const admitted = Math.random() > 0.35;
                if (admitted) {
                    const admissionDate = this.shiftDate(referralDate, 5);
                    const dischargeDate = this.shiftDate(admissionDate, 30 + Math.floor(Math.random() * 30));

                    try {
                        await window.analyticsHooks.updateReferralStatus(referral.id, 'admitted', {
                            admissionDate,
                            programName: program.name,
                            estimatedLOS: 45,
                            estimatedDailyRate: program.dailyRate
                        });
                    } catch (error) {}

                    if (window.analyticsHooks.logDocumentGenerated) {
                        try {
                            const doc = await window.analyticsHooks.logDocumentGenerated({
                                clientId: pseudoClientId,
                                clientInitials: pseudoInitials,
                                documentType: 'discharge_packet',
                                dueDate: dischargeDate,
                                notes: 'Historical discharge packet'
                            });
                            if (doc?.id) {
                                await window.analyticsHooks.completeDocument(doc.id, {
                                    completedDate: dischargeDate,
                                    uploadedToEMR: true
                                });
                            }
                        } catch (error) {}
                    }

                    if (window.analyticsHooks.logAuthorization) {
                        try {
                            const histAuth = await window.analyticsHooks.logAuthorization({
                                clientId: pseudoClientId,
                                clientInitials: pseudoInitials,
                                payerName: this.samplePayer(),
                                requestDate: referralDate,
                                daysRequested: 35,
                                authorizationType: 'concurrent'
                            });
                            if (histAuth?.id) {
                                await window.analyticsHooks.updateAuthorizationDecision(histAuth.id, 'approved', {
                                    decisionDate: this.shiftDate(referralDate, 6),
                                    daysApproved: 35
                                });
                            }
                        } catch (error) {}
                    }

                    if (window.analyticsHooks.logClientDischarge) {
                        try {
                            await window.analyticsHooks.logClientDischarge(pseudoClientId, {
                                dischargeDate,
                                dischargeType: 'planned',
                                dischargeDestination: this.randomFromArray(this.dischargeDestinations, 'Home'),
                                lengthOfStay: 40,
                                aftercarePlanFinalized: true
                            });
                        } catch (error) {}
                    }
                } else {
                    try {
                        await window.analyticsHooks.updateReferralStatus(referral.id, 'declined', {
                            reason: 'no_response',
                            notes: 'Historical decline'
                        });
                    } catch (error) {}
                }

                if (window.analyticsHooks.logProgramContact) {
                    try {
                        await window.analyticsHooks.logProgramContact(program.id, {
                            programName: program.name,
                            contactType: 'call',
                            contactDate: this.shiftDate(referralDate, 4),
                            notes: 'Historical contact'
                        });
                    } catch (error) {}
                }
            }
        },

        async populateDemoClients() {
            const scenario = this.getScenarioConfig();
            const scenarioLabel = scenario?.label || 'Balanced mix';
            const scenarioDescription = scenario?.description || '';

            const countStr = prompt(
                `How many demo clients would you like to generate?\n\n` +
                `Active scenario: ${scenarioLabel}\n${scenarioDescription ? '• ' + scenarioDescription + '\n\n' : '\n'}` +
                `Clients will be distributed across stages according to this scenario.`,
                '20'
            );
            
            if (!countStr) return;
            
            const count = parseInt(countStr, 10);
            if (isNaN(count) || count < 1 || count > 1000) {
                alert('Please enter a valid number between 1 and 1000');
                return;
            }

            const loadingMsg = document.createElement('div');
            loadingMsg.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0,0,0,0.9); color: white; padding: 20px 40px; border-radius: 8px; z-index: 10000; font-family: system-ui;';
            loadingMsg.textContent = `Generating ${count} demo clients...`;
            document.body.appendChild(loadingMsg);

            try {
                const ready = await this.ensureClientManagerReady();
                if (!ready || !window.clientManager) {
                    throw new Error('Client manager is not ready');
                }

                loadingMsg.textContent = `Clearing existing clients...`;
                const cleared = await this.clearAllClients();
                if (!cleared) throw new Error('Failed to clear existing clients');

                loadingMsg.textContent = `Clearing analytics history...`;
                await this.resetAnalyticsStores();
                await new Promise(resolve => setTimeout(resolve, 500));

                loadingMsg.textContent = `Generating ${count} demo clients...`;
                const generated = await this.generateDemoClients(count);
                if (!generated || !Array.isArray(generated) || generated.length === 0) {
                    throw new Error(`Failed to generate demo clients`);
                }

                loadingMsg.textContent = `Adding historical analytics...`;
                await this.seedHistoricalAnalytics(24);

                loadingMsg.textContent = `Refreshing views...`;
                
                if (window.clientManager && window.clientManager.notifyListeners) {
                    window.clientManager.notifyListeners();
                }
                if (window.refreshClientList) window.refreshClientList();
                if (window.initializeDashboard) await window.initializeDashboard(true);
                if (typeof window.initializeCMTracker === 'function') await window.initializeCMTracker();
                if (window.eventBus) {
                    window.eventBus.emit('clients:updated');
                    window.eventBus.emit('dashboard:refresh');
                }
                
                loadingMsg.textContent = `Generated ${generated.length} demo clients!`;
                loadingMsg.style.background = 'rgba(0,150,0,0.9)';
                
                setTimeout(() => {
                    if (document.body.contains(loadingMsg)) document.body.removeChild(loadingMsg);
                }, 2000);
            } catch (error) {
                console.error('Error populating demo clients:', error);
                loadingMsg.textContent = `Error: ${error.message}`;
                loadingMsg.style.background = 'rgba(150,0,0,0.9)';
                setTimeout(() => {
                    if (document.body.contains(loadingMsg)) document.body.removeChild(loadingMsg);
                }, 5000);
            }
        },

        init() {
            window.demoData = {
                generate: (count) => this.generateDemoClients(count),
                clear: () => this.clearAllClients(),
                reset: (count) => this.resetDemoData(count),
                populate: () => this.populateDemoClients(),
                clearUI: () => this.clearDemoData(),
                setScenario: (key) => this.setScenario(key),
                getScenario: () => this.getScenarioConfig()
            };
            
            window.populateDemoClients = () => this.populateDemoClients();
            window.clearDemoData = () => this.clearDemoData();
            window.setDemoScenario = (key) => this.setScenario(key);

            const select = document.getElementById('demoScenarioSelect');
            if (select) select.value = this.getScenarioKey();
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => DemoDataGenerator.init());
    } else {
        DemoDataGenerator.init();
    }

    window.DemoDataGenerator = DemoDataGenerator;
    window.demoDataGenerator = DemoDataGenerator;
    try {
        window.dispatchEvent(new CustomEvent('demoDataReady'));
    } catch (err) {}
})();
