import { useState, useEffect, useCallback } from 'react';
import { getCurrentUser, logout, seedAdmin, isAdmin, getAIConfig } from './lib/auth.js';
import { getStore } from './lib/storage.js';
import { PROVIDERS } from './lib/api.js';
import AuthPage       from './pages/AuthPage.jsx';
import SetupJDPage    from './pages/SetupJDPage.jsx';
import EvaluateCVPage from './pages/EvaluateCVPage.jsx';
import ComparePage    from './pages/ComparePage.jsx';
import PipelinePage   from './pages/PipelinePage.jsx';
import LinkedInPage   from './pages/LinkedInPage.jsx';
import OutreachPage   from './pages/OutreachPage.jsx';
import AdminPage      from './pages/AdminPage.jsx';
import SettingsPage   from './pages/SettingsPage.jsx';
import GuidePage      from './pages/GuidePage.jsx';
import { Notification } from './components/UI.jsx';
import Icon from './components/Icon.jsx';

seedAdmin();

const NAV = [
  { id: 'jd',       label: 'Job Description', icon: 'brief'   },
  { id: 'cv',       label: 'Evaluate CV',      icon: 'user'    },
  { id: 'outreach', label: 'Outreach',         icon: 'send'    },
  { id: 'compare',  label: 'Compare',          icon: 'compare' },
  { id: 'pipeline', label: 'Pipeline',         icon: 'kanban'  },
  { id: 'linkedin', label: 'LinkedIn',         icon: 'li'      },
  { id: 'guide',    label: 'Guide',            icon: 'book'    },
];

