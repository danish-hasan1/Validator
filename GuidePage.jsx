import { useState } from 'react';
import { Card } from '../components/UI.jsx';
import Icon from '../components/Icon.jsx';

const STEPS = [
  { icon:'🔑', title:'Step 1 — Set Your API Key', tab:'settings', openLabel:'Open Settings', color:'#5b6af5', bg:'#eef0ff',
    description:'Choose your AI provider and paste your API key. Stored only in your browser — sent directly to the provider, never via us.',
    steps:['Go to Settings → AI Provider & Model','Choose a provider — Groq and Gemini have free tiers','Select a model (the default is recommended)','Get your key from the provider console (links shown in Settings)','Paste the key and click Save Configuration'],
    tip:'Groq (Llama 3.3 70B) and Google Gemini 2.0 Flash are both free tier — great for starting with zero cost.' },
  { icon:'📋', title:'Step 2 — Set Up a Job Description', tab:'jd', openLabel:'Open Job Description', color:'#7c3aed', bg:'#f5f3ff',
    description:'The JD is the foundation. Save it once with its analysis and skill matrix — then reuse it to evaluate any number of candidates.',
    steps:['Go to Job Description','Name the JD (e.g. "Senior PM — Fintech Q1")','Paste the full JD text','Click "1. Analyse JD" — extracts intent, seniority, hiring signals','Click "2. Build Skill Matrix" — creates a 100-point scoring framework','Click Save JD — keep results visible or click New JD for another'],
    tip:'Use a Template (6 available) to pre-fill a complete JD and customise from there.',
    note:'Only .docx accepted for file uploads. PDF loses formatting — paste text directly for best results.' },
  { icon:'👤', title:'Step 3 — Evaluate a Candidate', tab:'cv', openLabel:'Open Evaluate CV', color:'#0284c7', bg:'#f0f9ff',
    description:'Score a CV against a saved JD with full depth-of-evidence inference, gap analysis, and a hiring recommendation.',
    steps:['Go to Evaluate CV','Select your saved JD from the grid','Enter the candidate name and paste their full CV text','Click "3. Score CV" — scored against the JD matrix','Click "4. Decision Snapshot" — Yes/No/Borderline + killer interview question','Click "5. Enrichment Q&A" — targeted questions for CV gaps','Use "Email Format" to export the questionnaire as a ready-to-send email','Use "View CV" to see the original while reading the evaluation','Use "Export Report" to save the full evaluation as a .txt file'],
    tip:'Results auto-save. Return to any candidate via the Previously Evaluated list. Use the search filter when the list grows.' },
  { icon:'⚖️', title:'Step 4 — Compare Candidates', tab:'compare', openLabel:'Open Compare', color:'#059669', bg:'#f0fdf4',
    description:'After scoring multiple candidates, compare them side-by-side and get a panel recommendation.',
    steps:['Go to Compare','Select the JD','Select 2 or more evaluated candidates','Click Generate Comparison Report','Review ranking, differentiators, risks, and final recommendation'],
    tip:'Works best after all shortlisted candidates are scored. The AI uses the full evaluations as input.' },
  { icon:'📊', title:'Step 5 — Manage Your Pipeline', tab:'pipeline', openLabel:'Open Pipeline', color:'#b45309', bg:'#fffbeb',
    description:'Kanban view — track candidates through your hiring funnel visually.',
    steps:['Go to Pipeline','Select a JD','Candidates appear across 4 columns: New → Shortlisted → On Hold → Rejected','Click "→ Status" buttons on each card to move candidates','Click a card to open the full evaluation'],
    tip:'Status changes in Pipeline sync instantly to the Evaluate CV view.' },
  { icon:'🔍', title:'Step 6 — LinkedIn Sourcing', tab:'linkedin', openLabel:'Open LinkedIn', color:'#0077b5', bg:'#eff8ff',
    description:'Turn any saved JD into LinkedIn Recruiter search parameters and Boolean strings.',
    steps:['Go to LinkedIn','Select a saved JD (must have run Step 1 analysis first)','Click Generate Sourcing Parameters','Copy Boolean strings into LinkedIn Recruiter\'s search field','Use Narrow for precision, Broad for discovery, Primary for balance'],
    tip:'Output includes job title variants, skill keywords, industry targets, and seniority filters tailored to your role.' },
  { icon:'📨', title:'Step 7 — Outreach & Re-Evaluation', tab:'outreach', openLabel:'Open Outreach', color:'#7c3aed', bg:'#f5f3ff',
    description:'Message candidates directly via email or WhatsApp, find their email, send enrichment Q&A, log replies, and re-evaluate updated CVs.',
    steps:[
      'Go to Outreach in the sidebar',
      'Select the JD and candidate you want to reach out to',
      'Add their email and/or WhatsApp number in Contact Details',
      'Use Email Finder if you don\'t have their email — AI infers likely formats from their name and company',
      'In Compose, pick channel (Email or WhatsApp) and message type',
      'Click "Generate with AI" for a personalised message, edit it, then click "Open in Email Client" or "Open in WhatsApp"',
      'Log the candidate\'s reply in the Thread tab to keep a full communication record',
      'When the candidate sends answers to the enrichment questionnaire, go to "Update & Re-Evaluate"',
      'Paste their answers — AI integrates them into an improved CV, then re-evaluate to see the score change',
    ],
    tip:'The "Send Q&A" message type in Compose automatically formats the enrichment questionnaire from Evaluate CV into a ready-to-send email or WhatsApp message.',
  },
];

