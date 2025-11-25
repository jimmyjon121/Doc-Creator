const fs = require('fs');
const path = require('path');

const programsPath = path.join(__dirname, '..', 'programs.v2.json');
const programs = JSON.parse(fs.readFileSync(programsPath, 'utf8'));

function setAdmissions(prog, admissions) {
  prog.admissions = {
    phone: admissions.phone ?? null,
    email: admissions.email ?? null,
    contactName: admissions.contactName ?? null,
    avgResponseTime: admissions.avgResponseTime ?? null,
    transportProvided: admissions.transportProvided ?? null,
  };
}

// === Program 11: High Focus Centers (network parent) ===
{
  const prog = programs[10]; // index 10 => program 11
  if (prog && prog.id === 'high_focus_parent') {
    prog.lgbtqAffirming = true;
    prog.transAffirming = true;
    prog.genderInclusiveHousing = null;

    prog.treatsASD = null;
    prog.treatsSUD = true;
    prog.highAcuityMH = false;

    prog.diagnosesServed = [
      'Depression',
      'Anxiety',
      'Bipolar',
      'Eating Disorders',
      'ADHD',
      'OCD',
      'Psychosis',
      'Self-harm',
      'Substance Use',
    ];

    prog.modalities = [
      'DBT',
      'Family Therapy',
      'Psychoeducation',
      'Psychiatric Services',
    ];

    prog.exclusions = null;
    prog.academics = null;
    prog.insuranceAccepted = null;

    setAdmissions(prog, {
      phone: '(877) 511-3114',
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
    console.warn('Unexpected program at index 10:', prog && prog.id);
  }
}

// === Programs 12–14: Cherry Hill, Branchburg, Lawrenceville (403 or inaccessible) ===
// Location pages for Cherry Hill and Lawrenceville are blocked (403) and Branchburg
// returns 403 when accessed directly, so we avoid location-specific clinical details.
// We only attach clearly network-wide properties (outpatient level of care and
// central admissions line) and leave all other enrichment fields null.

// Program 12: Cherry Hill, NJ
{
  const prog = programs[11]; // index 11 => program 12
  if (prog && prog.name.includes('Cherry Hill')) {
    prog.lgbtqAffirming = null;
    prog.transAffirming = null;
    prog.genderInclusiveHousing = null;

    prog.treatsASD = null;
    prog.treatsSUD = null;
    prog.highAcuityMH = false;
    prog.diagnosesServed = null;
    prog.modalities = null;
    prog.exclusions = null;
    prog.academics = null;
    prog.insuranceAccepted = null;

    setAdmissions(prog, {
      phone: '(877) 511-3114',
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
    console.warn('Unexpected program at index 11:', prog && prog.id);
  }
}

// Program 13: Branchburg, NJ
{
  const prog = programs[12]; // index 12 => program 13
  if (prog && prog.name.includes('Branchburg')) {
    prog.lgbtqAffirming = null;
    prog.transAffirming = null;
    prog.genderInclusiveHousing = null;

    prog.treatsASD = null;
    prog.treatsSUD = null;
    prog.highAcuityMH = false;
    prog.diagnosesServed = null;
    prog.modalities = null;
    prog.exclusions = null;
    prog.academics = null;
    prog.insuranceAccepted = null;

    setAdmissions(prog, {
      phone: '(877) 511-3114',
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
    console.warn('Unexpected program at index 12:', prog && prog.id);
  }
}

// Program 14: Lawrenceville, NJ
{
  const prog = programs[13]; // index 13 => program 14
  if (prog && prog.name.includes('Lawrenceville')) {
    prog.lgbtqAffirming = null;
    prog.transAffirming = null;
    prog.genderInclusiveHousing = null;

    prog.treatsASD = null;
    prog.treatsSUD = null;
    prog.highAcuityMH = false;
    prog.diagnosesServed = null;
    prog.modalities = null;
    prog.exclusions = null;
    prog.academics = null;
    prog.insuranceAccepted = null;

    setAdmissions(prog, {
      phone: '(877) 511-3114',
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
    console.warn('Unexpected program at index 13:', prog && prog.id);
  }
}

// === Program 15: Parsippany, NJ (location page accessible) ===
{
  const prog = programs[14]; // index 14 => program 15
  if (prog && prog.name.includes('Parsippany')) {
    prog.lgbtqAffirming = null;
    prog.transAffirming = null;
    prog.genderInclusiveHousing = null;

    prog.treatsASD = null;
    prog.treatsSUD = true; // co-occurring programs clearly advertised
    prog.highAcuityMH = false;

    prog.diagnosesServed = [
      'Depression',
      'Anxiety',
      'Bipolar',
      'Eating Disorders',
      'ADHD',
      'OCD',
      'Psychosis',
      'Self-harm',
      'Substance Use',
    ];

    prog.modalities = [
      'DBT',
      'Family Therapy',
      'Psychoeducation',
      'Psychiatric Services',
    ];

    prog.exclusions = null;
    prog.academics = null;
    prog.insuranceAccepted = null;

    setAdmissions(prog, {
      phone: '(877) 511-3114',
      email: null,
      contactName: null,
      avgResponseTime: null,
      transportProvided: true, // Parsippany page describes transportation services
    });

    prog.heroImageUrl = null;
    prog.logoUrl = null;
    prog.galleryUrls = null;
    prog.virtualTourUrl = null;
  } else {
    console.warn('Unexpected program at index 14:', prog && prog.id);
  }
}

fs.writeFileSync(programsPath, JSON.stringify(programs, null, 2));
console.log('Enriched High Focus Centers programs 11–15');


