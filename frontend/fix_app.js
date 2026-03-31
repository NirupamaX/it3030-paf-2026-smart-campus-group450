const fs = require('fs');
let code = fs.readFileSync('src/App.js', 'utf8');

// remove duplicated lucide-react import
code = code.replace(/import {[\s\S]*?lucide-react';\n/g, "");

// put it back exactly once
const importReplacement = `import { 
  LayoutDashboard, Building2, Calendar as CalIcon, AlertTriangle, 
  Bell, Shield, LogOut, RefreshCw, AlertCircle, CheckCircle, Menu, User,
  Plus, Check, X, FileEdit, MessageSquare, Image as ImageIcon
} from 'lucide-react';\n`;

code = code.replace("import './App.css';\n", "import './App.css';\n" + importReplacement);
fs.writeFileSync('src/App.js', code);
