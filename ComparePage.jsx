import { useState } from 'react';
import { Btn, Card, SectionHeader, ResultBlock, ScoreRing, RecBadge, StatusBadge, ScoreChart, EmptyState, Spinner } from './UI.jsx';
import Icon from './Icon.jsx';
import { PROMPTS } from './prompts.js';
import { callAI, stripMeta } from './api.js';
import { logActivity } from './storage.js';

export default function ComparePage({ user, aiConfig, store, onNavigate, notify }) {
  const [selJD,    setSelJD]    = useState(null);
  const [selCands, setSelCands] = useState([]);
  const [cmpResult,setCmpResult]= useState('');
  const [loading,  setLoading]  = useState(false);
  const [copied,   setCopied]   = useState(null);

  const jdList    = Object.values(store).sort((a, b) => b.savedAt - a.savedAt);
  const currentJD = selJD ? store[selJD] : null;
  const evaluatedCands = currentJD
    ? Object.values(currentJD.candidates || {}).filter(c => c.eval && c.score?.total != null)
    : [];

  const toggleCand = (name) => {
    setSelCands(prev => prev.includes(name) ? prev.filter(x => x !== name) : [...prev, name]);
    setCmpResult('');
  };

  const doCompare = async () => {
    if (!currentJD) return notify('Select a JD.', 'err');
    if (selCands.length < 2) return notify('Select at least 2 evaluated candidates.', 'err');
    if (!aiConfig?.apiKey) { notify('Add your API key in Settings first.', 'err'); return; }
    setLoading(true);
    try {
      const cands = selCands.map(n => {
        const c = currentJD.candidates[n];
        return { name: c.name, score: c.score?.total || 0, recommendation: c.score?.recommendation || '', eval: stripMeta(c.eval || '').slice(0, 2000) };
      });
      await callAI(aiConfig, PROMPTS.compare(selJD, cands), setCmpResult);
      logActivity('compare', user.email);
    } catch (e) { notify(e.message, 'err'); }
    finally { setLoading(false); }
  };

  const copyText = (text, id) => {
    navigator.clipboard.writeText(text).then(() => { setCopied(id); setTimeout(() => setCopied(null), 1500); });
  };

  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 900, color: '#1a1f36', marginBottom: 4 }}>Compare Candidates</h2>
      <p style={{ color: '#8892b0', fontSize: 13, marginBottom: 24 }}>
        Select a JD and 2 or more evaluated candidates to generate a side-by-side analysis with a panel recommendation.
      </p>

      {jdList.length === 0 ? (
        <EmptyState icon="⚖️" title="No data yet"
          sub="Save JDs and evaluate candidates first."
          action={<Btn onClick={() => onNavigate('jd')}><Icon n="plus" size={14} />Create JD</Btn>} />
      ) : (
        <>
          {/* Step 1: Select JD */}
          <Card style={{ marginBottom: 14 }}>
            <SectionHeader title="Step 1 — Select Job Description" />
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {jdList.map(j => {
                const evalCount = Object.values(j.candidates || {}).filter(c => c.eval && c.score?.total != null).length;
                return (
                  <button key={j.name} onClick={() => { setSelJD(j.name); setSelCands([]); setCmpResult(''); }}
                    style={{ padding: '8px 16px', borderRadius: 9, border: `1.5px solid ${selJD === j.name ? '#5b6af5' : '#dde3f0'}`, background: selJD === j.name ? '#eef0ff' : '#f5f7fd', color: selJD === j.name ? '#5b6af5' : '#4a5278', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', fontWeight: selJD === j.name ? 700 : 500, boxShadow: selJD === j.name ? 'inset 2px 2px 6px rgba(91,106,245,.12)' : '2px 2px 6px #d0d8e0,-1px -1px 4px #fff', transition: 'all .15s' }}>
                    {j.name}
                    <span style={{ fontSize: 11, color: selJD === j.name ? '#818cf8' : '#8892b0', marginLeft: 6 }}>({evalCount} scored)</span>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Step 2: Select candidates */}
          {selJD && (
            <Card style={{ marginBottom: 14 }}>
              <SectionHeader title="Step 2 — Select Candidates (minimum 2)" />
              {evaluatedCands.length === 0 ? (
                <div style={{ fontSize: 13, color: '#8892b0' }}>
                  No scored candidates for this JD yet.{' '}
                  <button onClick={() => onNavigate('cv', selJD)} style={{ background: 'none', border: 'none', color: '#5b6af5', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, textDecoration: 'underline' }}>
                    Evaluate one →
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {evaluatedCands.map(c => {
                    const sel = selCands.includes(c.name);
                    const sc  = c.score?.total || 0;
                    const scColor = sc >= 75 ? '#16a34a' : sc >= 55 ? '#b45309' : '#dc2626';
                    return (
                      <button key={c.name} onClick={() => toggleCand(c.name)}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 9, border: `1.5px solid ${sel ? '#818cf8' : '#dde3f0'}`, background: sel ? '#f5f3ff' : '#f5f7fd', color: sel ? '#7c3aed' : '#4a5278', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: sel ? 700 : 500, boxShadow: sel ? 'inset 2px 2px 6px rgba(124,58,237,.1)' : '2px 2px 6px #d0d8e0,-1px -1px 4px #fff' }}>
                        {sel && <Icon n="check" size={13} color="#7c3aed" />}
                        <span>{c.name}</span>
                        <span style={{ fontSize: 12, fontWeight: 800, color: scColor, fontFamily: "'Space Mono',monospace" }}>{sc}</span>
                        <StatusBadge status={c.status} />
                      </button>
                    );
                  })}
                </div>
              )}
            </Card>
          )}

          {/* Score preview of selected */}
          {selCands.length >= 2 && (
            <Card style={{ marginBottom: 14 }}>
              <SectionHeader title="Score Preview" />
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {selCands.map(n => {
                  const c = currentJD?.candidates?.[n]; if (!c) return null;
                  return (
                    <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#fafbff', border: '1px solid #e8ecf5', borderRadius: 12, padding: '12px 16px' }}>
                      <ScoreRing score={c.score?.total || 0} size={60} />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13.5, color: '#1a1f36', marginBottom: 4 }}>{n}</div>
                        <RecBadge rec={c.score?.recommendation} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Compare button */}
          {selJD && selCands.length >= 2 && (
            <Btn onClick={doCompare} disabled={loading} style={{ marginBottom: 4 }}>
              {loading
                ? <><Spinner />Comparing…</>
                : <><Icon n="compare" size={14} />Generate Comparison Report ({selCands.length} candidates)</>}
            </Btn>
          )}

          <ResultBlock
            label="Comparative Analysis & Panel Recommendation"
            content={cmpResult} id="cmp" busy={loading}
            onCopy={copyText} copied={copied} />

          {/* All scored candidates overview when nothing selected */}
          {selJD && evaluatedCands.length > 0 && !cmpResult && selCands.length < 2 && (
            <Card style={{ marginTop: 20 }}>
              <SectionHeader title="All Scored Candidates — Overview" />
              <ScoreChart candidates={evaluatedCands} onSelect={n => onNavigate('cv', selJD, n)} />
            </Card>
          )}
        </>
      )}
    </div>
  );
}
