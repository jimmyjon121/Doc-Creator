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

// === Program 16: Rosecrance Adolescent Services (network parent proxy) ===
{
  const prog = programs[15]; // index 15 => program 16
  if (prog && prog.id === 'rosecrance_parent') {
    prog.lgbtqAffirming = null;
    prog.transAffirming = null;
    prog.genderInclusiveHousing = null;

    prog.treatsASD = null;
    prog.treatsSUD = true; // system-wide SUD + MH focus
    prog.highAcuityMH = true; // includes residential campuses for adolescents

    prog.diagnosesServed = [
      'Depression',
      'Anxiety',
      'Bipolar',
      'Eating Disorders',
      'Substance Use',
    ];

    prog.modalities = [
      'Family Therapy',
      'Psychiatric Services',
      'Group Therapy',
      'Individual Therapy',
    ];

    prog.exclusions = null;
    prog.academics = null;

    prog.insuranceAccepted = [
      'Aetna',
      'Blue Cross Blue Shield',
      'Cigna',
      'Optum',
      'Most major insurance',
    ];

    setAdmissions(prog, {
      phone: '(866) 784-3021',
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
    console.warn('Unexpected program at index 15:', prog && prog.id);
  }
}

// === Program 17: Frankfort, IL (Rosecrance Frankfort) ===
{
  const prog = programs[16]; // index 16 => program 17
  if (prog && prog.name.includes('Frankfort')) {
    prog.lgbtqAffirming = null;
    prog.transAffirming = null;
    prog.genderInclusiveHousing = null;

    prog.treatsASD = null;
    prog.treatsSUD = true; // explicit mental health and substance use services
    prog.highAcuityMH = false; // outpatient therapy and IOP only

    prog.diagnosesServed = [
      'Depression',
      'Anxiety',
      'Bipolar',
      'Substance Use',
    ];

    prog.modalities = [
      'Individual Therapy',
      'Group Therapy',
      'Family Therapy',
      'Medication Management',
      'Psychiatric Services',
      'IOP',
      'Medication-Assisted Treatment',
      'Interventions',
    ];

    prog.exclusions = null;
    prog.academics = null;
    prog.insuranceAccepted = [
      'Aetna',
      'Blue Cross Blue Shield',
      'Cigna',
      'Optum',
      'Most major insurance',
    ];

    setAdmissions(prog, {
      phone: '(872) 328-7237',
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
    console.warn('Unexpected program at index 16:', prog && prog.id);
  }
}

// === Programs 18–20 (Chicago, McHenry County, Rockford) ===
// Their specific adolescent services pages are not directly reachable from the
// provided URLs; we therefore leave clinical details null and only set safe
// network-level defaults where clearly described system-wide.

// Program 18: Chicago, IL
{
  const prog = programs[17]; // index 17 => program 18
  if (prog && prog.name.includes('Chicago')) {
    prog.lgbtqAffirming = null;
    prog.transAffirming = null;
    prog.genderInclusiveHousing = null;

    prog.treatsASD = null;
    prog.treatsSUD = null;
    prog.highAcuityMH = null;

    prog.diagnosesServed = null;
    prog.modalities = null;
    prog.exclusions = null;
    prog.academics = null;
    prog.insuranceAccepted = null;

    setAdmissions(prog, {
      phone: null,
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
    console.warn('Unexpected program at index 17:', prog && prog.id);
  }
}

// Program 19: McHenry County, IL
{
  const prog = programs[18]; // index 18 => program 19
  if (prog && prog.name.includes('McHenry')) {
    prog.lgbtqAffirming = null;
    prog.transAffirming = null;
    prog.genderInclusiveHousing = null;

    prog.treatsASD = null;
    prog.treatsSUD = null;
    prog.highAcuityMH = null;

    prog.diagnosesServed = null;
    prog.modalities = null;
    prog.exclusions = null;
    prog.academics = null;
    prog.insuranceAccepted = null;

    setAdmissions(prog, {
      phone: null,
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
    console.warn('Unexpected program at index 18:', prog && prog.id);
  }
}

// Program 20: Rockford, IL
{
  const prog = programs[19]; // index 19 => program 20
  if (prog && prog.name.includes('Rockford')) {
    prog.lgbtqAffirming = null;
    prog.transAffirming = null;
    prog.genderInclusiveHousing = null;

    prog.treatsASD = null;
    prog.treatsSUD = null;
    prog.highAcuityMH = null;

    prog.diagnosesServed = null;
    prog.modalities = null;
    prog.exclusions = null;
    prog.academics = null;
    prog.insuranceAccepted = null;

    setAdmissions(prog, {
      phone: null,
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
    console.warn('Unexpected program at index 19:', prog && prog.id);
  }
}

fs.writeFileSync(programsPath, JSON.stringify(programs, null, 2));
console.log('Enriched Rosecrance programs 16–20');


