import { useState, useRef, useEffect } from 'react';
import {
  Btn, Card, SectionHeader, Input, TextArea, Label,
  ScoreRing, RecBadge, StatusBadge, EmptyState, Spinner,
  MarkdownContent, Badge,
} from '../components/UI.jsx';
import Icon from '../components/Icon.jsx';
import { PROMPTS } from '../lib/prompts.js';
import { callAI, parseScore, stripMeta } from '../lib/api.js';
import {
  saveCandidate, saveMessage, updateMessage, deleteMessage,
  saveCVSnapshot, logActivity,
} from '../lib/storage.js';

// ── Helpers ────────────────────────────────────────────────────────────────
const fmtTime = (ts) => {
  const d = new Date(ts);
  const today = new Date();
  if (d.toDateString() === today.toDateString())
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' +
    d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const CHANNEL_CFG = {
  email:    { label: 'Email',    icon: 'mail',     color: '#5b6af5', bg: '#eef0ff' },
  whatsapp: { label: 'WhatsApp', icon: 'whatsapp', color: '#16a34a', bg: '#dcfce7' },
  note:     { label: 'Note',     icon: 'note',     color: '#8892b0', bg: '#f1f5f9' },
  reply:    { label: 'Reply',    icon: 'reply',    color: '#7c3aed', bg: '#f5f3ff' },
};
const STATUS_MSG = {
  draft:   { label: 'Draft',   color: '#8892b0', bg: '#f1f5f9' },
  sent:    { label: 'Sent',    color: '#0284c7', bg: '#f0f9ff' },
  replied: { label: 'Replied', color: '#16a34a', bg: '#dcfce7' },
};

// ── Contact Panel ──────────────────────────────────────────────────────────
function ContactPanel({ candidate, onUpdate }) {
  const [editMode, setEditMode] = useState(false);
  const [email,    setEmail]    = useState(candidate.email    || '');
  const [phone,    setPhone]    = useState(candidate.phone    || '');
  const [linkedin, setLinkedin] = useState(candidate.linkedin || '');

  const save = () => { onUpdate({ email, phone, linkedin }); setEditMode(false); };

  return (
    <Card style={{ marginBottom: 14, padding: '14px 18px' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
        <span style={{ fontSize:11, fontWeight:800, color:'#8892b0', letterSpacing:'1px', textTransform:'uppercase' }}>Contact Details</span>
        <Btn sm v="ghost" onClick={() => setEditMode(e => !e)}>
          <Icon n={editMode ? 'x' : 'edit'} size={12}/>{editMode ? 'Cancel' : 'Edit'}
        </Btn>
      </div>

      {editMode ? (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {[
            { label:'Email Address',      val:email,    set:setEmail,    placeholder:'candidate@company.com',     type:'email' },
            { label:'WhatsApp / Phone',   val:phone,    set:setPhone,    placeholder:'+1 555 000 0000',           type:'text'  },
            { label:'LinkedIn URL',       val:linkedin, set:setLinkedin, placeholder:'https://linkedin.com/in/…', type:'text'  },
          ].map(f => (
            <div key={f.label}>
              <Label>{f.label}</Label>
              <input value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.placeholder} type={f.type}
                style={{ width:'100%', padding:'8px 12px', fontSize:13, borderRadius:8 }}/>
            </div>
          ))}
          <Btn sm onClick={save}><Icon n="save" size={12}/>Save Contact</Btn>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {[
            { icon:'mail',  label:'Email',    val:candidate.email,    href:candidate.email    ? `mailto:${candidate.email}`    : null },
            { icon:'phone', label:'Phone',    val:candidate.phone,    href:candidate.phone    ? `https://wa.me/${candidate.phone.replace(/\D/g,'')}` : null },
            { icon:'li',    label:'LinkedIn', val:candidate.linkedin, href:candidate.linkedin || null },
          ].map(({ icon, label, val, href }) => (
            <div key={label} style={{ display:'flex', alignItems:'center', gap:10 }}>
              <Icon n={icon} size={14} color={val ? '#5b6af5' : '#c5c9fb'}/>
              <span style={{ fontSize:12, color:'#8892b0', width:60 }}>{label}</span>
              {val
                ? <a href={href} target="_blank" rel="noreferrer"
                    style={{ fontSize:12.5, color:'#5b6af5', textDecoration:'none', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:200 }}>
                    {val}
                  </a>
                : <span style={{ fontSize:12, color:'#c5c9fb' }}>Not set</span>}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ── Email Finder ───────────────────────────────────────────────────────────
function EmailFinder({ candidate, aiConfig, user, notify, onEmailFound }) {
  const [context,     setContext]     = useState('');
  const [reasoning,   setReasoning]   = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading,     setLoading]     = useState(false);

  const run = async () => {
    if (!aiConfig?.apiKey) { notify('Add your API key in Settings.', 'err'); return; }
    const ctx = context || [candidate.title, candidate.cvText?.slice(0, 300)].filter(Boolean).join('\n');
    setLoading(true); setSuggestions([]); setReasoning('');
    try {
      let full = '';
      await callAI(aiConfig, PROMPTS.emailFinder(candidate.name, ctx), (t) => { full = t; setReasoning(t); });
      const m = full.match(/EMAIL_SUGGESTIONS:(\[.*?\])/s);
      if (m) {
        try { setSuggestions(JSON.parse(m[1])); } catch {}
        setReasoning(full.replace(/EMAIL_SUGGESTIONS:\[.*?\]/s, '').trim());
      }
      logActivity('emailFinder', user.email);
    } catch (e) { notify(e.message, 'err'); }
    finally { setLoading(false); }
  };

  return (
    <Card style={{ marginBottom:14 }}>
      <div style={{ fontSize:11, fontWeight:800, color:'#8892b0', letterSpacing:'1px', textTransform:'uppercase', marginBottom:10 }}>Email Finder</div>
      <p style={{ fontSize:12.5, color:'#8892b0', marginBottom:12, lineHeight:1.6 }}>
        AI infers likely email formats from candidate name and context. Add their company name or LinkedIn URL for better accuracy.
      </p>
      <TextArea value={context} onChange={setContext}
        placeholder="Optional: company name, LinkedIn URL, or job title to improve accuracy…"
        rows={2}/>
      <Btn onClick={run} disabled={loading} sm>
        {loading ? <><Spinner size={13}/>Finding emails…</> : <><Icon n="search" size={13}/>Find Likely Emails</>}
      </Btn>
      {reasoning && !loading && (
        <div style={{ marginTop:12, fontSize:12.5, color:'#4a5278', lineHeight:1.7 }}>
          <MarkdownContent text={reasoning}/>
        </div>
      )}
      {suggestions.length > 0 && (
        <div style={{ marginTop:12 }}>
          <Label>Suggested Emails</Label>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {suggestions.map((email, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', background:'#f5f7fd', border:'1px solid #e8ecf5', borderRadius:8 }}>
                <Icon n="mail" size={14} color="#5b6af5"/>
                <span style={{ fontSize:12, color:'#4a5278', flex:1, fontFamily:"'Space Mono',monospace" }}>{email}</span>
                <Btn sm v="ghost" onClick={() => onEmailFound(email)}>Use This</Btn>
                <a href={`mailto:${email}`} style={{ display:'flex' }} title="Open in mail client">
                  <Icon n="send" size={14} color="#8892b0"/>
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

// ── Compose Message ────────────────────────────────────────────────────────
function ComposeMessage({ candidate, jdName, aiConfig, user, questionnaire, onSend, notify }) {
  const [channel,    setChannel]    = useState('email');
  const [subject,    setSubject]    = useState('');
  const [body,       setBody]       = useState('');
  const [customNote, setCustomNote] = useState('');
  const [loading,    setLoading]    = useState(false);
  const [msgType,    setMsgType]    = useState('outreach'); // outreach | questionnaire | custom

  const resetMessage = () => { setBody(''); setSubject(''); };

  const generateMsg = async () => {
    if (!aiConfig?.apiKey) { notify('Add your API key.', 'err'); return; }
    setLoading(true);
    try {
      if (msgType === 'questionnaire') {
        if (!questionnaire) {
          notify('No questionnaire yet — run Step 5 in Evaluate CV first.', 'err');
          setLoading(false); return;
        }
        if (channel === 'email') {
          setSubject('A few questions about your application');
          setBody(`Hi ${candidate.name?.split(' ')[0] || 'there'},\n\nThank you for your interest in the ${jdName} role. To help us evaluate your application fully, we'd appreciate some additional context:\n\n${stripMeta(questionnaire)}\n\nPlease aim for 3–6 sentences per answer.\n\nLooking forward to your response.\n\nBest regards`);
        } else {
          setBody(`Hi ${candidate.name?.split(' ')[0] || 'there'}! Hope you're well. I'm reaching out about your application for ${jdName}. I have a few quick questions to better understand your experience — would you be happy to answer here on WhatsApp? 🙏`);
        }
      } else {
        let full = '';
        await callAI(aiConfig, PROMPTS.outreachMsg(jdName, candidate.name, candidate.title, channel, customNote), (t) => { full = t; });
        if (channel === 'email') {
          const lines = full.split('\n');
          const subIdx = lines.findIndex(l => l.startsWith('SUBJECT:'));
          if (subIdx >= 0) {
            setSubject(lines[subIdx].replace('SUBJECT:', '').trim());
            setBody(lines.slice(subIdx + 2).join('\n').trim());
          } else { setBody(full.trim()); }
        } else {
          setBody(full.trim());
        }
        logActivity('outreachMsg', user.email);
      }
    } catch (e) { notify(e.message, 'err'); }
    finally { setLoading(false); }
  };

  const openSend = () => {
    if (!body.trim()) { notify('Compose a message first.', 'err'); return; }
    if (channel === 'email') {
      const to  = candidate.email || '';
      window.open(`mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
    } else {
      const phone = (candidate.phone || '').replace(/\D/g, '');
      if (!phone) { notify('Add the candidate\'s phone number in Contact Details first.', 'err'); return; }
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(body)}`, '_blank');
    }
    onSend({ channel, subject, body, status: 'sent', msgType });
  };

  const saveDraft = () => {
    if (!body.trim()) return;
    onSend({ channel, subject, body, status: 'draft', msgType });
    notify('Draft saved.');
  };

  return (
    <Card style={{ marginBottom:14 }}>
      <div style={{ fontSize:11, fontWeight:800, color:'#8892b0', letterSpacing:'1px', textTransform:'uppercase', marginBottom:14 }}>Compose Message</div>

      {/* Message type */}
      <div style={{ display:'flex', gap:6, marginBottom:14 }}>
        {[
          { id:'outreach',      label:'Outreach',    icon:'send'  },
          { id:'questionnaire', label:'Send Q&A',    icon:'help'  },
          { id:'custom',        label:'Custom',      icon:'edit'  },
        ].map(t => (
          <button key={t.id} onClick={() => { setMsgType(t.id); resetMessage(); }}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 13px', borderRadius:8, border:`1.5px solid ${msgType===t.id?'#5b6af5':'#dde3f0'}`, background:msgType===t.id?'#eef0ff':'#f5f7fd', color:msgType===t.id?'#5b6af5':'#8892b0', cursor:'pointer', fontSize:12.5, fontFamily:'inherit', fontWeight:msgType===t.id?700:500 }}>
            <Icon n={t.icon} size={12}/>{t.label}
          </button>
        ))}
      </div>

      {/* Channel */}
      <div style={{ marginBottom:12 }}>
        <Label>Channel</Label>
        <div style={{ display:'flex', gap:8 }}>
          {(['email','whatsapp']).map(ch => {
            const cfg = CHANNEL_CFG[ch];
            return (
              <button key={ch} onClick={() => { setChannel(ch); resetMessage(); }}
                style={{ display:'flex', alignItems:'center', gap:7, padding:'8px 16px', borderRadius:8, border:`1.5px solid ${channel===ch?cfg.color:'#dde3f0'}`, background:channel===ch?cfg.bg:'#f5f7fd', color:channel===ch?cfg.color:'#8892b0', cursor:'pointer', fontSize:13, fontFamily:'inherit', fontWeight:channel===ch?700:500 }}>
                <Icon n={cfg.icon} size={14}/>{cfg.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Recruiter hint for AI */}
      {msgType === 'outreach' && (
        <div style={{ marginBottom:10 }}>
          <Label>Recruiter Note — guides AI tone/angle (optional)</Label>
          <input value={customNote} onChange={e => setCustomNote(e.target.value)}
            placeholder="e.g. growth-stage startup, remote-first, emphasise learning culture…"
            style={{ width:'100%', padding:'8px 12px', fontSize:13, borderRadius:8 }}/>
        </div>
      )}

      <div style={{ marginBottom:10 }}>
        <Btn sm v="secondary" onClick={generateMsg} disabled={loading}>
          {loading ? <><Spinner size={13}/>Generating…</> : <><Icon n="zap" size={13}/>Generate with AI</>}
        </Btn>
      </div>

      {channel === 'email' && (
        <div style={{ marginBottom:10 }}>
          <Label>Subject</Label>
          <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Email subject line…"
            style={{ width:'100%', padding:'8px 12px', fontSize:13, borderRadius:8 }}/>
        </div>
      )}

      <div style={{ marginBottom:12 }}>
        <Label>Message</Label>
        <textarea value={body} onChange={e => setBody(e.target.value)}
          placeholder={channel==='email' ? 'Write or generate your email body…' : 'Write or generate your WhatsApp message…'}
          rows={8}
          style={{ width:'100%', padding:'10px 12px', fontSize:13, borderRadius:8, lineHeight:1.7, fontFamily:'inherit' }}/>
        <div style={{ fontSize:11, color: body.length > 300 && channel==='whatsapp' ? '#ea580c' : '#8892b0', marginTop:3 }}>
          {body.length} chars{body.length > 300 && channel==='whatsapp' ? ' — consider shortening for WhatsApp' : ''}
        </div>
      </div>

      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        <Btn onClick={openSend} disabled={!body.trim()}>
          <Icon n={channel==='whatsapp'?'whatsapp':'send'} size={14}/>
          {channel==='email' ? 'Open in Email Client' : 'Open in WhatsApp'}
        </Btn>
        <Btn v="ghost" sm onClick={saveDraft} disabled={!body.trim()}>
          <Icon n="save" size={13}/>Save Draft
        </Btn>
        <Btn v="ghost" sm onClick={() => navigator.clipboard.writeText(body).then(() => notify('Copied!'))}>
          <Icon n="copy" size={13}/>Copy
        </Btn>
      </div>

      {/* Contact warnings */}
      {channel === 'email' && !candidate.email && (
        <div style={{ marginTop:10, background:'#fff7ed', border:'1px solid #fed7aa', borderRadius:8, padding:'8px 12px', fontSize:12, color:'#ea580c', display:'flex', alignItems:'center', gap:7 }}>
          <Icon n="warn" size={13} color="#ea580c"/>No email saved — add it in Contact Details or use Email Finder.
        </div>
      )}
      {channel === 'whatsapp' && !candidate.phone && (
        <div style={{ marginTop:10, background:'#fff7ed', border:'1px solid #fed7aa', borderRadius:8, padding:'8px 12px', fontSize:12, color:'#ea580c', display:'flex', alignItems:'center', gap:7 }}>
          <Icon n="warn" size={13} color="#ea580c"/>No phone number saved — add it in Contact Details.
        </div>
      )}
    </Card>
  );
}

// ── Message Thread ─────────────────────────────────────────────────────────
function MessageThread({ messages, onAddReply, onMarkStatus, onDelete }) {
  const [replyBody, setReplyBody] = useState('');
  const [showReply, setShowReply] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages?.length]);

  return (
    <Card style={{ marginBottom:14 }}>
      <div style={{ fontSize:11, fontWeight:800, color:'#8892b0', letterSpacing:'1px', textTransform:'uppercase', marginBottom:14 }}>
        Communication Thread ({messages?.length || 0})
      </div>
      {!messages?.length ? (
        <div style={{ textAlign:'center', padding:'24px 0', color:'#c5c9fb', fontSize:13 }}>
          No messages yet. Compose one in the Compose tab.
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10, maxHeight:520, overflowY:'auto', paddingRight:4 }}>
          {messages.map(msg => {
            const ch  = CHANNEL_CFG[msg.channel] || CHANNEL_CFG.note;
            const st  = STATUS_MSG[msg.status]   || STATUS_MSG.sent;
            const isReply = msg.channel === 'reply';
            return (
              <div key={msg.id} style={{ background:isReply?'#f5f3ff':'#fafbff', border:`1.5px solid ${isReply?'#e9d5ff':'#e8ecf5'}`, borderRadius:12, padding:'12px 14px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8, flexWrap:'wrap' }}>
                  <span style={{ background:ch.bg, color:ch.color, borderRadius:20, padding:'2px 10px', fontSize:11, fontWeight:700, display:'inline-flex', alignItems:'center', gap:5 }}>
                    <Icon n={ch.icon} size={10}/>{ch.label}
                  </span>
                  {!isReply && (
                    <span style={{ background:st.bg, color:st.color, borderRadius:20, padding:'2px 10px', fontSize:11, fontWeight:700 }}>{st.label}</span>
                  )}
                  {msg.subject && <span style={{ fontSize:12.5, fontWeight:700, color:'#1a1f36' }}>{msg.subject}</span>}
                  <span style={{ fontSize:11, color:'#c5c9fb', marginLeft:'auto' }}>{fmtTime(msg.ts)}</span>
                </div>
                <div style={{ fontSize:13, color:'#4a5278', lineHeight:1.7, whiteSpace:'pre-wrap' }}>{msg.body}</div>
                <div style={{ display:'flex', gap:6, marginTop:10, flexWrap:'wrap' }}>
                  {!isReply && msg.status !== 'replied' && (
                    <button onClick={() => setShowReply(showReply===msg.id ? null : msg.id)}
                      style={{ fontSize:11.5, padding:'3px 10px', borderRadius:6, border:'1px solid #e9d5ff', background:'#f5f3ff', color:'#7c3aed', cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:5 }}>
                      <Icon n="reply" size={11}/>Log Reply
                    </button>
                  )}
                  {!isReply && msg.status === 'sent' && (
                    <button onClick={() => onMarkStatus(msg.id, 'replied')}
                      style={{ fontSize:11.5, padding:'3px 10px', borderRadius:6, border:'1px solid #bbf7d0', background:'#f0fdf4', color:'#16a34a', cursor:'pointer', fontFamily:'inherit' }}>
                      ✓ Mark Replied
                    </button>
                  )}
                  {msg.status === 'draft' && (
                    <button onClick={() => onMarkStatus(msg.id, 'sent')}
                      style={{ fontSize:11.5, padding:'3px 10px', borderRadius:6, border:'1px solid #bae6fd', background:'#f0f9ff', color:'#0284c7', cursor:'pointer', fontFamily:'inherit' }}>
                      Mark Sent
                    </button>
                  )}
                  <button onClick={() => { if(confirm('Delete this message?')) onDelete(msg.id); }}
                    style={{ fontSize:11.5, padding:'3px 10px', borderRadius:6, border:'1px solid #fecdd3', background:'#fff1f2', color:'#be123c', cursor:'pointer', fontFamily:'inherit' }}>
                    Delete
                  </button>
                </div>
                {showReply === msg.id && (
                  <div style={{ marginTop:10, borderTop:'1px solid #f0f2f7', paddingTop:10 }}>
                    <textarea value={replyBody} onChange={e => setReplyBody(e.target.value)}
                      placeholder="Paste the candidate's reply here…"
                      rows={4}
                      style={{ width:'100%', padding:'8px 12px', fontSize:12.5, borderRadius:8, lineHeight:1.7, fontFamily:'inherit' }}/>
                    <div style={{ display:'flex', gap:7, marginTop:7 }}>
                      <Btn sm onClick={() => { onAddReply(replyBody); setReplyBody(''); setShowReply(null); onMarkStatus(msg.id, 'replied'); }} disabled={!replyBody.trim()}>
                        <Icon n="save" size={12}/>Save Reply
                      </Btn>
                      <Btn sm v="ghost" onClick={() => { setShowReply(null); setReplyBody(''); }}>Cancel</Btn>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          <div ref={bottomRef}/>
        </div>
      )}
    </Card>
  );
}

// ── Update CV & Re-Evaluate ────────────────────────────────────────────────
function UpdateAndReEvaluate({ candidate, selJD, currentJD, aiConfig, user, onCVUpdate, notify }) {
  const [answers,    setAnswers]    = useState('');
  const [updatedCV,  setUpdatedCV]  = useState('');
  const [reEvalText, setReEvalText] = useState('');
  const [delta,      setDelta]      = useState('');
  const [newScore,   setNewScore]   = useState(null);
  const [loading,    setLoading]    = useState(null);
  const [showHistory,setShowHistory]= useState(false);

  const cvHistory = candidate.cvHistory || [];
  const oldScore  = candidate.score?.total;

  const updateCV = async () => {
    if (!answers.trim())      return notify('Paste the candidate\'s answers first.', 'err');
    if (!candidate.cvText)    return notify('No original CV found for this candidate.', 'err');
    if (!aiConfig?.apiKey)    return notify('Add your API key in Settings.', 'err');
    setLoading('update');
    try {
      await callAI(aiConfig, PROMPTS.updateCVFromAnswers(candidate.cvText, candidate.questionnaire || '', answers), (t) => setUpdatedCV(t));
      logActivity('cvUpdate', user.email);
    } catch (e) { notify(e.message, 'err'); }
    finally { setLoading(null); }
  };

  const reEvaluate = async () => {
    if (!updatedCV.trim())     return notify('Update the CV first.', 'err');
    if (!currentJD?.analysis)  return notify('JD has no analysis — re-save the JD first.', 'err');
    if (!aiConfig?.apiKey)     return notify('Add your API key in Settings.', 'err');

    // Snapshot current CV before overwriting
    saveCVSnapshot(selJD, candidate.name, {
      cvText: candidate.cvText,
      score:  candidate.score,
      eval:   candidate.eval,
    });

    setLoading('reeval');
    try {
      const r = await callAI(aiConfig, PROMPTS.p3(currentJD.analysis, currentJD.matrix, updatedCV), (t) => setReEvalText(t));
      const sc = parseScore(r);
      setNewScore(sc);

      if (oldScore != null && sc?.total != null) {
        await callAI(aiConfig, PROMPTS.reEvalSummary(oldScore, sc.total, candidate.eval, r, candidate.name), (t) => setDelta(t));
      }

      onCVUpdate({ cvText: updatedCV, eval: r, score: sc });
      logActivity('reEval', user.email);
      notify('CV updated and re-evaluated ✓');
    } catch (e) { notify(e.message, 'err'); }
    finally { setLoading(null); }
  };

  return (
    <div>
      <Card style={{ marginBottom:14 }}>
        <div style={{ fontSize:11, fontWeight:800, color:'#8892b0', letterSpacing:'1px', textTransform:'uppercase', marginBottom:12 }}>Update CV from Candidate Answers</div>
        <p style={{ fontSize:12.5, color:'#8892b0', marginBottom:14, lineHeight:1.6 }}>
          Paste the candidate's answers to the enrichment questionnaire. AI integrates them into their CV, then you can re-evaluate the updated profile.
        </p>
        {candidate.questionnaire && (
          <div style={{ background:'#f5f3ff', border:'1px solid #e9d5ff', borderRadius:9, padding:'10px 14px', marginBottom:12, fontSize:12.5, color:'#7c3aed', lineHeight:1.6 }}>
            <strong>Questionnaire was generated.</strong> Paste the candidate's answers below to improve their profile.
          </div>
        )}
        <TextArea value={answers} onChange={setAnswers}
          placeholder="Paste the candidate's responses here. Each answer will be integrated into the appropriate section of their CV."
          rows={8} label="Candidate's Answers"/>
        <Btn onClick={updateCV} disabled={!!loading || !answers.trim()}>
          {loading==='update' ? <><Spinner/>Updating CV…</> : <><Icon n="edit" size={14}/>Update CV with Answers</>}
        </Btn>

        {updatedCV && (
          <div style={{ marginTop:16 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
              <Label>Updated CV Preview</Label>
              <Btn sm v="ghost" onClick={() => navigator.clipboard.writeText(updatedCV).then(() => notify('Copied!'))}>
                <Icon n="copy" size={12}/>Copy
              </Btn>
            </div>
            <div style={{ background:'#f5f7fd', border:'1px solid #e8ecf5', borderRadius:9, padding:'12px 14px', fontSize:12.5, color:'#4a5278', whiteSpace:'pre-wrap', lineHeight:1.75, maxHeight:280, overflowY:'auto', fontFamily:"'Space Mono',monospace" }}>
              {updatedCV}
            </div>
            <div style={{ marginTop:12 }}>
              <Btn onClick={reEvaluate} disabled={!!loading}>
                {loading==='reeval' ? <><Spinner/>Re-evaluating…</> : <><Icon n="reeval" size={14}/>Re-Evaluate Updated CV</>}
              </Btn>
            </div>
          </div>
        )}
      </Card>

      {/* Score delta */}
      {newScore && oldScore != null && (
        <Card style={{ marginBottom:14 }}>
          <div style={{ fontSize:11, fontWeight:800, color:'#8892b0', letterSpacing:'1px', textTransform:'uppercase', marginBottom:14 }}>Re-Evaluation Result</div>
          <div style={{ display:'flex', alignItems:'center', gap:20, marginBottom:16, flexWrap:'wrap' }}>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:11, color:'#8892b0', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:4 }}>Before</div>
              <div style={{ fontSize:36, fontWeight:900, color:oldScore>=75?'#16a34a':oldScore>=55?'#b45309':'#dc2626', fontFamily:"'Space Mono',monospace" }}>{oldScore}</div>
            </div>
            <div style={{ fontSize:24, color:'#c5c9fb' }}>→</div>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:11, color:'#8892b0', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:4 }}>After</div>
              <div style={{ fontSize:36, fontWeight:900, color:newScore.total>=75?'#16a34a':newScore.total>=55?'#b45309':'#dc2626', fontFamily:"'Space Mono',monospace" }}>{newScore.total}</div>
            </div>
            <div>
              <div style={{ fontSize:22, fontWeight:900, color:newScore.total>oldScore?'#16a34a':newScore.total<oldScore?'#dc2626':'#8892b0', marginBottom:6 }}>
                {newScore.total>oldScore?'↑':newScore.total<oldScore?'↓':'='}{Math.abs(newScore.total-oldScore)} pts
              </div>
              <RecBadge rec={newScore.recommendation}/>
            </div>
          </div>
          {delta && <MarkdownContent text={delta}/>}
        </Card>
      )}

      {/* CV History */}
      {cvHistory.length > 0 && (
        <Card>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
            <div style={{ fontSize:11, fontWeight:800, color:'#8892b0', letterSpacing:'1px', textTransform:'uppercase' }}>CV History ({cvHistory.length})</div>
            <Btn sm v="ghost" onClick={() => setShowHistory(h=>!h)}>
              <Icon n={showHistory?'chevU':'chevD'} size={12}/>{showHistory?'Hide':'Show'}
            </Btn>
          </div>
          {showHistory && (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {[...cvHistory].reverse().map((snap, i) => (
                <div key={i} style={{ padding:'10px 14px', background:'#fafbff', border:'1px solid #f0f2f7', borderRadius:9 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
                    <span style={{ fontSize:11, color:'#8892b0' }}>{new Date(snap.ts).toLocaleString()}</span>
                    {snap.score?.total != null && (
                      <span style={{ fontSize:12, fontWeight:700, color:snap.score.total>=75?'#16a34a':'#b45309' }}>Score: {snap.score.total}/100</span>
                    )}
                  </div>
                  <div style={{ fontSize:11.5, color:'#8892b0', fontFamily:"'Space Mono',monospace", maxHeight:60, overflow:'hidden' }}>
                    {snap.cvText?.slice(0,150)}…
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

// ── MAIN PAGE ──────────────────────────────────────────────────────────────
export default function OutreachPage({ user, aiConfig, store, onStoreChange, preselectedJD, preselectedCand, notify }) {
  const [selJD,     setSelJD]    = useState(preselectedJD  || null);
  const [selCand,   setSelCand]  = useState(preselectedCand || null);
  const [activeTab, setActiveTab]= useState('compose');

  // Sync when navigated here from another page with a specific candidate
  useEffect(() => {
    if (preselectedJD)   setSelJD(preselectedJD);
    if (preselectedCand) setSelCand(preselectedCand);
    if (preselectedJD || preselectedCand) setActiveTab('compose');
  }, [preselectedJD, preselectedCand]);

  const jdList    = Object.values(store).sort((a, b) => b.savedAt - a.savedAt);
  const currentJD = selJD ? store[selJD] : null;
  const allCands  = currentJD ? Object.values(currentJD.candidates || {}) : [];
  const candidate = (selJD && selCand) ? store[selJD]?.candidates?.[selCand] : null;

  const updateCand = (patch) => {
    if (!selJD || !selCand || !candidate) return;
    const updated = saveCandidate(selJD, selCand, { ...candidate, ...patch });
    onStoreChange(updated);
  };

  const handleSendMessage = (msg) => {
    const updated = saveMessage(selJD, selCand, msg);
    onStoreChange(updated);
    if (msg.status === 'sent') { setActiveTab('thread'); }
  };

  const msgCount   = candidate?.messages?.length || 0;
  const replyCount = candidate?.messages?.filter(m => m.channel === 'reply').length || 0;

  const SUBTABS = [
    { id:'compose',     label:'Compose',             icon:'send'   },
    { id:'thread',      label:`Thread${msgCount ? ` (${msgCount})` : ''}`, icon:'chat' },
    { id:'emailfinder', label:'Email Finder',         icon:'search' },
    { id:'update',      label:'Update & Re-Evaluate', icon:'reeval' },
  ];

  if (jdList.length === 0) {
    return (
      <div>
        <h2 style={{ fontSize:22, fontWeight:900, color:'#1a1f36', marginBottom:4 }}>Outreach</h2>
        <EmptyState icon="📨" title="No JDs yet"
          sub="Create JDs and evaluate candidates before using Outreach."
          action={<Btn onClick={() => document.dispatchEvent(new CustomEvent('nav',{detail:'jd'}))}><Icon n="plus" size={14}/>Create JD</Btn>}/>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ fontSize:22, fontWeight:900, color:'#1a1f36', marginBottom:4 }}>Outreach</h2>
      <p style={{ color:'#8892b0', fontSize:13, marginBottom:20 }}>
        Message candidates directly, find emails, send enrichment Q&A, log replies, and re-evaluate updated CVs.
      </p>

      {/* JD + Candidate selectors */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:18 }}>
        <Card style={{ padding:'12px 16px' }}>
          <div style={{ fontSize:11, fontWeight:800, color:'#8892b0', letterSpacing:'1px', textTransform:'uppercase', marginBottom:8 }}>Job Description</div>
          <select value={selJD||''} onChange={e => { setSelJD(e.target.value||null); setSelCand(null); }}
            style={{ width:'100%', padding:'8px 12px', fontSize:13, borderRadius:8 }}>
            <option value="">Select a JD…</option>
            {jdList.map(j => <option key={j.name} value={j.name}>{j.name}</option>)}
          </select>
        </Card>
        <Card style={{ padding:'12px 16px' }}>
          <div style={{ fontSize:11, fontWeight:800, color:'#8892b0', letterSpacing:'1px', textTransform:'uppercase', marginBottom:8 }}>Candidate</div>
          <select value={selCand||''} onChange={e => setSelCand(e.target.value||null)}
            disabled={!selJD || allCands.length===0}
            style={{ width:'100%', padding:'8px 12px', fontSize:13, borderRadius:8, opacity:!selJD?.4:1 }}>
            <option value="">Select a candidate…</option>
            {allCands.map(c => (
              <option key={c.name} value={c.name}>
                {c.name}{c.score?.total != null ? ` — ${c.score.total}/100` : ''}
              </option>
            ))}
          </select>
          {selJD && allCands.length===0 && (
            <div style={{ fontSize:11.5, color:'#ea580c', marginTop:6 }}>No candidates — evaluate some CVs first.</div>
          )}
        </Card>
      </div>

      {!candidate ? (
        <div style={{ textAlign:'center', padding:'40px 0', color:'#c5c9fb', fontSize:14 }}>
          Select a JD and candidate above to start.
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'260px 1fr', gap:18 }}>

          {/* Left: Candidate summary + contact */}
          <div>
            <Card raised style={{ marginBottom:14, padding:'16px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
                <div style={{ width:42, height:42, borderRadius:'50%', background:'linear-gradient(135deg,#5b6af5,#7c5cbf)', display:'grid', placeItems:'center', flexShrink:0 }}>
                  <span style={{ fontSize:17, fontWeight:800, color:'#fff' }}>{candidate.name?.[0]?.toUpperCase()||'?'}</span>
                </div>
                <div>
                  <div style={{ fontWeight:800, fontSize:14, color:'#1a1f36' }}>{candidate.name}</div>
                  {candidate.title && <div style={{ fontSize:12, color:'#8892b0' }}>{candidate.title}</div>}
                </div>
              </div>
              {candidate.score?.total != null && (
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10 }}>
                  <ScoreRing score={candidate.score.total} size={56}/>
                  <div>
                    <RecBadge rec={candidate.score.recommendation}/>
                    <div style={{ fontSize:11, color:'#8892b0', marginTop:4 }}>{candidate.score.confidence} confidence</div>
                  </div>
                </div>
              )}
              <StatusBadge status={candidate.status}/>
              {msgCount > 0 && (
                <div style={{ marginTop:8, fontSize:12, color:'#7c3aed' }}>
                  {msgCount} message{msgCount!==1?'s':''}{replyCount>0?` · ${replyCount} repl${replyCount!==1?'ies':'y'}`:''}
                </div>
              )}
            </Card>

            <ContactPanel candidate={candidate} onUpdate={updateCand}/>
          </div>

          {/* Right: Sub-tabs */}
          <div>
            <div style={{ display:'flex', gap:4, marginBottom:16, background:'#e8ecf5', borderRadius:12, padding:4, boxShadow:'inset 2px 2px 6px #d0d8ea,inset -2px -2px 5px #fff', flexWrap:'wrap' }}>
              {SUBTABS.map(t => (
                <button key={t.id} onClick={() => setActiveTab(t.id)}
                  style={{ flex:'1 1 auto', padding:'7px 4px', borderRadius:9, border:'none', background:activeTab===t.id?'#fff':'transparent', color:activeTab===t.id?'#5b6af5':'#8892b0', fontWeight:activeTab===t.id?700:500, fontSize:12, cursor:'pointer', fontFamily:'inherit', boxShadow:activeTab===t.id?'2px 2px 8px #c8d0e0,-1px -1px 5px #fff':'none', transition:'all .2s', display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}>
                  <Icon n={t.icon} size={13} color={activeTab===t.id?'#5b6af5':'#c5c9fb'}/>{t.label}
                </button>
              ))}
            </div>

            {activeTab==='compose' && (
              <ComposeMessage
                candidate={candidate} jdName={selJD} aiConfig={aiConfig} user={user}
                questionnaire={candidate.questionnaire}
                onSend={handleSendMessage} notify={notify}/>
            )}
            {activeTab==='thread' && (
              <MessageThread
                messages={candidate.messages||[]}
                onAddReply={(body) => { const u=saveMessage(selJD,selCand,{channel:'reply',body,status:'received'}); onStoreChange(u); }}
                onMarkStatus={(msgId,status) => { const u=updateMessage(selJD,selCand,msgId,{status}); onStoreChange(u); }}
                onDelete={(msgId) => { const u=deleteMessage(selJD,selCand,msgId); onStoreChange(u); }}/>
            )}
            {activeTab==='emailfinder' && (
              <EmailFinder
                candidate={candidate} aiConfig={aiConfig} user={user} notify={notify}
                onEmailFound={(email) => { updateCand({email}); setActiveTab('compose'); notify(`Email saved — ${email} ✓`); }}/>
            )}
            {activeTab==='update' && (
              <UpdateAndReEvaluate
                candidate={candidate} selJD={selJD} currentJD={currentJD}
                aiConfig={aiConfig} user={user}
                onCVUpdate={(patch) => { const u=saveCandidate(selJD,selCand,{...candidate,...patch}); onStoreChange(u); }}
                notify={notify}/>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
