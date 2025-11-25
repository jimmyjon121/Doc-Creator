const fs = require('fs');
const path = require('path');

const programsPath = path.join(__dirname, 'programs.v2.json');
const programs = JSON.parse(fs.readFileSync(programsPath, 'utf8'));

// Helper to ensure an admissions object exists and to set its fields explicitly
function setAdmissions(prog, admissions) {
  prog.admissions = {
    phone: admissions.phone ?? null,
    email: admissions.email ?? null,
    contactName: admissions.contactName ?? null,
    avgResponseTime: admissions.avgResponseTime ?? null,
    transportProvided: admissions.transportProvided ?? null,
  };
}

// === Shared insurance for Discovery Mood & Anxiety (from Insurance page) ===
const discoveryNetworkInsurance = [
  'Beacon Health Strategies',
  'Blue Shield of California',
  'Cambia Health Solutions',
  'Carefirst',
  'Cigna',
  'CompCare BH',
  'Coventry / First Health (CCN)',
  'Employee Health Network (EHN)',
  'First Choice Health',
  'Fortified Provider Network (FPN)',
  'Fresno County',
  'Halcyon',
  'HealthNet',
  'HMC',
  'Holman Group',
  'Humana (Life Sync)',
  'IEHP',
  'ILWU / PMA Long Shoremens Union',
  'Indian Health Services (HIS) Shinnecock Unit',
  'Kaiser',
  'Magellan',
  'Marin County',
  'MCCP',
  'Merced County',
  'MHN',
  'MODA',
  'MultiPlan',
  'Networks by Design',
  'Optum',
  'Premera BC',
  'Sharp',
  'TriCare East – Humana',
  'TriCare Military MHN/HealthNet',
  'UHA',
  'UNICARE – Beacon HS',
  'US Family Healthplan – PacMed',
  'WellPoint',
];

// === Program 1: Discovery Mood & Anxiety Programs (network parent) ===
{
  const prog = programs[0]; // index 0 => program 1
  if (prog && prog.id === 'discovery_mood_parent') {
    prog.lgbtqAffirming = true;
    prog.transAffirming = true;
    prog.genderInclusiveHousing = null;

    prog.treatsASD = null;
    prog.treatsSUD = true;
    prog.highAcuityMH = true;

    prog.diagnosesServed = [
      'Depression',
      'Anxiety',
      'Bipolar',
      'Trauma/PTSD',
      'Self-harm',
      'Substance Use',
    ];

    prog.modalities = [
      'CBT',
      'DBT',
      'ACT',
    ];

    prog.exclusions = null;
    prog.academics = null;

    prog.insuranceAccepted = discoveryNetworkInsurance.slice();

    setAdmissions(prog, {
      phone: '844-374-3974',
      email: null,
      contactName: null,
      avgResponseTime: null,
      transportProvided: null,
    });

    prog.heroImageUrl = null;
    prog.logoUrl = null;
    prog.galleryUrls = null;
    prog.virtualTourUrl = null;
  } else {
    console.warn('Unexpected program at index 0:', prog && prog.id);
  }
}

// === Program 2: Dade City, FL (adolescent RTC, gender inclusive) ===
{
  const prog = programs[1]; // index 1 => program 2
  if (prog) {
    prog.lgbtqAffirming = true;
    prog.transAffirming = true;
    prog.genderInclusiveHousing = null;

    prog.treatsASD = null;
    prog.treatsSUD = null; // mental health focus; no explicit SUD track listed
    prog.highAcuityMH = true; // 24/7 RTC with intensive support

    prog.diagnosesServed = [
      'Depression',
      'Anxiety',
      'Bipolar',
      'Trauma/PTSD',
      'Self-harm',
    ];

    prog.modalities = [
      'CBT',
      'DBT',
      'ACT',
      'Art Therapy',
      'Music Therapy',
      'Family Therapy',
    ];

    prog.exclusions = null;
    prog.academics = null;

    prog.insuranceAccepted = [
      'Aetna',
      'Blue Cross Blue Shield',
      'Cigna',
      'Humana',
      'Most major insurance',
    ];

    setAdmissions(prog, {
      phone: '844-374-3974',
      email: null,
      contactName: null,
      avgResponseTime: null,
      transportProvided: null,
    });

    prog.heroImageUrl = null;
    prog.logoUrl = null;
    prog.galleryUrls = null;
    prog.virtualTourUrl = null;
  } else {
    console.warn('No program at index 1');
  }
}