export default function App() {
  const [user,        setUser]        = useState(() => getCurrentUser());
  const [tab,         setTab]         = useState('jd');
  const [store,       setStore]       = useState(() => getStore());
  const [notif,       setNotif]       = useState(null);
  const [cvContext,   setCvContext]   = useState({ jd: null, cand: null });
  const [pipContext,  setPipContext]  = useState({ jd: null });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Listen for custom nav events fired by child pages
  useEffect(() => {
    const handler = (e) => {
      const d = e.detail;
      if (typeof d === 'string') {
        setTab(d);
      } else if (d?.tab) {
        setTab(d.tab);
        if (d.tab === 'cv')       setCvContext({ jd: d.jd || null, cand: d.cand || null });
        if (d.tab === 'pipeline') setPipContext({ jd: d.jd || null });
      }
      setSidebarOpen(false);
    };
    document.addEventListener('nav', handler);
    return () => document.removeEventListener('nav', handler);
  }, []);

  const notify = useCallback((msg, type = 'ok') => {
    setNotif({ msg, type });
    setTimeout(() => setNotif(null), 3500);
  }, []);

  const navigate = useCallback((tabId, jd = null, cand = null) => {
    setTab(tabId);
    if (tabId === 'cv' || tabId === 'outreach') setCvContext({ jd, cand });
    if (tabId === 'pipeline') setPipContext({ jd });
    setSidebarOpen(false);
  }, []);

  const handleStoreChange = useCallback((s) => setStore({ ...s }), []);
  const handleAuth        = (u) => { setUser(u); setTab('jd'); };
  const handleLogout      = () => { logout(); setUser(null); setSidebarOpen(false); };
  const handleUserUpdate  = (u) => setUser(u);

  if (!user) return <AuthPage onAuth={handleAuth} />;

  const aiConfig = getAIConfig(user);
  const provDef  = PROVIDERS[aiConfig.provider] || PROVIDERS.anthropic;
  const hasKey   = !!aiConfig.apiKey;
  const jdList   = Object.values(store).sort((a, b) => b.savedAt - a.savedAt);
  const pageProps = { user, aiConfig, store, onStoreChange: handleStoreChange, onNavigate: navigate, notify };

  const NavItem = ({ id, label, icon, color }) => {
    const active = tab === id;
    return (
      <button onClick={() => navigate(id)}
        style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', borderRadius:10, border:'none', background: active ? (color ? `${color}18` : '#eef0ff') : 'transparent', color: active ? (color || '#5b6af5') : '#8892b0', cursor:'pointer', fontSize:13, fontWeight: active ? 700 : 500, fontFamily:'inherit', textAlign:'left', transition:'all .12s', boxShadow: active ? `inset 2px 2px 5px ${color || '#5b6af5'}18` : 'none', width:'100%' }}>
        <Icon n={icon} size={15} color={active ? (color || '#5b6af5') : '#c5c9fb'} />
        {label}
      </button>
    );
  };

  const Sidebar = () => (
    <aside className="app-sidebar" style={{ width:'var(--sidebar-w)', background:'#fff', borderRight:'1px solid #eef0f5', display:'flex', flexDirection:'column', flexShrink:0, boxShadow:'4px 0 18px rgba(91,106,245,.06)', height:'100%' }}>

      {/* Logo */}
      <a href="./landing.html" style={{ padding:'18px 16px 14px', borderBottom:'1px solid #f0f2f7', display:'flex', alignItems:'center', gap:10, textDecoration:'none' }}>
        <div style={{ width:34, height:34, borderRadius:10, background:'linear-gradient(135deg,#5b6af5,#7c5cbf)', display:'grid', placeItems:'center', boxShadow:'0 3px 10px rgba(91,106,245,.35)', flexShrink:0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
        </div>
        <div>
          <div style={{ fontWeight:900, fontSize:15, color:'#1a1f36', letterSpacing:'-.4px' }}>Validator</div>
          <div style={{ fontSize:9, color:'#c5c9fb', letterSpacing:'.8px', textTransform:'uppercase' }}>AI Recruiting</div>
        </div>
      </a>

      {/* Nav */}
      <nav style={{ padding:'10px 8px', display:'flex', flexDirection:'column', gap:2 }}>
        {NAV.map(item => <NavItem key={item.id} {...item} />)}
        {isAdmin(user) && <NavItem id="admin" label="Admin" icon="shield" color="#7c3aed" />}
        <NavItem id="settings" label="Settings" icon="settings" />
      </nav>

      {/* Provider badge */}
      {hasKey && (
        <div style={{ margin:'0 8px 8px', padding:'7px 10px', background:provDef.bg, border:`1px solid ${provDef.color}33`, borderRadius:8, display:'flex', alignItems:'center', gap:7 }}>
          <span style={{ fontSize:14 }}>{provDef.logo}</span>
          <div style={{ minWidth:0 }}>
            <div style={{ fontSize:11, fontWeight:700, color:provDef.color, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{provDef.name}</div>
            <div style={{ fontSize:10, color:'#8892b0', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{aiConfig.model.split('-').slice(0,3).join('-')}</div>
          </div>
        </div>
      )}

      {/* Saved JDs */}
      <div style={{ flex:1, overflowY:'auto', borderTop:'1px solid #f0f2f7', padding:'8px 8px' }}>
        <div style={{ fontSize:10, fontWeight:800, color:'#c5c9fb', letterSpacing:'1px', textTransform:'uppercase', padding:'4px 6px 6px' }}>
          Saved JDs ({jdList.length})
        </div>
        {jdList.length === 0 && <div style={{ fontSize:12, color:'#dde3f0', padding:'0 6px' }}>None yet.</div>}
        {jdList.map(j => {
          const cc = Object.keys(j.candidates||{}).length;
          const scores = Object.values(j.candidates||{}).map(c => c.score?.total).filter(v => v != null);
          const best = scores.length ? Math.max(...scores) : null;
          return (
            <button key={j.name} onClick={() => navigate('cv', j.name)}
              style={{ display:'flex', alignItems:'flex-start', gap:7, padding:'6px 6px', borderRadius:7, width:'100%', border:'none', background:'transparent', cursor:'pointer', fontFamily:'inherit', textAlign:'left', marginBottom:1 }}
              onMouseEnter={e => e.currentTarget.style.background='#f5f7fd'}
              onMouseLeave={e => e.currentTarget.style.background='transparent'}>
              <Icon n="brief" size={11} color="#c5c9fb" />
              <div style={{ overflow:'hidden', minWidth:0 }}>
                <div style={{ fontSize:11.5, fontWeight:600, color:'#4a5278', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{j.name}</div>
                <div style={{ fontSize:10, color:'#c5c9fb', marginTop:1 }}>{cc} cand{cc!==1?'s':''}{best!=null?` · top ${best}`:''}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* User footer */}
      <div style={{ padding:'10px 12px', borderTop:'1px solid #f0f2f7' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ minWidth:0, overflow:'hidden' }}>
            <div style={{ fontSize:12, fontWeight:700, color:'#4a5278', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user.name}</div>
            <div style={{ fontSize:10, color:'#c5c9fb', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user.email}</div>
          </div>
          <button onClick={handleLogout} title="Sign out" style={{ background:'none', border:'none', cursor:'pointer', color:'#c5c9fb', display:'flex', padding:3, flexShrink:0 }}>
            <Icon n="logout" size={15} />
          </button>
        </div>
        {!hasKey && (
          <div onClick={() => navigate('settings')} style={{ marginTop:7, background:'#fff7ed', border:'1px solid #fed7aa', borderRadius:7, padding:'5px 9px', fontSize:11, color:'#ea580c', cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}>
            <Icon n="warn" size={12} color="#ea580c" />No API key — tap to add
          </div>
        )}
      </div>
    </aside>
  );

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', position:'relative' }}>
      <Notification notif={notif} />

      {/* Mobile overlay */}
      <div className={`sidebar-overlay${sidebarOpen ? ' open' : ''}`} onClick={() => setSidebarOpen(false)} />

      {/* Sidebar (open/close driven by class on mobile) */}
      <div className={`app-sidebar${sidebarOpen ? ' open' : ''}`} style={{ width:'var(--sidebar-w)', position:'relative', height:'100vh', display:'flex', flexDirection:'column' }}>
        <Sidebar />
      </div>

      {/* Main */}
      <main className="app-main" style={{ flex:1, overflowY:'auto', background:'#f0f2f7', minWidth:0 }}>
        {/* Mobile top bar */}
        <div className="hamburger-btn" style={{ position:'sticky', top:0, zIndex:40, background:'#fff', borderBottom:'1px solid #eef0f5', padding:'10px 16px', alignItems:'center', gap:12, boxShadow:'0 2px 8px rgba(0,0,0,.06)' }}>
          <button onClick={() => setSidebarOpen(s => !s)} style={{ background:'none', border:'none', cursor:'pointer', display:'flex', color:'#4a5278', padding:4 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:26, height:26, borderRadius:8, background:'linear-gradient(135deg,#5b6af5,#7c5cbf)', display:'grid', placeItems:'center' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            </div>
            <span style={{ fontWeight:800, fontSize:14, color:'#1a1f36' }}>Validator</span>
          </div>
          <div style={{ marginLeft:'auto', fontSize:12.5, fontWeight:600, color:'#5b6af5', background:'#eef0ff', padding:'4px 12px', borderRadius:20 }}>
            {NAV.find(n => n.id === tab)?.label || tab}
          </div>
        </div>

        <div className="main-pad" style={{ maxWidth: tab==='pipeline' ? 1100 : 900, margin:'0 auto', padding:'24px 28px', animation:'fadeUp .22s ease both' }} key={tab}>
          {tab==='jd'       && <SetupJDPage    {...pageProps} />}
          {tab==='cv'       && <EvaluateCVPage {...pageProps} key={`cv-${cvContext.jd}-${cvContext.cand}`} preselectedJD={cvContext.jd} preselectedCand={cvContext.cand} />}
          {tab==='compare'  && <ComparePage    user={user} aiConfig={aiConfig} store={store} onNavigate={navigate} notify={notify} />}
          {tab==='outreach' && <OutreachPage   user={user} aiConfig={aiConfig} store={store} onStoreChange={handleStoreChange} onNavigate={navigate} notify={notify} preselectedJD={cvContext.jd} preselectedCand={cvContext.cand} />}
          {tab==='pipeline' && <PipelinePage   store={store} onStoreChange={handleStoreChange} onNavigate={navigate} notify={notify} preselectedJD={pipContext.jd} />}
          {tab==='linkedin' && <LinkedInPage   user={user} aiConfig={aiConfig} store={store} notify={notify} />}
          {tab==='guide'    && <GuidePage />}
          {tab==='admin'    && isAdmin(user) && <AdminPage {...pageProps} />}
          {tab==='settings' && <SettingsPage user={user} onUserUpdate={handleUserUpdate} notify={notify} />}
        </div>
      </main>
    </div>
  );
}
