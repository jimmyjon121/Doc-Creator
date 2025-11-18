(function() {
    'use strict';

    const HOUSES = ['house_nest', 'house_cove', 'house_hedge', 'house_meridian', 'house_banyan', 'house_preserve'];
    const COACHES = ['JH', 'AD', 'UN', 'KS', 'LM', 'TR'];
    const CASE_MANAGERS = ['MB', 'CF', 'ES', 'RG', 'PK', 'LV'];
    const THERAPISTS = ['BL', 'DW', 'ET', 'SN', 'QP', 'VA'];
    const AMBASSADORS = ['SR', 'MP', 'CV', 'LM', 'HW', 'JG'];
    const VIEW_PREFERENCES = ['options', 'plans'];

    const PROGRAM_OPTIONS = [
        { id: 'harbor_haven', name: 'Harbor Haven Intensive Outpatient', type: 'PHP/IOP' },
        { id: 'seaside_bridge', name: 'Seaside Bridge Transition Home', type: 'Residential' },
        { id: 'cedar_path', name: 'Cedar Path Family Collective', type: 'Family Coaching' },
        { id: 'beacon_therapeutic', name: 'Beacon Therapeutic', type: 'Therapeutic Boarding' },
        { id: 'summit_step', name: 'Summit Step Recovery', type: 'Sober Living' },
        { id: 'blue_sky', name: 'Blue Sky Mood & Anxiety', type: 'PHP/IOP' }
    ];

    const STAGES = [
        { key: 'week1', minDays: 0, maxDays: 7 },
        { key: 'day14to16', minDays: 14, maxDays: 16 },  // Critical aftercare window
        { key: 'day30', minDays: 28, maxDays: 32 },
        { key: 'day45plus', minDays: 45, maxDays: 60 },
        { key: 'discharge_pipeline', minDays: 40, maxDays: 65, dischargeWindow: [0, 5] },
        { key: 'recent_discharged', minDays: 50, maxDays: 70, dischargeWindow: [-7, -1] }
    ];

    const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    function randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function randomItem(list) {
        return list[randomInt(0, list.length - 1)];
    }

    function shiftDate(baseDate, days) {
        const result = new Date(baseDate);
        result.setDate(result.getDate() + days);
        return result;
    }

    function formatDate(date) {
        return date.toISOString().split('T')[0];
    }

    function makeInitials(index) {
        const letterA = LETTERS[index % LETTERS.length];
        const letterB = LETTERS[(index * 3) % LETTERS.length];
        const letterC = LETTERS[(index * 7) % LETTERS.length];
        return Math.random() > 0.5 ? `${letterA}${letterB}` : `${letterA}${letterB}${letterC}`;
    }

    function buildAftercareOptions(daysInCare) {
        if (daysInCare < 14) return [];

        const optionCount = Math.random() > 0.7 ? 2 : 1;
        const options = [];
        for (let i = 0; i < optionCount; i++) {
            const template = PROGRAM_OPTIONS[(i + randomInt(0, PROGRAM_OPTIONS.length - 1)) % PROGRAM_OPTIONS.length];
            const statusPool = ['exploring', 'assessment', 'accepted', 'declined'];
            const status = daysInCare > 40 ? randomItem(statusPool) : randomItem(statusPool.slice(0, 3));

            options.push({
                programId: `${template.id}_${randomInt(100, 999)}`,
                programName: template.name,
                programType: template.type,
                status,
                familyContacted: Math.random() > 0.2,
                familyContactDate: formatDate(shiftDate(new Date(), -randomInt(5, 20))),
                recordsRequested: Math.random() > 0.4,
                recordsRequestDate: formatDate(shiftDate(new Date(), -randomInt(3, 15))),
                recordsSent: Math.random() > 0.5,
                recordsSentDate: formatDate(shiftDate(new Date(), -randomInt(2, 10))),
                assessmentScheduled: Math.random() > 0.6,
                assessmentDate: Math.random() > 0.6 ? formatDate(shiftDate(new Date(), randomInt(-7, 7))) : null,
                assessmentCompleted: Math.random() > 0.6,
                accepted: status === 'accepted',
                acceptanceDate: status === 'accepted' ? formatDate(shiftDate(new Date(), -randomInt(1, 12))) : null,
                lastUpdated: new Date().toISOString(),
                dateAdded: formatDate(shiftDate(new Date(), -randomInt(5, 25)))
            });
        }

        return options;
    }

    function buildCheckboxState(daysInCare, threshold) {
        const complete = daysInCare >= threshold ? Math.random() > 0.25 : false;
        return {
            complete,
            date: complete ? formatDate(shiftDate(new Date(), -randomInt(1, 7))) : null
        };
    }

    function determineDischargeDate(stage, today) {
        if (!stage.dischargeWindow) return null;
        const offset = randomInt(stage.dischargeWindow[0], stage.dischargeWindow[1]);
        return formatDate(shiftDate(today, offset));
    }

    function buildClient(stage, index, today) {
        const daysInCare = randomInt(stage.minDays, stage.maxDays);
        const admissionDate = formatDate(shiftDate(today, -daysInCare));
        const dischargeDate = determineDischargeDate(stage, today);
        const initials = makeInitials(index);
        const kipuId = `DEMO-${Date.now().toString().slice(-4)}${index}${randomInt(10, 99)}`;
        const houseId = randomItem(HOUSES);
        const status = dischargeDate ? 'discharged' : 'active';

        const needsAssessment = buildCheckboxState(daysInCare, 1);
        const healthPhysical = buildCheckboxState(daysInCare, 7);
        const gadState = buildCheckboxState(daysInCare, 10);
        const phqState = buildCheckboxState(daysInCare, 14);
        const surveyState = buildCheckboxState(daysInCare, 25);

        // For clients in day 14-16 window, make some without aftercare thread to show alerts
        const aftercareThread = daysInCare >= 14 ? 
            (stage.key === 'day14to16' ? Math.random() > 0.6 : Math.random() > 0.35) : false;
        const optionsDoc = daysInCare >= 18 ? Math.random() > 0.4 : false;
        const dischargePacket = dischargeDate ? Math.random() > 0.45 : daysInCare >= 30 ? Math.random() > 0.65 : false;
        const closureCorrespondence = dischargeDate ? Math.random() > 0.4 : Math.random() > 0.75;

        return {
            initials,
            kipuId,
            houseId,
            admissionDate,
            dischargeDate,
            status,
            referralDate: formatDate(shiftDate(new Date(admissionDate), -7)),
            intakeScheduledDate: formatDate(shiftDate(new Date(admissionDate), -3)),
            insuranceVerified: Math.random() > 0.2,
            bedAssignment: `${houseId.split('_')[1] || 'suite'}-Rm${randomInt(1, 8)}`,
            clinicalCoachInitials: randomItem(COACHES),
            caseManagerInitials: randomItem(CASE_MANAGERS),
            primaryTherapistInitials: randomItem(THERAPISTS),
            familyAmbassadorPrimaryInitials: randomItem(AMBASSADORS),
            familyAmbassadorSecondaryInitials: randomItem(AMBASSADORS),
            needsAssessment: needsAssessment.complete,
            needsAssessmentDate: needsAssessment.date,
            healthPhysical: healthPhysical.complete,
            healthPhysicalDate: healthPhysical.date,
            aftercareThreadSent: aftercareThread,
            aftercareThreadDate: aftercareThread ? formatDate(shiftDate(new Date(), -randomInt(1, 6))) : null,
            optionsDocUploaded: optionsDoc,
            optionsDocUploadedDate: optionsDoc ? formatDate(shiftDate(new Date(), -randomInt(1, 4))) : null,
            dischargePacketUploaded: dischargePacket,
            dischargePacketDate: dischargePacket ? formatDate(shiftDate(new Date(), -randomInt(0, 3))) : null,
            referralClosureCorrespondence: closureCorrespondence,
            referralClosureDate: closureCorrespondence ? formatDate(shiftDate(new Date(), -randomInt(0, 2))) : null,
            dischargeSummary: dischargeDate ? true : Math.random() > 0.7,
            dischargeSummaryDate: dischargeDate ? dischargeDate : null,
            dischargePlanningNote: Math.random() > 0.5,
            dischargePlanningNoteDate: Math.random() > 0.5 ? formatDate(shiftDate(new Date(), -randomInt(1, 8))) : null,
            dischargeASAM: Math.random() > 0.5,
            dischargeASAMDate: Math.random() > 0.5 ? formatDate(shiftDate(new Date(), -randomInt(1, 5))) : null,
            gadCompleted: gadState.complete,
            gadCompletedDate: gadState.date,
            phqCompleted: phqState.complete,
            phqCompletedDate: phqState.date,
            satisfactionSurvey: surveyState.complete,
            satisfactionSurveyDate: surveyState.date,
            aftercareOptions: buildAftercareOptions(daysInCare),
            dateOptionsProvided: optionsDoc ? formatDate(shiftDate(new Date(), -randomInt(1, 3))) : null,
            tags: ['demo'],
            notes: `Demo data (${stage.key}) - generated ${formatDate(today)}.`,
            preferences: {
                includeAtHome: Math.random() > 0.5,
                includeAlumni: Math.random() > 0.5,
                documentType: randomItem(VIEW_PREFERENCES)
            },
            isDemo: true
        };
    }

    function distributeStages(count) {
        const clients = [];
        const today = new Date();
        for (let i = 0; i < count; i++) {
            const stage = STAGES[i % STAGES.length];
            clients.push(buildClient(stage, i, today));
        }
        return clients;
    }

    window.demoDataGenerator = {
        createClients(count = 50) {
            return distributeStages(count);
        }
    };
})();

