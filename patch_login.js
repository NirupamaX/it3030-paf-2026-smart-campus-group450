const fs = require('fs');
const file = 'frontend/src/App.js';
let content = fs.readFileSync(file, 'utf8');

// 1. Add Import
if (!content.includes('LoginPage')) {
    content = content.replace("import { useEffect", "import LoginPage from './components/LoginPage/LoginPage';\nimport { useEffect");
}

// 2. Replace authCard with LoginPage
const authCardRegex = /const authCard = \([\s\S]*?\n  \);/m;
const newAuthCard = `const authCard = (
    <LoginPage 
        mode={mode} 
        setMode={setMode} 
        loginForm={loginForm} 
        setLoginForm={setLoginForm} 
        onLogin={onLogin} 
        registerForm={registerForm} 
        setRegisterForm={setRegisterForm} 
        onRegister={onRegister} 
        loading={loading} 
        ROLES={ROLES} 
    />
);`;

if (authCardRegex.test(content)) {
    content = content.replace(authCardRegex, newAuthCard);
    fs.writeFileSync(file, content, 'utf8');
    console.log("Successfully patched App.js to use LoginPage component");
} else {
    console.log("Could not find authCard region in App.js");
}
