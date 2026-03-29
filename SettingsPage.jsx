import { useState } from 'react';
import { Btn, Card, SectionHeader, Label } from '../components/UI.jsx';
import Icon from '../components/Icon.jsx';
import { updateProviderConfig } from '../lib/auth.js';
import { exportData, importData, KEYS, LS, getUsers, saveUser } from '../lib/storage.js';
import { PROVIDERS, PROVIDER_LIST } from '../lib/api.js';

const hashPw = (pw) => btoa(encodeURIComponent(pw + '_v1salt'));

export default function SettingsPage({ user, onUserUpdate, notify }) {
  const [provider, setProvider] = useState(user?.provider || 'anthropic');
  const [apiKey,   setApiKey]   = useState(user?.apiKey   || '');
  const [model,    setModel]    = useState(user?.model    || PROVIDERS[user?.provider||'anthropic']?.defaultModel||'');
  const [keyShow,  setKeyShow]  = useState(false);

  // Password change
  const [pwForm,   setPwForm]   = useState({ old:'', newPw:'', confirm:'' });
  const [pwErr,    setPwErr]    = useState('');
  const [pwOk,     setPwOk]     = useState(false);

  const currentProv = PROVIDERS[provider] || PROVIDERS.anthropic;

  // Provider change — keep apiKey as-is so user doesn't lose their key
  const handleProviderChange = (pid) => {
    setProvider(pid);
    setModel(PROVIDERS[pid]?.defaultModel || '');
    // Do NOT clear apiKey — let user decide what key to enter
  };

  const saveConfig = () => {
    updateProviderConfig(user.email, { apiKey, provider, model });
    onUserUpdate({ ...user, apiKey, provider, model });
    notify(`${currentProv.name} settings saved ✓`);
  };

  const removeKey = () => {
    setApiKey('');
    updateProviderConfig(user.email, { apiKey:'', provider, model });
    onUserUpdate({ ...user, apiKey:'', provider, model });
    notify('API key removed.', 'warn');
  };

  const changePassword = () => {
    setPwErr(''); setPwOk(false);
    if (!pwForm.old) { setPwErr('Enter your current password.'); return; }
    if (pwForm.newPw.length < 6) { setPwErr('New password must be at least 6 characters.'); return; }
    if (pwForm.newPw !== pwForm.confirm) { setPwErr('New passwords do not match.'); return; }
    const users = getUsers();
    const u = users[user.email];
    if (!u) { setPwErr('User not found.'); return; }
    if (u.passwordHash !== hashPw(pwForm.old)) { setPwErr('Current password is incorrect.'); return; }
    u.passwordHash = hashPw(pwForm.newPw);
    saveUser(u);
    setPwForm({ old:'', newPw:'', confirm:'' });
    setPwOk(true);
    setTimeout(() => setPwOk(false), 4000);
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try { importData(ev.target.result); notify('Data imported ✓'); }
      catch { notify('Invalid backup file.', 'err'); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const clearAll = () => {
    if (!confirm('Delete ALL data including JDs, candidates, and evaluations?\n\nThis cannot be undone.')) return;
    Object.values(KEYS).forEach(k => LS.del(k));
    notify('All data cleared. Reloading…', 'warn');
    setTimeout(() => window.location.reload(), 1200);
  };

  return (
    <div style={{ maxWidth:620 }}>
      <h2 style={{ fontSize:22, fontWeight:900, color:'#1a1f36', marginBottom:4 }}>Settings</h2>
      <p style={{ color:'#8892b0', fontSize:13, marginBottom:24 }}>Manage your AI provider, API key, password, and data.</p>

      {/* ── AI Provider & Model ── */}
      <Card raised style={{ marginBottom:20 }}>
        <SectionHeader title="AI Provider & Model"/>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:20 }}>
          {PROVIDER_LIST.map(p => {
            const active = provider===p.id;
            return (
              <button key={p.id} onClick={()=>handleProviderChange(p.id)}
                style={{ display:'flex', flexDirection:'column', alignItems:'flex-start', gap:5, padding:'11px 13px', borderRadius:10, border:`2px solid ${active?p.color:'#dde3f0'}`, background:active?p.bg:'#fafbff', cursor:'pointer', fontFamily:'inherit', textAlign:'left', transition:'all .15s', boxShadow:active?`0 0 0 3px ${p.color}22`:'2px 2px 6px #d0d8e0,-1px -1px 4px #fff' }}>
                <div style={{ display:'flex', alignItems:'center', gap:7, width:'100%' }}>
                  <span style={{ fontSize:17 }}>{p.logo}</span>
                  {active && <div style={{ marginLeft:'auto', width:7, height:7, borderRadius:'50%', background:p.color }}/>}
                </div>
                <div style={{ fontSize:12, fontWeight:700, color:active?p.color:'#4a5278' }}>{p.name}</div>
              </button>
            );
          })}
        </div>

        <div style={{ marginBottom:16 }}>
          <Label>Model</Label>
          <select value={model} onChange={e=>setModel(e.target.value)}
            style={{ width:'100%', padding:'10px 14px', fontSize:13.5, borderRadius:10, appearance:'none', background:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238892b0' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E") no-repeat right 14px center #f7f8fc`, cursor:'pointer' }}>
            {currentProv.models.map(m=>(
              <option key={m.id} value={m.id}>{m.label} — {m.note}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom:16 }}>
          <Label>{currentProv.keyLabel}</Label>
          {apiKey && (
            <div style={{ background:'#f0fdf4', border:'1.5px solid #bbf7d0', borderRadius:9, padding:'9px 13px', marginBottom:10, display:'flex', alignItems:'center', gap:9 }}>
              <Icon n="check" size={14} color="#16a34a"/>
              <span style={{ fontSize:12.5, color:'#15803d', fontFamily:"'Space Mono',monospace" }}>Active: {apiKey.slice(0,8)}…{apiKey.slice(-6)}</span>
            </div>
          )}
          <div style={{ position:'relative' }}>
            <input value={apiKey} onChange={e=>setApiKey(e.target.value)} placeholder={currentProv.keyPlaceholder} type={keyShow?'text':'password'}
              style={{ width:'100%', padding:'10px 44px 10px 14px', fontSize:13.5, borderRadius:10 }}/>
            <button onClick={()=>setKeyShow(s=>!s)} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#8892b0', display:'flex' }}>
              <Icon n={keyShow?'eyeOff':'eye'} size={16}/>
            </button>
          </div>
          <div style={{ fontSize:11.5, color:'#8892b0', marginTop:5, lineHeight:1.6 }}>{currentProv.keyHint} · Stored only in your browser.</div>
        </div>

        <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:16 }}>
          <Btn onClick={saveConfig}><Icon n="save" size={14}/>Save Configuration</Btn>
          {apiKey && <Btn v="danger" onClick={removeKey}><Icon n="trash" size={14}/>Remove Key</Btn>}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <div style={{ padding:'11px 13px', background:currentProv.bg, border:`1px solid ${currentProv.color}22`, borderRadius:10, fontSize:12.5, lineHeight:1.7 }}>
            <div style={{ fontWeight:700, color:currentProv.color, marginBottom:3 }}>{currentProv.logo} {currentProv.name}</div>
            <div style={{ color:'#4a5278' }}>{currentProv.models.length} models available</div>
            <div style={{ color:'#8892b0' }}>Cheapest: {currentProv.models[currentProv.models.length-1]?.note}</div>
          </div>
          <div style={{ padding:'11px 13px', background:'#fafbff', border:'1px solid #f0f2f7', borderRadius:10, fontSize:12.5, color:'#8892b0', lineHeight:1.7 }}>
            <div style={{ fontWeight:700, color:'#4a5278', marginBottom:3 }}>🔒 Privacy</div>
            <div>Key stored locally only.</div>
            <div>Sent directly to {currentProv.name}.</div>
          </div>
        </div>
      </Card>

      {/* ── Password Change ── */}
      <Card style={{ marginBottom:20 }}>
        <SectionHeader title="Change Password"/>
        <div style={{ display:'flex', flexDirection:'column', gap:12, maxWidth:380 }}>
          <div>
            <Label>Current Password</Label>
            <input value={pwForm.old} onChange={e=>setPwForm(f=>({...f,old:e.target.value}))} type="password" placeholder="Your current password" style={{ width:'100%', padding:'10px 14px', fontSize:13, borderRadius:10 }}/>
          </div>
          <div>
            <Label>New Password</Label>
            <input value={pwForm.newPw} onChange={e=>setPwForm(f=>({...f,newPw:e.target.value}))} type="password" placeholder="At least 6 characters" style={{ width:'100%', padding:'10px 14px', fontSize:13, borderRadius:10 }}/>
          </div>
          <div>
            <Label>Confirm New Password</Label>
            <input value={pwForm.confirm} onChange={e=>setPwForm(f=>({...f,confirm:e.target.value}))} type="password" placeholder="Repeat new password" style={{ width:'100%', padding:'10px 14px', fontSize:13, borderRadius:10 }}/>
          </div>
          {pwErr && <div style={{ fontSize:12.5, color:'#be123c', background:'#fff1f2', border:'1px solid #fecdd3', borderRadius:8, padding:'8px 12px' }}>{pwErr}</div>}
          {pwOk  && <div style={{ fontSize:12.5, color:'#15803d', background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:8, padding:'8px 12px', display:'flex', alignItems:'center', gap:7 }}><Icon n="check" size={13} color="#16a34a"/>Password changed successfully.</div>}
          <div><Btn onClick={changePassword}><Icon n="lock" size={14}/>Change Password</Btn></div>
        </div>
      </Card>

      {/* ── Account Details ── */}
      <Card style={{ marginBottom:20 }}>
        <SectionHeader title="Account Details"/>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px 24px' }}>
          {[
            ['Name',     user?.name],
            ['Email',    user?.email],
            ['Role',     user?.role],
            ['Provider', PROVIDERS[user?.provider||'anthropic']?.name],
            ['Model',    (user?.model||'').split('-').slice(0,3).join('-')||'—'],
            ['Joined',   user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'],
          ].map(([label,val])=>(
            <div key={label}>
              <div style={{ fontSize:10.5, fontWeight:700, color:'#8892b0', letterSpacing:'.6px', textTransform:'uppercase', marginBottom:3 }}>{label}</div>
              <div style={{ fontSize:13, fontWeight:500, color:'#1a1f36', wordBreak:'break-all' }}>{val||'—'}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* ── Data Management ── */}
      <Card>
        <SectionHeader title="Data Management"/>
        <p style={{ fontSize:12.5, color:'#8892b0', marginBottom:16, lineHeight:1.65 }}>
          All JDs, candidates, evaluations, and notes live in your browser's localStorage. Export regularly to back up.
        </p>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          <Btn v="secondary" onClick={exportData}><Icon n="download" size={14}/>Export Backup</Btn>
          <label style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'10px 20px', borderRadius:10, fontWeight:600, fontSize:13.5, cursor:'pointer', border:'1.5px solid #dde3f0', background:'#fff', color:'#4a5278', boxShadow:'3px 3px 8px #c8d0e0,-2px -2px 6px #fff' }}>
            <Icon n="upload" size={14}/>Import Backup
            <input type="file" accept=".json" onChange={handleImport} style={{ display:'none' }}/>
          </label>
          <Btn v="danger" onClick={clearAll}><Icon n="trash" size={14}/>Clear All Data</Btn>
        </div>
      </Card>
    </div>
  );
}
