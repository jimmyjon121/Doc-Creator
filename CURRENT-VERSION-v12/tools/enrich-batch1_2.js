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

// === Program 6: Friendship Circle South Florida (network parent) ===
{
  const prog = programs[5]; // index 5 => program 6
  if (prog && prog.id === 'friendship_circle_parent') {
    prog.lgbtqAffirming = null;
    prog.transAffirming = null;
    prog.genderInclusiveHousing = null;

    prog.treatsASD = null;
    prog.treatsSUD = null;
    prog.highAcuityMH = false;

    prog.diagnosesServed = [
      'Intellectual Disabilities',
      'Developmental Disabilities',
    ];

    prog.modalities = [
      'Social Skills Training',
      'Life Skills Training',
      'Vocational Training',
      'Peer Support',
    ];

    prog.exclusions = null;
    prog.academics = null;
    prog.insuranceAccepted = null;

    setAdmissions(prog, {
      phone: '(754) 800-1770',
      email: 'Office@friendshipfl.org',
      contactName: null,
      avgResponseTime: null,
      transportProvided: null,
    });

    prog.heroImageUrl = null;
    prog.logoUrl = null;
    prog.galleryUrls = null;
    prog.virtualTourUrl = null;
  } else {
    console.warn('Unexpected program at index 5:', prog && prog.id);
  }
}

// === Program 7: Teen Scene (Fort Lauderdale, FL) ===
{
  const prog = programs[6]; // index 6 => program 7
  if (prog && prog.name.includes('Teen Scene')) {
    prog.lgbtqAffirming = null;
    prog.transAffirming = null;
    prog.genderInclusiveHousing = null;

    prog.treatsASD = null;
    prog.treatsSUD = null;
    prog.highAcuityMH = false;

    prog.diagnosesServed = [
      'Intellectual Disabilities',
      'Developmental Disabilities',
    ];

    prog.modalities = [
      'Social Skills Training',
      'Life Skills Training',
      'Peer Support',
    ];

    prog.exclusions = null;
    prog.academics = null;
    prog.insuranceAccepted = null;

    setAdmissions(prog, {
      phone: '(754) 800-1770',
      email: 'Office@friendshipfl.org',
      contactName: null,
      avgResponseTime: null,
      transportProvided: null,
    });

    prog.heroImageUrl = null;
    prog.logoUrl = null;
    prog.galleryUrls = null;
    prog.virtualTourUrl = null;
  } else {
    console.warn('Unexpected program at index 6:', prog && prog.id);
  }
}

// === Program 8: Hallandale, FL (website not resolving) ===
{
  const prog = programs[7]; // index 7 => program 8
  if (prog && prog.name.includes('Hallandale')) {
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
    console.warn('Unexpected program at index 7:', prog && prog.id);
  }
}

// === Program 9: Parkland/North Broward, FL (domain parked) ===
{
  const prog = programs[8]; // index 8 => program 9
  if (prog && prog.name.includes('Parkland')) {
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
    console.warn('Unexpected program at index 8:', prog && prog.id);
  }
}

// === Program 10: Miami (Chabad of Kendall/Pinecrest) ===
{
  const prog = programs[9]; // index 9 => program 10
  if (prog && prog.name.includes('Miami')) {
    prog.lgbtqAffirming = null;
    prog.transAffirming = null;
    prog.genderInclusiveHousing = null;

    prog.treatsASD = true;
    prog.treatsSUD = null;
    prog.highAcuityMH = false;

    prog.diagnosesServed = [
      'Autism Spectrum',
      'Intellectual Disabilities',
      'Developmental Disabilities',
    ];

    prog.modalities = [
      'Social Skills Training',
      'Peer Support',
    ];

    prog.exclusions = null;
    prog.academics = null;
    prog.insuranceAccepted = null;

    setAdmissions(prog, {
      phone: '305-234-5654',
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
    console.warn('Unexpected program at index 9:', prog && prog.id);
  }
}

fs.writeFileSync(programsPath, JSON.stringify(programs, null, 2));
console.log('Enriched Friendship Circle programs 6–10');


