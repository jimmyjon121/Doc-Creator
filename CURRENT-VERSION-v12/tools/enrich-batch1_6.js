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

// === Program 26: Special Education Day School (Frederick, MD) ===
{
  const prog = programs[25]; // index 25 => program 26
  if (prog && prog.name.includes('Frederick')) {
    // Unable to confidently map this historic listing to a current
    // Sheppard Pratt school program in Frederick; only outpatient and
    // rehab/VOC services are listed for Frederick on the current site.
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
    console.warn('Unexpected program at index 25:', prog && prog.id);
  }
}

// === Program 27: Special Education Day School (Lanham, MD) ===
{
  const prog = programs[26]; // index 26 => program 27
  if (prog && prog.name.includes('Lanham')) {
    prog.lgbtqAffirming = null;
    prog.transAffirming = null;
    prog.genderInclusiveHousing = null;

    prog.treatsASD = true;
    prog.treatsSUD = false;
    prog.highAcuityMH = false;

    prog.diagnosesServed = [
      'Autism Spectrum',
      'Intellectual Disabilities',
      'Developmental Disabilities',
    ];

    prog.modalities = [
      'Special Education',
      'Life Skills Training',
      'Vocational Training',
      'Behavioral Support',
    ];

    prog.exclusions = null;

    prog.academics = {
      accreditedSchool: true,
      creditsTransferable: null,
      diplomaGranting: null,
      specialEducation: true,
      gradeLevels: 'K-12',
    };

    prog.insuranceAccepted = null;

    setAdmissions(prog, {
      phone: '240-667-1423',
      email: 'SPLanhamSchool@sheppardpratt.org',
      contactName: 'Donna Smikle',
      avgResponseTime: null,
      transportProvided: null,
    });

    prog.heroImageUrl = null;
    prog.logoUrl = null;
    prog.galleryUrls = null;
    prog.virtualTourUrl = null;
  } else {
    console.warn('Unexpected program at index 26:', prog && prog.id);
  }
}

// === Program 28: Special Education Day School (Millersville, MD) ===
{
  const prog = programs[27]; // index 27 => program 28
  if (prog && prog.name.includes('Millersville')) {
    prog.lgbtqAffirming = null;
    prog.transAffirming = null;
    prog.genderInclusiveHousing = null;

    prog.treatsASD = true;
    prog.treatsSUD = false;
    prog.highAcuityMH = false;

    prog.diagnosesServed = [
      'Autism Spectrum',
      'Developmental Disabilities',
      'ADHD',
      'Anxiety',
      'Depression',
    ];

    prog.modalities = [
      'Special Education',
      'Life Skills Training',
      'Vocational Training',
      'Behavioral Support',
    ];

    prog.exclusions = null;

    prog.academics = {
      accreditedSchool: true,
      creditsTransferable: null,
      diplomaGranting: null,
      specialEducation: true,
      gradeLevels: '1-5',
    };

    prog.insuranceAccepted = null;

    setAdmissions(prog, {
      phone: '443-462-2826',
      email: 'SPAnneArundelSchools@sheppardpratt.org',
      contactName: null,
      avgResponseTime: null,
      transportProvided: null,
    });

    prog.heroImageUrl = null;
    prog.logoUrl = null;
    prog.galleryUrls = null;
    prog.virtualTourUrl = null;
  } else {
    console.warn('Unexpected program at index 27:', prog && prog.id);
  }
}

// === Program 29: Special Education Day School (Rockville, MD) ===
{
  const prog = programs[28]; // index 28 => program 29
  if (prog && prog.name.includes('Rockville')) {
    prog.lgbtqAffirming = null;
    prog.transAffirming = null;
    prog.genderInclusiveHousing = null;

    prog.treatsASD = true;
    prog.treatsSUD = false;
    prog.highAcuityMH = false;

    prog.diagnosesServed = [
      'Autism Spectrum',
      'Bipolar',
      'Depression',
      'Mood Disorders',
      'Developmental Disabilities',
    ];

    prog.modalities = [
      'Special Education',
      'Life Skills Training',
      'Vocational Training',
      'Behavioral Support',
    ];

    prog.exclusions = null;

    prog.academics = {
      accreditedSchool: true,
      creditsTransferable: null,
      diplomaGranting: null,
      specialEducation: true,
      gradeLevels: 'K-12',
    };

    prog.insuranceAccepted = null;

    setAdmissions(prog, {
      phone: '301-933-3451',
      email: 'SPRockvilleSchool@sheppardpratt.org',
      contactName: 'Mark Hajjar',
      avgResponseTime: null,
      transportProvided: null,
    });

    prog.heroImageUrl = null;
    prog.logoUrl = null;
    prog.galleryUrls = null;
    prog.virtualTourUrl = null;
  } else {
    console.warn('Unexpected program at index 28:', prog && prog.id);
  }
}

// === Program 30: McLean Hospital (parent) ===
{
  const prog = programs[29]; // index 29 => program 30
  if (prog && prog.id === 'mclean_hospital_parent') {
    prog.lgbtqAffirming = null;
    prog.transAffirming = null;
    prog.genderInclusiveHousing = null;

    prog.treatsASD = null;
    prog.treatsSUD = true; // Addiction programs listed as a core condition
    prog.highAcuityMH = null;

    prog.diagnosesServed = [
      'Substance Use',
      'Borderline Personality Disorder',
      'OCD',
      'Anxiety',
      'Depression',
      'Trauma/PTSD',
      'Bipolar',
      'Schizophrenia',
      'Eating Disorders',
    ];

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
    console.warn('Unexpected program at index 29:', prog && prog.id);
  }
}

fs.writeFileSync(programsPath, JSON.stringify(programs, null, 2));
console.log('Enriched programs 26–30 (Sheppard Pratt schools + McLean parent)');


