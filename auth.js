import { getUsers, saveUser, getSession, setSession, clearSession } from './storage.js';
import { DEFAULT_PROVIDER, PROVIDERS } from './api.js';

export const ADMIN_EMAIL = 'admin@validator.ai';

const hashPw = (pw) => btoa(encodeURIComponent(pw + '_v1salt'));

export function registerUser({ name, email, password, apiKey, provider, model, agreedToTerms }) {
  if (!agreedToTerms) throw new Error('You must agree to the Terms of Use.');
  const users = getUsers();
  const normalEmail = email.trim().toLowerCase();
  if (users[normalEmail]) throw new Error('An account with this email already exists.');
  const user = {
    name: name.trim(),
    email: normalEmail,
    passwordHash: hashPw(password),
    apiKey: apiKey || '',
    provider: provider || DEFAULT_PROVIDER,
    model: model || PROVIDERS[provider || DEFAULT_PROVIDER]?.defaultModel || '',
    role: normalEmail === ADMIN_EMAIL ? 'admin' : 'user',
    createdAt: Date.now(),
    active: true,
  };
  saveUser(user);
  return user;
}

export function loginUser({ email, password }) {
  const users = getUsers();
  const user = users[email.trim().toLowerCase()];
  if (!user) throw new Error('No account found with this email.');
  if (!user.active) throw new Error('Your account has been deactivated. Contact the administrator.');
  if (user.passwordHash !== hashPw(password)) throw new Error('Incorrect password.');
  const session = { ...user, loggedInAt: Date.now() };
  setSession(session);
  return session;
}

export function updateProviderConfig(email, { apiKey, provider, model }) {
  const users = getUsers();
  if (!users[email]) return;
  users[email] = { ...users[email], apiKey, provider, model };
  saveUser(users[email]);
  const session = getSession();
  if (session?.email === email) setSession({ ...session, apiKey, provider, model });
}

/** Legacy shim — still works for code that only updates the key */
export function updateApiKey(email, apiKey) {
  const users = getUsers();
  if (!users[email]) return;
  users[email].apiKey = apiKey;
  saveUser(users[email]);
  const session = getSession();
  if (session?.email === email) setSession({ ...session, apiKey });
}

export function logout() { clearSession(); }
export function getCurrentUser() { return getSession(); }
export function isAdmin(user) { return user?.role === 'admin'; }

/** Seed admin account — no-op if already exists */
export function seedAdmin() {
  const users = getUsers();
  if (users[ADMIN_EMAIL]) return;
  saveUser({
    name: 'Admin',
    email: ADMIN_EMAIL,
    passwordHash: hashPw('admin123'),
    apiKey: '',
    provider: DEFAULT_PROVIDER,
    model: PROVIDERS[DEFAULT_PROVIDER].defaultModel,
    role: 'admin',
    createdAt: Date.now(),
    active: true,
  });
}

/** Build the AI config object used by callAI() */
export function getAIConfig(user) {
  const provider = user?.provider || DEFAULT_PROVIDER;
  const provDef  = PROVIDERS[provider];
  // Fall back to the current default if the stored model was removed/deprecated
  // (providers periodically retire model IDs out from under saved user configs).
  const modelIsValid = provDef?.models?.some(m => m.id === user?.model);
  return {
    provider,
    apiKey: user?.apiKey || '',
    model:  modelIsValid ? user.model : (provDef?.defaultModel || ''),
  };
}
