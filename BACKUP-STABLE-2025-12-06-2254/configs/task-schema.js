/**
 * Task Schema Definition - CANONICAL Task Definitions
 * 
 * PURPOSE: Single source of truth for all client tasks and milestones.
 * Defines task IDs, labels, due dates, categories, and dependencies.
 * 
 * USAGE: Access via window.TaskSchema in browser context.
 * 
 * STRUCTURE:
 *   - categories: Color-coded groupings for UI display
 *   - tasks: Individual task definitions with:
 *       - id: Unique identifier (matches client.taskState keys)
 *       - label: Human-readable name
 *       - category: Category key for grouping
 *       - due: { type: 'daysAfterAdmission', days: N }
 *       - legacyField: Maps to old client object properties
 *       - dependsOn: Array of prerequisite task IDs
 * 
 * VERSIONING: Bump version when adding/modifying task definitions.
 * 
 * NOTE: TrackerEngine has a parallel hardcoded list - prefer this schema.
 */

(function registerTaskSchema() {
    if (typeof window === 'undefined') {
        return;
    }

    window.TaskSchema = {
        version: '2025.11.22',
        categories: {
            admission: {
                label: '48-Hour Admission',
                accent: '#0ea5e9'
            },
            aftercare: {
                label: 'Aftercare Planning',
                accent: '#8b5cf6'
            },
            clinical: {
                label: 'Clinical Assessments',
                accent: '#10b981'
            },
            documentation: {
                label: 'Discharge Documentation',
                accent: '#f97316'
            },
            asam: {
                label: 'ASAM & LOC',
                accent: '#ef4444'
            }
        },
        tasks: {
            needsAssessment: {
                id: 'needsAssessment',
                label: 'Needs Assessment',
                category: 'admission',
                description: 'Complete intake needs assessment within 48 hours.',
                due: { type: 'afterAdmission', days: 2 },
                defaultOwnerRole: 'caseManager',
                legacyField: 'needsAssessment',
                legacyDateField: 'needsAssessmentDate'
            },
            healthPhysical: {
                id: 'healthPhysical',
                label: 'Health & Physical',
                category: 'admission',
                description: 'Health & physical assessment within 48 hours.',
                due: { type: 'afterAdmission', days: 2 },
                defaultOwnerRole: 'primaryTherapist',
                legacyField: 'healthPhysical',
                legacyDateField: 'healthPhysicalDate'
            },
            aftercareThreadSent: {
                id: 'aftercareThreadSent',
                label: 'Aftercare Thread Sent',
                category: 'aftercare',
                description: 'Open aftercare planning thread with family by day 14.',
                due: { type: 'afterAdmission', days: 14 },
                defaultOwnerRole: 'clinicalCoach',
                legacyField: 'aftercareThreadSent',
                legacyDateField: 'aftercareThreadDate',
                autoCreates: ['optionsDocUploaded']
            },
            optionsDocUploaded: {
                id: 'optionsDocUploaded',
                label: 'Options Document Uploaded',
                category: 'aftercare',
                description: 'Upload the Aftercare Options document to Kipu.',
                due: { type: 'afterTaskComplete', task: 'aftercareThreadSent', days: 7 },
                dependsOn: ['aftercareThreadSent'],
                defaultOwnerRole: 'clinicalCoach',
                legacyField: 'optionsDocUploaded',
                legacyDateField: 'optionsDocUploadedDate',
                autoCreates: ['dischargePacketUploaded']
            },
            dischargePacketUploaded: {
                id: 'dischargePacketUploaded',
                label: 'Discharge Packet Uploaded',
                category: 'aftercare',
                description: 'Complete discharge packet and upload to Kipu.',
                due: { type: 'beforeDischarge', days: 2 },
                dependsOn: ['optionsDocUploaded'],
                defaultOwnerRole: 'caseManager',
                legacyField: 'dischargePacketUploaded',
                legacyDateField: 'dischargePacketDate',
                autoCreates: ['referralClosureCorrespondence']
            },
            referralClosureCorrespondence: {
                id: 'referralClosureCorrespondence',
                label: 'Referral Closure Correspondence',
                category: 'aftercare',
                description: 'Send closure correspondence to referral partners.',
                due: { type: 'afterTaskComplete', task: 'dischargePacketUploaded', days: 2 },
                dependsOn: ['dischargePacketUploaded'],
                defaultOwnerRole: 'caseManager',
                legacyField: 'referralClosureCorrespondence',
                legacyDateField: 'referralClosureDate'
            },
            gadCompleted: {
                id: 'gadCompleted',
                label: 'GAD-7 Anxiety Assessment',
                category: 'clinical',
                description: 'Complete the GAD-7 assessment by day 7.',
                due: { type: 'afterAdmission', days: 7 },
                defaultOwnerRole: 'primaryTherapist',
                legacyField: 'gadCompleted',
                legacyDateField: 'gadCompletedDate'
            },
            phqCompleted: {
                id: 'phqCompleted',
                label: 'PHQ-9 Depression Screening',
                category: 'clinical',
                description: 'Complete the PHQ-9 assessment by day 7.',
                due: { type: 'afterAdmission', days: 7 },
                defaultOwnerRole: 'primaryTherapist',
                legacyField: 'phqCompleted',
                legacyDateField: 'phqCompletedDate'
            },
            satisfactionSurvey: {
                id: 'satisfactionSurvey',
                label: 'Satisfaction Survey',
                category: 'clinical',
                description: 'Conduct family satisfaction survey before discharge.',
                due: { type: 'beforeDischarge', days: 3 },
                defaultOwnerRole: 'familyAmbassadorPrimary',
                legacyField: 'satisfactionSurvey',
                legacyDateField: 'satisfactionSurveyDate'
            },
            dischargeSummary: {
                id: 'dischargeSummary',
                label: 'Discharge Summary',
                category: 'documentation',
                description: 'Complete discharge summary in Kipu.',
                due: { type: 'beforeDischarge', days: 2 },
                defaultOwnerRole: 'primaryTherapist',
                legacyField: 'dischargeSummary',
                legacyDateField: 'dischargeSummaryDate'
            },
            dischargePlanningNote: {
                id: 'dischargePlanningNote',
                label: 'Discharge Planning Note',
                category: 'documentation',
                description: 'Finalize discharge planning note.',
                due: { type: 'beforeDischarge', days: 2 },
                defaultOwnerRole: 'clinicalCoach',
                legacyField: 'dischargePlanningNote',
                legacyDateField: 'dischargePlanningNoteDate'
            },
            dischargeASAM: {
                id: 'dischargeASAM',
                label: 'Discharge ASAM',
                category: 'asam',
                description: 'Complete ASAM upon discharge or step-down.',
                due: { type: 'beforeDischarge', days: 1 },
                defaultOwnerRole: 'caseManager',
                legacyField: 'dischargeASAM',
                legacyDateField: 'dischargeASAMDate'
            },
            asamAdmission: {
                id: 'asamAdmission',
                label: 'Admission ASAM Documented',
                category: 'asam',
                description: 'Admissions team completed ASAM at intake (for tracking only).',
                due: { type: 'atAdmission' },
                defaultOwnerRole: 'admissions',
                legacyField: 'asamAdmissionDocumented',
                legacyDateField: 'asamAdmissionDate'
            },
            asamContinued: {
                id: 'asamContinued',
                label: '30-Day Continued Stay ASAM',
                category: 'asam',
                description: 'Coach must complete continued stay ASAM every 30 days in same LOC.',
                due: { type: 'afterEpisodeStart', days: 30 },
                defaultOwnerRole: 'clinicalCoach',
                legacyField: 'asamContinuedDocumented',
                legacyDateField: 'asamContinuedDate'
            },
            asamStepDown: {
                id: 'asamStepDown',
                label: 'Step-Down / LOC Change ASAM',
                category: 'asam',
                description: 'Document ASAM when IU notifies a level-of-care change.',
                due: { type: 'afterLocChange', days: 2 },
                defaultOwnerRole: 'clinicalCoach',
                legacyField: 'asamStepDownDocumented',
                legacyDateField: 'asamStepDownDate'
            }
        }
    };

    console.log('✅ Task schema registered', window.TaskSchema);
})();

