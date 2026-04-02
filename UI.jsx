import { useState, useRef } from 'react';
import Icon from './Icon.jsx';

const stripMeta = (t) =>
  (t || '').replace(/CANDIDATE_SCORE:\{[^\n]+\}/g,'').replace(/SCORE_DIMENSIONS:\{[^\n]+\}/g,'').trim();

// ── Button ─────────────────────────────────────────────────────────────────
const VARIANTS = {
  primary:   { bg:'#5b6af5',  color:'#fff',    border:'none',                 shadow:'0 2px 8px rgba(91,106,245,.35)' },
  secondary: { bg:'#fff',     color:'#4a5278', border:'1.5px solid #d5dcea',  shadow:'3px 3px 8px #c8d0e0,-2px -2px 6px #fff' },
  ghost:     { bg:'transparent',color:'#4a5278',border:'1.5px solid #dde3f0', shadow:'none' },
  danger:    { bg:'#fff0f0',  color:'#ef4444', border:'1.5px solid #fecaca',  shadow:'2px 2px 6px #f0c8c8,-1px -1px 4px #fff' },
  success:   { bg:'#f0fdf4',  color:'#16a34a', border:'1.5px solid #bbf7d0',  shadow:'2px 2px 6px #c8e8d0,-1px -1px 4px #fff' },
  indigo:    { bg:'#eef0ff',  color:'#5b6af5', border:'1.5px solid #c5c9fb',  shadow:'2px 2px 6px #ccd0f0,-1px -1px 4px #fff' },
  teal:      { bg:'#f0fdfa',  color:'#0d9488', border:'1.5px solid #99f6e4',  shadow:'2px 2px 6px #c0e8e0,-1px -1px 4px #fff' },
  orange:    { bg:'#fff7ed',  color:'#ea580c', border:'1.5px solid #fed7aa',  shadow:'2px 2px 6px #f0d8c0,-1px -1px 4px #fff' },
};

export function Btn({ onClick, children, v='primary', sm, disabled, full, type='button', style:x={} }) {
  const s = VARIANTS[v] || VARIANTS.primary;
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={{ padding:sm?'6px 14px':'10px 20px', borderRadius:sm?8:10, fontWeight:600, fontSize:sm?12:13.5, cursor:disabled?'not-allowed':'pointer', border:s.border, background:s.bg, color:s.color, boxShadow:s.shadow, fontFamily:'inherit', display:'inline-flex', alignItems:'center', gap:7, opacity:disabled?.45:1, transition:'opacity .15s,box-shadow .15s', width:full?'100%':undefined, justifyContent:full?'center':undefined, flexShrink:0, ...x }}>
      {children}
    </button>
  );
}

// ── Input ──────────────────────────────────────────────────────────────────
export function Input({ value, onChange, placeholder, type='text', label, hint, error, sm, style:x={} }) {
  return (
    <div style={{ marginBottom:16, ...x }}>
      {label && <Label>{label}</Label>}
      <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} type={type}
        style={{ width:'100%', padding:sm?'8px 12px':'10px 14px', fontSize:13.5, borderRadius:10 }} />
      {hint && !error && <div style={{ fontSize:11.5, color:'#8892b0', marginTop:4, lineHeight:1.5 }}>{hint}</div>}
      {error && <div style={{ fontSize:11.5, color:'#ef4444', marginTop:4 }}>{error}</div>}
    </div>
  );
}

// ── TextArea ───────────────────────────────────────────────────────────────
export function TextArea({ value, onChange, placeholder, rows=8, label, hint, mono }) {
  return (
    <div style={{ marginBottom:16 }}>
      {label && <Label>{label}</Label>}
      <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows}
        style={{ width:'100%', padding:'11px 14px', fontSize:13, lineHeight:1.7, borderRadius:10, fontFamily:mono?"'Space Mono',monospace":'inherit' }} />
      {hint && <div style={{ fontSize:11.5, color:'#8892b0', marginTop:4, lineHeight:1.5 }}>{hint}</div>}
    </div>
  );
}

// ── Label ──────────────────────────────────────────────────────────────────
export function Label({ children }) {
  return <div style={{ fontSize:11.5, fontWeight:700, color:'#8892b0', marginBottom:6, letterSpacing:'.6px', textTransform:'uppercase' }}>{children}</div>;
}

