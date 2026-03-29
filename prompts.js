export const PROMPTS = {
  p1: (jd) => `You are the original hiring decision-maker who authored this job description, combined with a senior talent evaluator.

Understand the JD EXACTLY as intended — not just what is written. Infer intent, priorities, and expectations. Assume the JD may be incomplete or loosely written.

## 1. Role Objective & Business Intent
- What real-world problem does this role solve?
- Why does this role exist right now?

## 2. Seniority, Scope & Ownership
- Expected seniority level (entry/mid/senior/lead/head/principal)
- Degree of ownership — task execution vs end-to-end responsibility
- Decision-making authority and independence

## 3. Primary Competencies (Critical / Must-Have)
- Capabilities without which the candidate would fail
- WHY each competency is essential

## 4. Secondary Competencies (Value-Add)
- Capabilities that strengthen the profile but are not mandatory

## 5. Implicit & Unstated Expectations
- Skills, behaviors, or experience assumed but not written

## 6. Evaluation Biases & Hiring Signals
- What will the hiring manager prioritize during CV screening?
- What will quickly disqualify a candidate?

## 7. Ideal Candidate Mental Model
- Describe the ideal candidate as if briefing a recruiter or interview panel

Job Description:
${jd}`,

  p2: (jdAnalysis) => `Convert the JD analysis below into a structured, weighted evaluation framework.

Rules: Total = exactly 100 points. Weight by actual hiring importance. Core competencies carry significantly higher weight. Depth and ownership matter more than surface exposure.

## 1. Skill & Competency Matrix
| Skill/Competency | Category | Weight | Strong Evidence | Weak Evidence |

## 2. Weighting Rationale
Explain each weight and trade-offs between overlapping skills.

## 3. Seniority Sensitivity
How do expectations shift for junior vs senior candidates?

## 4. Non-Negotiable Conditions
Competencies whose absence should trigger rejection.

On the very last line output ONLY:
SCORE_DIMENSIONS:{"dimensions":[{"name":"Skill Name","weight":N,"category":"Core"}],"total":100}

JD Analysis:
${jdAnalysis}`,

  p3: (jdAnalysis, skillMatrix, cv) => `You are a senior recruitment professional evaluating a candidate.

Principles: Infer skills from role scope and career progression. Evaluate depth, ownership, outcomes — not just tool mentions. Assume experienced professionals may omit foundational skills.

## 1. Candidate Profile Overview
Apparent seniority, domain alignment, career trajectory.

## 2. Skill-by-Skill Assessment
For EACH skill in the matrix: evidence found (explicit or inferred), strength (Strong/Moderate/Weak/Missing), points awarded with justification.

## 3. Implicit Skill Inference
Skills likely present but not listed, with reasoning.

## 4. Gaps, Risks & Constraints
Missing or weak competencies. Critical vs trainable.

## 5. Final Scoring Summary
Total score out of 100. Category-wise breakdown.

## 6. Hiring Recommendation
Strong Fit / Moderate Fit / Weak Fit / Reject — with confidence level and rationale.

## 7. Interview Focus Areas
Strengths to validate. Risk areas requiring deeper probing.

On the very last line output ONLY:
CANDIDATE_SCORE:{"total":N,"category_scores":{"Core":N,"Secondary":N,"Implicit":N},"recommendation":"Strong Fit","confidence":"High"}

JD Analysis:
${jdAnalysis}

Skill Matrix:
${skillMatrix}

Candidate CV:
${cv}`,

  p4: (cvEval) => `Answer strictly as the hiring decision-maker. Direct and decisive.

**SHORTLIST DECISION:** Yes / No / Borderline

**BIGGEST STRENGTH:**
[One specific sentence]

**BIGGEST RISK:**
[One specific sentence]

**KILLER INTERVIEW QUESTION:**
[The one question that would most quickly confirm or reject fit — and why it matters]

**OVERALL ASSESSMENT:**
[2–3 sentences maximum]

CV Evaluation:
${cvEval}`,

  p5: (jdAnalysis, skillMatrix, cvEval) => `Generate a targeted clarification questionnaire for this candidate.

Purpose: Uncover experience that may exist but wasn't expressed in the CV. NOT an assessment — an enrichment exercise.

Principles:
- Never assume incompetence — assume possible omission
- Do NOT reference scores, gaps, or evaluation language
- Avoid yes/no questions — encourage 3–6 sentence responses
- Questions should translate naturally into CV bullet points

## 1. Role-Relevant Experience Clarification
2–4 questions on critical competencies with limited evidence.

## 2. Depth, Complexity & Proficiency
2–4 questions on scale, tools, environments, maturity.

## 3. Adjacent or Transferable Experience
2–4 questions identifying equivalent experience.

## 4. Implicit Seniority & Behavioral Capabilities
2–4 questions on leadership, influence, decision-making.

## 5. Ownership, Impact & Outcomes
2–4 questions on measurable outcomes and accountability.

Number all questions sequentially. No commentary — questions only, ready to send to the candidate.

JD Analysis: ${jdAnalysis}
Skill Matrix: ${skillMatrix}
CV Evaluation: ${cvEval}`,

  p6: (jdAnalysis) => `Convert this role analysis into LinkedIn Recruiter search parameters.

## 1. Job Titles
**Primary:** ... **Variants:** ... **Adjacent:** ...

## 2. Skills & Keywords
**Core:** ... **Supporting:** ... **Transferable:** ...

## 3. Company / Industry Background
**Target sectors:** ... **Company types:** ...

## 4. Boolean Search Strings
**Primary** (balanced):
\`\`\`
[string]
\`\`\`
**Broad** (discovery):
\`\`\`
[string]
\`\`\`
**Narrow** (precision):
\`\`\`
[string]
\`\`\`

## 5. LinkedIn Recruiter Filters
**Seniority:** ... **Function:** ... **Experience:** ... **Additional:** ...

No commentary. Recruiter-ready output only.

JD Analysis:
${jdAnalysis}`,

  compare: (jdName, candidates) => `You are a senior hiring panel facilitator comparing ${candidates.length} candidates for: ${jdName}

${candidates.map((c, i) => `### ${i+1}. ${c.name}\nScore: ${c.score}/100 | ${c.recommendation}\n\n${c.eval}`).join('\n\n---\n\n')}

## 1. Ranking & Recommendation Order
Rank all ${candidates.length} candidates with clear rationale. One decisive line per candidate.

## 2. Comparative Strengths Matrix
Table showing where each candidate excels or falls short on key competencies.

## 3. Critical Differentiators
The 2–3 factors that most meaningfully separate the top candidates.

## 4. Risk Assessment by Candidate
Primary hiring risk per candidate, and how material it is.

## 5. Panel Interview Strategy
Specific focus areas per candidate to resolve remaining unknowns.

## 6. Final Hiring Recommendation
First-choice with rationale. Contingency if they decline.`,

  // Outreach: generate personalised email/WhatsApp outreach message
  outreachMsg: (jdName, candName, candTitle, type, customNote) => `You are a senior recruiter writing a personalised ${type === 'whatsapp' ? 'WhatsApp' : 'email'} outreach message.

Role: ${jdName}
Candidate: ${candName}${candTitle ? ` (${candTitle})` : ''}
${customNote ? `Recruiter note: ${customNote}` : ''}

Write a ${type === 'whatsapp' ? 'brief, warm WhatsApp message (3–4 sentences max, conversational, no bullet points)' : 'professional but warm email (subject line + body, concise, no more than 5 sentences)'}. 

Rules:
- Do NOT use generic phrases like "I came across your profile"
- Reference the role naturally
- End with a clear, low-friction call to action (reply, 15-min call, or link to apply)
- Never mention AI or that this was generated
- Sound like a real recruiter wrote it

${type === 'email' ? 'Output format:\nSUBJECT: [subject line]\n\n[email body]' : '[WhatsApp message only — no subject]'}`,

  // Email finder: infer likely email formats from candidate info
  emailFinder: (candName, context) => `You are a recruitment research specialist. Based on the candidate information below, generate the most likely professional email addresses they might use.

Candidate: ${candName}
Context: ${context}

Generate 3–5 likely email format variations based on common corporate email patterns (firstname.lastname@, firstnamelastname@, f.lastname@, etc.).

If a company or domain can be inferred from the context, use it. Otherwise use common free email domains.

Output ONLY a JSON array on the last line:
EMAIL_SUGGESTIONS:["email1@domain.com","email2@domain.com","email3@domain.com"]

Before the JSON, briefly explain your reasoning for each suggestion (2 sentences max each).`,

  // Update CV from candidate's questionnaire answers
  updateCVFromAnswers: (originalCV, questionnaire, answers) => `You are a professional CV writer. A recruiter sent a candidate these clarification questions and received answers. Your job is to incorporate the candidate's answers into their CV to produce an improved, more complete version.

Rules:
- Keep the original CV structure and formatting style
- Integrate the answers naturally into the relevant sections (don't just append them)
- Only add or expand — never remove or contradict existing content
- Use professional CV language throughout
- Do NOT add a section called "Interview Answers" — integrate seamlessly

Original CV:
${originalCV}

Questions sent to candidate:
${questionnaire}

Candidate's answers:
${answers}

Output the complete updated CV text only. No commentary before or after.`,

  // Re-evaluate with updated CV — generate score delta summary
  reEvalSummary: (oldScore, newScore, oldEval, newEval, candName) => `You are comparing two evaluations of the same candidate, ${candName}, after their CV was updated with additional information.

Previous score: ${oldScore}/100
New score: ${newScore}/100
Score change: ${newScore - oldScore > 0 ? '+' : ''}${newScore - oldScore} points

Previous evaluation summary:
${oldEval?.slice(0, 800) || 'N/A'}

New evaluation summary:
${newEval?.slice(0, 800) || 'N/A'}

Write a concise re-evaluation summary (3–5 bullet points) covering:
- What new information was revealed
- Which competencies improved and by how much
- Whether the hiring recommendation changed
- Key remaining gaps (if any)
- Updated recommendation`,
};

export const JD_TEMPLATES = [
  { name: 'Senior Product Manager', icon: '🎯', text: `We are looking for a Senior Product Manager to lead our core product initiatives. You will own the product roadmap, collaborate with engineering, design, and business stakeholders, and drive outcomes that matter to customers.\n\nResponsibilities:\n- Define and own the product vision and roadmap\n- Work closely with engineering and design to ship high-quality features\n- Conduct user research and translate insights into product decisions\n- Communicate product strategy to leadership and cross-functional teams\n- Define success metrics and track outcomes\n\nRequirements:\n- 5+ years of product management experience\n- Strong analytical and data-driven decision making\n- Experience in an agile environment\n- Excellent communication and stakeholder management\n- Prior B2B SaaS experience preferred` },
  { name: 'Engineering Manager', icon: '⚙️', text: `We are hiring an Engineering Manager to lead a team of 6–10 engineers.\n\nResponsibilities:\n- Lead, mentor, and grow a team of software engineers\n- Partner with product and design on technical direction\n- Drive engineering excellence through strong practices\n- Own hiring, performance management, and career development\n\nRequirements:\n- 3+ years of engineering management experience\n- Strong software engineering background (backend preferred)\n- Experience with distributed systems and cloud infrastructure\n- Proven ability to hire, retain, and develop talent` },
  { name: 'Data Scientist', icon: '📊', text: `We are looking for a Data Scientist to build predictive models and deliver insights.\n\nResponsibilities:\n- Build and deploy ML models for recommendation, ranking, and forecasting\n- Design and analyze A/B experiments\n- Communicate findings to non-technical stakeholders\n\nRequirements:\n- 3+ years of data science or ML experience\n- Proficiency in Python (pandas, scikit-learn, PyTorch or TensorFlow)\n- Strong statistical knowledge and experimental design\n- Experience with SQL and large-scale data processing` },
  { name: 'Head of Marketing', icon: '📣', text: `We are seeking a Head of Marketing to build and lead our marketing function.\n\nResponsibilities:\n- Define and execute go-to-market and growth strategy\n- Build and manage the marketing team\n- Own demand generation, content, SEO/SEM, and brand\n- Partner with sales to drive pipeline and revenue\n\nRequirements:\n- 8+ years marketing experience, 2+ in leadership\n- Proven track record in B2B SaaS growth marketing\n- Strong digital marketing expertise\n- Data-driven with marketing analytics experience` },
  { name: 'UX Designer', icon: '🎨', text: `We need a Senior UX Designer to own the end-to-end design of our product.\n\nResponsibilities:\n- Lead user research, ideation, prototyping, and design delivery\n- Collaborate with PMs and engineers\n- Establish and maintain a design system\n\nRequirements:\n- 5+ years UX/product design experience\n- Proficiency in Figma\n- Strong portfolio showing complex product design\n- Experience with user research and usability testing` },
  { name: 'Sales Director', icon: '💼', text: `We are hiring a Sales Director to build and lead our enterprise sales motion.\n\nResponsibilities:\n- Build and manage a team of account executives\n- Own pipeline, forecasting, and revenue targets\n- Develop sales processes and playbooks\n\nRequirements:\n- 7+ years B2B SaaS sales, 3+ in leadership\n- Track record of building and scaling sales teams\n- Experience with enterprise accounts ($100K+ ACV)` },
];
