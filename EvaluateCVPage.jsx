import { useState, useEffect } from 'react';
import {
  Btn, Card, Input, TextArea, SectionHeader, ResultBlock,
  StepIndicator, ScoreRing, RecBadge, StatusBadge, ScoreChart,
  EmptyState, Spinner, Label, Badge, STATUS_CFG,
} from '../components/UI.jsx';
import Icon from '../components/Icon.jsx';
import { PROMPTS } from '../lib/prompts.js';
import { callAI, parseScore, stripMeta } from '../lib/api.js';
import { saveCandidate, deleteCandidate, logActivity, dlText } from '../lib/storage.js';

const STEP_LABELS = ['Select JD', 'Candidate Details', 'Evaluate & Decide'];

function buildReport(jdEntry, c) {
  return [
    'VALIDATOR — CANDIDATE EVALUATION REPORT', '='.repeat(60),
    `Role:       ${jdEntry?.name||''}`,
    `Candidate:  ${c.name||''}`,
    `Score:      ${c.score?.total??'N/A'}/100`,
    `Fit:        ${c.score?.recommendation||'N/A'}`,
    `Confidence: ${c.score?.confidence||'N/A'}`,
    `Status:     ${STATUS_CFG[c.status||'new'].label}`,
    `Exported:   ${new Date().toLocaleString()}`,
    '='.repeat(60), '',
    ...(c.eval?         ['─'.repeat(60),'CV EVALUATION',             '─'.repeat(60),stripMeta(c.eval),  '']:[]),
    ...(c.decision?     ['─'.repeat(60),'DECISION SNAPSHOT',         '─'.repeat(60),c.decision,         '']:[]),
    ...(c.questionnaire?['─'.repeat(60),'ENRICHMENT QUESTIONNAIRE',  '─'.repeat(60),c.questionnaire,    '']:[]),
    ...(c.notes?        ['─'.repeat(60),'INTERNAL NOTES',            '─'.repeat(60),c.notes,            '']:[]),
  ].join('\n');
}

function buildEmail(text, candName) {
  return `Subject: A few questions about your application\n\nHi ${candName||'[Candidate Name]'},\n\nThank you for your interest in the role. To help us evaluate your application fully, we'd appreciate some additional context:\n\n${stripMeta(text)}\n\nPlease aim for 3–6 sentences per answer. Specific examples and metrics are very helpful.\n\nBest regards,\n[Your Name]`;
}

