import { ModelRouter, ModelRole } from '../utils/modelRouter.js';
const { toArr } = ModelRouter;

const VERB_POOL = [
    'Architected', 'Engineered', 'Spearheaded', 'Accelerated', 'Automated',
    'Migrated', 'Refactored', 'Coordinated', 'Established', 'Modernised',
    'Deployed', 'Resolved', 'Pioneered', 'Executed', 'Leveraged',
    'Streamlined', 'Launched', 'Reduced', 'Increased', 'Integrated',
    'Collaborated', 'Designed', 'Delivered', 'Optimised', 'Built',
    'Shipped', 'Expanded', 'Boosted', 'Eliminated', 'Consolidated',
];

const BANNED = [
    'proven track record', 'extensive experience', 'results-driven', 'versatile',
    'team player', 'responsible for', 'helped', 'assisted', 'proactive',
    'problem solving', 'dynamic', 'passionate', 'detail-oriented', 'self-starter',
    'maintained', 'developed', 'implemented',
].map(w => `"${w}"`).join(', ');

const QUANT_GUIDE = `
QUANTIFICATION RULES (non-negotiable):
- Every bullet MUST contain at least one number, metric, or measurable outcome.
- Use formats like: "by X%", "X+ users", "from X to Y", "in X weeks", "X req/sec", "team of X".
- If the original has no number, use a realistic plausible one (e.g. "~30%", "5+ engineers").
- Zero unquantified bullets allowed.`;

const VERB_RULES = `
ACTION VERB RULES (non-negotiable):
- Every bullet must start with a UNIQUE action verb — no verb used more than once across all bullets.
- Verbs pool: ${VERB_POOL.join(', ')}.
- FORBIDDEN verbs: Developed, Implemented, Maintained, Improved, Managed, Created, Used, Worked.`;

export class ResumeOptimizerService {
    constructor(
        private router: ModelRouter,
        private callGroq: (prompt: string, json: boolean) => Promise<string>,
    ) { }

    private async run(original: string, prompt: string, section: string, isJson: boolean): Promise<any> {
        const groqResult = await this.callGroq(prompt, isJson);

        const validated = await this.router.callText(ModelRole.VALIDATION, `
QA check for resume section "${section}".
Original content: ${original}
AI-generated content: ${groqResult}

Tasks:
1. Remove any hallucinations (facts not in original).
2. Ensure every bullet starts with a unique action verb.
3. Ensure every bullet contains a number or metric.
4. Fix any formatting issues.

Return ONLY the corrected final content — no preamble, no explanation.`);

        if (!isJson) return validated.trim();

        try { return JSON.parse(validated); }
        catch {
            try { return JSON.parse(groqResult); }
            catch { return JSON.parse(original); }
        }
    }

    async summary(text: string, evaluation: any, jd: string, keywords: any): Promise<string> {
        const jobTitle = String(keywords.role_seniority || 'Full Stack Engineer');
        return this.run(text, `
Rewrite this resume professional summary for maximum ATS score.

STRICT RULES:
1. First words MUST be the exact job title: "${jobTitle}"
2. Include these hard skills naturally: ${toArr(keywords.tech_stack).slice(0, 7).join(', ')}
3. Include these soft skills: ${toArr(keywords.soft_skills).join(', ')}
4. Include exactly TWO quantified achievements (e.g. "reduced latency by 40%", "delivered 8 features")
5. 55-75 words total
6. BANNED phrases: ${BANNED}
7. No personal pronouns (I, my, we)
8. Missing keywords to include: ${toArr(evaluation.missing_keywords).slice(0, 5).join(', ')}
9. OUTPUT: Single paragraph of flowing prose. NO bullet points, NO asterisks, NO dashes, NO lists.

Current summary: ${text}
Job Description: ${jd}

Return ONLY the rewritten summary as a single plain-text paragraph.`, 'Professional Summary', false);
    }

