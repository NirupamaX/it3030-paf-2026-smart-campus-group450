const fs = require('fs');
let appFilePath = 'src/App.js';
let appContent = fs.readFileSync(appFilePath, 'utf8');

// remove decideBooking entirely
appContent = appContent.replace(/const decideBooking = async \([\s\S]*?setError\(err\.message\);\n    \}\n  \};/m, "");

fs.writeFileSync(appFilePath, appContent, 'utf8');
console.log("Fixed App.js");
