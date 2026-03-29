# Validator — AI Recruiting Intelligence

A production-grade, multi-provider AI platform for analysing job descriptions, scoring CVs, comparing candidates, and building LinkedIn sourcing strings. Built with React + Vite.

**Live workflow:** Landing page → Register/Login → Set up JD → Evaluate CVs → Compare → Decide

---

## Quick Start

```bash
git clone https://github.com/Arsheen5106/Validator.git
cd Validator
npm install
npm run dev
# Opens landing.html at http://localhost:5173/landing.html
# App runs at http://localhost:5173/
```

Default admin: `admin@validator.ai` / `admin123`

---

## Supported AI Providers

| Provider | Models | Key Source |
|---|---|---|
| **Anthropic** (default) | Claude Sonnet 4, Opus 4.5, Haiku 4.5 | console.anthropic.com |
| **OpenAI** | GPT-4o, GPT-4o Mini, GPT-4 Turbo, o1 Mini | platform.openai.com |
| **Groq** | Llama 3.3 70B, Llama 3.1 8B, Mixtral 8x7B | console.groq.com (free tier) |
| **Google Gemini** | Gemini 2.0 Flash, 1.5 Pro | aistudio.google.com (free tier) |
| **Mistral** | Mistral Large, Small, Mixtral 8x22B | console.mistral.ai |
| **Alibaba Qwen** | Qwen Max, Plus, Turbo, Qwen 2.5 72B | dashscope.aliyuncs.com |

Switch provider at any time in Settings. All providers use streaming. Your key is stored only in your browser.

---

## Features

| Module | Description |
|---|---|
| **Landing Page** | Marketing page with hero, features, testimonials, CTA |
| **Auth** | Register/Login with provider selection, terms acceptance |
| **JD Analysis** | Extract hiring intent, seniority, must-haves from any JD |
| **Skill Matrix** | Auto-build 100-point weighted scoring framework |
| **CV Evaluation** | Score candidates with depth inference, gaps, recommendation |
| **Decision Snapshot** | Yes/No/Borderline + killer interview question |
| **Enrichment Q&A** | Targeted questionnaire for candidates with CV gaps |
| **Compare** | Side-by-side panel report for 2–10 candidates |
| **Pipeline** | Kanban board (New → Shortlisted → On Hold → Rejected) |
| **LinkedIn Sourcing** | Boolean strings + Recruiter filters from JD |
| **Admin** | User management, activity log, global score overview |
| **Guide** | Interactive step-by-step tutorial + FAQ |

---

## File Structure

```
Validator/
├── landing.html              ← Marketing/landing page
├── index.html                ← React app entry point
├── vite.config.js            ← Multi-page Vite config
├── package.json
└── src/
    ├── App.jsx               ← Router + sidebar + auth guard
    ├── index.css             ← Clay morphism light theme
    ├── lib/
    │   ├── api.js            ← Multi-provider AI client (6 providers)
    │   ├── auth.js           ← Login/register/session + provider config
    │   ├── prompts.js        ← All 6 AI prompts + 6 JD templates
    │   └── storage.js        ← localStorage helpers + export/import
    ├── components/
    │   ├── Icon.jsx          ← 40+ SVG icons
    │   └── UI.jsx            ← Shared component library
    └── pages/
        ├── AuthPage.jsx      ← Login + Register + Terms + Provider picker
        ├── SetupJDPage.jsx   ← JD analysis + skill matrix + templates
        ├── EvaluateCVPage.jsx← Step-by-step CV workflow
        ├── ComparePage.jsx   ← Multi-candidate comparison
        ├── PipelinePage.jsx  ← Kanban board
        ├── LinkedInPage.jsx  ← Sourcing builder
        ├── AdminPage.jsx     ← User management + analytics
        ├── SettingsPage.jsx  ← Provider/API key + backup
        └── GuidePage.jsx     ← Interactive tutorial + FAQ
```

---

## Build for Production

```bash
npm run build
# Output: dist/
#   dist/landing.html   ← landing page
#   dist/index.html     ← React app
```

Deploy the `dist/` folder to any static host (Vercel, Netlify, GitHub Pages).

---

## Privacy & Data

- All data (JDs, CVs, evaluations) stored in **browser localStorage only**
- API keys sent **directly to your chosen provider** — never via any server
- Export backups from Settings → Export Backup

---

## Disclaimer

AI outputs must be reviewed by a human before any hiring decision. Validator is a decision-support tool. Users are responsible for compliance with applicable employment laws.

---

MIT License