    async skills(skills: any[], evaluation: any, jd: string, keywords: any): Promise<any[]> {
        const missingSoft = toArr(evaluation.missing_soft_skills).length
            ? toArr(evaluation.missing_soft_skills)
            : toArr(keywords.soft_skills);

        return this.run(JSON.stringify(skills), `
Rewrite resume skills section for ATS.

STRICT RULES:
1. Same JSON array structure: [{name, keywords:[]}]
2. Most JD-relevant categories first
3. Add missing hard skills ONLY if truthful: ${toArr(evaluation.missing_keywords).join(', ')}
4. MUST have a category named "Soft Skills" containing: ${missingSoft.join(', ')}
5. Remove skills irrelevant to the JD

Current skills: ${JSON.stringify(skills)}
Job Description: ${jd}

Return JSON array only — same structure as input.`, 'Technical Skills', true);
    }

    async optimizeWorkEntry(entry: any, evalNote: string, jd: string, keywords: any): Promise<any> {
        return this.run(JSON.stringify(entry), `
Rewrite this work experience entry for maximum ATS score.

${QUANT_GUIDE}
${VERB_RULES}

ADDITIONAL RULES:
- Keep company name, job title, startDate, endDate UNCHANGED
- 8-10 bullet points total
- Include keywords: ${toArr(keywords.tech_stack).slice(0, 6).join(', ')}
- Weave in context: ${toArr(keywords.soft_skills).join(', ')}
- BANNED phrases: ${BANNED}
- Mention API development or RESTful services in at least 2 bullets

Evaluator notes to address: ${evalNote}
Entry: ${JSON.stringify(entry)}
Job Description: ${jd}

Return complete updated JSON object only.`, 'Work Experience', true);
    }

    async optimizeProjectEntry(proj: any, evalNote: string, jd: string, keywords: any): Promise<any> {
        return this.run(JSON.stringify(proj), `
Rewrite this project for ATS. Keep name and dates UNCHANGED.

${QUANT_GUIDE}
${VERB_RULES}

ADDITIONAL RULES:
- description: 1-2 sentences of plain prose, include ${toArr(keywords.tech_stack).slice(0, 4).join(', ')}
- highlights: array of 3-5 plain strings — each MUST be a plain string like "Reduced load time by 35%"
- CRITICAL: highlights must be ["string", "string"] NOT [{"text": "string"}]
- Each highlight must start with a unique verb and contain a number/metric
- BANNED: ${BANNED}

Evaluator notes: ${evalNote}
Project: ${JSON.stringify(proj)}
Job Description: ${jd}

Return complete updated JSON object only. highlights must be a plain string array.`, 'Project Entry', true);
    }

    async awards(awards: any[], jd: string): Promise<any[]> {
        if (!awards?.length) return awards;
        return this.run(JSON.stringify(awards), `
Optimise awards section for ATS. Keep relevant awards, add brief relevance context if missing.
Awards: ${JSON.stringify(awards)}
Job Description: ${jd}
Return JSON array only.`, 'Awards', true);
    }

    private computeCurrentYears(work: any[]): number {
        if (!work?.length) return 0;
        const now = new Date();
        let totalMs = 0;
        for (const job of work) {
            const start = job.startDate ? new Date(job.startDate) : null;
            if (!start) continue;
            const end = (job.endDate && job.endDate.toLowerCase() !== 'present')
                ? new Date(job.endDate) : now;
            totalMs += Math.max(0, end.getTime() - start.getTime());
        }
        return totalMs / (1000 * 60 * 60 * 24 * 365.25);
    }

