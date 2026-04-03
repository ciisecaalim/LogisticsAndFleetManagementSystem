const fs=require('fs');
const path='frontend/src/pages/SettingsPage.jsx';
const file=fs.readFileSync(path,'utf8');
const lines=file.split('\\n');
console.log(lines.slice(-40).join('\\n'));
