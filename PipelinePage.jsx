import { useState, useEffect } from 'react';
import { Btn, Card, SectionHeader, RecBadge, ScoreChart, EmptyState, STATUS_CFG } from './UI.jsx';
import Icon from './Icon.jsx';
import { saveCandidate } from './storage.js';

export default function PipelinePage({ store, onStoreChange, onNavigate, notify, preselectedJD }) {
  const [selJD, setSelJD] = useState(preselectedJD || null);

  useEffect(() => {
    if (preselectedJD) setSelJD(preselectedJD);
  }, [preselectedJD]);

  const jdList    = Object.values(store).sort((a, b) => b.savedAt - a.savedAt);
  const currentJD = selJD ? store[selJD] : null;
  const cands     = currentJD ? Object.values(currentJD.candidates || {}) : [];
  const cols      = ['new', 'shortlisted', 'hold', 'rejected'];
  const byStatus  = (st) => cands.filter(c => (c.status || 'new') === st);

  const moveStatus = (cName, newStatus) => {
    const existing = currentJD?.candidates?.[cName];
    if (!existing) return;
    const updated = saveCandidate(selJD, cName, { ...existing, status: newStatus });
    onStoreChange(updated);
  };

  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 900, color: '#1a1f36', marginBottom: 4 }}>Candidate Pipeline</h2>
      <p style={{ color: '#8892b0', fontSize: 13, marginBottom: 24 }}>
        Kanban view of all candidates grouped by status. Click any card to open the full evaluation.
      </p>

      {jdList.length === 0 ? (
        <EmptyState icon="📋" title="No JDs yet"
          sub="Create a JD and evaluate some candidates first."
          action={<Btn onClick={() => onNavigate('jd')}><Icon n="plus" size={14} />Create JD</Btn>} />
      ) : (
        <>
          <Card style={{ marginBottom: 16 }}>
            <SectionHeader title="Select Job Description" />
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {jdList.map(j => {
                const cc = Object.keys(j.candidates || {}).length;
                return (
                  <button key={j.name} onClick={() => setSelJD(j.name)}
                    style={{ padding: '8px 16px', borderRadius: 9, border: `1.5px solid ${selJD === j.name ? '#5b6af5' : '#dde3f0'}`, background: selJD === j.name ? '#eef0ff' : '#f5f7fd', color: selJD === j.name ? '#5b6af5' : '#4a5278', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', fontWeight: selJD === j.name ? 700 : 500, boxShadow: selJD === j.name ? 'inset 2px 2px 6px rgba(91,106,245,.1)' : '2px 2px 6px #d0d8e0,-1px -1px 4px #fff', transition: 'all .15s' }}>
                    {j.name}
                    <span style={{ fontSize: 11, color: '#8892b0', marginLeft: 6 }}>({cc})</span>
                  </button>
                );
              })}
            </div>
          </Card>

          {selJD && (
            cands.length === 0 ? (
              <EmptyState icon="👥" title="No candidates yet for this JD"
                sub="Evaluate some CVs first to populate the pipeline."
                action={<Btn onClick={() => onNavigate('cv', selJD)}><Icon n="user" size={14} />Evaluate CVs</Btn>} />
            ) : (
              <>
                {/* Kanban board */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
                  {cols.map(st => {
                    const s   = STATUS_CFG[st];
                    const col = byStatus(st);
                    return (
                      <div key={st} style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '4px 4px 12px #d0d8e8,-3px -3px 9px #fff', border: '1.5px solid #e8ecf5' }}>
                        <div style={{ padding: '10px 14px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,.04)' }}>
                          <span style={{ fontSize: 11.5, fontWeight: 800, color: s.c, letterSpacing: '.5px', textTransform: 'uppercase' }}>{s.label}</span>
                          <span style={{ fontSize: 12, fontWeight: 800, color: s.c, background: 'rgba(255,255,255,.6)', borderRadius: 10, padding: '1px 9px' }}>{col.length}</span>
                        </div>
                        <div style={{ padding: 9, display: 'flex', flexDirection: 'column', gap: 8, minHeight: 100 }}>
                          {col.map(c => (
                            <div key={c.name}
                              onClick={() => onNavigate('cv', selJD, c.name)}
                              style={{ background: '#fafbff', border: '1.5px solid #e8ecf5', borderRadius: 10, padding: '10px 12px', cursor: 'pointer', boxShadow: '2px 2px 6px #d0d8e0,-1px -1px 4px #fff', transition: 'box-shadow .15s' }}
                              onMouseEnter={e => e.currentTarget.style.boxShadow = '3px 3px 10px #c8d0e0,-1px -1px 6px #fff'}
                              onMouseLeave={e => e.currentTarget.style.boxShadow = '2px 2px 6px #d0d8e0,-1px -1px 4px #fff'}>
                              <div style={{ fontWeight: 700, fontSize: 12.5, color: '#1a1f36', marginBottom: 6 }}>{c.name}</div>
                              {c.score?.total != null && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                  <div style={{ flex: 1, height: 5, background: '#e8ecf5', borderRadius: 3 }}>
                                    <div style={{ height: '100%', width: `${c.score.total}%`, background: c.score.total >= 75 ? '#16a34a' : c.score.total >= 55 ? '#b45309' : '#dc2626', borderRadius: 3, transition: 'width .8s ease' }} />
                                  </div>
                                  <span style={{ fontSize: 11, fontWeight: 800, color: c.score.total >= 75 ? '#16a34a' : c.score.total >= 55 ? '#b45309' : '#dc2626', fontFamily: "'Space Mono',monospace" }}>{c.score.total}</span>
                                </div>
                              )}
                              {c.score?.recommendation && <div style={{ marginBottom: 6 }}><RecBadge rec={c.score.recommendation} /></div>}
                              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                                {cols.filter(x => x !== st).map(x => (
                                  <button key={x}
                                    onClick={e => { e.stopPropagation(); moveStatus(c.name, x); }}
                                    style={{ fontSize: 10, padding: '2px 7px', borderRadius: 5, border: `1px solid ${STATUS_CFG[x].c}66`, background: STATUS_CFG[x].bg, color: STATUS_CFG[x].c, cursor: 'pointer', fontFamily: 'inherit' }}>
                                    → {STATUS_CFG[x].label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                          {col.length === 0 && (
                            <div style={{ fontSize: 12, color: '#c5c9fb', textAlign: 'center', padding: '18px 0' }}>Empty</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {cands.filter(c => c.score?.total != null).length > 0 && (
                  <Card>
                    <SectionHeader title="Score Overview" />
                    <ScoreChart candidates={cands} onSelect={n => onNavigate('cv', selJD, n)} />
                  </Card>
                )}
              </>
            )
          )}
        </>
      )}
    </div>
  );
}
