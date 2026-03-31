const fs = require('fs');

let code = fs.readFileSync('src/App.js', 'utf8');

// Update raw inputs/selects/textareas to use .input class if they do not have one 
code = code.replace(/<input\s+(?![^>]*className=)/g, '<input className="input" ');
code = code.replace(/<input\n/g, '<input className="input"\n');
code = code.replace(/<select\s+(?![^>]*className=)/g, '<select className="input" ');
code = code.replace(/<select\n/g, '<select className="input"\n');
code = code.replace(/<textarea\s+(?![^>]*className=)/g, '<textarea className="input" ');
code = code.replace(/<textarea\n/g, '<textarea className="input"\n');

// Update buttons with the base button class
// Find button where no className is set: <button type=... => <button className="btn btn-secondary" type=...
code = code.replace(/<button(?![^>]*className=)/g, '<button className="btn btn-secondary"');

// Fix old .primary to .btn .btn-primary
code = code.replace(/className="primary"/g, 'className="btn btn-primary"');
code = code.replace(/className="primary "/g, 'className="btn btn-primary "');

// Auth switch button classes
code = code.replace(/className=\{mode === 'login' \? 'active' : ''\}/g, 'className={`btn ${mode === \'login\' ? \'btn-primary\' : \'btn-ghost\'}`}');
code = code.replace(/className=\{mode === 'register' \? 'active' : ''\}/g, 'className={`btn ${mode === \'register\' ? \'btn-primary\' : \'btn-ghost\'}`}');

// Add styling for auth-switch
const authStyles = `
.auth-switch {
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-6);
  border-bottom: 1px solid var(--border-color);
  padding-bottom: var(--space-4);
}
.auth-switch button {
  flex: 1;
}
`;

fs.writeFileSync('src/App.js', code);

// Append auth styles inside styles/pages.css
let pagesCss = fs.readFileSync('src/styles/pages.css', 'utf8');
if (!pagesCss.includes('.auth-switch')) {
  pagesCss += "\n" + authStyles;
  fs.writeFileSync('src/styles/pages.css', pagesCss);
}

// We will also just make sure standard tags use form-group or space between them. 
// We can just add marginal bottom to inputs and labels in components.css
let compsCss = fs.readFileSync('src/styles/components.css', 'utf8');
const formStyles = `
.auth-box form {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.auth-box label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-muted);
  margin-bottom: calc(var(--space-1) * -1);
}
`;
if (!compsCss.includes('.auth-box form')) {
  compsCss += "\n" + formStyles;
  fs.writeFileSync('src/styles/components.css', compsCss);
}

