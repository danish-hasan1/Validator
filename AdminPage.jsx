import { useState } from 'react';
import { Btn, Card, SectionHeader, ScoreChart, StatusBadge, Badge, EmptyState } from './UI.jsx';
import Icon from './Icon.jsx';
import { getUsers, saveUser, deleteUser, getLog, clearLog, exportData } from './storage.js';
import { PROVIDERS } from './api.js';

const OP_LABELS = { p1:'JD Analysis', p2:'Skill Matrix', p3:'CV Scoring', p4:'Decision', p5:'Enrichment Q&A', p6:'LinkedIn', compare:'Comparison' };
const OP_COLORS = { p1:'#5b6af5', p2:'#7c3aed', p3:'#b45309', p4:'#ea580c', p5:'#059669', p6:'#0284c7', compare:'#7c3aed' };

function exportCSV(jdList) {
  const rows = [
    ['JD Name', 'Candidate Name', 'CV Title', 'Score', 'Recommendation', 'Confidence', 'Status', 'Core', 'Secondary', 'Implicit', 'Saved'],
  ];
  for (const j of jdList) {
    for (const c of Object.values(j.candidates || {})) {
      if (!c.score?.total) continue;
      rows.push([
        j.name, c.name, c.title || '',
        c.score.total, c.score.recommendation || '', c.score.confidence || '',
        c.status || 'new',
        c.score.category_scores?.Core || '', c.score.category_scores?.Secondary || '', c.score.category_scores?.Implicit || '',
        c.savedAt ? new Date(c.savedAt).toLocaleDateString() : '',
      ]);
    }
  }
  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = `validator_scores_${Date.now()}.csv`;
  a.click();
}

