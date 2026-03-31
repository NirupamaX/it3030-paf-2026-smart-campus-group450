const fs = require('fs');
const file = 'frontend/src/App.js';
let content = fs.readFileSync(file, 'utf8');

// Add Import
if (!content.includes('BookingSystem')) {
    content = content.replace("import LoginPage", "import BookingSystem from './components/BookingSystem/BookingSystem';\nimport LoginPage");
}

// Ensure loadBookings fetches all bookings if not admin too, so we can show conflicts
const loadBookingsRegex = /const loadBookings = async \(\) => {[\s\S]*?};/m;
const newLoadBookings = `const loadBookings = async () => {
    try {
      const mine = await listMyBookings();
      setBookings(mine);
    } catch(e) {}
    try {
      const all = await listAllBookings();
      setAllBookings(all);
    } catch (e) {
      if(isAdmin) console.error("Error loading all bookings", e);
    }
  };`;

// Note: If normal user gets forbidden on listAllBookings, we just catch it and ignore.
content = content.replace(loadBookingsRegex, newLoadBookings);

// Replace Bookings Render
let startIndex = content.indexOf("{tab === 'Bookings' && (");
if (startIndex === -1) {
  startIndex = content.indexOf('{tab === "Bookings" && (');
}

if (startIndex !== -1) {
    let bracketCount = 0;
    let endIndex = -1;
    let started = false;
    for (let i = startIndex; i < content.length; i++) {
        if (content[i] === '{' || content[i] === '(') {
            bracketCount++;
            started = true;
        } else if (content[i] === '}' || content[i] === ')') {
            bracketCount--;
        }
        
        if (started && bracketCount === 0 && content[i] === '}') {
            endIndex = i;
            break;
        }
    }
    
    if (endIndex !== -1) {
        const replacement = `{tab === 'Bookings' && (
          <div className="fade-in">
              <BookingSystem 
                  facilities={facilities}
                  userBookings={bookings}
                  allBookings={allBookings}
                  isAdmin={isAdmin}
                  onSubmitBooking={async (params) => {
                      try {
                          await createBooking(params);
                          setInfo('Booking request created successfully.');
                          loadBookings();
                      } catch (err) {
                          setError(err.message);
                      }
                  }}
                  onApproveBooking={(id) => onBookingDecision(id, true)}
                  onRejectBooking={(id) => {
                      const reason = prompt('Reason for rejection:');
                      if (reason) onBookingDecision(id, false, reason);
                  }}
              />
          </div>
        )}`;
        content = content.substring(0, startIndex) + replacement + content.substring(endIndex + 1);
        fs.writeFileSync(file, content, 'utf8');
        console.log("Successfully patched App.js with BookingSystem.");
    } else {
        console.log("Could not find matching end bracket for Bookings section");
    }
} else {
    console.log("Could not find start of Bookings section");
}
