const fs = require('fs');

let pgCss = fs.readFileSync('src/styles/pages.css', 'utf8');

// remove old auth styling from pages.css
pgCss = pgCss.replace(/\/\* Auth Centered Container \*\/[\s\S]*/, "");

pgCss += `/* Auth Experience Styles */
.auth-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: 
    radial-gradient(ellipse at top left, var(--primary-light), transparent 50%),
    radial-gradient(ellipse at bottom right, var(--secondary-light), transparent 50%),
    var(--bg-body);
  padding: var(--space-4);
  animation: authFadeIn 0.8s ease-out;
}

@keyframes authFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.auth-shell {
  display: flex;
  flex-direction: row;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-hover);
  overflow: hidden;
  max-width: 1000px;
  width: 100%;
  animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideUp {
  from { transform: translateY(40px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.brand-card {
  flex: 1;
  padding: 4rem;
  background: linear-gradient(135deg, var(--primary), #818CF8);
  color: var(--text-inverse);
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.brand-card::after {
  content: '';
  position: absolute;
  top: -50%;
  right: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 60%);
  animation: pulse 15s infinite linear;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

.brand-card h1 {
  font-size: 3rem;
  font-weight: 800;
  letter-spacing: -0.04em;
  margin-bottom: var(--space-2);
  z-index: 1;
}

.brand-card .slogan {
  font-size: 1.25rem;
  font-weight: 500;
  opacity: 0.9;
  margin-bottom: var(--space-6);
  z-index: 1;
}

.brand-card p {
  opacity: 0.8;
  line-height: 1.6;
  margin-bottom: var(--space-6);
  z-index: 1;
}

.brand-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  margin-bottom: var(--space-8);
  z-index: 1;
}

.brand-tags span {
  background: rgba(255, 255, 255, 0.2);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-pill);
  font-size: 0.85rem;
  font-weight: 600;
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255,255,255,0.1);
}

.oauth-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-card);
  color: var(--primary);
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-md);
  font-weight: 700;
  text-align: center;
  transition: all 0.3s ease;
  box-shadow: var(--shadow-sm);
  text-decoration: none;
  z-index: 1;
}

.oauth-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  background: var(--bg-body);
}

.auth-box {
  flex: 1;
  padding: 4rem;
  background: var(--bg-card);
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.auth-switch {
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-6);
  border-bottom: 2px solid var(--border-color);
  padding-bottom: var(--space-4);
}

.auth-switch button {
  flex: 1;
  padding: var(--space-3);
  font-weight: 600;
  transition: all 0.3s ease;
}

/* Animations for form elements */
.auth-box form {
  animation: fadeIn 0.4s ease-out;
}

.auth-box .input, .auth-box select {
  transition: all 0.3s ease;
  border: 1px solid var(--border-color);
  background: var(--bg-body);
}

.auth-box .input:focus, .auth-box select:focus {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.1);
  background: var(--bg-card);
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 768px) {
  .auth-shell {
    flex-direction: column;
  }
  .brand-card, .auth-box {
    padding: 2rem;
  }
}
`;

fs.writeFileSync('src/styles/pages.css', pgCss);
