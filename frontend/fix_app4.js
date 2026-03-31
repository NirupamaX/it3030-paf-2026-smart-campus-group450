const fs = require('fs');
let appFilePath = 'src/App.js';
let appContent = fs.readFileSync(appFilePath, 'utf8');

const regex = /const decideBooking = async \([\s\S]*?setInfo\(`Booking \$\{decision\.toLowerCase\(\)\}\.`\);\n      await loadBookings\(\);\n    \} catch \(err\) \{\n      setError\(err\.message\);\n    \}\n  \};/m;

appContent = appContent.replace(regex, "");

fs.writeFileSync(appFilePath, appContent, 'utf8');
console.log("Removed decideBooking successfully");