// ── Card ───────────────────────────────────────────────────────────────────
export function Card({ children, style, raised }) {
  return <div className={raised?'clay-card':'clay-card-sm'} style={{ padding:'20px', ...style }}>{children}</div>;
}

// ── SectionHeader ──────────────────────────────────────────────────────────
export function SectionHeader({ title, action }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
      <div style={{ fontSize:11, fontWeight:800, color:'#8892b0', letterSpacing:'1px', textTransform:'uppercase' }}>{title}</div>
      {action && <div>{action}</div>}
    </div>
  );
}

// ── Badge ──────────────────────────────────────────────────────────────────
export function Badge({ children, color='#5b6af5', bg='#eef0ff' }) {
  return <span style={{ background:bg, color, borderRadius:20, padding:'2px 10px', fontSize:11, fontWeight:700, display:'inline-block', whiteSpace:'nowrap' }}>{children}</span>;
}

// ── RecBadge ───────────────────────────────────────────────────────────────
const REC = { 'Strong Fit':{bg:'#dcfce7',c:'#16a34a'}, 'Moderate Fit':{bg:'#fef3c7',c:'#b45309'}, 'Weak Fit':{bg:'#ffedd5',c:'#ea580c'}, 'Reject':{bg:'#fee2e2',c:'#dc2626'} };
export function RecBadge({ rec }) {
  const s = REC[rec] || { bg:'#f1f5f9', c:'#64748b' };
  return <span style={{ background:s.bg, color:s.c, borderRadius:20, padding:'3px 11px', fontSize:11.5, fontWeight:700, whiteSpace:'nowrap' }}>{rec||'—'}</span>;
}

// ── StatusBadge ────────────────────────────────────────────────────────────
export const STATUS_CFG = {
  new:         { bg:'#f1f5f9', c:'#64748b', label:'New' },
  shortlisted: { bg:'#dcfce7', c:'#16a34a', label:'Shortlisted' },
  hold:        { bg:'#fef3c7', c:'#b45309', label:'On Hold' },
  rejected:    { bg:'#fee2e2', c:'#dc2626', label:'Rejected' },
};
export function StatusBadge({ status }) {
  const s = STATUS_CFG[status||'new'];
  return <span style={{ background:s.bg, color:s.c, borderRadius:10, padding:'2px 9px', fontSize:11, fontWeight:700, whiteSpace:'nowrap' }}>{s.label}</span>;
}

// ── Spinner ────────────────────────────────────────────────────────────────
export function Spinner({ size=14 }) {
  return <span style={{ display:'inline-block', animation:'spin 1s linear infinite', lineHeight:0, flexShrink:0 }}><Icon n="refresh" size={size} /></span>;
}

// ── Notification ───────────────────────────────────────────────────────────
export function Notification({ notif }) {
  if (!notif) return null;
  const c = { ok:{bg:'#f0fdf4',border:'#bbf7d0',color:'#15803d'}, err:{bg:'#fff1f2',border:'#fecdd3',color:'#be123c'}, warn:{bg:'#fffbeb',border:'#fde68a',color:'#b45309'} }[notif.type]||{bg:'#f0fdf4',border:'#bbf7d0',color:'#15803d'};
  return <div style={{ position:'fixed', top:20, right:20, zIndex:9999, background:c.bg, border:`1.5px solid ${c.border}`, color:c.color, borderRadius:12, padding:'12px 18px', fontSize:13, fontWeight:600, animation:'popIn .2s ease', boxShadow:'0 8px 24px rgba(0,0,0,.12)', maxWidth:340, lineHeight:1.5 }}>{notif.msg}</div>;
}

// ── EmptyState ─────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, sub, action }) {
  return (
    <div style={{ textAlign:'center', padding:'52px 24px' }}>
      <div style={{ fontSize:44, marginBottom:14 }}>{icon}</div>
      <div style={{ fontSize:16, fontWeight:700, color:'#4a5278', marginBottom:6 }}>{title}</div>
      <div style={{ fontSize:13, color:'#8892b0', maxWidth:320, margin:'0 auto', paddingBottom:action?20:0 }}>{sub}</div>
      {action && <div style={{ marginTop:20 }}>{action}</div>}
    </div>
  );
}

