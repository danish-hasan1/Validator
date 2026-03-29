import { useState, useEffect } from 'react';
import { Btn, Card, SectionHeader, ResultBlock, Spinner, EmptyState, TextArea, Input, Label, Badge } from './UI.jsx';
import Icon from './Icon.jsx';
import { PROMPTS } from './prompts.js';
import { callAI, parseScore } from './api.js';
import { saveCandidate, logActivity } from './storage.js';

export default function OutreachPage({ user, aiConfig, store, onStoreChange, notify }) {
  const [selJD,    setSelJD]    = useState(null);
  const [selCand,  setSelCand]  = useState(null);
  const [loading,  setLoading]  = useState(null); // 'message' | 'email' | 're-eval'
  const [result,   setResult]   = useState({ message: '', email: '' });
  const [newCv,    setNewCv]    = useState('');
  const [copied,   setCopied]   = useState(null);

  const jdList      = Object.values(store).sort((a, b) => b.savedAt - a.savedAt);
  const currentJD   = selJD ? store[selJD] : null;
  const candidates  = currentJD ? Object.values(currentJD.candidates || {}).sort((a, b) => (b.score?.total || 0) - (a.score?.total || 0)) : [];
  const activeCand  = selCand ? currentJD?.candidates?.[selCand] : null;

  useEffect(() => {
    if (activeCand) setNewCv(activeCand.cv || '');
    setResult({ message: '', email: '' });
  }, [selCand]);

  const generateMessage = async (type) => {
    if (!activeCand || !currentJD) return;
    setLoading('message');
    try {
      let msg = '';
      await callAI(aiConfig, PROMPTS.p7(currentJD.text, activeCand.cv, type), (chunk) => {
        msg += chunk;
        setResult(prev => ({ ...prev, message: msg }));
      });
      logActivity(user, 'p7', `Generated ${type} message for ${activeCand.name}`);
    } catch (e) { notify(e.message, 'err'); }
    finally { setLoading(null); }
  };

  const findEmail = async () => {
    if (!activeCand) return;
    setLoading('email');
    try {
      let emailRes = '';
      const company = activeCand.title?.split(' at ')?.[1] || activeCand.title?.split('@')?.[1] || 'their current company';
      await callAI(aiConfig, PROMPTS.p8(activeCand.name, company), (chunk) => {
        emailRes += chunk;
        setResult(prev => ({ ...prev, email: emailRes }));
      });
      logActivity(user, 'p8', `Found potential emails for ${activeCand.name}`);
    } catch (e) { notify(e.message, 'err'); }
    finally { setLoading(null); }
  };

  const reEvaluate = async () => {
    if (!activeCand || !currentJD || !newCv.trim()) return;
    setLoading('re-eval');
    try {
      let fullEval = '';
      await callAI(aiConfig, PROMPTS.p3(currentJD.analysis, currentJD.matrix, newCv), (chunk) => {
        fullEval += chunk;
      });
      const score = parseScore(fullEval);
      const updated = { ...activeCand, cv: newCv, eval: fullEval, score, updatedAt: Date.now() };
      saveCandidate(selJD, updated);
      onStoreChange({ ...store });
      notify('Candidate re-evaluated successfully.');
      logActivity(user, 'p3', `Re-evaluated ${activeCand.name} with updated CV`);
    } catch (e) { notify(e.message, 'err'); }
    finally { setLoading(null); }
  };

  const copy = (txt, key) => {
    navigator.clipboard.writeText(txt);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div style={{ padding: '0 0 40px' }}>
      <SectionHeader title="Outreach & Engagement" subtitle="Generate personalized messages, find emails, and update candidate CVs." icon="mail" />

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 24, alignItems: 'start' }}>
        
        {/* Sidebar: Selection */}
        <Card style={{ padding: 20, position: 'sticky', top: 20 }}>
          <Label>Select Job Description</Label>
          <select value={selJD || ''} onChange={e => { setSelJD(e.target.value); setSelCand(null); }} 
            style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #eef0f7', marginBottom: 20, fontSize: 13.5 }}>
            <option value="">-- Choose JD --</option>
            {jdList.map(j => <option key={j.id} value={j.id}>{j.name}</option>)}
          </select>

          {currentJD && (
            <>
              <Label>Select Candidate</Label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {candidates.length === 0 && <div style={{ fontSize: 12, color: '#8892b0', fontStyle: 'italic' }}>No candidates evaluated for this JD.</div>}
                {candidates.map(c => (
                  <button key={c.name} onClick={() => setSelCand(c.name)}
                    style={{ textAlign: 'left', padding: '10px 12px', borderRadius: 10, border: selCand === c.name ? '1.5px solid #5b6af5' : '1.5px solid #eef0f7', background: selCand === c.name ? '#f5f7ff' : '#fff', cursor: 'pointer', transition: 'all .2s' }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: selCand === c.name ? '#5b6af5' : '#1a1f36' }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: '#8892b0', marginTop: 2 }}>Score: {c.score?.total || 0}/100</div>
                  </button>
                ))}
              </div>
            </>
          )}
        </Card>

        {/* Main Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {!activeCand ? (
            <EmptyState icon="user" title="No Candidate Selected" desc="Select a job description and a candidate from the sidebar to start outreach." />
          ) : (
            <>
              {/* Outreach Messaging */}
              <Card style={{ padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: '#eef0ff', display: 'grid', placeItems: 'center' }}>
                      <Icon n="mail" color="#5b6af5" size={20} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 800 }}>Personalized Outreach</h3>
                      <p style={{ fontSize: 12, color: '#8892b0' }}>Generate conversion-focused messages based on fit.</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <Btn onClick={() => generateMessage('linkedin')} loading={loading === 'message'} variant="secondary" size="sm">
                      <Icon n="li" size={14} /> LinkedIn Message
                    </Btn>
                    <Btn onClick={() => generateMessage('email')} loading={loading === 'message'} variant="secondary" size="sm">
                      <Icon n="mail" size={14} /> Cold Email
                    </Btn>
                  </div>
                </div>

                {result.message ? (
                  <ResultBlock content={result.message} onCopy={() => copy(result.message, 'msg')} copied={copied === 'msg'} />
                ) : (
                  <div style={{ padding: '30px 20px', textAlign: 'center', border: '2px dashed #eef0f7', borderRadius: 12, color: '#8892b0', fontSize: 13 }}>
                    Click a button above to generate a message.
                  </div>
                )}
              </Card>

              {/* Email Finder & Contact Info */}
              <Card style={{ padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: '#f0fdf4', display: 'grid', placeItems: 'center' }}>
                      <Icon n="search" color="#16a34a" size={20} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 800 }}>Email Finder</h3>
                      <p style={{ fontSize: 12, color: '#8892b0' }}>Predict potential professional email addresses.</p>
                    </div>
                  </div>
                  <Btn onClick={findEmail} loading={loading === 'email'} variant="secondary" size="sm">
                    Find Potential Emails
                  </Btn>
                </div>

                {result.email ? (
                  <ResultBlock content={result.email} onCopy={() => copy(result.email, 'email')} copied={copied === 'email'} />
                ) : (
                  <div style={{ padding: '20px', textAlign: 'center', border: '2px dashed #f0fdf4', borderRadius: 12, color: '#8892b0', fontSize: 13 }}>
                    AI will guess emails based on name and company patterns.
                  </div>
                )}
              </Card>

              {/* CV Update & Re-evaluation */}
              <Card style={{ padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: '#fff7ed', display: 'grid', placeItems: 'center' }}>
                    <Icon n="refresh" color="#ea580c" size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 800 }}>CV Update & Re-evaluation</h3>
                    <p style={{ fontSize: 12, color: '#8892b0' }}>Paste an updated CV or more info to re-score the candidate.</p>
                  </div>
                </div>

                <TextArea value={newCv} onChange={setNewCv} placeholder="Paste updated CV text here..." rows={12} />
                
                <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
                  <Btn onClick={reEvaluate} loading={loading === 're-eval'} variant="primary" disabled={newCv === activeCand.cv}>
                    <Icon n="refresh" size={16} /> Re-evaluate Candidate
                  </Btn>
                </div>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
