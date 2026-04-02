import { useState } from 'react';
import { Btn, Card, SectionHeader, EmptyState, ResultBlock } from '../components/UI.jsx';
import Icon from '../components/Icon.jsx';
import { PROMPTS } from '../lib/prompts.js';
import { callAI } from '../lib/api.js';
import { logActivity } from '../lib/storage.js';

export default function LinkedInPage({ user, aiConfig, store, notify }) {
  const [selJD,   setSelJD]   = useState(null);
  const [result,  setResult]  = useState('');
  const [loading, setLoading] = useState(false);
  const [copied,  setCopied]  = useState(null);

  const jdList = Object.values(store).sort((a, b) => b.savedAt - a.savedAt);
  const currentJD = selJD ? store[selJD] : null;

  const run = async () => {
    if (!currentJD) return notify('Select a JD first.', 'err');
    if (!currentJD.analysis) return notify('This JD has no analysis yet — open it in Job Description and run Step 1 first.', 'err');
    if (!aiConfig?.apiKey) { notify('Add your API key in Settings first.', 'err'); return; }
    setLoading(true);
    try {
      await callAI(aiConfig, PROMPTS.p6(currentJD.analysis), setResult);
      logActivity('p6', user.email);
    } catch (e) { notify(e.message, 'err'); }
    finally { setLoading(false); }
  };

  const copyText = (text, id) => {
    navigator.clipboard.writeText(text).then(() => { setCopied(id); setTimeout(() => setCopied(null), 1500); });
  };

  return (
    <div>
      <h2 style={{ fontSize:22, fontWeight:900, color:'#1a1f36', marginBottom:4 }}>LinkedIn Sourcing Builder</h2>
      <p style={{ color:'#8892b0', fontSize:13, marginBottom:24 }}>
        Generate Boolean search strings and LinkedIn Recruiter filters from any saved JD analysis. Copy directly into Recruiter.
      </p>

      {jdList.length===0 ? (
        <EmptyState icon="🔍" title="No JDs saved yet"
          sub="Create and save a job description first — the JD analysis powers the sourcing output."
          action={<Btn onClick={()=>document.dispatchEvent(new CustomEvent('nav',{detail:'jd'}))}><Icon n="plus" size={14}/>Set Up a JD</Btn>}/>
      ) : (
        <>
          <Card style={{ marginBottom:16 }}>
            <SectionHeader title="Select Job Description"/>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {jdList.map(j => {
                const hasAnalysis = !!j.analysis;
                return (
                  <button key={j.name} onClick={()=>{ setSelJD(j.name); setResult(''); }}
                    style={{ padding:'8px 16px', borderRadius:9, border:`1.5px solid ${selJD===j.name?'#5b6af5':'#dde3f0'}`, background:selJD===j.name?'#eef0ff':'#f5f7fd', color:selJD===j.name?'#5b6af5':'#4a5278', cursor:'pointer', fontSize:13, fontFamily:'inherit', fontWeight:selJD===j.name?700:500, boxShadow:selJD===j.name?'inset 2px 2px 6px rgba(91,106,245,.1)':'2px 2px 6px #d0d8e0,-1px -1px 4px #fff', transition:'all .15s', display:'flex', alignItems:'center', gap:8 }}>
                    {j.name}
                    {!hasAnalysis && <span style={{ fontSize:10, color:'#ea580c', background:'#fff7ed', border:'1px solid #fed7aa', borderRadius:6, padding:'1px 6px' }}>No analysis</span>}
                  </button>
                );
              })}
            </div>
          </Card>

          {selJD && currentJD && (
            currentJD.analysis ? (
              <div style={{ background:'#f0fdf4', border:'1.5px solid #bbf7d0', borderRadius:10, padding:'9px 14px', marginBottom:14, display:'flex', alignItems:'center', gap:9 }}>
                <Icon n="check" size={14} color="#16a34a"/>
                <span style={{ fontSize:13, color:'#15803d', fontWeight:600 }}>{selJD} — JD analysis ready</span>
              </div>
            ) : (
              <div style={{ background:'#fff7ed', border:'1.5px solid #fed7aa', borderRadius:10, padding:'9px 14px', marginBottom:14, display:'flex', alignItems:'center', gap:9 }}>
                <Icon n="warn" size={14} color="#ea580c"/>
                <span style={{ fontSize:13, color:'#ea580c' }}>This JD has no analysis yet.</span>
                <button onClick={()=>document.dispatchEvent(new CustomEvent('nav',{detail:{tab:'jd'}}))} style={{ background:'none', border:'none', color:'#ea580c', cursor:'pointer', fontSize:13, fontFamily:'inherit', fontWeight:700, textDecoration:'underline', marginLeft:4 }}>
                  Run analysis →
                </button>
              </div>
            )
          )}

          <Btn onClick={run} disabled={loading || !selJD || !currentJD?.analysis}>
            {loading
              ? <><span style={{ animation:'spin 1s linear infinite', display:'inline-block' }}><Icon n="refresh" size={14}/></span>Building parameters…</>
              : <><Icon n="li" size={14}/>Generate LinkedIn Sourcing Parameters</>}
          </Btn>

          <ResultBlock label="LinkedIn Sourcing — Boolean Strings & Recruiter Filters" content={result} id="li" busy={loading} onCopy={copyText} copied={copied}/>
        </>
      )}
    </div>
  );
}