const FAQ = [
  { q:'Which AI provider should I use?', a:'Anthropic\'s Claude Sonnet 4 gives the most accurate results. For free tiers, Groq (Llama 3.3 70B) or Google Gemini 2.0 Flash are excellent. OpenAI GPT-4o is a strong alternative. Switch at any time in Settings.' },
  { q:'Why only .docx for file uploads?', a:'PDF text extraction loses critical formatting — bullet points run together, tables collapse, and columns merge. This causes the AI to misread the CV structure. Pasting text directly (Ctrl+A in your PDF reader) gives the cleanest result.' },
  { q:'Where is my data stored?', a:'Everything — JDs, CVs, evaluations, notes, scores — is in your browser\'s localStorage only. Nothing is uploaded to any server. Export backups regularly from Settings → Export Backup.' },
  { q:'Can multiple people use the same Validator?', a:'Yes — each person registers their own account. Admins manage all accounts from Admin → Users. Each user brings their own API key and can choose their own provider.' },
  { q:'How accurate is the scoring?', a:'Validator uses the same JD analysis and skill matrix for every candidate — ensuring consistent relative scoring. The AI infers depth, ownership, and outcomes rather than just matching keywords. All scores should be reviewed by a human before any hiring decision.' },
  { q:'Can I reuse a JD for multiple candidates?', a:'Yes — this is the core design. Save a JD once and evaluate unlimited candidates against it. All results are grouped and searchable under that JD.' },
  { q:'What is the Enrichment Questionnaire?', a:'When a CV has gaps, it generates targeted questions to give the candidate a chance to clarify their experience. Questions are framed positively — never judgmental. Use "Email Format" to export as a ready-to-send email.' },
  { q:'Why should I use Compare instead of just looking at scores?', a:'Individual scores tell you how each candidate performs against the JD. Compare shows you how they perform against each other — with ranking, critical differentiators, risk assessment, and a final panel recommendation. It turns individual scores into a decision.' },
  { q:'How does the Outreach email/WhatsApp work?', a:'Validator generates personalised messages using AI and opens them in your default email client (via mailto:) or WhatsApp Web. Your messages are sent through your own accounts — Validator never sends on your behalf or stores any sent message externally. All communication logs are saved in your browser only.' },
  { q:'What is the Update & Re-Evaluate feature?', a:'After a candidate replies to the enrichment questionnaire, paste their answers into "Update & Re-Evaluate". AI integrates the answers into an improved CV, then re-scores it against the same JD. You see the before/after score change with a summary of what improved and what gaps remain.' },
];