// ── ScoreRing ──────────────────────────────────────────────────────────────
export function ScoreRing({ score, size=80 }) {
  const s=score||0, r=(size-10)/2, circ=2*Math.PI*r;
  const color   = s>=75?'#16a34a':s>=55?'#b45309':'#dc2626';
  const bgColor = s>=75?'#dcfce7':s>=55?'#fef3c7':'#fee2e2';
  return (
    <div style={{ position:'relative', width:size, height:size, flexShrink:0 }}>
      <svg width={size} height={size} style={{ transform:'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={bgColor} strokeWidth="6" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="6" strokeDasharray={circ} strokeDashoffset={circ*(1-Math.min(100,s)/100)} strokeLinecap="round" />
      </svg>
      <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
        <span style={{ fontSize:size*.22, fontWeight:900, color, lineHeight:1 }}>{s}</span>
        <span style={{ fontSize:size*.1, color:'#8892b0' }}>/100</span>
      </div>
    </div>
  );
}

// ── ScoreChart ─────────────────────────────────────────────────────────────
export function ScoreChart({ candidates, onSelect }) {
  if (!candidates?.length) return null;
  const sorted = [...candidates].filter(c=>c.score?.total!=null).sort((a,b)=>b.score.total-a.score.total);
  if (!sorted.length) return null;
  return (
    <div>
      {sorted.map((c,i) => {
        const sc=c.score.total, color=sc>=75?'#16a34a':sc>=55?'#b45309':'#dc2626', bgColor=sc>=75?'#dcfce7':sc>=55?'#fef3c7':'#fee2e2';
        return (
          <div key={c.name} onClick={()=>onSelect?.(c.name)} style={{ marginBottom:10, cursor:onSelect?'pointer':'default' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
              <div style={{ display:'flex', alignItems:'center', gap:7, minWidth:0, overflow:'hidden' }}>
                <span style={{ fontSize:11, fontWeight:700, color:'#8892b0', flexShrink:0 }}>{i+1}.</span>
                <span style={{ fontSize:12, fontWeight:600, color:'#4a5278', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.name}</span>
                <StatusBadge status={c.status} />
              </div>
              <span style={{ fontSize:12, fontWeight:800, color, fontFamily:"'Space Mono',monospace", flexShrink:0, marginLeft:8 }}>{sc}/100</span>
            </div>
            <div style={{ height:7, background:bgColor, borderRadius:4, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${sc}%`, background:color, borderRadius:4, transition:'width .8s ease' }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── StepIndicator ──────────────────────────────────────────────────────────
export function StepIndicator({ steps, current }) {
  return (
    <div style={{ display:'flex', alignItems:'flex-start', marginBottom:28 }}>
      {steps.map((s,i) => (
        <div key={i} style={{ display:'flex', alignItems:'flex-start', flex:i<steps.length-1?1:undefined }}>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:5 }}>
            <div style={{ width:30, height:30, borderRadius:'50%', display:'grid', placeItems:'center', fontSize:12, fontWeight:800, background:i<current?'#5b6af5':i===current?'#fff':'#f1f5f9', color:i<current?'#fff':i===current?'#5b6af5':'#8892b0', border:i===current?'2px solid #5b6af5':'2px solid transparent', boxShadow:i===current?'0 0 0 4px #eef0ff,3px 3px 8px #c8d0e0':'2px 2px 6px #d0d8e0,-1px -1px 4px #fff', flexShrink:0 }}>
              {i<current?<Icon n="check" size={13} color="#fff" />:i+1}
            </div>
            <span style={{ fontSize:10.5, fontWeight:600, color:i===current?'#5b6af5':'#8892b0', whiteSpace:'nowrap', textAlign:'center' }}>{s}</span>
          </div>
          {i<steps.length-1 && <div style={{ flex:1, height:2, background:i<current?'#5b6af5':'#e2e8f0', margin:'14px 4px 0', minWidth:8 }} />}
        </div>
      ))}
    </div>
  );
}

// ── ResultBlock — with Challenge / Accept feature ─────────────────────────
//
// Challenge state is kept in a ref-map keyed by `id` so it survives
// React re-renders while content streams in.
//
// State per result:
//   { challenged: bool, note: string, acceptedAt: number|null }
//
// - Not yet interacted → shows "⚑ Challenge" + faint "Accepted" pill
// - Challenged → shows orange banner with note, "Clear Challenge" button
// - Accepted explicitly (or never challenged after streaming done) → green pill

export function ResultBlock({ label, content, id, busy, extraActions, onCopy, copied }) {
  const expandedRef  = useRef({});
  const challengeRef = useRef({});   // { [id]: { challenged, note, showForm } }
  const [, forceUpdate] = useState(0);
  const tick = () => forceUpdate(n => n + 1);

  const expanded  = expandedRef.current[id] || false;
  const setExpanded = (v) => { expandedRef.current[id] = v; tick(); };

  const cState    = challengeRef.current[id] || { challenged: false, note: '', showForm: false };
  const setCState = (patch) => { challengeRef.current[id] = { ...cState, ...patch }; tick(); };

  if (!content && !busy) return null;
  const isLong     = content && content.length > 2500;
  const isAccepted = content && !busy && !cState.challenged && !cState.showForm;

  const openChallenge  = () => setCState({ showForm: true, challenged: false });
  const submitChallenge = () => {
    if (!cState.note?.trim()) return;
    setCState({ challenged: true, showForm: false });
  };
  const clearChallenge  = () => setCState({ challenged: false, note: '', showForm: false });

  return (
    <div className="clay-card" style={{ marginTop:20, overflow:'hidden', padding:0, border: cState.challenged ? '1.5px solid #fed7aa' : undefined }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 18px', borderBottom:'1px solid #e8ecf5', background: cState.challenged ? '#fff7ed' : '#fafbff', flexWrap:'wrap', gap:6 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
          <span style={{ fontSize:11, fontWeight:800, color: cState.challenged ? '#ea580c' : '#5b6af5', letterSpacing:'1px', textTransform:'uppercase' }}>{label}</span>
          {/* Status pills */}
          {content && !busy && (
            cState.challenged ? (
              <span style={{ background:'#fff7ed', border:'1px solid #fde68a', borderRadius:20, padding:'2px 9px', fontSize:10.5, fontWeight:700, color:'#ea580c', display:'inline-flex', alignItems:'center', gap:4 }}>
                ⚑ Challenged
              </span>
            ) : (
              <span style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:20, padding:'2px 9px', fontSize:10.5, fontWeight:700, color:'#16a34a', display:'inline-flex', alignItems:'center', gap:4 }}>
                ✓ Accepted
              </span>
            )
          )}
        </div>
        <div style={{ display:'flex', gap:6, alignItems:'center', flexWrap:'wrap' }}>
          {extraActions}
          {content && !busy && (
            <>
              {/* Challenge / Clear button */}
              {!cState.challenged && !cState.showForm && (
                <button onClick={openChallenge}
                  style={{ background:'#fff7ed', border:'1px solid #fed7aa', borderRadius:7, padding:'4px 10px', cursor:'pointer', color:'#ea580c', display:'flex', alignItems:'center', gap:5, fontSize:11, fontFamily:'inherit', fontWeight:600 }}>
                  ⚑ Challenge
                </button>
              )}
              {cState.challenged && (
                <button onClick={clearChallenge}
                  style={{ background:'#f5f7fd', border:'1px solid #dde3f0', borderRadius:7, padding:'4px 10px', cursor:'pointer', color:'#8892b0', display:'flex', alignItems:'center', gap:5, fontSize:11, fontFamily:'inherit' }}>
                  <Icon n="x" size={10}/>Clear
                </button>
              )}
              {/* Copy */}
              <button onClick={() => onCopy?.(content, id)}
                style={{ background:copied===id?'#f0fdf4':'#f5f7fd', border:`1px solid ${copied===id?'#bbf7d0':'#dde3f0'}`, borderRadius:7, padding:'4px 10px', cursor:'pointer', color:copied===id?'#16a34a':'#8892b0', display:'flex', alignItems:'center', gap:5, fontSize:11, fontFamily:'inherit' }}>
                {copied===id ? <><Icon n="check" size={11}/>Copied</> : <><Icon n="copy" size={11}/>Copy</>}
              </button>
              {/* Expand */}
              {isLong && (
                <button onClick={() => setExpanded(!expanded)}
                  style={{ background:'#f5f7fd', border:'1px solid #dde3f0', borderRadius:7, padding:'4px 10px', cursor:'pointer', color:'#8892b0', display:'flex', alignItems:'center', gap:5, fontSize:11, fontFamily:'inherit' }}>
                  <Icon n={expanded?'chevU':'chevD'} size={11}/>{expanded?'Collapse':'Expand'}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Challenge form */}
      {cState.showForm && (
        <div style={{ padding:'14px 18px', background:'#fffbeb', borderBottom:'1px solid #fde68a' }}>
          <div style={{ fontSize:12.5, fontWeight:700, color:'#ea580c', marginBottom:8, display:'flex', alignItems:'center', gap:6 }}>
            ⚑ What doesn't feel right about this result?
          </div>
          <textarea
            value={cState.note || ''}
            onChange={e => setCState({ note: e.target.value })}
            placeholder="e.g. Score seems too high — CV has no evidence of team leadership at this scale. Missing context on their B2B SaaS experience."
            rows={3}
            autoFocus
            style={{ width:'100%', padding:'9px 12px', fontSize:12.5, borderRadius:8, border:'1.5px solid #fde68a', background:'#fff', fontFamily:'inherit', lineHeight:1.65, resize:'vertical' }}
          />
          <div style={{ display:'flex', gap:8, marginTop:8 }}>
            <button onClick={submitChallenge} disabled={!cState.note?.trim()}
              style={{ padding:'6px 16px', borderRadius:7, border:'none', background: cState.note?.trim() ? '#ea580c' : '#fde68a', color:'#fff', fontSize:12.5, fontWeight:700, cursor: cState.note?.trim() ? 'pointer' : 'not-allowed', fontFamily:'inherit', opacity: cState.note?.trim() ? 1 : .6 }}>
              ⚑ Submit Challenge
            </button>
            <button onClick={() => setCState({ showForm: false, note: '' })}
              style={{ padding:'6px 14px', borderRadius:7, border:'1px solid #fde68a', background:'transparent', color:'#ea580c', fontSize:12.5, cursor:'pointer', fontFamily:'inherit' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Challenged note banner */}
      {cState.challenged && cState.note && (
        <div style={{ padding:'10px 18px', background:'#fff7ed', borderBottom:'1px solid #fde68a', display:'flex', alignItems:'flex-start', gap:8 }}>
          <span style={{ fontSize:14, flexShrink:0, marginTop:1 }}>⚑</span>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:11, fontWeight:800, color:'#ea580c', marginBottom:3, letterSpacing:'.4px' }}>CHALLENGE NOTE</div>
            <div style={{ fontSize:12.5, color:'#92400e', lineHeight:1.6 }}>{cState.note}</div>
          </div>
          <button onClick={clearChallenge}
            style={{ background:'none', border:'none', cursor:'pointer', color:'#fbbf24', display:'flex', flexShrink:0, padding:2 }}>
            <Icon n="x" size={14}/>
          </button>
        </div>
      )}

      {/* Content */}
      <div style={{ padding:'18px 20px', maxHeight:expanded?'none':520, overflowY:expanded?'visible':'auto' }}>
        {busy
          ? <div style={{ display:'flex', alignItems:'center', gap:10, color:'#8892b0', fontSize:13 }}><Spinner size={16}/>Generating…</div>
          : <MarkdownContent text={content}/>}
      </div>

      {/* Expand more */}
      {isLong && !expanded && !busy && (
        <div style={{ padding:'8px 20px 14px', borderTop:'1px solid #f0f2f7', textAlign:'center' }}>
          <button onClick={() => setExpanded(true)} style={{ background:'none', border:'none', color:'#5b6af5', cursor:'pointer', fontSize:12.5, fontFamily:'inherit', display:'inline-flex', alignItems:'center', gap:5 }}>
            <Icon n="chevD" size={13} color="#5b6af5"/>Show full output
          </button>
        </div>
      )}
    </div>
  );
}

// ── MarkdownContent ────────────────────────────────────────────────────────
export function MarkdownContent({ text }) {
  if (!text) return null;
  const clean = stripMeta(text);
  const els=[], lines=clean.split('\n'); let i=0;
  const esc=(s)=>s
    .replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>')
    .replace(/\*(.*?)\*/g,'<em>$1</em>')
    .replace(/`([^`]+)`/g,'<code style="background:#f0f2f9;padding:1px 6px;border-radius:4px;font-size:.9em;font-family:monospace;color:#5b6af5">$1</code>');

  while (i<lines.length) {
    const l=lines[i], t=l.trim();
    if (!t) { els.push(<div key={i} style={{ height:6 }}/>); i++; continue; }

    if (l.match(/^#{1,4} /)) {
      const lv=l.match(/^(#+)/)[1].length, txt=l.replace(/^#+\s/,'');
      els.push(<div key={i} style={{ fontSize:[20,16,14,13][lv-1]||13, fontWeight:800, color:lv<=2?'#1a1f36':'#5b6af5', margin:`${lv<=2?20:14}px 0 6px`, lineHeight:1.3 }} dangerouslySetInnerHTML={{ __html:esc(txt) }}/>);
    } else if (l.match(/^\|.+\|$/) && !l.match(/^\|[-:| ]+\|$/)) {
      const rows=[]; let j=i;
      while (j<lines.length && lines[j].match(/^\|.+\|$/)) { rows.push(lines[j]); j++; }
      const data=rows.filter(r=>!r.match(/^\|[-:| ]+\|$/));
      els.push(
        <div key={i} style={{ overflowX:'auto', margin:'14px 0', borderRadius:10, boxShadow:'3px 3px 10px #c8d0e0,-2px -2px 7px #fff', border:'1px solid #e8ecf5' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12.5 }}>
            {data.map((r,ri) => {
              const cells=r.split('|').filter((_,ci,a)=>ci>0&&ci<a.length-1), Tag=ri===0?'th':'td';
              return <tr key={ri} style={{ borderBottom:ri<data.length-1?'1px solid #eef0ff':'none', background:ri===0?'#fafbff':ri%2?'#f8f9fe':'#fff' }}>
                {cells.map((c,ci)=><Tag key={ci} style={{ padding:'9px 12px', textAlign:'left', color:ri===0?'#5b6af5':'#4a5278', fontWeight:ri===0?700:400, fontSize:ri===0?11:12.5, whiteSpace:ci===0?'nowrap':'normal', verticalAlign:'top' }} dangerouslySetInnerHTML={{ __html:esc(c.trim()) }}/>)}
              </tr>;
            })}
          </table>
        </div>
      );
      i=j; continue;
    } else if (t.startsWith('```')) {
      let j=i+1; const codeLines=[];
      while (j<lines.length&&!lines[j].trim().startsWith('```')) { codeLines.push(lines[j]); j++; }
      els.push(<pre key={i} style={{ background:'#f0f2f9', border:'1px solid #dde3f0', borderRadius:10, padding:'12px 16px', fontSize:12, fontFamily:"'Space Mono',monospace", color:'#4a5278', overflowX:'auto', margin:'10px 0', lineHeight:1.65 }}>{codeLines.join('\n')}</pre>);
      i=j+1; continue;
    } else if (t.match(/^[-•*]\s/)) {
      const indent=l.search(/\S/);
      els.push(<div key={i} style={{ display:'flex', gap:8, margin:'4px 0', paddingLeft:Math.min(indent*2,24) }}><span style={{ color:'#5b6af5', flexShrink:0, fontSize:9, marginTop:5 }}>◆</span><span style={{ fontSize:13, lineHeight:1.7, color:'#4a5278' }} dangerouslySetInnerHTML={{ __html:esc(t.replace(/^[-•*]\s/,'')) }}/></div>);
    } else if (t.match(/^\d+\.\s/)) {
      const num=t.match(/^(\d+)/)[1];
      els.push(<div key={i} style={{ display:'flex', gap:10, margin:'5px 0' }}><span style={{ color:'#5b6af5', fontWeight:700, fontSize:13, minWidth:20, flexShrink:0, marginTop:2 }}>{num}.</span><span style={{ fontSize:13, lineHeight:1.7, color:'#4a5278' }} dangerouslySetInnerHTML={{ __html:esc(t.replace(/^\d+\.\s*/,'')) }}/></div>);
    } else if (t.match(/^---+$/)) {
      els.push(<hr key={i} style={{ border:'none', borderTop:'1px solid #e8ecf5', margin:'16px 0' }}/>);
    } else {
      els.push(<p key={i} style={{ fontSize:13, lineHeight:1.75, color:'#4a5278', margin:'4px 0' }} dangerouslySetInnerHTML={{ __html:esc(t) }}/>);
    }
    i++;
  }
  return <div>{els}</div>;
}

export { Icon };
