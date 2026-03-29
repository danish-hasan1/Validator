import { useState, useEffect } from 'react';
import { Btn, TextArea, Input, Card, SectionHeader, ResultBlock, Spinner, ScoreChart } from '../components/UI.jsx';
import Icon from '../components/Icon.jsx';
import { JD_TEMPLATES, PROMPTS } from '../lib/prompts.js';
import { callAI } from '../lib/api.js';
import { saveJDEntry, deleteJDEntry, logActivity, getDraft, saveDraft } from '../lib/storage.js';

export default function SetupJDPage({ user, aiConfig, store, onStoreChange, onNavigate, notify }) {
  const [jdName,        setJdName]        = useState('');
  const [jdText,        setJdText]        = useState('');
  const [jdAnalysis,    setJdAnalysis]    = useState('');
  const [skillMatrix,   setSkillMatrix]   = useState('');
  const [loading,       setLoading]       = useState(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [editingJD,     setEditingJD]     = useState(null);
  const [savedBanner,   setSavedBanner]   = useState('');   // name of last saved JD for inline confirmation
  const [copied,        setCopied]        = useState(null);
  const [jdSearch,      setJdSearch]      = useState('');

  const jdList      = Object.values(store).sort((a, b) => b.savedAt - a.savedAt);
  const filteredJDs = jdList.filter(j => !jdSearch || j.name.toLowerCase().includes(jdSearch.toLowerCase()));

  // Auto-save draft
  useEffect(() => {
    const t = setTimeout(() => {
      if (jdText) saveDraft({ jdName, jdText, jdAnalysis, skillMatrix });
    }, 1000);
    return () => clearTimeout(t);
  }, [jdName, jdText, jdAnalysis, skillMatrix]);

  const run = async (id, prompt, setter) => {
    if (!aiConfig?.apiKey) { notify('Add your API key in Settings first.', 'err'); return null; }
    setLoading(id);
    try {
      const r = await callAI(aiConfig, prompt, setter);
      logActivity(id, user.email);
      return r;
    } catch (e) { notify(e.message, 'err'); return null; }
    finally { setLoading(null); }
  };

  const doP1 = () => run('p1', PROMPTS.p1(jdText), setJdAnalysis);
  const doP2 = (a = jdAnalysis) => run('p2', PROMPTS.p2(a), setSkillMatrix);

  const handleSave = async () => {
    if (!jdName.trim()) return notify('Give this JD a name first.', 'err');
    if (!jdText.trim()) return notify('Paste a job description.', 'err');
    let an = jdAnalysis, mx = skillMatrix;
    if (!an) {
      notify('Running JD Analysis…');
      an = await run('p1', PROMPTS.p1(jdText), setJdAnalysis);
      if (!an) return;
    }
    if (!mx) {
      notify('Building Skill Matrix…');
      mx = await run('p2', PROMPTS.p2(an), setSkillMatrix);
      if (!mx) return;
    }
    const existing = store[jdName.trim()] || {};
    const updated = saveJDEntry(jdName.trim(), {
      jd: jdText, analysis: an, matrix: mx,
      candidates: existing.candidates || {},
    });
    onStoreChange(updated);
    setSavedBanner(jdName.trim());
    // Don't clearForm — keep analysis results visible. User can click New JD explicitly.
  };

  const handleNew = () => {
    setEditingJD(null);
    setJdName(''); setJdText('');
    setJdAnalysis(''); setSkillMatrix('');
    setSavedBanner('');
  };

  const updateJD = async () => {
    if (!editingJD) return;
    const updated = saveJDEntry(editingJD, {
      jd: jdText, analysis: jdAnalysis, matrix: skillMatrix,
      candidates: store[editingJD]?.candidates || {},
    });
    onStoreChange(updated);
    notify(`"${editingJD}" updated ✓`);
    setSavedBanner(editingJD);
    setEditingJD(null);
  };

  const startEdit = (name) => {
    const e = store[name]; if (!e) return;
    setEditingJD(name); setJdName(name); setJdText(e.jd);
    setJdAnalysis(e.analysis || ''); setSkillMatrix(e.matrix || '');
    setSavedBanner('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (name) => {
    if (!confirm(`Delete "${name}" and all its candidate evaluations? This cannot be undone.`)) return;
    const updated = deleteJDEntry(name);
    onStoreChange(updated);
    if (editingJD === name) handleNew();
    notify(`"${name}" deleted.`, 'warn');
  };

  const loadTemplate = (t) => {
    setJdName(t.name); setJdText(t.text);
    setJdAnalysis(''); setSkillMatrix('');
    setSavedBanner('');
    setShowTemplates(false);
    notify('Template loaded — customise and analyse.');
  };

  const copyText = (text, id) => {
    navigator.clipboard.writeText(text).then(() => { setCopied(id); setTimeout(() => setCopied(null), 1500); });
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24 }}>
        <div>
          <h2 style={{ fontSize:22, fontWeight:900, color:'#1a1f36', marginBottom:4 }}>
            {editingJD ? `Editing: ${editingJD}` : 'Job Description Setup'}
          </h2>
          <p style={{ color:'#8892b0', fontSize:13, lineHeight:1.6 }}>
            {editingJD ? 'Update the JD, re-run analysis if needed, then save.' : 'Analyse and save a JD once. Reuse it to evaluate unlimited candidates.'}
          </p>
        </div>
        <div style={{ display:'flex', gap:8, flexShrink:0, flexWrap:'wrap' }}>
          {getDraft() && !editingJD && !jdText && (
            <Btn v="ghost" sm onClick={() => { const d=getDraft(); setJdName(d.jdName||''); setJdText(d.jdText||''); setJdAnalysis(d.jdAnalysis||''); setSkillMatrix(d.skillMatrix||''); notify('Draft restored.'); }}>
              <Icon n="refresh" size={12}/>Draft
            </Btn>
          )}
          {(jdText || editingJD) && (
            <Btn v="ghost" sm onClick={handleNew}><Icon n="plus" size={12}/>New JD</Btn>
          )}
          <Btn v="ghost" sm onClick={() => setShowTemplates(t => !t)}>
            <Icon n="file" size={12}/>{showTemplates ? 'Hide' : 'Templates'}
          </Btn>
        </div>
      </div>

      {/* Saved banner */}
      {savedBanner && (
        <div style={{ background:'#f0fdf4', border:'1.5px solid #bbf7d0', borderRadius:10, padding:'11px 16px', marginBottom:16, display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:9 }}>
            <Icon n="check" size={16} color="#16a34a"/>
            <span style={{ fontSize:13.5, fontWeight:700, color:'#15803d' }}>"{savedBanner}" saved successfully</span>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <Btn sm v="success" onClick={() => onNavigate('cv', savedBanner)}><Icon n="user" size={12}/>Evaluate CVs</Btn>
            <Btn sm v="ghost" onClick={handleNew}><Icon n="plus" size={12}/>New JD</Btn>
          </div>
        </div>
      )}

      {/* Templates */}
      {showTemplates && (
        <Card style={{ marginBottom:20 }}>
          <SectionHeader title="Quick-Start Templates"/>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(168px,1fr))', gap:8 }}>
            {JD_TEMPLATES.map(t => (
              <button key={t.name} onClick={() => loadTemplate(t)}
                style={{ display:'flex', alignItems:'center', gap:9, padding:'10px 14px', borderRadius:10, border:'1.5px solid #c5c9fb', background:'#eef0ff', color:'#5b6af5', cursor:'pointer', fontSize:12.5, fontFamily:'inherit', fontWeight:600, textAlign:'left' }}
                onMouseEnter={e=>e.currentTarget.style.background='#e0e3ff'}
                onMouseLeave={e=>e.currentTarget.style.background='#eef0ff'}>
                <span style={{ fontSize:18 }}>{t.icon}</span>{t.name}
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* JD Input */}
      <Card raised style={{ marginBottom:20 }}>
        <Input value={jdName} onChange={setJdName} placeholder="e.g. Senior Product Manager — Fintech Q1 2025" label="JD Name"/>
        <TextArea value={jdText} onChange={setJdText}
          placeholder="Paste the full job description here. The more complete, the better the analysis."
          rows={10} label="Job Description Text"
          hint="Note: only .docx accepted for file uploads. PDF loses formatting — paste text directly for best results."/>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          <Btn onClick={doP1} disabled={!!loading || !jdText.trim()}>
            {loading==='p1'?<><Spinner/>Analysing…</>:<><Icon n="zap" size={14}/>1. Analyse JD</>}
          </Btn>
          <Btn v="secondary" onClick={()=>doP2()} disabled={!!loading || !jdAnalysis}>
            {loading==='p2'?<><Spinner/>Building…</>:<><Icon n="grid" size={14}/>2. Build Skill Matrix</>}
          </Btn>
          {editingJD
            ? <Btn v="indigo" onClick={updateJD} disabled={!!loading}><Icon n="save" size={14}/>Update JD</Btn>
            : <Btn v="secondary" onClick={handleSave} disabled={!!loading}><Icon n="save" size={14}/>Save JD</Btn>}
        </div>
      </Card>

      {/* Results */}
      <ResultBlock label="Step 1 — JD Analysis & Intent Extraction" content={jdAnalysis} id="p1" busy={loading==='p1'} onCopy={copyText} copied={copied}/>
      <ResultBlock label="Step 2 — Weighted Skill & Competency Matrix" content={skillMatrix} id="p2" busy={loading==='p2'} onCopy={copyText} copied={copied}/>

      {/* Saved JDs */}
      {jdList.length > 0 && (
        <div style={{ marginTop:36 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
            <div style={{ fontSize:11, fontWeight:800, color:'#8892b0', letterSpacing:'1px', textTransform:'uppercase' }}>
              Saved Job Descriptions ({jdList.length})
            </div>
            {jdList.length > 3 && (
              <input value={jdSearch} onChange={e=>setJdSearch(e.target.value)} placeholder="Search JDs…"
                style={{ padding:'6px 12px', fontSize:12.5, borderRadius:8, width:200 }}/>
            )}
          </div>

          {filteredJDs.length===0 && <div style={{ fontSize:13, color:'#8892b0' }}>No JDs match your search.</div>}

          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {filteredJDs.map(j => {
              const cands  = Object.values(j.candidates||{});
              const scores = cands.map(c=>c.score?.total).filter(v=>v!=null);
              const best   = scores.length ? Math.max(...scores) : null;
              return (
                <Card key={j.name} style={{ padding:'14px 18px' }}>
                  <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontWeight:700, fontSize:13.5, color:'#1a1f36' }}>{j.name}</div>
                      <div style={{ fontSize:12, color:'#8892b0', marginTop:2 }}>
                        {cands.length} candidate{cands.length!==1?'s':''} · {new Date(j.savedAt).toLocaleDateString()}
                        {best!=null&&` · Best: ${best}/100`}
                      </div>
                    </div>
                    <div style={{ display:'flex', gap:7, flexShrink:0 }}>
                      <Btn sm v="teal" onClick={()=>onNavigate('cv',j.name)}><Icon n="user" size={12}/>Evaluate CVs</Btn>
                      <Btn sm v="ghost" onClick={()=>startEdit(j.name)}><Icon n="edit" size={12}/>Edit</Btn>
                      <Btn sm v="danger" onClick={()=>handleDelete(j.name)}><Icon n="trash" size={12}/></Btn>
                    </div>
                  </div>
                  {cands.length>0 && scores.length>0 && (
                    <div style={{ marginTop:12, paddingTop:12, borderTop:'1px solid #f0f2f7' }}>
                      <ScoreChart candidates={cands.filter(c=>c.score?.total!=null)} onSelect={n=>onNavigate('cv',j.name,n)}/>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
