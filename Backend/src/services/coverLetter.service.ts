import puppeteer from 'puppeteer';
import path from 'path';
import { ModelRouter, ModelRole } from '../utils/modelRouter.js';

export class CoverLetterService {
    constructor(private router: ModelRouter) { }

    /**
     * Generates cover letter data using AI based on resume and job description.
     */
    async generateData(
        baseResume: any,
        jobDescription: string,
        jobTitle: string,
        company: string,
        evaluation: any
    ): Promise<any> {
        console.log(`[CoverLetterService] Generating data for ${jobTitle} at ${company}...`);

        const prompt = `
You are an expert career coach and professional writer. Generate a highly tailored, persuasive cover letter.
The cover letter should highlight how the candidate's experience (from the resume) directly addresses the job requirements (from the job description) and evaluation notes.

Candidate Name: ${baseResume.basics.name}
Job Title: ${jobTitle}
Company: ${company}

Job Description:
${jobDescription}

Evaluation Insights:
Overall Score: ${evaluation.overall_score}
Missing Keywords: ${evaluation.missing_keywords?.join(', ')}
Improvement Suggestions: ${evaluation.improvement_suggestions?.join(', ')}

Resume Summary:
${baseResume.basics.summary}

Return ONLY valid JSON with this structure:
{
  "date": "string (Current Date)",
  "recipient": {
    "name": "Hiring Manager",
    "company": "${company}"
  },
  "content": {
    "salutation": "string",
    "introduction": "string",
    "body_paragraphs": ["string"],
    "closing": "string",
    "sign_off": "string"
  }
}
`;

        return this.router.callJSON(ModelRole.ENRICHMENT, prompt);
    }

    /**
     * Generates a PDF from the cover letter data using Puppeteer.
     */
    async generatePDF(data: any): Promise<string> {
        console.log('[CoverLetterService] Rendering PDF...');
        const outputPath = path.join(process.cwd(), `CoverLetter_${Date.now()}.pdf`);

        const html = this.buildHTML(data);

        const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });
        await page.pdf({ path: outputPath, format: 'A4', printBackground: true });
        await browser.close();

        return outputPath;
    }

    private buildHTML(data: any): string {
        const { date, recipient, content } = data;
        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        @page { margin: 0.8in; }
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            font-size: 11pt;
            margin: 0;
        }
        .header { margin-bottom: 30px; }
        .date { margin-bottom: 20px; }
        .recipient { margin-bottom: 30px; }
        .salutation { margin-bottom: 20px; font-weight: bold; }
        .introduction { margin-bottom: 20px; }
        .body-paragraph { margin-bottom: 20px; text-align: justify; }
        .closing { margin-bottom: 20px; }
        .sign-off { margin-top: 40px; }
    </style>
</head>
<body>
    <div class="date">${date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
    
    <div class="recipient">
        <div>${recipient?.name || 'Hiring Manager'}</div>
        <div>${recipient?.company || ''}</div>
    </div>
    
    <div class="salutation">${content?.salutation || 'Dear Hiring Manager,'}</div>
    
    <div class="introduction">${content?.introduction || ''}</div>
    
    ${(content?.body_paragraphs || []).map((p: string) => `<div class="body-paragraph">${p}</div>`).join('')}
    
    <div class="closing">${content?.closing || ''}</div>
    
    <div class="sign-off">
        <div>${content?.sign_off || 'Sincerely,'}</div>
        <br>
        <div style="font-weight: bold;">(Candidate Name)</div>
    </div>
</body>
</html>
        `;
    }
}
