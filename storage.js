// ── Keys ──────────────────────────────────────────────────────
export const KEYS = {
  store:   'validator_store_v1',
  log:     'validator_log_v1',
  users:   'validator_users_v1',
  session: 'validator_session_v1',
  draft:   'validator_draft_v1',
};

// ── Generic LS ────────────────────────────────────────────────
export const LS = {
  get: (k, def = null) => {
    try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch { return def; }
  },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  del: (k)    => { try { localStorage.removeItem(k); } catch {} },
};

// ── JD Store ──────────────────────────────────────────────────
export const getStore = () => LS.get(KEYS.store, {});
export const setStore = (s) => { LS.set(KEYS.store, s); return s; };

export const saveJDEntry = (name, data) => {
  const s = getStore();
  s[name] = { ...s[name], ...data, name, savedAt: Date.now(), candidates: data.candidates || s[name]?.candidates || {} };
  return setStore(s);
};

export const deleteJDEntry = (name) => {
  const s = getStore(); delete s[name]; return setStore(s);
};

export const saveCandidate = (jdKey, candName, data) => {
  const s = getStore();
  if (!s[jdKey]) return s;
  s[jdKey].candidates = { ...(s[jdKey].candidates || {}), [candName]: { name: candName, ...data, savedAt: Date.now() } };
  return setStore(s);
};

export const deleteCandidate = (jdKey, candName) => {
  const s = getStore();
  if (s[jdKey]?.candidates) { delete s[jdKey].candidates[candName]; }
  return setStore(s);
};

// ── Activity log ──────────────────────────────────────────────
export const logActivity = (op, userId = null) => {
  const l = LS.get(KEYS.log, []);
  LS.set(KEYS.log, [{ op, userId, ts: Date.now() }, ...l].slice(0, 1000));
};
export const getLog   = () => LS.get(KEYS.log, []);
export const clearLog = () => LS.del(KEYS.log);

// ── Users ─────────────────────────────────────────────────────
export const getUsers   = () => LS.get(KEYS.users, {});
export const saveUser   = (u) => {
  const users = getUsers(); users[u.email] = { ...u, updatedAt: Date.now() }; LS.set(KEYS.users, users);
};
export const deleteUser = (email) => {
  const u = getUsers(); delete u[email]; LS.set(KEYS.users, u);
};

// ── Session ───────────────────────────────────────────────────
export const getSession   = ()  => LS.get(KEYS.session, null);
export const setSession   = (u) => LS.set(KEYS.session, u);
export const clearSession = ()  => LS.del(KEYS.session);

// ── Draft ─────────────────────────────────────────────────────
export const saveDraft  = (d) => LS.set(KEYS.draft, d);
export const getDraft   = ()  => LS.get(KEYS.draft, null);
export const clearDraft = ()  => LS.del(KEYS.draft);

// ── Export / Import ───────────────────────────────────────────
export const exportData = () => {
  const data = { store: getStore(), log: getLog(), exportedAt: new Date().toISOString() };
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  a.download = `validator_backup_${Date.now()}.json`;
  a.click();
};

export const importData = (jsonStr) => {
  const data = JSON.parse(jsonStr);
  if (data.store) setStore(data.store);
  return data.store || {};
};

// ── Download text ─────────────────────────────────────────────
export const dlText = (filename, content) => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([content], { type: 'text/plain' }));
  a.download = filename; a.click();
};
