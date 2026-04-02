/**
 * Multi-provider AI API client with streaming support.
 * Supported providers: anthropic | openai | groq | gemini | mistral | qwen
 */

// ── Provider Definitions ──────────────────────────────────────
export const PROVIDERS = {
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic',
    logo: '🟣',
    keyPrefix: 'sk-ant-',
    keyPlaceholder: 'sk-ant-api03-...',
    keyHint: 'Get your key at console.anthropic.com → API Keys',
    keyLabel: 'Anthropic API Key',
    models: [
      { id: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4 (Recommended)', note: '~$0.003/eval' },
      { id: 'claude-opus-4-5',          label: 'Claude Opus 4.5 (Most capable)',  note: '~$0.015/eval' },
      { id: 'claude-haiku-4-5-20251001',label: 'Claude Haiku 4.5 (Fastest)',      note: '~$0.001/eval' },
    ],
    defaultModel: 'claude-sonnet-4-20250514',
    color: '#7c3aed',
    bg: '#f5f3ff',
  },
  openai: {
    id: 'openai',
    name: 'OpenAI',
    logo: '🟢',
    keyPrefix: 'sk-',
    keyPlaceholder: 'sk-proj-...',
    keyHint: 'Get your key at platform.openai.com → API Keys',
    keyLabel: 'OpenAI API Key',
    models: [
      { id: 'gpt-4o',           label: 'GPT-4o (Recommended)', note: '~$0.005/eval' },
      { id: 'gpt-4o-mini',      label: 'GPT-4o Mini (Fast)',    note: '~$0.001/eval' },
      { id: 'gpt-4-turbo',      label: 'GPT-4 Turbo',          note: '~$0.01/eval'  },
      { id: 'o1-mini',          label: 'o1 Mini',               note: '~$0.003/eval' },
    ],
    defaultModel: 'gpt-4o',
    color: '#16a34a',
    bg: '#f0fdf4',
  },
  groq: {
    id: 'groq',
    name: 'Groq',
    logo: '⚡',
    keyPrefix: 'gsk_',
    keyPlaceholder: 'gsk_...',
    keyHint: 'Get your key at console.groq.com → API Keys (free tier available)',
    keyLabel: 'Groq API Key',
    models: [
      { id: 'llama-3.3-70b-versatile',     label: 'Llama 3.3 70B (Recommended)', note: 'Free tier' },
      { id: 'llama-3.1-8b-instant',        label: 'Llama 3.1 8B (Fastest)',       note: 'Free tier' },
      { id: 'mixtral-8x7b-32768',          label: 'Mixtral 8x7B',                 note: 'Free tier' },
      { id: 'gemma2-9b-it',               label: 'Gemma 2 9B',                   note: 'Free tier' },
    ],
    defaultModel: 'llama-3.3-70b-versatile',
    color: '#ea580c',
    bg: '#fff7ed',
  },
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    logo: '🔵',
    keyPrefix: 'AIza',
    keyPlaceholder: 'AIzaSy...',
    keyHint: 'Get your key at aistudio.google.com → Get API Key',
    keyLabel: 'Google AI Studio Key',
    models: [
      { id: 'gemini-2.0-flash',           label: 'Gemini 2.0 Flash (Recommended)', note: 'Free tier' },
      { id: 'gemini-2.0-flash-lite',      label: 'Gemini 2.0 Flash Lite (Fastest)', note: 'Free tier' },
      { id: 'gemini-1.5-pro',             label: 'Gemini 1.5 Pro',                 note: '~$0.007/eval' },
    ],
    defaultModel: 'gemini-2.0-flash',
    color: '#0284c7',
    bg: '#f0f9ff',
  },
  mistral: {
    id: 'mistral',
    name: 'Mistral',
    logo: '🌊',
    keyPrefix: '',
    keyPlaceholder: 'your-mistral-key...',
    keyHint: 'Get your key at console.mistral.ai → API Keys',
    keyLabel: 'Mistral API Key',
    models: [
      { id: 'mistral-large-latest',   label: 'Mistral Large (Recommended)', note: '~$0.004/eval' },
      { id: 'mistral-small-latest',   label: 'Mistral Small (Fast)',         note: '~$0.001/eval' },
      { id: 'open-mixtral-8x22b',     label: 'Mixtral 8x22B',               note: '~$0.006/eval' },
    ],
    defaultModel: 'mistral-large-latest',
    color: '#d97706',
    bg: '#fffbeb',
  },
  qwen: {
    id: 'qwen',
    name: 'Alibaba Qwen',
    logo: '🔷',
    keyPrefix: 'sk-',
    keyPlaceholder: 'sk-...',
    keyHint: 'Get your key at dashscope.aliyuncs.com → API Keys',
    keyLabel: 'DashScope API Key',
    models: [
      { id: 'qwen-max',       label: 'Qwen Max (Recommended)', note: '~$0.002/eval' },
      { id: 'qwen-plus',      label: 'Qwen Plus (Balanced)',    note: '~$0.001/eval' },
      { id: 'qwen-turbo',     label: 'Qwen Turbo (Fast)',       note: 'Free tier'    },
      { id: 'qwen2.5-72b-instruct', label: 'Qwen 2.5 72B',     note: '~$0.002/eval' },
    ],
    defaultModel: 'qwen-max',
    color: '#2563eb',
    bg: '#eff6ff',
  },
};

