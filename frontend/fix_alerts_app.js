const fs = require('fs');
let code = fs.readFileSync('src/App.js', 'utf8');

// 1. In the !token block, rewrite the basic alerts
code = code.replace(
  "{error ? <div className=\"alert error\">{error}</div> : null}",
  "{error && <div className=\"alert error toast\"><AlertCircle size={18}/> {error}</div>}"
);

code = code.replace(
  "{info ? <div className=\"alert success\">{info}</div> : null}",
  "{info && <div className=\"alert success toast\"><CheckCircle size={18}/> {info}</div>}"
);

// 2. In the main layout, rewrite the existing custom alerts to include 'toast'
code = code.replace(
  "{error && <div className=\"alert error\"><AlertCircle size={18}/> {error}</div>}",
  "{error && <div className=\"alert error toast\"><AlertCircle size={18}/> {error}</div>}"
);

code = code.replace(
  "{info && <div className=\"alert success\"><CheckCircle size={18}/> {info}</div>}",
  "{info && <div className=\"alert success toast\"><CheckCircle size={18}/> {info}</div>}"
);

fs.writeFileSync('src/App.js', code);
