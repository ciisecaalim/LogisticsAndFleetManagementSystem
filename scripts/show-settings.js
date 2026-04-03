const fs = require('fs');
const lines = fs.readFileSync('frontend/src/pages/SettingsPage.jsx', 'utf8').split('\n');
for (let i = 1160; i < 1240; i += 1) {
  console.log(`${(i + 1).toString().padStart(4, '0')}: ${lines[i]}`);
}
