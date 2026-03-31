const fs = require('fs');

// IMPORTANT: We are running this file from inside "frontend", so the path is "src/App.js"
let appFilePath = 'src/App.js';
let appContent = fs.readFileSync(appFilePath, 'utf8');

const start = appContent.indexOf('const decideBooking = async');
if (start !== -1) {
    const strAfter = appContent.substring(start);
    const end = strAfter.indexOf('};') + 2;
    appContent = appContent.slice(0, start) + appContent.slice(start + end + 1);
    fs.writeFileSync(appFilePath, appContent, 'utf8');
    console.log("Sliced decideBooking via indexOf");
} else {
    console.log("Could not find decideBooking at all");
}
