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

**INTERVIEW KILLER QUESTION:**
[One targeted, high-signal question to probe their weakest critical skill]

Candidate Evaluation:
${cvEval}`,

  p5: (jd, cv, gaps) => `You are an expert technical interviewer.

Based on the JD and CV, identify specific competencies that are missing or weakly evidenced but critical for the role.

Generate 3-5 high-signal enrichment questions for the candidate to answer via email. 

Rules: 
- Don't "test" them; frame questions as "Help us understand your experience with..."
- Be specific to the role's actual challenges.
- Keep the email tone professional and encouraging.

Job Description:
${jd}

Candidate CV:
${cv}

Identified Gaps:
${gaps}`,

  p6: (jdAnalysis) => `Convert the JD analysis into a high-performance LinkedIn sourcing strategy.

## 1. Boolean Search Strings
- Broad (Market-wide)
- Targeted (Direct Competitors)
- Niche (Specific Skillset)

## 2. Job Title Variants
- Standard and creative variants to catch all profiles.

## 3. LinkedIn Recruiter Filters
- Skills, seniority, keywords, industries.

## 4. Ideal Profile "Lookalikes"
- Types of companies or backgrounds to target.

JD Analysis:
${jdAnalysis}`,

  p7: (jd, cv, type = 'linkedin') => `You are a world-class executive recruiter and outreach specialist.

Generate a highly personalized, conversion-focused outreach message (Type: ${type}) to the candidate below based on the Job Description.

## 1. Context & Hook
- Reference a specific achievement, skill, or role transition in their CV.
- Align it with the core mission of the role in the JD.

## 2. Value Proposition
- Why is this role a step up for them?
- What problem will they solve that matches their expertise?

## 3. Decisive Call to Action
- Low-friction next step (quick chat, specific question).

## 4. Tone & Style
- Professional, yet warm and conversational.
- No generic buzzwords. No "I hope this finds you well".
- Concise.

Job Description:
${jd}

Candidate CV:
${cv}`,

  p8: (name, company) => `Generate a list of 3 potential professional email addresses for the candidate "${name}" at "${company}". 
Format: name.surname@company.com, initials@company.com, etc.
Include a confidence score for each.`,
};

export const JD_TEMPLATES = [
  { name: 'Senior Product Manager', icon: '🎯', text: `We are looking for a Senior Product Manager to lead our core product initiatives. You will own the product roadmap, collaborate with engineering, design, and business stakeholders, and drive outcomes that matter to customers.\n\nResponsibilities:\n- Define and own the product vision and roadmap\n- Work closely with engineering and design to ship high-quality features\n- Conduct user research and translate insights into product decisions\n- Communicate product strategy to leadership and cross-functional teams\n- Define success metrics and track outcomes\n\nRequirements:\n- 5+ years of product management experience\n- Strong analytical and data-driven decision making\n- Experience in an agile environment\n- Excellent communication and stakeholder management\n- Prior B2B SaaS experience preferred` },
  { name: 'Engineering Manager', icon: '⚙️', text: `We are hiring an Engineering Manager to lead a team of 6–10 engineers.\n\nResponsibilities:\n- Lead, mentor, and grow a team of software engineers\n- Partner with product and design on technical direction\n- Drive engineering excellence through strong practices\n- Own hiring, performance management, and career development\n\nRequirements:\n- 3+ years of engineering management experience\n- Strong software engineering background (backend preferred)\n- Experience with distributed systems and cloud infrastructure\n- Proven ability to hire, retain, and develop talent` },
  { name: 'Data Scientist', icon: '📊', text: `We are looking for a Data Scientist to build predictive models and deliver insights.\n\nResponsibilities:\n- Build and deploy ML models for recommendation, ranking, and forecasting\n- Design and analyze A/B experiments\n- Communicate findings to non-technical stakeholders\n\nRequirements:\n- 3+ years of data science or ML experience\n- Proficiency in Python (pandas, scikit-learn, PyTorch or TensorFlow)\n- Strong statistical knowledge and experimental design\n- Experience with SQL and large-scale data processing` },
  { name: 'Head of Marketing', icon: '📣', text: `We are seeking a Head of Marketing to build and lead our marketing function.\n\nResponsibilities:\n- Define and execute go-to-market and growth strategy\n- Build and manage the marketing team\n- Own demand generation, content, SEO/SEM, and brand\n- Partner with sales to drive pipeline and revenue\n\nRequirements:\n- 8+ years marketing experience, 2+ in leadership\n- Proven track record in B2B SaaS growth marketing\n- Strong digital marketing expertise\n- Data-driven with marketing analytics experience` },
  { name: 'UX Designer', icon: '🎨', text: `We need a Senior UX Designer to own the end-to-end design of our product.\n\nResponsibilities:\n- Lead user research, ideation, prototyping, and design delivery\n- Collaborate with PMs and engineers\n- Establish and maintain a design system\n\nRequirements:\n- 5+ years UX/product design experience\n- Proficiency in Figma\n- Strong portfolio showing complex product design\n- Experience with user research and usability testing` },
  { name: 'Sales Director', icon: '💼', text: `We are hiring a Sales Director to build and lead our enterprise sales motion.\n\nResponsibilities:\n- Build and manage a team of account executives\n- Own pipeline, forecasting, and revenue targets\n- Develop sales processes and playbooks\n\nRequirements:\n- 7+ years B2B SaaS sales, 3+ in leadership\n- Track record of building and scaling sales teams\n- Experience with enterprise accounts ($100K+ ACV)` },
];
