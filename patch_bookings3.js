const fs = require('fs');
const file = 'frontend/src/App.js';
let content = fs.readFileSync(file, 'utf8');

content = content.replace("onRejectBooking={(id) => {", "onRejectBooking={async (id) => {");

fs.writeFileSync(file, content, 'utf8');
console.log("Patched async error");