    async restructureTimeline(
        work: any[],
        projects: any[],
        requiredYears: number,
        keywords: any,
        jd: string,
    ): Promise<{ work: any[]; projects: any[] }> {
        const currentYears = this.computeCurrentYears(work);
        const techStack = toArr(keywords.tech_stack).slice(0, 10).join(', ');
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;

        let detailLevel: string;
        let minBullets: number;
        if (requiredYears <= 3) {
            detailLevel = 'This is a JUNIOR role. Include MORE project details, responsibilities, and technical depth to fill the page.';
            minBullets = 6;
        } else if (requiredYears <= 6) {
            detailLevel = 'This is a MID-LEVEL role. Balance between technical detail and achievements.';
            minBullets = 5;
        } else {
            detailLevel = 'This is a SENIOR role (8+ years). Highlight impactful achievements, leadership contributions, and architecture decisions. Show progression.';
            minBullets = 4;
        }

        const prompt = `
You are an expert resume engineer. Restructure the work experience and projects to match EXACTLY ${requiredYears} years of total experience.

CURRENT STATE:
- Current total experience: ${currentYears.toFixed(1)} years
- Required experience: ${requiredYears} years
- Current date: ${currentYear}-${String(currentMonth).padStart(2, '0')}
- JD Tech Stack: ${techStack}

EXISTING WORK ENTRIES:
${JSON.stringify(work, null, 2)}

EXISTING PROJECTS:
${JSON.stringify(projects, null, 2)}

CRITICAL RULES:
1. ALL work entries MUST use company name "Navin Infotech" — no exceptions.
2. The timeline must cover EXACTLY ${requiredYears} years backward from ${currentYear}-${String(currentMonth).padStart(2, '0')} (present).
3. The most recent role MUST have endDate = "Present".
4. Split the timeline into 2-3 natural role progressions (e.g. Junior → Mid → Senior).
   - Example for 5 years: "2021-03 to 2023-06" and "2023-06 to Present"
   - Example for 8 years: "2018-01 to 2020-06", "2020-06 to 2023-01", "2023-01 to Present"
5. NO GAPS between roles — each role's startDate must equal the previous role's endDate.
6. Dates must be in YYYY-MM-DD format.
7. Position titles should show progression (e.g. Software Engineer → Senior Software Engineer → Lead Engineer).
8. ${detailLevel}
9. **EVERY work entry MUST have at least ${minBullets} bullet points in "highlights". NO EMPTY ENTRIES. This is NON-NEGOTIABLE.**
10. The SENIOR/most-recent role should have ${minBullets + 2}-${minBullets + 3} bullets. Earlier roles should have ${minBullets}-${minBullets + 1} bullets.
11. Every bullet in highlights MUST:
   - Start with a UNIQUE strong action verb
   - Contain at least one metric or number
   - Align with the JD technologies: ${techStack}
12. Projects should align with JD tech stack. Keep ${Math.min(projects.length, requiredYears <= 3 ? 3 : 2)} projects maximum.
13. Project highlights must be plain string arrays like ["Did X by Y%"], NOT objects. Each project must have 3-5 highlights.
14. Use content from the original entries as inspiration — do NOT invent unrelated technologies.
15. The resume FIRST PAGE must appear FULL and complete — no sparse sections, no empty roles.

JOB DESCRIPTION:
${jd.slice(0, 2000)}

Return ONLY valid JSON:
{
  "work": [{ "company": "Navin Infotech", "position": "string", "startDate": "YYYY-MM-DD", "endDate": "YYYY-MM-DD or Present", "location": "string", "highlights": ["string"] }],
  "projects": [{ "name": "string", "description": "string", "highlights": ["string"], "url": "string" }]
}`;

        console.log(`[OptimizerService] Restructuring timeline: ${currentYears.toFixed(1)}yr → ${requiredYears}yr`);

        try {
            const result = await this.run(
                JSON.stringify({ work, projects }),
                prompt,
                'Timeline Restructuring',
                true,
            );

            const newWork = Array.isArray(result.work) ? result.work : work;
            const newProjects = Array.isArray(result.projects) ? result.projects : projects;

            for (const entry of newWork) {
                entry.company = 'Navin Infotech';
                if (!Array.isArray(entry.highlights)) entry.highlights = [];
                entry.highlights = entry.highlights.map((h: any) =>
                    typeof h === 'string' ? h : (h?.text ?? h?.description ?? String(h))
                );
            }

            for (const proj of newProjects) {
                if (!Array.isArray(proj.highlights)) proj.highlights = [];
                proj.highlights = proj.highlights.map((h: any) =>
                    typeof h === 'string' ? h : (h?.text ?? h?.description ?? String(h))
                );
            }

            // Post-validation: fill any work entry that has fewer than minBullets
            for (const entry of newWork) {
                if (entry.highlights.length < minBullets) {
                    console.warn(`[OptimizerService] Work entry "${entry.position}" has only ${entry.highlights.length} bullets — generating more`);
                    try {
                        const fillResult = await this.router.callJSON(ModelRole.ENRICHMENT, `
Generate ${minBullets + 2} strong bullet points for this work experience entry.
The role is "${entry.position}" at "Navin Infotech" from ${entry.startDate} to ${entry.endDate}.
Tech stack from JD: ${techStack}

Rules:
- Each bullet MUST start with a unique strong action verb (Architected, Engineered, Spearheaded, etc.)
- Each bullet MUST contain at least one metric or number
- Align with the JD technologies
- BANNED words: Developed, Implemented, Maintained, Helped, Assisted

Existing bullets to keep: ${JSON.stringify(entry.highlights)}

Return JSON: { "highlights": ["string", "string", ...] }`);
                        if (fillResult?.highlights?.length) {
                            entry.highlights = [
                                ...entry.highlights,
                                ...fillResult.highlights.map((h: any) =>
                                    typeof h === 'string' ? h : String(h)
                                ),
                            ].slice(0, minBullets + 2);
                        }
                    } catch { }
                }
            }

            return { work: newWork, projects: newProjects };
        } catch (err: any) {
            console.error(`[OptimizerService] Timeline restructure failed: ${err.message} — using originals`);
            return { work, projects };
        }
    }

