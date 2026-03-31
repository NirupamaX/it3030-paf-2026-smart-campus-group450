const fs = require('fs');
let code = fs.readFileSync('src/App.js', 'utf8');

code = code.replace(
  "  const [mode, setMode] = useState('login');", 
  "  const [mode, setMode] = useState('login');\n  const [sidebarOpen, setSidebarOpen] = useState(false);"
);

fs.writeFileSync('src/App.js', code);
