const fs = require('fs');
const lines = fs.readFileSync('frontend/src/pages/SettingsPage.jsx', 'utf8').split('\n');
lines.forEach((line, index) => {
  if (line.includes('Save ')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
