# Validator — AI Recruiting Intelligence

A production-grade, multi-provider AI platform for analysing job descriptions, scoring CVs, comparing candidates, sourcing from LinkedIn, and managing candidate outreach. Built with React + Vite. All data stays in your browser.

**Live workflow:** Landing page → Register → Set up JD → Evaluate CVs → Compare → Pipeline → Outreach → Close

---

## Quick Start

```bash
git clone https://github.com/danish-hasan1/Validator.git
cd Validator
npm install
npm run dev
# Opens landing.html at http://localhost:5173/landing.html
# App runs at http://localhost:5173/
```

Default admin: `admin@validator.ai` / `admin123`

---

## Supported AI Providers (6 total)

| Provider | Models | Key Source | Cost |
|---|---|---|---|
| **Anthropic** (default) | Claude Sonnet 4, Opus 4.5, Haiku 4.5 | console.anthropic.com | ~$0.003–0.015/eval |
| **OpenAI** | GPT-4o, GPT-4o Mini, GPT-4 Turbo, o1 Mini | platform.openai.com | ~$0.001–0.01/eval |
| **Groq** | Llama 3.3 70B, Llama 3.1 8B, Mixtral 8x7B, Gemma 2 9B | console.groq.com | **Free tier** |
| **Google Gemini** | Gemini 2.0 Flash, 2.0 Flash Lite, 1.5 Pro | aistudio.google.com | **Free tier** |
| **Mistral** | Mistral Large, Small, Mixtral 8x22B | console.mistral.ai | ~$0.001–0.006/eval |
| **Alibaba Qwen** | Qwen Max, Plus, Turbo, Qwen 2.5 72B | dashscope.aliyuncs.com | ~$0.001–0.002/eval |

Switch provider at any time in Settings. Your key is stored only in your browser — sent directly to the provider.

---

## Modules

| Module | Description |
|---|---|
| **Landing Page** | Marketing page with hero, features, testimonials, provider strip, CTA |
| **Auth** | Register/Login with provider selector, terms acceptance, disclaimer |
| **Job Description** | Analyse JD → extract intent, build 100-pt skill matrix → save for reuse |
| **Evaluate CV** | Score candidates with depth inference, gap analysis, decision snapshot, enrichment Q&A |
| **Compare** | Side-by-side panel report for 2–10 candidates with AI ranking |
| **Pipeline** | Kanban board — New → Shortlisted → On Hold → Rejected |
| **LinkedIn Sourcing** | Boolean search strings + Recruiter filters from JD analysis |
| **Outreach** | Email/WhatsApp messaging, email finder, communication thread, CV update from answers, re-evaluation |
| **Admin** | User management, activity log, score overview, CSV export |
| **Guide** | Interactive 7-step tutorial + FAQ |

---

## Outreach Module

The Outreach module lets you manage end-to-end candidate communication:

- **Compose** — AI generates personalised email or WhatsApp messages. Three types: Outreach, Send Q&A (sends the enrichment questionnaire), Custom. Opens `mailto:` or `wa.me/` with pre-filled content.
- **Thread** — Full communication log per candidate. Log candidate replies, mark sent/replied, track status.
- **Email Finder** — AI infers likely email addresses from candidate name and company context.
- **Update & Re-Evaluate** — Paste candidate's answers to Q&A → AI integrates into improved CV → Re-evaluate to see score change with delta summary.

Access Outreach directly from:
- The "Outreach" button in Evaluate CV (step 2 action bar)
- The "✉ Outreach" button on every Pipeline kanban card

---

## File Structure

```
Validator/
├── landing.html              ← Marketing page
├── index.html                ← React app entry
├── vite.config.js            ← Multi-page Vite config
├── package.json
└── src/
    ├── App.jsx               ← Router + responsive sidebar + auth
    ├── index.css             ← Clay morphism light theme + mobile responsive
    ├── lib/
    │   ├── api.js            ← Multi-provider AI client (6 providers, streaming)
    │   ├── auth.js           ← Login/register/session + provider config
    │   ├── prompts.js        ← All AI prompts (JD analysis, CV scoring, outreach, etc.)
    │   └── storage.js        ← localStorage helpers + messages + CV history
    ├── components/
    │   ├── ErrorBoundary.jsx ← Runtime error catch with reload UI
    │   ├── Icon.jsx          ← 50+ SVG icons
    │   └── UI.jsx            ← Shared component library
    └── pages/
        ├── AuthPage.jsx      ← Login + Register + provider picker + terms
        ├── SetupJDPage.jsx   ← JD analysis + skill matrix + templates + delete
        ├── EvaluateCVPage.jsx← Step-by-step CV evaluation with CV reference panel
        ├── ComparePage.jsx   ← Multi-candidate comparison with AI panel report
        ├── PipelinePage.jsx  ← Kanban board with quick-move and outreach shortcuts
        ├── LinkedInPage.jsx  ← Boolean sourcing string generator
        ├── OutreachPage.jsx  ← Full candidate communication system
        ├── AdminPage.jsx     ← User management + analytics + CSV export
        ├── SettingsPage.jsx  ← Provider/model/API key + password change + backup
        └── GuidePage.jsx     ← Interactive 7-step tutorial + FAQ
```

---

## Build & Deploy

```bash
npm run build
# Output: dist/
#   dist/landing.html   ← landing page
#   dist/index.html     ← React app
```

Deploy `dist/` to any static host (Vercel, Netlify, GitHub Pages).

---

## Privacy

- All data (JDs, CVs, evaluations, messages) stored in **browser localStorage only**
- API keys sent **directly to your chosen AI provider** — never via any third-party server
- Export backups anytime: Settings → Export Backup

---

## AI Disclaimer

All AI outputs must be reviewed by a human before any hiring decision. Validator is a decision-support tool. Users are responsible for compliance with applicable employment and anti-discrimination laws.

---

MIT License
