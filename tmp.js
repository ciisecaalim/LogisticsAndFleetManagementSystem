const fs=require('fs'); 
const data=fs.readFileSync('frontend\\src\\pages\\VehiclesPage.jsx','utf8').split('\\n').slice(520,620).join('\\n'); 
console.log(data); 
