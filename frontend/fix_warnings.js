const fs = require('fs');

// Fix BookingSystem
let bsFilePath = 'src/components/BookingSystem/BookingSystem.jsx';
let bsContent = fs.readFileSync(bsFilePath, 'utf8');
bsContent = bsContent.replace("const source = isAdmin ? allBookings : allBookings; // In a real app we might fetch facility-specific bookings", "");
fs.writeFileSync(bsFilePath, bsContent, 'utf8');

// Fix App.js
let appFilePath = 'src/App.js';
let appContent = fs.readFileSync(appFilePath, 'utf8');
appContent = appContent.replace("const [decisionForm, setDecisionForm] = useState({});", "");
appContent = appContent.replace(/const submitBooking = async \([\s\S]*?loadBookings\(\);\n    \} catch \(err\) \{\n      setError\(err\.message\);\n    \}\n  \};/m, "");
appContent = appContent.replace(/const decideBooking = async \([\s\S]*?loadBookings\(\);\n    \} catch \(err\) \{\n      setError\(err\.message\);\n    \}\n  \};/m, "");

fs.writeFileSync(appFilePath, appContent, 'utf8');
console.log("Fixed warnings");