export default function AdminPage({ user, store, onStoreChange, onNavigate, notify }) {
  const [users,       setUsers]       = useState(() => getUsers());
  const [log,         setLog]         = useState(() => getLog());
  const [editingUser, setEditingUser] = useState(null);
  const [editForm,    setEditForm]    = useState({});
  const [searchQ,     setSearchQ]     = useState('');
  const [activeTab,   setActiveTab]   = useState('overview');

  const jdList    = Object.values(store).sort((a, b) => b.savedAt - a.savedAt);
  const filtJDs   = jdList.filter(j => !searchQ || j.name.toLowerCase().includes(searchQ.toLowerCase()));
  const allCands   = jdList.flatMap(j => Object.values(j.candidates || {}));
  const allScored  = allCands.filter(c => c.score?.total != null);
  const totalMsgs  = allCands.reduce((acc, c) => acc + (c.messages?.length || 0), 0);
  const contacted  = allCands.filter(c => (c.messages||[]).some(m => m.status === 'sent')).length;
  const avgScore  = allScored.length ? Math.round(allScored.reduce((a,c)=>a+c.score.total,0)/allScored.length) : null;

  const startEditUser = (u) => {
    setEditingUser(u.email);
    setEditForm({ name:u.name, apiKey:u.apiKey||'', provider:u.provider||'anthropic', model:u.model||'', role:u.role });
  };

  const saveEditUser = (email) => {
    const u = { ...users[email], ...editForm };
    saveUser(u);
    setUsers(prev => ({ ...prev, [email]: u }));
    setEditingUser(null);
    notify('User updated ✓');
  };

  const toggleActive = (email) => {
    const updated = { ...users[email], active: !users[email].active };
    saveUser(updated);
    setUsers(prev => ({ ...prev, [email]: updated }));
    notify(`${email} ${updated.active?'activated':'deactivated'}.`, 'warn');
  };

  const removeUser = (email) => {
    if (!confirm(`Delete user "${email}"?`)) return;
    deleteUser(email);
    setUsers(prev => { const u={...prev}; delete u[email]; return u; });
    notify(`${email} removed.`, 'warn');
  };

  const statCards = [
    { label:'Saved JDs',    val:jdList.length,  icon:'brief', color:'#5b6af5' },
    { label:'Candidates',   val:allCands.length, icon:'users', color:'#7c3aed' },
    { label:'Avg Score',    val:avgScore?`${avgScore}`:'—', icon:'star', color:avgScore?(avgScore>=75?'#16a34a':'#b45309'):'#8892b0' },
    { label:'Shortlisted',  val:allCands.filter(c=>c.status==='shortlisted').length, icon:'check',   color:'#16a34a' },
    { label:'On Hold',      val:allCands.filter(c=>c.status==='hold').length,        icon:'star',    color:'#b45309' },
    { label:'Rejected',     val:allCands.filter(c=>c.status==='rejected').length,    icon:'x',       color:'#dc2626' },
    { label:'Users',        val:Object.keys(users).length,                           icon:'users',   color:'#0284c7' },
    { label:'API Calls',    val:log.length,                                          icon:'zap',     color:'#ea580c' },
    { label:'Contacted',    val:contacted,                                           icon:'send',    color:'#7c3aed' },
    { label:'Messages Sent',val:totalMsgs,                                           icon:'chat',    color:'#059669' },
  ];

  const subTabs = ['overview', 'users', 'jds', 'log'];

  return (
    <div>
      <h2 style={{ fontSize:22, fontWeight:900, color:'#1a1f36', marginBottom:4 }}>Admin Dashboard</h2>
      <p style={{ color:'#8892b0', fontSize:13, marginBottom:20 }}>Full platform visibility — users, JDs, candidates, activity.</p>

      <div style={{ display:'flex', gap:4, marginBottom:24, background:'#e8ecf5', borderRadius:12, padding:4, boxShadow:'inset 2px 2px 6px #d0d8ea,inset -2px -2px 5px #fff' }}>
        {subTabs.map(t=>(
          <button key={t} onClick={()=>setActiveTab(t)}
            style={{ flex:1, padding:'8px 0', borderRadius:9, border:'none', background:activeTab===t?'#fff':'transparent', color:activeTab===t?'#5b6af5':'#8892b0', fontWeight:activeTab===t?700:500, fontSize:13, cursor:'pointer', fontFamily:'inherit', textTransform:'capitalize', boxShadow:activeTab===t?'2px 2px 8px #c8d0e0,-1px -1px 5px #fff':'none', transition:'all .2s' }}>
            {t==='jds'?'JDs':t.charAt(0).toUpperCase()+t.slice(1)}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {activeTab==='overview' && (
        <div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))', gap:10, marginBottom:24 }}>
            {statCards.map(s=>(
              <Card key={s.label} style={{ padding:'14px 16px' }}>
                <Icon n={s.icon} size={18} color={s.color}/>
                <div style={{ fontSize:26, fontWeight:900, color:'#1a1f36', lineHeight:1, marginTop:8 }}>{s.val}</div>
                <div style={{ fontSize:10.5, color:'#8892b0', marginTop:4, letterSpacing:'.5px', textTransform:'uppercase' }}>{s.label}</div>
              </Card>
            ))}
          </div>

          {allScored.length>0 && (
            <Card style={{ marginBottom:20 }}>
              <SectionHeader title={`All Scored Candidates (${allScored.length}) — Top Scores`}/>
              <ScoreChart
                candidates={[...allScored].sort((a,b)=>b.score.total-a.score.total).slice(0,12)}
                onSelect={n=>{ const jdKey=jdList.find(j=>j.candidates?.[n])?.name; if(jdKey) onNavigate('cv',jdKey,n); }}
              />
            </Card>
          )}

          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            <Btn v="secondary" onClick={exportData}><Icon n="download" size={14}/>Export Full Backup</Btn>
            {allScored.length>0 && (
              <Btn v="secondary" onClick={()=>exportCSV(jdList)}>
                <Icon n="file" size={14}/>Export Scores CSV
              </Btn>
            )}
          </div>
        </div>
      )}

      {/* USERS */}
      {activeTab==='users' && (
        <div>
          <SectionHeader title={`Users (${Object.keys(users).length})`}/>
          {Object.values(users).length===0
            ? <EmptyState icon="👤" title="No users yet" sub="Users appear here after registering."/>
            : (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {Object.values(users).map(u=>{
                  const prov=PROVIDERS[u.provider||'anthropic']||PROVIDERS.anthropic;
                  const isEditing=editingUser===u.email;
                  return (
                    <Card key={u.email} style={{ padding:'14px 18px' }}>
                      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                            <div style={{ width:34, height:34, borderRadius:'50%', background:u.role==='admin'?'linear-gradient(135deg,#7c3aed,#5b6af5)':'linear-gradient(135deg,#5b6af5,#0284c7)', display:'grid', placeItems:'center', flexShrink:0 }}>
                              <span style={{ fontSize:14, fontWeight:800, color:'#fff' }}>{u.name?.[0]?.toUpperCase()||'?'}</span>
                            </div>
                            <div>
                              <div style={{ display:'flex', alignItems:'center', gap:7, flexWrap:'wrap' }}>
                                <span style={{ fontWeight:700, fontSize:13.5, color:'#1a1f36' }}>{u.name}</span>
                                <Badge color={u.role==='admin'?'#7c3aed':'#5b6af5'} bg={u.role==='admin'?'#f5f3ff':'#eef0ff'}>{u.role}</Badge>
                                {!u.active&&<Badge color="#dc2626" bg="#fee2e2">Inactive</Badge>}
                              </div>
                              <div style={{ fontSize:12, color:'#8892b0' }}>{u.email} · {new Date(u.createdAt).toLocaleDateString()}</div>
                            </div>
                          </div>
                          <div style={{ display:'flex', alignItems:'center', gap:8, paddingLeft:42 }}>
                            <span style={{ fontSize:14 }}>{prov.logo}</span>
                            <span style={{ fontSize:12, color:prov.color, fontWeight:600 }}>{prov.name}</span>
                            {u.model&&<span style={{ fontSize:11, color:'#8892b0' }}>{u.model.split('-').slice(0,3).join('-')}</span>}
                            {u.apiKey
                              ? <span style={{ fontSize:11, color:'#8892b0', fontFamily:"'Space Mono',monospace" }}>···{u.apiKey.slice(-4)}</span>
                              : <span style={{ fontSize:11, color:'#ea580c' }}>⚠ No key</span>}
                          </div>
                        </div>
                        <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                          {!isEditing&&<>
                            <Btn sm v="ghost" onClick={()=>startEditUser(u)}><Icon n="edit" size={12}/>Edit</Btn>
                            <Btn sm v={u.active?'danger':'success'} onClick={()=>toggleActive(u.email)}>{u.active?'Deactivate':'Activate'}</Btn>
                            {u.role!=='admin'&&<Btn sm v="danger" onClick={()=>removeUser(u.email)}><Icon n="trash" size={12}/></Btn>}
                          </>}
                          {isEditing&&<>
                            <Btn sm onClick={()=>saveEditUser(u.email)}><Icon n="save" size={12}/>Save</Btn>
                            <Btn sm v="ghost" onClick={()=>setEditingUser(null)}><Icon n="x" size={12}/></Btn>
                          </>}
                        </div>
                      </div>
                      {isEditing&&(
                        <div style={{ marginTop:14, paddingTop:14, borderTop:'1px solid #f0f2f7', display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                          {[['Name','name','text'],['API Key','apiKey','password']].map(([label,field,type])=>(
                            <div key={field}>
                              <div style={{ fontSize:10.5, fontWeight:700, color:'#8892b0', marginBottom:4, letterSpacing:'.5px', textTransform:'uppercase' }}>{label}</div>
                              <input value={editForm[field]||''} onChange={e=>setEditForm(f=>({...f,[field]:e.target.value}))} type={type} placeholder={field==='apiKey'?'Paste new key (leave blank to keep current)':''} style={{ width:'100%', padding:'7px 10px', fontSize:13, borderRadius:7 }}/>
                            </div>
                          ))}
                          <div>
                            <div style={{ fontSize:10.5, fontWeight:700, color:'#8892b0', marginBottom:4, letterSpacing:'.5px', textTransform:'uppercase' }}>Role</div>
                            <select value={editForm.role||'user'} onChange={e=>setEditForm(f=>({...f,role:e.target.value}))} style={{ width:'100%', padding:'7px 10px', fontSize:13, borderRadius:7 }}>
                              <option value="user">user</option><option value="admin">admin</option>
                            </select>
                          </div>
                          <div>
                            <div style={{ fontSize:10.5, fontWeight:700, color:'#8892b0', marginBottom:4, letterSpacing:'.5px', textTransform:'uppercase' }}>Provider</div>
                            <select value={editForm.provider||'anthropic'} onChange={e=>setEditForm(f=>({...f,provider:e.target.value,model:PROVIDERS[e.target.value]?.defaultModel||''}))} style={{ width:'100%', padding:'7px 10px', fontSize:13, borderRadius:7 }}>
                              {Object.values(PROVIDERS).map(p=><option key={p.id} value={p.id}>{p.logo} {p.name}</option>)}
                            </select>
                          </div>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
        </div>
      )}

      {/* JDs */}
      {activeTab==='jds' && (
        <div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
            <SectionHeader title={`Job Descriptions (${jdList.length})`}/>
            <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="Search JDs…" style={{ padding:'6px 12px', fontSize:12, borderRadius:8, width:200 }}/>
          </div>
          {filtJDs.length===0
            ? <EmptyState icon="📋" title="No JDs found" sub={searchQ?'Try a different term.':'No JDs saved yet.'}/>
            : <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {filtJDs.map(j=>{
                  const cands=Object.values(j.candidates||{}), scores=cands.map(c=>c.score?.total).filter(v=>v!=null), best=scores.length?Math.max(...scores):null;
                  return (
                    <Card key={j.name} style={{ padding:'14px 18px' }}>
                      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
                        <div>
                          <div style={{ fontWeight:700, fontSize:14, color:'#1a1f36', marginBottom:3 }}>{j.name}</div>
                          <div style={{ fontSize:12, color:'#8892b0' }}>{cands.length} candidate{cands.length!==1?'s':''} · {new Date(j.savedAt).toLocaleDateString()}{best!=null&&` · Best: ${best}/100`}</div>
                        </div>
                        <div style={{ display:'flex', gap:7 }}>
                          <Btn sm v="teal" onClick={()=>onNavigate('cv',j.name)}><Icon n="user" size={12}/>Evaluate</Btn>
                          <Btn sm v="ghost" onClick={()=>onNavigate('pipeline',j.name)}><Icon n="kanban" size={12}/>Pipeline</Btn>
                        </div>
                      </div>
                      {cands.length>0&&scores.length>0&&(
                        <div style={{ marginTop:12, paddingTop:12, borderTop:'1px solid #f0f2f7' }}>
                          <ScoreChart candidates={cands} onSelect={n=>onNavigate('cv',j.name,n)}/>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>}
        </div>
      )}

      {/* LOG */}
      {activeTab==='log' && (
        <div>
          <SectionHeader title={`Activity Log (${log.length})`} action={log.length>0&&(
            <Btn sm v="danger" onClick={()=>{ clearLog(); setLog([]); notify('Log cleared.','warn'); }}><Icon n="trash" size={12}/>Clear</Btn>
          )}/>
          {log.length===0
            ? <EmptyState icon="📊" title="No activity yet" sub="API calls appear here."/>
            : <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                {log.slice(0,100).map((l,i)=>(
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:14, padding:'7px 13px', background:'#fafbff', border:'1px solid #eef0ff', borderRadius:9 }}>
                    <span style={{ fontSize:10.5, color:'#8892b0', fontFamily:"'Space Mono',monospace", minWidth:70 }}>{new Date(l.ts).toLocaleTimeString()}</span>
                    <span style={{ fontSize:12.5, fontWeight:700, color:OP_COLORS[l.op]||'#8892b0', minWidth:130 }}>{OP_LABELS[l.op]||l.op}</span>
                    {l.userId&&<span style={{ fontSize:11.5, color:'#c5c9fb', fontFamily:"'Space Mono',monospace" }}>{l.userId}</span>}
                    <span style={{ fontSize:11, color:'#c5c9fb', marginLeft:'auto' }}>{new Date(l.ts).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>}
        </div>
      )}
    </div>
  );
}