// === Program 3: Maitland, FL (PHP/IOP, all genders, ages 11+) ===
{
  const prog = programs[2]; // index 2 => program 3
  if (prog) {
    prog.lgbtqAffirming = true;
    prog.transAffirming = true;
    prog.genderInclusiveHousing = null;

    prog.treatsASD = null;
    prog.treatsSUD = null;
    prog.highAcuityMH = false; // PHP/IOP only

    prog.diagnosesServed = [
      'Depression',
      'Anxiety',
      'Bipolar',
      'Trauma/PTSD',
      'Self-harm',
    ];

    prog.modalities = [
      'CBT',
      'DBT',
    ];

    prog.exclusions = null;
    prog.academics = null;

    prog.insuranceAccepted = [
      'Aetna',
      'Florida Blue Cross Blue Shield',
      'Cigna',
      'Beacon',
      'Most major insurance',
    ];

    setAdmissions(prog, {
      phone: '844-374-3974',
      email: null,
      contactName: null,
      avgResponseTime: null,
      transportProvided: null,
    });

    prog.heroImageUrl = null;
    prog.logoUrl = null;
    prog.galleryUrls = null;
    prog.virtualTourUrl = null;
  } else {
    console.warn('No program at index 2');
  }
}

// === Program 4: Tampa-Orlando Region, FL (regional wrapper around Dade City) ===
{
  const prog = programs[3]; // index 3 => program 4
  if (prog) {
    prog.lgbtqAffirming = true;
    prog.transAffirming = true;
    prog.genderInclusiveHousing = null;

    prog.treatsASD = null;
    prog.treatsSUD = null;
    prog.highAcuityMH = true; // represents adolescent residential program in region

    prog.diagnosesServed = [
      'Depression',
      'Anxiety',
      'Bipolar',
      'Trauma/PTSD',
      'Self-harm',
    ];

    prog.modalities = [
      'CBT',
      'DBT',
      'ACT',
      'Art Therapy',
      'Music Therapy',
      'Family Therapy',
    ];

    prog.exclusions = null;
    prog.academics = null;

    // Use the broader Discovery network list for regional wrapper
    prog.insuranceAccepted = discoveryNetworkInsurance.slice();

    setAdmissions(prog, {
      phone: '844-374-3974',
      email: null,
      contactName: null,
      avgResponseTime: null,
      transportProvided: null,
    });

    prog.heroImageUrl = null;
    prog.logoUrl = null;
    prog.galleryUrls = null;
    prog.virtualTourUrl = null;
  } else {
    console.warn('No program at index 3');
  }
}

// === Program 5: Virtual PHP/IOP (Florida) ===
{
  const prog = programs[4]; // index 4 => program 5
  if (prog) {
    prog.lgbtqAffirming = true;
    prog.transAffirming = true;
    prog.genderInclusiveHousing = null; // virtual program

    prog.treatsASD = null;
    prog.treatsSUD = null; // virtual mental health focus
    prog.highAcuityMH = false;

    prog.diagnosesServed = [
      'Depression',
      'Anxiety',
      'Bipolar',
      'Trauma/PTSD',
      'Self-harm',
    ];

    prog.modalities = [
      'CBT',
      'DBT',
      'ACT',
      'Family Therapy',
    ];

    prog.exclusions = null;
    prog.academics = null;

    prog.insuranceAccepted = [
      'Most major insurance',
    ];

    setAdmissions(prog, {
      phone: '833-774-1438',
      email: null,
      contactName: null,
      avgResponseTime: null,
      transportProvided: null,
    });

    prog.heroImageUrl = null;
    prog.logoUrl = null;
    prog.galleryUrls = null;
    prog.virtualTourUrl = null;
  } else {
    console.warn('No program at index 4');
  }
}

fs.writeFileSync(programsPath, JSON.stringify(programs, null, 2));
console.log('Enriched Discovery Mood & Anxiety programs 1–5');


