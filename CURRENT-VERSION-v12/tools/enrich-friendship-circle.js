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

// Shared non-clinical flags and modalities for Friendship Circle community programs
function applyNonClinicalFriendshipMeta(prog) {
  prog.lgbtqAffirming = null;
  prog.transAffirming = null;
  prog.genderInclusiveHousing = null;

  // Community/social programs, not treatment providers
  prog.treatsASD = false;
  prog.treatsSUD = false;
  prog.highAcuityMH = false;

  prog.diagnosesServed = [
    'Autism Spectrum',
    'Intellectual Disabilities',
    'Developmental Disabilities',
    'Learning Disabilities',
    'Physical Disabilities',
  ];

  prog.modalities = [
    'Life Skills Training',
    'Social Skills Groups',
    'Vocational Training',
    'Recreational Programming',
    'Mentorship',
    'Academic Support',
  ];

  prog.exclusions = null;
  prog.academics = null;
  prog.insuranceAccepted = null;

  prog.heroImageUrl = null;
  prog.logoUrl = null;
  prog.galleryUrls = null;
  prog.virtualTourUrl = null;
}

// === Program 6: Friendship Circle South Florida (parent) ===
{
  const prog = programs[5]; // index 5 => program 6
  if (prog && prog.id === 'friendship_circle_parent') {
    applyNonClinicalFriendshipMeta(prog);

    // Keep admissions at the location level for Hallandale/Parkland programs
    setAdmissions(prog, {
      phone: null,
      email: null,
      contactName: null,
      avgResponseTime: null,
      transportProvided: null,
    });
  } else {
    console.warn('Unexpected program at index 5:', prog && prog.id);
  }
}

// === Program 7: Teen Scene (Fort Lauderdale, FL) ===
{
  const prog = programs[6]; // index 6 => program 7
  if (prog && prog.id === 'program_20') {
    applyNonClinicalFriendshipMeta(prog);

    // Uses South Broward/Hallandale contact line
    setAdmissions(prog, {
      phone: '(954) 558-7269',
      email: 'dassy@sdfriendshipcircle.com',
      contactName: null,
      avgResponseTime: null,
      transportProvided: null,
    });
  } else {
    console.warn('Unexpected program at index 6:', prog && prog.id);
  }
}

// === Program 8: Hallandale, FL (Friendship Circle South Broward) ===
{
  const prog = programs[7]; // index 7 => program 8
  if (prog && prog.id === 'program_21') {
    applyNonClinicalFriendshipMeta(prog);

    setAdmissions(prog, {
      phone: '(954) 558-7269',
      email: 'dassy@sdfriendshipcircle.com',
      contactName: null,
      avgResponseTime: null,
      transportProvided: null,
    });
  } else {
    console.warn('Unexpected program at index 7:', prog && prog.id);
  }
}

// === Program 9: Parkland/North Broward, FL (Friendship Circle of North Broward & South Palm Beach) ===
{
  const prog = programs[8]; // index 8 => program 9
  if (prog && prog.id === 'program_22') {
    applyNonClinicalFriendshipMeta(prog);

    setAdmissions(prog, {
      phone: '(954) 970-9551',
      email: 'floridafriendshipcircle@gmail.com',
      contactName: null,
      avgResponseTime: null,
      transportProvided: null,
    });
  } else {
    console.warn('Unexpected program at index 8:', prog && prog.id);
  }
}

// Program 10 (Miami) is left unchanged for now – no new verified details were supplied.

fs.writeFileSync(programsPath, JSON.stringify(programs, null, 2));
console.log('Updated Friendship Circle community programs (6–9) as non-clinical supports');


