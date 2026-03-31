const fs = require('fs');
const file = 'frontend/src/App.js';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('import BookingSystem')) {
  // Try to find import LoginPage, or just put it at top 
  if (content.includes("import LoginPage")) {
     content = content.replace("import LoginPage", "import BookingSystem from './components/BookingSystem/BookingSystem';\nimport LoginPage");
  } else {
     content = "import BookingSystem from './components/BookingSystem/BookingSystem';\n" + content;
  }
}

content = content.replace("onApproveBooking={(id) => onBookingDecision(id, true)}", "onApproveBooking={async (id) => { try { await bookingDecision(id, { decision: 'APPROVED', comment: '' }); loadBookings(); } catch(e) { setError(e.message); } }}");

content = content.replace("if (reason) onBookingDecision(id, false, reason);", "if (reason) { try { await bookingDecision(id, { decision: 'REJECTED', comment: reason }); loadBookings(); } catch(e) { setError(e.message); } }");

fs.writeFileSync(file, content, 'utf8');
console.log("Patched errors");