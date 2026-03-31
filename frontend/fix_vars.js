const fs = require('fs');
let code = fs.readFileSync('src/App.js', 'utf8');

code = code.replace("RefreshCw, AlertCircle, CheckCircle, Menu, User,\n  Plus, Check, X, FileEdit, MessageSquare, Image as ImageIcon\n}", 
"RefreshCw, AlertCircle, CheckCircle, Menu\n}");

fs.writeFileSync('src/App.js', code);
