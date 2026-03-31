const fs = require('fs');

let code = fs.readFileSync('src/App.js', 'utf8');

const importReplacement = `import './App.css';
import { 
  LayoutDashboard, Building2, Calendar as CalIcon, AlertTriangle, 
  Bell, Shield, LogOut, RefreshCw, AlertCircle, CheckCircle, Menu, User,
  Plus, Check, X, FileEdit, MessageSquare, Image as ImageIcon
} from 'lucide-react';
`;

code = code.replace("import './App.css';", importReplacement);

// Render function rewrite!
// We'll replace everything from 'return (' to the first `<nav className="tabs">` block
const mainReturnRegex = /return \(\s*<main className="app">\s*<header className="topbar">[\s\S]*?<nav className="tabs">[\s\S]*?<\/nav>/m;

const newLayout = `
  const getTabIcon = (t) => {
    switch (t) {
      case 'Facilities': return <Building2 size={18} />;
      case 'Bookings': return <CalIcon size={18} />;
      case 'Incidents': return <AlertTriangle size={18} />;
      case 'Notifications': return <Bell size={18} />;
      case 'Admin': return <Shield size={18} />;
      default: return <LayoutDashboard size={18} />;
    }
  };

  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="layout-container">
      <aside className={\`sidebar \${sidebarOpen ? 'open' : ''}\`}>
        <div className="sidebar-brand">
          <LayoutDashboard size={24} />
          <h2>CampusX</h2>
        </div>
        <nav className="sidebar-nav">
          {visibleTabs.map((item) => (
            <button
              key={item}
              className={\`nav-item \${tab === item ? 'active' : ''}\`}
              onClick={() => { setTab(item); setSidebarOpen(false); }}
              type="button"
            >
              <div className="nav-item-content">
                {getTabIcon(item)}
                {item}
              </div>
              {item === 'Notifications' && unread > 0 ? (
                <span className="badge badge-red">{unread}</span>
              ) : null}
            </button>
          ))}
        </nav>
      </aside>

      <main className="main-wrapper">
        <header className="topbar">
          <div className="topbar-left">
            <button className="btn btn-ghost d-sm-block" style={{ display: typeof window !== 'undefined' && window.innerWidth <= 768 ? 'block' : 'none'}} onClick={() => setSidebarOpen(true)}>
              <Menu size={20} />
            </button>
            <h3 style={{ margin: 0, fontWeight: 600 }}>{tab}</h3>
          </div>
          <div className="topbar-right">
            <button onClick={loadAll} className="btn btn-ghost" type="button" title="Refresh">
              <RefreshCw size={18} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '8px', borderLeft: '1px solid var(--border-color)' }}>
              <span className="badge badge-indigo">{user?.role || '-'}</span>
              <button onClick={onLogout} className="btn btn-ghost" style={{color: 'var(--danger)'}} type="button">
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </header>

        <div className="page-content-scroll">
          {error && <div className="alert error"><AlertCircle size={18}/> {error}</div>}
          {info && <div className="alert success"><CheckCircle size={18}/> {info}</div>}

          {/* Quick Analytics Strip directly above tabs content */}
          {tab === 'Facilities' && (
             <section className="analytics-grid">
               {dashboardStats.map((item) => (
                 <article className="card analytic-card" key={item.label}>
                   <p className="analytic-title">{item.label}</p>
                   <div className="analytic-value">{item.value}</div>
                   <span className="analytic-hint">{item.hint}</span>
                 </article>
               ))}
             </section>
          )}

`;

code = code.replace(mainReturnRegex, newLayout);

code = code.replace(/<\/main>\s*\);\s*}\s*export default App;/m, "        </div>\n      </main>\n    </div>\n  );\n}\n\nexport default App;");

// Update standard classes to match new design elements (cards, buttons)
code = code.replace(/className="app"/g, "className=\"auth-wrapper\"");
code = code.replace(/className="auth-card"/g, "className=\"auth-box\"");
code = code.replace(/<button onClick=\{handleLogin\}/g, "<button className=\"btn btn-primary\" style={{width:'100%', marginTop:16}} onClick={handleLogin}");
code = code.replace(/<button onClick=\{handleRegister\}/g, "<button className=\"btn btn-primary\" style={{width:'100%', marginTop:16}} onClick={handleRegister}");
code = code.replace(/className="ghost"/g, "className=\"btn btn-ghost\"");

fs.writeFileSync('src/App.js', code);
