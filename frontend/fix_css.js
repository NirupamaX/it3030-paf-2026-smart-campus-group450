const fs = require('fs');
const file = 'src/components/BookingSystem/BookingSystem.css';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/var\(--space-1\)/g, '4px');
content = content.replace(/var\(--space-2\)/g, '8px');
content = content.replace(/var\(--space-3\)/g, '12px');
content = content.replace(/var\(--space-4\)/g, '16px');
content = content.replace(/var\(--space-5\)/g, '20px');
content = content.replace(/var\(--space-6\)/g, '24px');

fs.writeFileSync(file, content, 'utf8');
console.log("Fixed CSS variables");