    async optimizeAll(resume: any, evaluation: any, jd: string, keywords: any): Promise<any> {
        console.log('[OptimizerService] Starting optimization pipeline...');
        const t0 = Date.now();

        const requiredYears = Number(keywords.required_experience_years) || 3;
        const { work: restructuredWork, projects: restructuredProjects } =
            await this.restructureTimeline(resume.work, resume.projects, requiredYears, keywords, jd);
        const summaryEval = evaluation._sections?.summary ?? evaluation;
        const skillsEval = evaluation._sections?.skills ?? evaluation;
        const workEval = evaluation._sections?.work ?? [];
        const projectsEval = evaluation._sections?.projects ?? [];

        const workPromises = restructuredWork.map((entry: any, i: number) => {
            const evalNote = toArr(workEval[i]?.improvement_suggestions).join('; ');
            return this.optimizeWorkEntry(entry, evalNote, jd, keywords);
        });
        const projectPromises = restructuredProjects.map((proj: any, i: number) => {
            const evalNote = toArr(projectsEval[i]?.improvement_suggestions).join('; ');
            return this.optimizeProjectEntry(proj, evalNote, jd, keywords);
        });

        const [
            optimizedSummary,
            optimizedSkills,
            optimizedWork,
            optimizedProjects,
            optimizedAwards,
        ] = await Promise.all([
            this.summary(resume.basics.summary, summaryEval, jd, keywords),
            this.skills(resume.skills, skillsEval, jd, keywords),
            Promise.all(workPromises),
            Promise.all(projectPromises),
            this.awards(resume.awards ?? [], jd),
        ]);

        console.log(`[OptimizerService] All sections optimized in ${Date.now() - t0}ms`);

        return {
            ...resume,
            basics: { ...resume.basics, summary: optimizedSummary },
            skills: optimizedSkills,
            work: optimizedWork,
            projects: optimizedProjects,
            awards: optimizedAwards,
        };
    }
}