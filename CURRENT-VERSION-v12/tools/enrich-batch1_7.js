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

// === Program 31: McLean 3East DBT programs ===
{
  const prog = programs[30]; // index 30 => program 31
  if (prog && prog.id === 'mclean_3east_dbt') {
    prog.lgbtqAffirming = null;
    prog.transAffirming = null;
    prog.genderInclusiveHousing = null;

    prog.treatsASD = null;
    prog.treatsSUD = null;
    prog.highAcuityMH = null;

    prog.diagnosesServed = null;

    // Only modality we can safely verify from the public homepage
    prog.modalities = ['DBT'];

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
    console.warn('Unexpected program at index 30:', prog && prog.id);
  }
}

// === Program 32: McLean Adolescent Acute Residential Treatment (ART) ===
{
  const prog = programs[31]; // index 31 => program 32
  if (prog && prog.id === 'mclean_art_program') {
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
    console.warn('Unexpected program at index 31:', prog && prog.id);
  }
}

// === Program 33: McLean OCD Institute Jr. (OCDI Jr.) ===
{
  const prog = programs[32]; // index 32 => program 33
  if (prog && prog.id === 'mclean_ocdi_jr') {
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
    console.warn('Unexpected program at index 32:', prog && prog.id);
  }
}

// === Program 34: Seven Hills Foundation (network parent) ===
{
  const prog = programs[33]; // index 33 => program 34
  if (prog && prog.id === 'seven_hills_parent') {
    prog.lgbtqAffirming = null;
    prog.transAffirming = null;
    prog.genderInclusiveHousing = null;

    prog.treatsASD = null;
    prog.treatsSUD = null;
    prog.highAcuityMH = null;

    prog.diagnosesServed = null;

    prog.modalities = [
      'Medication-Assisted Treatment',
      'Positive Behavioral Supports',
    ];

    prog.exclusions = null;
    prog.academics = null;
    prog.insuranceAccepted = null;

    setAdmissions(prog, {
      phone: '508-755-2340',
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
    console.warn('Unexpected program at index 33:', prog && prog.id);
  }
}

// === Program 35: Stetson School – Seven Hills Foundation ===
{
  const prog = programs[34]; // index 34 => program 35
  if (prog && prog.id === 'stetson_school_seven_hills') {
    prog.lgbtqAffirming = null;
    prog.transAffirming = null;
    prog.genderInclusiveHousing = null;

    prog.treatsASD = true;
    prog.treatsSUD = null;
    prog.highAcuityMH = null;

    prog.diagnosesServed = [
      'Autism Spectrum',
      'Developmental Disabilities',
      'Trauma/PTSD',
    ];

    prog.modalities = [
      'CBT',
      'Psychoeducation',
      'Psychodynamic Therapy',
      'Behavioral Therapy',
      'Psychiatric Services',
    ];

    prog.exclusions = null;

    prog.academics = {
      accreditedSchool: true,
      creditsTransferable: null,
      diplomaGranting: null,
      specialEducation: true,
      gradeLevels: null,
    };

    prog.insuranceAccepted = null;

    setAdmissions(prog, {
      phone: '978-355-4541 ext. 4139',
      email: 'koconnor@stetsonschool.org',
      contactName: "Kathy O'Connor",
      avgResponseTime: 'Within 24 hours',
      transportProvided: null,
    });

    prog.heroImageUrl = null;
    prog.logoUrl = null;
    prog.galleryUrls = null;
    prog.virtualTourUrl = null;
  } else {
    console.warn('Unexpected program at index 34:', prog && prog.id);
  }
}

fs.writeFileSync(programsPath, JSON.stringify(programs, null, 2));
console.log('Enriched programs 31–35 (McLean and Seven Hills/Stetson)');


