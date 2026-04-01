const fs = require('fs');
let code = fs.readFileSync('frontend/src/App.js', 'utf8');

// fix primary button
code = code.replace(/className=""primary""/g, 'className=""btn btn-primary""');
// ghost button
code = code.replace(/className=""ghost""/g, 'className=""btn btn-ghost""');
code = code.replace(/className=""danger""/g, 'className=""btn btn-danger""');

// form groups wrapping inputs
// Since it's hard to reliably regex replace <input> inside JSX cleanly, let's just do a blanket addition
code = code.replace(/<input(?!\s+className)/g, '<input className=""input""');
code = code.replace(/<select(?!\s+className)/g, '<select className=""input""');
code = code.replace(/<textarea(?!\s+className)/g, '<textarea className=""input""');

fs.writeFileSync('frontend/src/App.js', code);
console.log('App js css classes patched.');
