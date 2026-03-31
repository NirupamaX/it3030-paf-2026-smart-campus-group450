const fs = require('fs');
let code = fs.readFileSync('src/App.js', 'utf8');

code = code.replace(
  "  const [mode, setMode] = useState('login');\n", 
  "  const [mode, setMode] = useState('login');\n  const [sidebarOpen, setSidebarOpen] = useState(false);\n"
);

fs.writeFileSync('src/App.js', code);