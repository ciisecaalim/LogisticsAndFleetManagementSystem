const fs = require('fs');

const content = fs.readFileSync('frontend/src/pages/SettingsPage.jsx', 'utf8');
const lines = content.split('\n');

const targetIndex = lines.findIndex((line) => line.includes('Live telemetry'));
if (targetIndex === -1) {
  console.error('Live telemetry not found');
  process.exit(1);
}

for (let i = targetIndex; i < targetIndex + 80 && i < lines.length; i += 1) {
  console.log(`${(i + 1).toString().padStart(4, '0')}: ${lines[i]}`);
}