export default function EvaluateCVPage({ user, aiConfig, store, onStoreChange, preselectedJD, preselectedCand, onNavigate, notify }) {
  const [step,       setStep]      = useState(0);
  const [selJD,      setSelJD]     = useState(null);
  const [candSearch, setCandSearch]= useState('');
  const [showCVRef,  setShowCVRef] = useState(false);

  const [candName,      setCandName]      = useState('');
  const [cvTitle,       setCvTitle]       = useState('');
  const [cvText,        setCvText]        = useState('');
  const [candStatus,    setCandStatus]    = useState('new');
  const [candNotes,     setCandNotes]     = useState('');
  const [showNotes,     setShowNotes]     = useState(false);
  const [selCand,       setSelCand]       = useState(null);

  const [cvEval,        setCvEval]        = useState('');
  const [decision,      setDecision]      = useState('');
  const [questionnaire, setQuestionnaire] = useState('');
  const [cvScore,       setCvScore]       = useState(null);
  const [loading,       setLoading]       = useState(null);
  const [copied,        setCopied]        = useState(null);

  const jdList        = Object.values(store).sort((a, b) => b.savedAt - a.savedAt);
  const currentJD     = selJD ? store[selJD] : null;
  const allCands      = currentJD ? Object.values(currentJD.candidates||{}) : [];
  const existingCands = candSearch
    ? allCands.filter(c => c.name.toLowerCase().includes(candSearch.toLowerCase()))
    : allCands;

  useEffect(() => {
    if (preselectedJD && store[preselectedJD]) {
      setSelJD(preselectedJD);
      if (preselectedCand && store[preselectedJD]?.candidates?.[preselectedCand]) {
        const c = store[preselectedJD].candidates[preselectedCand];
        setCandName(c.name); setCvTitle(c.title||''); setCvText(c.cvText||'');
        setCvEval(c.eval||''); setDecision(c.decision||'');
        setQuestionnaire(c.questionnaire||'');
        setCvScore(c.score||null); setCandStatus(c.status||'new');
        setCandNotes(c.notes||''); setSelCand(preselectedCand);
        setShowNotes(!!c.notes); setStep(2);
      } else {
        setStep(1);
      }
    } else if (!preselectedJD) {
      setStep(0);
    }
  }, [preselectedJD, preselectedCand]); // store omitted — fires only on route change

  const resetCandidate = () => {
    setCvText(''); setCandName(''); setCvTitle(''); setCvEval(''); setDecision('');
    setQuestionnaire(''); setCvScore(null); setCandStatus('new');
    setCandNotes(''); setSelCand(null); setShowNotes(false);
    setCandSearch(''); setShowCVRef(false);
  };

  const loadExistingCandidate = (jdKey, cName) => {
    const c = store[jdKey]?.candidates?.[cName];
    if (!c) return;
    if (jdKey !== selJD) setSelJD(jdKey);
    setCandName(c.name); setCvTitle(c.title||''); setCvText(c.cvText||'');
    setCvEval(c.eval||''); setDecision(c.decision||'');
    setQuestionnaire(c.questionnaire||'');
    setCvScore(c.score||null); setCandStatus(c.status||'new');
    setCandNotes(c.notes||''); setSelCand(cName);
    setShowNotes(!!c.notes); setShowCVRef(false); setStep(2);
  };

  const run = async (id, prompt, setter) => {
    if (!aiConfig?.apiKey) { notify('Add your API key in Settings first.','err'); return null; }
    setLoading(id);
    try {
      const r = await callAI(aiConfig, prompt, setter);
      logActivity(id, user.email);
      return r;
    } catch (e) { notify(e.message,'err'); return null; }
    finally { setLoading(null); }
  };

  const getCandData = () => ({ cvText, title:cvTitle, eval:cvEval, decision, questionnaire, score:cvScore, status:candStatus, notes:candNotes });

  const persist = (extra={}) => {
    const key = candName.trim() || selCand;
    if (!selJD || !key) return;
    const updated = saveCandidate(selJD, key, { ...getCandData(), ...extra });
    onStoreChange(updated);
  };

  const doP3 = async () => {
    if (!cvText.trim()) return notify('Paste the candidate CV first.','err');
    if (!currentJD?.analysis) return notify('JD has no analysis — re-open and save the JD.','err');
    const r = await run('p3', PROMPTS.p3(currentJD.analysis, currentJD.matrix, cvText), setCvEval);
    if (r) {
      const sc = parseScore(r);
      setCvScore(sc);
      const key = candName.trim() || `Candidate_${Date.now()}`;
      if (!candName.trim()) setCandName(key);
      const updated = saveCandidate(selJD, key, { ...getCandData(), eval:r, score:sc });
      onStoreChange(updated);
      setSelCand(key);
      if (step < 2) setStep(2);
    }
  };

  const doP4 = async () => {
    if (!cvEval) return notify('Score the CV first.','err');
    const r = await run('p4', PROMPTS.p4(cvEval), setDecision);
    if (r) persist({ decision:r });
  };

  const doP5 = async () => {
    if (!cvEval) return notify('Score the CV first.','err');
    if (!currentJD?.analysis) return notify('JD analysis missing.','err');
    const r = await run('p5', PROMPTS.p5(currentJD.analysis, currentJD.matrix, cvEval), setQuestionnaire);
    if (r) persist({ questionnaire:r });
  };

  const updateStatus = (st) => {
    setCandStatus(st);
    if (selJD && (candName.trim()||selCand)) persist({ status:st });
  };

  const confirmDelete = (cName) => {
    if (!confirm(`Remove "${cName}" from this JD?`)) return;
    const updated = deleteCandidate(selJD, cName);
    onStoreChange(updated);
    if (selCand===cName) resetCandidate();
    notify(`${cName} removed.`,'warn');
  };

  const copyText = (text, id) => {
    navigator.clipboard.writeText(text).then(()=>{ setCopied(id); setTimeout(()=>setCopied(null),1500); });
  };

  // ── STEP 0: Pick JD ───────────────────────────────────────────────────────
  if (step===0) return (
    <div>
      <h2 style={{ fontSize:22, fontWeight:900, color:'#1a1f36', marginBottom:4 }}>Evaluate a Candidate</h2>
      <p style={{ color:'#8892b0', fontSize:13, marginBottom:24 }}>Select which job description to evaluate against, or create a new one first.</p>
      {jdList.length===0
        ? <EmptyState icon="📋" title="No saved JDs yet" sub="Create and save a job description first — its skill matrix is used to score candidates." action={<Btn onClick={()=>onNavigate('jd')}><Icon n="plus" size={14}/>Set Up a JD First</Btn>}/>
        : <>
            <SectionHeader title="Use a Saved JD"/>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(210px,1fr))', gap:10, marginBottom:20 }}>
              {jdList.map(j => {
                const cc = Object.keys(j.candidates||{}).length;
                const scored = Object.values(j.candidates||{}).filter(c=>c.score?.total!=null);
                return (
                  <button key={j.name} onClick={()=>{ setSelJD(j.name); resetCandidate(); setStep(1); }}
                    style={{ background:'#fafbff', border:'2px solid #e8ecf5', borderRadius:12, padding:'14px 16px', cursor:'pointer', textAlign:'left', fontFamily:'inherit', boxShadow:'3px 3px 8px #d0d8e8,-2px -2px 6px #fff', transition:'border-color .15s,box-shadow .15s' }}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor='#5b6af5';e.currentTarget.style.boxShadow='4px 4px 12px #c0c8e0,-2px -2px 8px #fff';}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor='#e8ecf5';e.currentTarget.style.boxShadow='3px 3px 8px #d0d8e8,-2px -2px 6px #fff';}}>
                    <div style={{ fontWeight:700, fontSize:13.5, color:'#1a1f36', marginBottom:4 }}>{j.name}</div>
                    <div style={{ fontSize:12, color:'#8892b0', marginBottom:scored.length>0?10:0 }}>{cc} candidate{cc!==1?'s':''} evaluated</div>
                    {scored.length>0 && <ScoreChart candidates={scored.slice(0,3)}/>}
                  </button>
                );
              })}
            </div>
            <div style={{ textAlign:'center', color:'#8892b0', fontSize:13 }}>
              — or —{' '}<button onClick={()=>onNavigate('jd')} style={{ background:'none', border:'none', color:'#5b6af5', cursor:'pointer', fontFamily:'inherit', fontSize:13, textDecoration:'underline' }}>Set up a new JD</button>
            </div>
          </>}
    </div>
  );

  // ── STEP 1: Candidate Details ─────────────────────────────────────────────
  if (step===1) return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
        <button onClick={()=>{ setSelJD(null); setStep(0); resetCandidate(); }} style={{ background:'none', border:'none', cursor:'pointer', color:'#8892b0', display:'flex', alignItems:'center', gap:5, fontSize:13, fontFamily:'inherit' }}>
          <Icon n="chevR" size={14} color="#c5c9fb"/>Back
        </button>
        <span style={{ color:'#dde3f0' }}>·</span>
        <span style={{ fontSize:13, color:'#5b6af5', fontWeight:700 }}>{selJD}</span>
      </div>
      <StepIndicator steps={STEP_LABELS} current={1}/>

      {/* Previously evaluated */}
      {allCands.length>0 && (
        <Card style={{ marginBottom:20 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
            <div style={{ fontSize:11, fontWeight:800, color:'#8892b0', letterSpacing:'1px', textTransform:'uppercase' }}>
              Previously Evaluated ({allCands.length})
            </div>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              {allCands.length>5 && (
                <input value={candSearch} onChange={e=>setCandSearch(e.target.value)} placeholder="Search…"
                  style={{ padding:'5px 10px', fontSize:12, borderRadius:7, width:150 }}/>
              )}
              <Btn sm v="ghost" onClick={resetCandidate}><Icon n="plus" size={12}/>New</Btn>
            </div>
          </div>
          <div style={{ display:'flex', gap:7, flexWrap:'wrap' }}>
            {existingCands.map(c => (
              <div key={c.name} style={{ display:'flex', alignItems:'stretch' }}>
                <button onClick={()=>loadExistingCandidate(selJD,c.name)}
                  style={{ display:'flex', alignItems:'center', gap:7, background:selCand===c.name?'#eef0ff':'#f5f7fd', border:`1.5px solid ${selCand===c.name?'#5b6af5':'#dde3f0'}`, borderRight:'none', borderRadius:'8px 0 0 8px', padding:'6px 12px', cursor:'pointer', fontFamily:'inherit' }}>
                  <span style={{ fontSize:12.5, fontWeight:600, color:selCand===c.name?'#5b6af5':'#4a5278' }}>{c.name}</span>
                  {c.score?.total!=null && <span style={{ fontSize:11, fontWeight:800, color:c.score.total>=75?'#16a34a':c.score.total>=55?'#b45309':'#dc2626' }}>{c.score.total}</span>}
                  <StatusBadge status={c.status}/>
                </button>
                <button onClick={()=>confirmDelete(c.name)}
                  style={{ background:selCand===c.name?'#eef0ff':'#f5f7fd', border:`1.5px solid ${selCand===c.name?'#5b6af5':'#dde3f0'}`, borderRadius:'0 8px 8px 0', padding:'6px 8px', cursor:'pointer', color:'#c5c9fb', display:'flex', alignItems:'center' }}
                  title="Remove">
                  <Icon n="x" size={12}/>
                </button>
              </div>
            ))}
            {existingCands.length===0&&candSearch && <div style={{ fontSize:12.5, color:'#8892b0' }}>No candidates match "{candSearch}".</div>}
          </div>
        </Card>
      )}

      <Card raised>
        <SectionHeader title="New Candidate"/>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <Input value={candName} onChange={setCandName} placeholder="e.g. Priya Mehta" label="Candidate Name *"/>
          <Input value={cvTitle} onChange={setCvTitle} placeholder="e.g. Senior PM at FinCorp" label="CV Title (optional)"/>
        </div>
        <div style={{ marginBottom:14 }}>
          <Label>Status</Label>
          <div style={{ display:'flex', gap:6 }}>
            {Object.entries(STATUS_CFG).map(([k,v])=>(
              <button key={k} onClick={()=>setCandStatus(k)}
                style={{ flex:1, padding:'9px 6px', borderRadius:8, border:`1.5px solid ${candStatus===k?v.c:'#dde3f0'}`, background:candStatus===k?v.bg:'#f5f7fd', color:candStatus===k?v.c:'#8892b0', cursor:'pointer', fontSize:12, fontFamily:'inherit', fontWeight:candStatus===k?700:500 }}>
                {v.label}
              </button>
            ))}
          </div>
        </div>
        <TextArea value={cvText} onChange={setCvText}
          placeholder={`Paste the candidate's complete CV / resume text here.\n\nNote: only .docx for file uploads — PDF loses formatting. Paste text directly for best results.`}
          rows={12} label="Candidate CV / Resume Text *"
          hint="Paste the full CV for the most accurate evaluation."/>
        <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
          <Btn onClick={()=>{ if(!candName.trim())return notify('Enter the candidate name.','err'); if(!cvText.trim())return notify('Paste the candidate CV first.','err'); setStep(2); }} disabled={!cvText.trim()||!candName.trim()}>
            <Icon n="arrow" size={14}/>Continue to Evaluation
          </Btn>
          <span style={{ fontSize:12, color:'#8892b0' }}>or</span>
          <Btn v="secondary" onClick={()=>{ if(!candName.trim())return notify('Enter the candidate name.','err'); if(!cvText.trim())return notify('Paste the candidate CV first.','err'); doP3(); }}>
            <Icon n="zap" size={14}/>Score Directly
          </Btn>
        </div>
      </Card>
    </div>
  );

  // ── STEP 2: Evaluate & Decide ─────────────────────────────────────────────
  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:20 }}>
        <button onClick={()=>setStep(1)} style={{ background:'none', border:'none', cursor:'pointer', color:'#8892b0', display:'flex', alignItems:'center', gap:5, fontSize:13, fontFamily:'inherit' }}>
          <Icon n="chevR" size={14} color="#c5c9fb"/>Back
        </button>
        <span style={{ color:'#dde3f0' }}>·</span>
        <span style={{ fontSize:13, color:'#5b6af5', fontWeight:700 }}>{selJD}</span>
        <Icon n="arrow" size={14} color="#c5c9fb"/>
        <span style={{ fontSize:13, color:'#1a1f36', fontWeight:700 }}>{candName}</span>
      </div>
      <StepIndicator steps={STEP_LABELS} current={2}/>

      {/* Score card */}
      {cvScore && (
        <Card raised style={{ marginBottom:20, display:'flex', alignItems:'center', gap:22, flexWrap:'wrap' }}>
          <ScoreRing score={cvScore.total} size={90}/>
          <div style={{ flex:1, minWidth:180 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10, flexWrap:'wrap' }}>
              <span style={{ fontWeight:800, fontSize:16, color:'#1a1f36' }}>{candName}</span>
              <RecBadge rec={cvScore.recommendation}/>
              <Badge color={cvScore.confidence==='High'?'#16a34a':'#b45309'} bg={cvScore.confidence==='High'?'#dcfce7':'#fef3c7'}>{cvScore.confidence} confidence</Badge>
            </div>
            <div style={{ display:'flex', gap:20, flexWrap:'wrap' }}>
              {Object.entries(cvScore.category_scores||{}).map(([cat,sc])=>(
                <div key={cat}>
                  <div style={{ fontSize:10, color:'#8892b0', letterSpacing:'.5px', textTransform:'uppercase' }}>{cat}</div>
                  <div style={{ fontSize:18, fontWeight:900, color:'#1a1f36', marginTop:2 }}>{sc}<span style={{ fontSize:11, color:'#8892b0', fontWeight:400 }}>pts</span></div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize:10, color:'#8892b0', letterSpacing:'.5px', textTransform:'uppercase', marginBottom:6 }}>Status</div>
            <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
              {Object.entries(STATUS_CFG).map(([k,v])=>(
                <button key={k} onClick={()=>updateStatus(k)}
                  style={{ padding:'4px 11px', borderRadius:20, border:`1.5px solid ${candStatus===k?v.c:'#dde3f0'}`, background:candStatus===k?v.bg:'transparent', color:candStatus===k?v.c:'#8892b0', cursor:'pointer', fontSize:11.5, fontFamily:'inherit', fontWeight:candStatus===k?700:500 }}>
                  {v.label}
                </button>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Action buttons */}
      <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:8 }}>
        <Btn onClick={doP3} disabled={!!loading||!cvText.trim()}>
          {loading==='p3'?<><Spinner/>Scoring…</>:<><Icon n="user" size={14}/>3. Score CV</>}
        </Btn>
        <Btn v="secondary" onClick={doP4} disabled={!!loading||!cvEval}>
          {loading==='p4'?<><Spinner/>Deciding…</>:<><Icon n="zap" size={14}/>4. Decision Snapshot</>}
        </Btn>
        <Btn v="secondary" onClick={doP5} disabled={!!loading||!cvEval}>
          {loading==='p5'?<><Spinner/>Generating…</>:<><Icon n="help" size={14}/>5. Enrichment Q&A</>}
        </Btn>
        <Btn v="ghost" sm onClick={()=>setShowCVRef(n=>!n)}>
          <Icon n="eye" size={13}/>{showCVRef?'Hide CV':'View CV'}
        </Btn>
        <Btn v="ghost" sm onClick={()=>setShowNotes(n=>!n)}>
          <Icon n="note" size={13}/>{showNotes?'Hide Notes':'Notes'}
          {candNotes && <span style={{ width:6, height:6, borderRadius:'50%', background:'#f59e0b', display:'inline-block', flexShrink:0 }}/>}
        </Btn>
        {(cvEval||decision||questionnaire) && (
          <Btn v="ghost" sm onClick={()=>dlText(
            `${candName.replace(/\s+/g,'_')}_${(selJD||'').replace(/\s+/g,'_')}_report.txt`,
            buildReport(currentJD,{name:candName,cvText,eval:cvEval,decision,questionnaire,score:cvScore,status:candStatus,notes:candNotes})
          )}><Icon n="download" size={13}/>Export Report</Btn>
        )}
        {selCand && (
          <Btn v="indigo" sm onClick={()=>onNavigate('outreach',selJD,selCand)}>
            <Icon n="send" size={13}/>Outreach
          </Btn>
        )}
      </div>

      {/* CV Reference Panel */}
      {showCVRef && cvText && (
        <Card style={{ marginBottom:8, background:'#fafbff' }}>
          <SectionHeader title={`CV Reference — ${candName}`} action={
            <button onClick={()=>setShowCVRef(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'#8892b0', display:'flex' }}><Icon n="x" size={14}/></button>
          }/>
          <div style={{ fontSize:12.5, color:'#4a5278', whiteSpace:'pre-wrap', lineHeight:1.75, maxHeight:300, overflowY:'auto', fontFamily:"'Space Mono',monospace", background:'#f5f7fd', border:'1px solid #e8ecf5', borderRadius:8, padding:'12px 14px' }}>
            {cvText}
          </div>
        </Card>
      )}

      {/* Notes */}
      {showNotes && (
        <Card style={{ marginBottom:8 }}>
          <TextArea value={candNotes} onChange={setCandNotes} placeholder="Internal recruiter notes — private, not included in AI analysis…" rows={3} label="Internal Notes (private)"/>
          <Btn sm v="ghost" onClick={()=>{ persist({notes:candNotes}); notify('Notes saved ✓'); }}><Icon n="save" size={12}/>Save Notes</Btn>
        </Card>
      )}

      <ResultBlock label="Step 3 — CV Evaluation & Scoring" content={cvEval} id="p3" busy={loading==='p3'} onCopy={copyText} copied={copied}/>
      <ResultBlock label="Step 4 — Hiring Decision Snapshot" content={decision} id="p4" busy={loading==='p4'} onCopy={copyText} copied={copied}/>
      <ResultBlock
        label="Step 5 — Candidate Enrichment Questionnaire" content={questionnaire} id="p5" busy={loading==='p5'} onCopy={copyText} copied={copied}
        extraActions={questionnaire && (
          <button onClick={()=>dlText(`${candName||'candidate'}_questionnaire_email.txt`,buildEmail(questionnaire,candName))}
            style={{ background:'#f0f9ff', border:'1px solid #bae6fd', borderRadius:7, padding:'4px 10px', cursor:'pointer', color:'#0284c7', display:'flex', alignItems:'center', gap:5, fontSize:11, fontFamily:'inherit' }}>
            <Icon n="mail" size={11}/>Email Format
          </button>
        )}
      />
    </div>
  );
}
