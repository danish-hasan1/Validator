import { useState } from 'react';
import { registerUser, loginUser } from './auth.js';
import { Btn, Input, Card } from './UI.jsx';
import Icon from './Icon.jsx';
import { PROVIDERS, PROVIDER_LIST } from './api.js';

export default function AuthPage({ onAuth }) {
  const openRegister = () => {
    const urlParam = new URLSearchParams(window.location.search).get('register');
    const ssFlag   = sessionStorage.getItem('validator_open_register');
    if (urlParam === 'true' || ssFlag === '1') {
      sessionStorage.removeItem('validator_open_register');
      return 'register';
    }
    return 'login';
  };

  const [mode,    setMode]    = useState(openRegister);
  const [form,    setForm]    = useState({ name: '', email: '', password: '', confirmPw: '', apiKey: '', provider: 'anthropic', model: PROVIDERS.anthropic.defaultModel, agreedToTerms: false });
  const [err,     setErr]     = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw,  setShowPw]  = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  const set = (k) => (v) => setForm(f => ({ ...f, [k]: v }));

  const handleProviderChange = (pid) => {
    setForm(f => ({ ...f, provider: pid, model: PROVIDERS[pid]?.defaultModel || '', apiKey: '' }));
  };

  const currentProv = PROVIDERS[form.provider] || PROVIDERS.anthropic;

  const handleSubmit = async (e) => {
    e.preventDefault(); setErr(''); setLoading(true);
    try {
      if (mode === 'register') {
        if (!form.name.trim())    throw new Error('Full name is required.');
        if (!form.email.trim())   throw new Error('Email is required.');
        if (form.password.length < 6) throw new Error('Password must be at least 6 characters.');
        if (form.password !== form.confirmPw) throw new Error('Passwords do not match.');
        if (!form.agreedToTerms) throw new Error('Please agree to the Terms of Use before registering.');
        registerUser({ name: form.name, email: form.email, password: form.password, apiKey: form.apiKey, provider: form.provider, model: form.model, agreedToTerms: form.agreedToTerms });
      }
      const user = loginUser({ email: form.email, password: form.password });
      onAuth(user);
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#f0f2f7 0%,#e8ecf5 50%,#eef0ff 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: mode === 'register' ? 520 : 440 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <a href="./landing.html" style={{ textDecoration: 'none', display: 'inline-block' }}>
            <div style={{ width: 52, height: 52, borderRadius: 15, background: 'linear-gradient(135deg,#5b6af5,#7c5cbf)', display: 'grid', placeItems: 'center', margin: '0 auto 14px', boxShadow: '0 4px 20px rgba(91,106,245,.3)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            </div>
          </a>
          <h1 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 26, fontWeight: 900, color: '#1a1f36', letterSpacing: '-.03em', marginBottom: 4 }}>Validator</h1>
          <p style={{ color: '#8892b0', fontSize: 13 }}>AI-Powered Recruiting Intelligence</p>
        </div>

        <Card raised style={{ padding: 32 }}>
          {/* Mode toggle */}
          <div style={{ display: 'flex', background: '#f0f2f7', borderRadius: 10, padding: 4, marginBottom: 24, boxShadow: 'inset 2px 2px 6px #d0d8ea,inset -2px -2px 5px #fff' }}>
            {[['login', 'Sign In'], ['register', 'Create Account']].map(([m, label]) => (
              <button key={m} onClick={() => { setMode(m); setErr(''); }}
                style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: 'none', background: mode === m ? '#fff' : 'transparent', color: mode === m ? '#5b6af5' : '#8892b0', fontWeight: mode === m ? 700 : 500, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', boxShadow: mode === m ? '2px 2px 8px #c8d0e0,-1px -1px 5px #fff' : 'none', transition: 'all .2s' }}>
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {mode === 'register' && (
              <Input value={form.name} onChange={set('name')} placeholder="Your full name" label="Full Name" />
            )}

            <Input value={form.email} onChange={set('email')} placeholder="you@company.com" label="Email Address" type="email" />

            {/* Password */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: '#8892b0', marginBottom: 6, letterSpacing: '.6px', textTransform: 'uppercase' }}>Password</div>
              <div style={{ position: 'relative' }}>
                <input value={form.password} onChange={e => set('password')(e.target.value)} placeholder={mode === 'register' ? 'Min 6 characters' : 'Your password'} type={showPw ? 'text' : 'password'}
                  style={{ width: '100%', padding: '10px 44px 10px 14px', fontSize: 13.5, borderRadius: 10 }} />
                <button type="button" onClick={() => setShowPw(s => !s)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#8892b0', display: 'flex' }}>
                  <Icon n={showPw ? 'eyeOff' : 'eye'} size={16} />
                </button>
              </div>
            </div>

            {mode === 'register' && (
              <>
                <Input value={form.confirmPw} onChange={set('confirmPw')} placeholder="Confirm password" label="Confirm Password" type="password" />

                {/* Provider picker */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: '#8892b0', marginBottom: 8, letterSpacing: '.6px', textTransform: 'uppercase' }}>
                    AI Provider <span style={{ color: '#c5c9fb', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(can be changed later)</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
                    {PROVIDER_LIST.map(p => {
                      const active = form.provider === p.id;
                      return (
                        <button type="button" key={p.id} onClick={() => handleProviderChange(p.id)}
                          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px', borderRadius: 8, border: `1.5px solid ${active ? p.color : '#dde3f0'}`, background: active ? p.bg : '#f5f7fd', cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s' }}>
                          <span style={{ fontSize: 15 }}>{p.logo}</span>
                          <span style={{ fontSize: 11.5, fontWeight: active ? 700 : 500, color: active ? p.color : '#8892b0' }}>{p.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Model */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: '#8892b0', marginBottom: 6, letterSpacing: '.6px', textTransform: 'uppercase' }}>Model</div>
                  <select value={form.model} onChange={e => set('model')(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', fontSize: 13, borderRadius: 10, background: '#f7f8fc', appearance: 'none', cursor: 'pointer' }}>
                    {currentProv.models.map(m => (
                      <option key={m.id} value={m.id}>{m.label} — {m.note}</option>
                    ))}
                  </select>
                </div>

                {/* API Key */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: '#8892b0', marginBottom: 6, letterSpacing: '.6px', textTransform: 'uppercase' }}>
                    {currentProv.keyLabel} <span style={{ color: '#c5c9fb', fontWeight: 400 }}>(optional)</span>
                  </div>
                  <input value={form.apiKey} onChange={e => set('apiKey')(e.target.value)} placeholder={currentProv.keyPlaceholder} type="password"
                    style={{ width: '100%', padding: '10px 14px', fontSize: 13, borderRadius: 10 }} />
                  <div style={{ fontSize: 11, color: '#8892b0', marginTop: 4 }}>{currentProv.keyHint}</div>
                </div>

                {/* Terms */}
                <div style={{ background: '#fafbff', border: '1.5px solid #dde3f0', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <button type="button" onClick={() => set('agreedToTerms')(!form.agreedToTerms)}
                      style={{ width: 18, height: 18, borderRadius: 5, border: '2px solid', borderColor: form.agreedToTerms ? '#5b6af5' : '#c5c9fb', background: form.agreedToTerms ? '#5b6af5' : '#fff', cursor: 'pointer', flexShrink: 0, display: 'grid', placeItems: 'center', marginTop: 2 }}>
                      {form.agreedToTerms && <Icon n="check" size={11} color="#fff" />}
                    </button>
                    <div style={{ fontSize: 12.5, color: '#4a5278', lineHeight: 1.6 }}>
                      I have read and agree to the{' '}
                      <button type="button" onClick={() => setShowDisclaimer(true)}
                        style={{ background: 'none', border: 'none', color: '#5b6af5', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, textDecoration: 'underline' }}>
                        Terms of Use & Disclaimer
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {err && (
              <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 9, padding: '10px 14px', fontSize: 13, color: '#be123c', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon n="warn" size={15} color="#be123c" />{err}
              </div>
            )}

            <Btn type="submit" disabled={loading} full style={{ padding: '13px 20px', fontSize: 14.5, boxShadow: '0 4px 14px rgba(91,106,245,.35)' }}>
              {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </Btn>
          </form>

          {mode === 'login' && (
            <div style={{ textAlign: 'center', marginTop: 16, fontSize: 12.5, color: '#8892b0' }}>
              Default admin: <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 11.5, color: '#5b6af5' }}>admin@validator.ai</span> / <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 11.5 }}>admin123</span>
            </div>
          )}
        </Card>

        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: '#8892b0' }}>
          Your data stays in your browser · Bring your own API key
        </div>
      </div>

      {/* Disclaimer Modal */}
      {showDisclaimer && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 24 }}
          onClick={() => setShowDisclaimer(false)}>
          <div className="clay-card" style={{ maxWidth: 560, width: '100%', padding: 0, maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e8ecf5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontWeight: 800, fontSize: 16, color: '#1a1f36' }}>Terms of Use & Disclaimer</h3>
              <button onClick={() => setShowDisclaimer(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8892b0', display: 'flex' }}>
                <Icon n="x" size={18} />
              </button>
            </div>
            <div style={{ padding: '20px 24px', overflowY: 'auto', fontSize: 13, color: '#4a5278', lineHeight: 1.85 }}>
              <p><strong>1. Purpose.</strong> Validator is an AI-assisted tool for analysing job descriptions and evaluating candidate CVs. It is not a replacement for human judgment.</p><br />
              <p><strong>2. AI Limitations.</strong> All AI outputs may contain errors, inaccuracies, or biases. Every output must be reviewed by a qualified human professional before being used in any hiring decision.</p><br />
              <p><strong>3. Non-Discrimination.</strong> Users are solely responsible for ensuring their use complies with all applicable employment, equal opportunity, and anti-discrimination laws.</p><br />
              <p><strong>4. Data & Privacy.</strong> All data entered — JDs, CVs, notes — is stored in your browser's localStorage only. Validator does not transmit your data to any server other than your chosen AI provider's API.</p><br />
              <p><strong>5. API Key Responsibility.</strong> You are responsible for your own API key and any costs incurred from its use within this tool.</p><br />
              <p><strong>6. No Warranty.</strong> This tool is provided "as is" without warranty of any kind. The developers are not liable for any hiring decisions made based on its outputs.</p>
            </div>
            <div style={{ padding: '14px 24px', borderTop: '1px solid #e8ecf5', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <Btn v="ghost" sm onClick={() => setShowDisclaimer(false)}>Close</Btn>
              <Btn sm onClick={() => { set('agreedToTerms')(true); setShowDisclaimer(false); }}>
                <Icon n="check" size={13} />I Agree
              </Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