export const PROVIDER_LIST = Object.values(PROVIDERS);
export const DEFAULT_PROVIDER = 'anthropic';

// ── Streaming helpers ─────────────────────────────────────────

async function streamSSE(res, onChunk) {
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let full = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    for (const line of dec.decode(value).split('\n')) {
      if (!line.startsWith('data: ')) continue;
      const d = line.slice(6).trim();
      if (d === '[DONE]') continue;
      try {
        const p = JSON.parse(d);
        // OpenAI / Groq / Mistral / Qwen format
        const delta = p.choices?.[0]?.delta?.content;
        // Anthropic format
        const antDelta = p.type === 'content_block_delta' ? p.delta?.text : null;
        const chunk = delta ?? antDelta;
        if (chunk) { full += chunk; onChunk(full); }
      } catch {}
    }
  }
  return full;
}

// ── Anthropic ─────────────────────────────────────────────────
async function callAnthropic(apiKey, model, prompt, onChunk) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'messages-2023-12-15',
    },
    body: JSON.stringify({ model, max_tokens: 4000, stream: true, messages: [{ role: 'user', content: prompt }] }),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error?.message || `Anthropic API error ${res.status}`); }
  return streamSSE(res, onChunk);
}

// ── OpenAI-compatible (OpenAI, Groq, Mistral, Qwen) ──────────
async function callOpenAICompat(endpoint, apiKey, model, prompt, onChunk, extraHeaders = {}) {
  const res = await fetch(`${endpoint}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}`, ...extraHeaders },
    body: JSON.stringify({ model, stream: true, max_tokens: 4000, messages: [{ role: 'user', content: prompt }] }),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error?.message || `API error ${res.status}`); }
  return streamSSE(res, onChunk);
}

// ── Google Gemini ─────────────────────────────────────────────
async function callGemini(apiKey, model, prompt, onChunk) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${apiKey}&alt=sse`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: 4000 } }),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error?.message || `Gemini API error ${res.status}`); }
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let full = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    for (const line of dec.decode(value).split('\n')) {
      if (!line.startsWith('data: ')) continue;
      const d = line.slice(6).trim();
      try {
        const p = JSON.parse(d);
        const chunk = p.candidates?.[0]?.content?.parts?.[0]?.text;
        if (chunk) { full += chunk; onChunk(full); }
      } catch {}
    }
  }
  return full;
}

// ── Main dispatcher ───────────────────────────────────────────
/**
 * Call the AI API for the given provider config.
 * @param {{ provider: string, apiKey: string, model: string }} config
 * @param {string} prompt
 * @param {function} onChunk
 */
export async function callAI(config, prompt, onChunk) {
  const { provider = DEFAULT_PROVIDER, apiKey, model } = config;
  const provDef = PROVIDERS[provider];
  if (!provDef) throw new Error(`Unknown provider: ${provider}`);
  const resolvedModel = model || provDef.defaultModel;

  switch (provider) {
    case 'anthropic':
      return callAnthropic(apiKey, resolvedModel, prompt, onChunk);
    case 'openai':
      return callOpenAICompat('https://api.openai.com/v1', apiKey, resolvedModel, prompt, onChunk);
    case 'groq':
      return callOpenAICompat('https://api.groq.com/openai/v1', apiKey, resolvedModel, prompt, onChunk);
    case 'mistral':
      return callOpenAICompat('https://api.mistral.ai/v1', apiKey, resolvedModel, prompt, onChunk);
    case 'qwen':
      return callOpenAICompat(
        'https://dashscope-intl.aliyuncs.com/compatible-mode/v1',
        apiKey, resolvedModel, prompt, onChunk,
        { 'X-DashScope-SSE': 'enable' }
      );
    case 'gemini':
      return callGemini(apiKey, resolvedModel, prompt, onChunk);
    default:
      throw new Error(`Provider "${provider}" not yet supported.`);
  }
}

// ── Legacy shim — keeps old callClaude() calls working ────────
export async function callClaude(apiKey, prompt, onChunk) {
  return callAnthropic(apiKey, PROVIDERS.anthropic.defaultModel, prompt, onChunk);
}

// ── Parsers ───────────────────────────────────────────────────
export const parseScore = (t) => {
  const m = t?.match(/CANDIDATE_SCORE:(\{[^\n]+\})/);
  try { return m ? JSON.parse(m[1]) : null; } catch { return null; }
};

export const stripMeta = (t) =>
  (t || '')
    .replace(/CANDIDATE_SCORE:\{[^\n]+\}/g, '')
    .replace(/SCORE_DIMENSIONS:\{[^\n]+\}/g, '')
    .trim();
