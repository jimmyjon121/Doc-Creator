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

// === Program 21: Sheppard Pratt Schools (network parent) ===
{
  const prog = programs[20]; // index 20 => program 21
  if (prog && prog.id === 'sheppard_pratt_parent') {
    prog.lgbtqAffirming = null;
    prog.transAffirming = null;
    prog.genderInclusiveHousing = null;

    prog.treatsASD = true; // schools explicitly serve autism spectrum disorders
    prog.treatsSUD = false;
    prog.highAcuityMH = false;

    prog.diagnosesServed = [
      'Autism Spectrum',
      'Intellectual Disabilities',
      'Developmental Disabilities',
      'ODD/Conduct',
      'ADHD',
      'Learning Disabilities',
    ];

    prog.modalities = [
      'Special Education',
      'Life Skills Training',
      'Vocational Training',
      'Behavioral Support',
    ];

    prog.exclusions = null;

    prog.academics = null;

    prog.insuranceAccepted = null;

    setAdmissions(prog, {
      phone: '410-938-3000',
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
    console.warn('Unexpected program at index 20:', prog && prog.id);
  }
}

// === Program 22: Special Education Day School (Glyndon, MD) ===
{
  const prog = programs[21]; // index 21 => program 22
  if (prog && prog.name.includes('Glyndon')) {
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
      'Learning Disabilities',
      'ODD/Conduct',
      'ADHD',
      'Speech/Language Disorders',
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
      phone: '410-861-5540',
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
    console.warn('Unexpected program at index 21:', prog && prog.id);
  }
}

// === Program 23: Special Education Day School (Hunt Valley, MD) ===
{
  const prog = programs[22]; // index 22 => program 23
  if (prog && prog.name.includes('Hunt Valley')) {
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
      'ODD/Conduct',
      'ADHD',
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
      phone: '410-527-0001',
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
    console.warn('Unexpected program at index 22:', prog && prog.id);
  }
}

// === Program 24: Special Education Day School (Gaithersburg, MD) ===
{
  const prog = programs[23]; // index 23 => program 24
  if (prog && prog.name.includes('Gaithersburg')) {
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
      'Learning Disabilities',
      'ADHD',
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
      gradeLevels: '6-12',
    };

    prog.insuranceAccepted = null;

    setAdmissions(prog, {
      phone: '301-258-4534',
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
    console.warn('Unexpected program at index 23:', prog && prog.id);
  }
}

// === Program 25: Special Education Day School (Cumberland, MD) ===
{
  const prog = programs[24]; // index 24 => program 25
  if (prog && prog.name.includes('Cumberland')) {
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
      'ODD/Conduct',
      'ADHD',
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
      phone: '301-777-2520',
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
    console.warn('Unexpected program at index 24:', prog && prog.id);
  }
}

fs.writeFileSync(programsPath, JSON.stringify(programs, null, 2));
console.log('Enriched Sheppard Pratt school programs 21–25');


