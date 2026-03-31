const fs = require('fs');

let pgCss = fs.readFileSync('src/styles/components.css', 'utf8');

// If toasts are not defined, add them
if (!pgCss.includes('.toast')) {
  pgCss += `
/* Global Toast Notifications */
.toast {
  position: fixed;
  top: var(--space-6);
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  min-width: 300px;
  justify-content: center;
  box-shadow: var(--shadow-lg);
  animation: slideDownFadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes slideDownFadeIn {
  from { opacity: 0; transform: translate(-50%, -20px); }
  to { opacity: 1; transform: translate(-50%, 0); }
}

/* Ensure no margins mess up the position */
.alert.toast {
  margin: 0;
}
`;
  fs.writeFileSync('src/styles/components.css', pgCss);
}
