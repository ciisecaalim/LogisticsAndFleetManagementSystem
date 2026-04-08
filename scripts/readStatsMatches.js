const fs = require('fs');
const targets = [
  'frontend/src/pages/DriversPage.jsx',
  'frontend/src/pages/VehiclesPage.jsx',
  'frontend/src/pages/TripsPage.jsx',
  'frontend/src/pages/ShipmentsPage.jsx',
  'frontend/src/components/StatsBanner.jsx',
  'frontend/src/hooks/useEntityCounts.js'
];

for (const file of targets) {
  const lines = fs.readFileSync(file, 'utf8').split('\\n');
  let found = 0;
  for (let i = 0; i < lines.length && found < 3; i += 1) {
    const line = lines[i];
    if (line.includes('StatsBanner') || line.includes('SUMMARY_STATS') || line.includes('useEntityCounts')) {
      console.log(`${file}:${i + 1}: ${line.trim()}`);
      found += 1;
    }
  }
}
