const fs = require('fs');
let appFilePath = 'src/App.js';
let appContent = fs.readFileSync(appFilePath, 'utf8');

const decideBookingStr = `  const decideBooking = async (bookingId, decision) => {
    clearMessages();
    try {
      await bookingDecision(bookingId, {
        decision,
        comment: decisionForm[bookingId] || '',
      });
      setInfo(\`Booking \${decision.toLowerCase()}.\`);
      await loadBookings();
    } catch (err) {
      setError(err.message);
    }
  };`;

// Try dynamic regex again:
appContent = appContent.replace(/const decideBooking = async \([\s\S]*?setError\(err\.message\);\n      \}\n    \};/m, "");

fs.writeFileSync(appFilePath, appContent, 'utf8');
console.log("Removed decideBooking");