export default function GuidePage() {
  const [openStep, setOpenStep] = useState(0);
  const [openFaq,  setOpenFaq]  = useState(null);

  return (
    <div>
      <h2 style={{ fontSize:22, fontWeight:900, color:'#1a1f36', marginBottom:4 }}>Guide & Tutorial</h2>
      <p style={{ color:'#8892b0', fontSize:13, marginBottom:28 }}>Everything you need to get set up and start evaluating effectively.</p>

      <div style={{ display:'flex', gap:6, marginBottom:24, flexWrap:'wrap' }}>
        {STEPS.map((s,i)=>(
          <button key={i} onClick={()=>setOpenStep(i)}
            style={{ display:'flex', alignItems:'center', gap:7, padding:'7px 13px', borderRadius:20, border:`1.5px solid ${openStep===i?s.color:'#dde3f0'}`, background:openStep===i?s.bg:'#f5f7fd', color:openStep===i?s.color:'#8892b0', cursor:'pointer', fontSize:12.5, fontFamily:'inherit', fontWeight:openStep===i?700:500, transition:'all .15s' }}>
            <span>{s.icon}</span>Step {i+1}
          </button>
        ))}
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:36 }}>
        {STEPS.map((s,i)=>{
          const open=openStep===i;
          return (
            <div key={i} style={{ background:'#fff', borderRadius:14, overflow:'hidden', boxShadow:open?'4px 4px 16px #c8d0e8,-3px -3px 10px #fff':'3px 3px 10px #d0d8e8,-2px -2px 7px #fff', border:`1.5px solid ${open?s.color+'44':'#e8ecf5'}`, transition:'all .2s' }}>
              <button onClick={()=>setOpenStep(open?-1:i)}
                style={{ width:'100%', padding:'16px 20px', display:'flex', alignItems:'center', gap:14, background:'none', border:'none', cursor:'pointer', fontFamily:'inherit', textAlign:'left' }}>
                <div style={{ width:40, height:40, borderRadius:12, background:s.bg, display:'grid', placeItems:'center', fontSize:20, flexShrink:0 }}>{s.icon}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:800, fontSize:14, color:'#1a1f36' }}>{s.title}</div>
                  <div style={{ fontSize:12.5, color:'#8892b0', marginTop:2 }}>{s.description}</div>
                </div>
                <Icon n={open?'chevU':'chevD'} size={18} color={open?s.color:'#c5c9fb'}/>
              </button>
              {open&&(
                <div style={{ padding:'0 20px 20px 74px', animation:'fadeIn .2s ease' }}>
                  <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:14 }}>
                    {s.steps.map((step,si)=>(
                      <div key={si} style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
                        <div style={{ width:22, height:22, borderRadius:'50%', background:s.bg, border:`2px solid ${s.color}44`, display:'grid', placeItems:'center', flexShrink:0, marginTop:2 }}>
                          <span style={{ fontSize:11, fontWeight:800, color:s.color }}>{si+1}</span>
                        </div>
                        <div style={{ fontSize:13, color:'#4a5278', lineHeight:1.65, paddingTop:2 }}>{step}</div>
                      </div>
                    ))}
                  </div>
                  {s.tip&&<div style={{ background:s.bg, border:`1px solid ${s.color}33`, borderRadius:9, padding:'10px 14px', fontSize:12.5, color:s.color, lineHeight:1.6, marginBottom:s.note?8:12 }}><strong>💡 Tip:</strong> {s.tip}</div>}
                  {s.note&&<div style={{ background:'#fff7ed', border:'1px solid #fed7aa', borderRadius:9, padding:'10px 14px', fontSize:12.5, color:'#ea580c', lineHeight:1.6, marginBottom:12 }}><strong>⚠ Note:</strong> {s.note}</div>}
                  <button onClick={()=>document.dispatchEvent(new CustomEvent('nav',{detail:s.tab}))}
                    style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'8px 16px', borderRadius:8, border:`1.5px solid ${s.color}`, background:s.bg, color:s.color, cursor:'pointer', fontSize:13, fontFamily:'inherit', fontWeight:700 }}>
                    {s.openLabel} →
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <h3 style={{ fontSize:17, fontWeight:800, color:'#1a1f36', marginBottom:16 }}>Frequently Asked Questions</h3>
      <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:36 }}>
        {FAQ.map((f,i)=>{
          const open=openFaq===i;
          return (
            <div key={i} style={{ background:'#fff', borderRadius:12, overflow:'hidden', boxShadow:'3px 3px 10px #d0d8e8,-2px -2px 7px #fff', border:'1.5px solid #e8ecf5' }}>
              <button onClick={()=>setOpenFaq(open?null:i)}
                style={{ width:'100%', padding:'14px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, background:'none', border:'none', cursor:'pointer', fontFamily:'inherit', textAlign:'left' }}>
                <span style={{ fontWeight:700, fontSize:13.5, color:'#1a1f36' }}>{f.q}</span>
                <Icon n={open?'chevU':'chevD'} size={16} color="#c5c9fb"/>
              </button>
              {open&&<div style={{ padding:'0 18px 16px', fontSize:13, color:'#4a5278', lineHeight:1.75, animation:'fadeIn .15s ease' }}>{f.a}</div>}
            </div>
          );
        })}
      </div>

      <div style={{ background:'linear-gradient(135deg,#eef0ff,#f5f3ff)', border:'1.5px solid #c5c9fb', borderRadius:16, padding:'28px 32px', textAlign:'center' }}>
        <div style={{ fontSize:32, marginBottom:10 }}>🚀</div>
        <h3 style={{ fontSize:17, fontWeight:800, color:'#1a1f36', marginBottom:6 }}>Ready to start?</h3>
        <p style={{ fontSize:13, color:'#8892b0', marginBottom:20 }}>Set your API key, create your first JD, and evaluate your first candidate.</p>
        <div style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap' }}>
          <button onClick={()=>document.dispatchEvent(new CustomEvent('nav',{detail:'settings'}))}
            style={{ padding:'10px 20px', borderRadius:10, border:'none', background:'#5b6af5', color:'#fff', cursor:'pointer', fontSize:13.5, fontFamily:'inherit', fontWeight:700, boxShadow:'0 3px 12px rgba(91,106,245,.35)', display:'inline-flex', alignItems:'center', gap:7 }}>
            <Icon n="key" size={14} color="#fff"/>Add API Key
          </button>
          <button onClick={()=>document.dispatchEvent(new CustomEvent('nav',{detail:'jd'}))}
            style={{ padding:'10px 20px', borderRadius:10, border:'1.5px solid #c5c9fb', background:'#fff', color:'#5b6af5', cursor:'pointer', fontSize:13.5, fontFamily:'inherit', fontWeight:700, display:'inline-flex', alignItems:'center', gap:7 }}>
            <Icon n="brief" size={14} color="#5b6af5"/>Set Up First JD
          </button>
        </div>
      </div>
    </div>
  );
}
