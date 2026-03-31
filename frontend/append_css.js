const fs = require('fs');
let code = fs.readFileSync('src/App.css', 'utf8');

const extra = `
.admin-analytics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-4);
  margin-top: var(--space-4);
}
.analytics-card {
  background: var(--primary-light);
  color: var(--primary-hover);
  padding: var(--space-6);
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-2);
}
.analytics-card small {
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
}
.analytics-card h3 {
  font-size: 2rem;
  font-weight: 800;
  margin: 0;
}
`;

fs.writeFileSync('src/App.css', code + extra);
