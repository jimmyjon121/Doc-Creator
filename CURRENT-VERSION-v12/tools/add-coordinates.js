/**
 * Add missing coordinates to programs.v2.json
 * Run with: node add-coordinates.js
 */

const fs = require('fs');
const path = require('path');

// City coordinate lookup table
const CITY_COORDS = {
  // New Jersey
  'Cherry Hill, NJ': { lat: 39.9348, lng: -75.0307 },
  'Branchburg, NJ': { lat: 40.5687, lng: -74.7007 },
  'Lawrenceville, NJ': { lat: 40.2968, lng: -74.7293 },
  'Lawrence Township, NJ': { lat: 40.2968, lng: -74.7293 },
  'Parsippany, NJ': { lat: 40.8579, lng: -74.4260 },
  'Paramus, NJ': { lat: 40.9445, lng: -74.0754 },
  'Cranford, NJ': { lat: 40.6579, lng: -74.3004 },
  'Freehold, NJ': { lat: 40.2598, lng: -74.2737 },
  'Robbinsville, NJ': { lat: 40.2165, lng: -74.6110 },
  'Princeton, NJ': { lat: 40.3487, lng: -74.6593 },
  'Hamilton, NJ': { lat: 40.2084, lng: -74.6695 },
  'Moorestown, NJ': { lat: 39.9687, lng: -74.9488 },
  'North Brunswick, NJ': { lat: 40.4543, lng: -74.4793 },
  'Eatontown, NJ': { lat: 40.2965, lng: -74.0507 },
  'Bayonne, NJ': { lat: 40.6687, lng: -74.1143 },
  'Pine Brook, NJ': { lat: 40.8765, lng: -74.3457 },
  'New Brunswick, NJ': { lat: 40.4862, lng: -74.4518 },
  'Mendham, NJ': { lat: 40.7754, lng: -74.6007 },
  'Piscataway, NJ': { lat: 40.5501, lng: -74.4593 },
  'Newark, NJ': { lat: 40.7357, lng: -74.1724 },
  'Belle Mead, NJ': { lat: 40.4715, lng: -74.6460 },
  'Downingtown, PA': { lat: 40.0065, lng: -75.7035 },
  
  // Illinois
  'Frankfort, IL': { lat: 41.4959, lng: -87.8487 },
  'Chicago, IL': { lat: 41.8781, lng: -87.6298 },
  'McHenry County, IL': { lat: 42.3239, lng: -88.4501 },
  'Rockford, IL': { lat: 42.2711, lng: -89.0937 },
  
  // Maryland
  'Glyndon, MD': { lat: 39.4973, lng: -76.8050 },
  'Hunt Valley, MD': { lat: 39.4951, lng: -76.6411 },
  'Gaithersburg, MD': { lat: 39.1434, lng: -77.2014 },
  'Cumberland, MD': { lat: 39.6529, lng: -78.7625 },
  'Frederick, MD': { lat: 39.4143, lng: -77.4105 },
  'Lanham, MD': { lat: 38.9687, lng: -76.8633 },
  'Millersville, MD': { lat: 39.0573, lng: -76.6372 },
  'Rockville, MD': { lat: 39.0840, lng: -77.1528 },
  
  // Texas
  'Dallas, TX': { lat: 32.7767, lng: -96.7970 },
  'Arlington, TX': { lat: 32.7357, lng: -97.1081 },
  'Forney, TX': { lat: 32.7479, lng: -96.4719 },
  'McKinney, TX': { lat: 33.1972, lng: -96.6397 },
  
  // Other states
  'Oxford, MS': { lat: 34.3665, lng: -89.5192 },
  'Tucson, AZ': { lat: 32.2226, lng: -110.9747 },
  'Troy, MT': { lat: 48.4616, lng: -115.8797 },
  'Lexington, VA': { lat: 37.7840, lng: -79.4428 },
  'Black Mountain, NC': { lat: 35.6179, lng: -82.3213 },
  'Charlotte, NC': { lat: 35.2271, lng: -80.8431 },
  'Ellenboro, NC': { lat: 35.3154, lng: -81.7598 },
  'Coeur d\'Alene, ID': { lat: 47.6777, lng: -116.7805 },
  'Nicholson, PA': { lat: 41.6281, lng: -75.7710 },
  'Deerfield Beach, FL': { lat: 26.3184, lng: -80.0998 },
  'Gainesville, GA': { lat: 34.2979, lng: -83.8241 },
  
  // Network defaults (central to their service area)
  'New Jersey Network': { lat: 40.0583, lng: -74.4057 },
  'Illinois Network': { lat: 41.8781, lng: -87.6298 },
  'Maryland Network': { lat: 39.0458, lng: -76.6413 },
  'VT & NH': { lat: 43.9654, lng: -72.3212 },
  'National Network': { lat: 39.8283, lng: -98.5795 },
  'Multiple locations, NJ': { lat: 40.0583, lng: -74.4057 },
};

// Function to extract city from various formats
function extractCity(cityField, name) {
  if (!cityField) return null;
  
  // Special cases
  if (cityField.includes('Special Education Day School')) {
    const match = cityField.match(/\(([^)]+)/);
    if (match) return match[1] + ', MD';
  }
  
  if (cityField.includes('Multiple locations')) {
    return 'Multiple locations, NJ';
  }
  
  if (cityField.includes('Network')) {
    return cityField;
  }
  
  return cityField;
}

// Function to find coordinates for a program
function findCoordinates(program) {
  const city = program.location?.city || '';
  const state = program.location?.state || '';
  const name = program.name || '';
  
  // Try direct city + state lookup
  const cityState = `${city}, ${state}`.trim();
  if (CITY_COORDS[cityState]) {
    return CITY_COORDS[cityState];
  }
  
  // Try city only
  if (CITY_COORDS[city]) {
    return CITY_COORDS[city];
  }
  
  // Try extracting city from name or city field
  const extractedCity = extractCity(city, name);
  if (extractedCity && CITY_COORDS[extractedCity]) {
    return CITY_COORDS[extractedCity];
  }
  
  // Check for special patterns
  for (const [key, coords] of Object.entries(CITY_COORDS)) {
    if (city.toLowerCase().includes(key.split(',')[0].toLowerCase())) {
      return coords;
    }
    if (name.toLowerCase().includes(key.split(',')[0].toLowerCase())) {
      return coords;
    }
  }
  
  return null;
}

// Main function
function addCoordinates() {
  const filePath = path.join(__dirname, '..', 'programs.v2.json');
  
  console.log('📥 Loading programs.v2.json...');
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  let updated = 0;
  let notFound = [];
  
  data.forEach((program, index) => {
    if (program.location?.lat == null || program.location?.lng == null) {
      const coords = findCoordinates(program);
      
      if (coords) {
        program.location.lat = coords.lat;
        program.location.lng = coords.lng;
        updated++;
        console.log(`✅ Added coords for: ${program.name} -> [${coords.lat}, ${coords.lng}]`);
      } else {
        notFound.push({
          name: program.name,
          city: program.location?.city,
          state: program.location?.state
        });
      }
    }
  });
  
  // Save updated file
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  
  console.log('\n📊 Summary:');
  console.log(`   Updated: ${updated} programs`);
  console.log(`   Not found: ${notFound.length} programs`);
  
  if (notFound.length > 0) {
    console.log('\n⚠️ Programs still needing coordinates:');
    notFound.forEach(p => {
      console.log(`   - ${p.name} (${p.city}, ${p.state})`);
    });
  }
}

addCoordinates();


