import puppeteer from 'puppeteer';
import path from 'path';

export class ResumePDFService {
    private fmt(d: string) {
        if (!d) return '';
        if (d.toLowerCase() === 'present') return 'Present';
        const dt = new Date(d);
        return isNaN(dt.getTime()) ? d : dt.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
    }

    private str(val: any): string {
        if (!val) return '';
        if (typeof val === 'string') return val.trim();
        if (typeof val === 'object') {
            // AI sometimes returns {text: "..."} or {bullet: "..."} objects
            const candidate = val.text ?? val.bullet ?? val.content ?? val.description ?? val.value ?? '';
            return String(candidate).trim();
        }
        return String(val).trim();
    }

    private highlights(arr: any[]): string[] {
        if (!Array.isArray(arr)) return [];
        return arr.map(h => this.str(h)).filter(h => h.length > 0);
    }

    private cleanSummary(text: string): string {
        return text
            .replace(/^\s*[\*\-•]\s*/gm, '')
            .replace(/\n+/g, ' ')
            .trim();
    }

    private mapData(resume: any) {
        const basics = resume.basics ?? {};
        const loc = basics.location;
        return {
            name: this.str(basics.name),
            label: this.str(basics.label),
            email: this.str(basics.email),
            phone: this.str(basics.phone),
            location: typeof loc === 'string' ? loc : loc ? [loc.city, loc.region, loc.countryCode].filter(Boolean).join(', ') : '',
            url: this.str(basics.url),
            profiles: basics.profiles ?? [],
            summary: this.cleanSummary(this.str(basics.summary)),
            skills: resume.skills ?? [],
            work: resume.work ?? [],
            projects: resume.projects ?? [],
            education: resume.education ?? [],
            awards: resume.awards ?? [],
            certificates: resume.certificates ?? [],
        };
    }

    private contactLine(r: ReturnType<typeof this.mapData>) {
        const parts: string[] = [];
        if (r.email) parts.push(r.email);
        if (r.phone) parts.push(r.phone);
        if (r.location) parts.push(r.location);
        const linkedin = r.profiles.find((p: any) =>
            p.network?.toLowerCase().includes('linkedin') || p.url?.toLowerCase().includes('linkedin'));
        if (linkedin?.url) parts.push(`<a href="${this.str(linkedin.url)}">LinkedIn</a>`);
        if (r.url) parts.push(`<a href="${r.url}">${r.url}</a>`);
        const portfolio = r.profiles.find((p: any) =>
            ['portfolio', 'github', 'website'].includes((p.network ?? '').toLowerCase()));
        if (portfolio?.url && portfolio.url !== r.url)
            parts.push(`<a href="${this.str(portfolio.url)}">${this.str(portfolio.network)}</a>`);
        return parts.join(' &nbsp;|&nbsp; ');
    }

    private buildHTML(resume: any) {
        const r = this.mapData(resume);
        const fmt = this.fmt.bind(this);

        return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"/>
<style>
  @page{margin:0.5in 0.6in}
  *{box-sizing:border-box}
  body{font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;margin:0;color:#000;line-height:1.45;font-size:11px;-webkit-print-color-adjust:exact}
  h1{font-size:20px;margin:0 0 2px;text-align:center;font-weight:700;letter-spacing:0.5px}
  .lbl{font-size:12px;color:#333;text-align:center;margin-bottom:3px}
  .contact{font-size:10.5px;color:#222;text-align:center;margin-bottom:12px}
  .contact a{color:#000;text-decoration:underline}
  .sec{margin-top:13px}
  .sec-title{font-size:11px;font-weight:700;border-bottom:1.5px solid #000;padding-bottom:2px;margin-bottom:7px;text-transform:uppercase;letter-spacing:1px}
  .entry{margin-bottom:9px}
  .row{display:flex;justify-content:space-between;font-weight:700;font-size:11px}
  .sub{font-size:10.5px;color:#333;margin-bottom:2px}
  ul{margin:2px 0 5px 15px;padding:0;list-style-type:disc}
  li{margin-bottom:2px;font-size:10.5px;text-align:left}
  .skill{margin-bottom:4px;font-size:10.5px;text-align:left}
  p{margin:0;font-size:10.5px;text-align:left}
</style>
</head><body>
  <h1>${r.name}</h1>
  ${r.label ? `<div class="lbl">${r.label}</div>` : ''}
  <div class="contact">${this.contactLine(r)}</div>

  ${r.summary ? `<div class="sec"><div class="sec-title">Professional Summary</div><p>${r.summary}</p></div>` : ''}

  ${r.work.length ? `<div class="sec"><div class="sec-title">Professional Experience</div>${r.work.map((j: any) => `
  <div class="entry">
    <div class="row"><span>${j.company ?? j.name}</span><span>${j.location ?? ''}</span></div>
    <div class="sub"><strong>${j.position}</strong> | ${fmt(j.startDate)} – ${j.endDate ? fmt(j.endDate) : 'Present'}</div>
    ${j.summary ? `<p style="margin-bottom:3px">${j.summary}</p>` : ''}
    ${j.highlights?.length ? `<ul>${j.highlights.map((h: string) => `<li>${h}</li>`).join('')}</ul>` : ''}
  </div>`).join('')}</div>` : ''}

  ${r.projects.length ? `<div class="sec"><div class="sec-title">Projects</div>${r.projects.map((p: any) => `
  <div class="entry">
    <div class="row"><span>${p.name}</span>${p.url ? `<a href="${p.url}" style="font-size:10px;font-weight:normal">Link</a>` : ''}</div>
    ${p.description ? `<p style="margin-bottom:3px">${p.description}</p>` : ''}
    ${p.highlights?.length ? `<ul>${p.highlights.map((h: string) => `<li>${h}</li>`).join('')}</ul>` : ''}
  </div>`).join('')}</div>` : ''}

  ${r.skills.length ? `<div class="sec"><div class="sec-title">Skills</div>${r.skills.map((s: any) => `
  <div class="skill"><strong>${s.name ?? s.category}:</strong> ${(s.keywords ?? s.skills ?? []).join(', ')}</div>`).join('')}</div>` : ''}

  ${r.education.length ? `<div class="sec"><div class="sec-title">Education</div>${r.education.map((e: any) => `
  <div class="entry">
    <div class="row"><span>${e.institution ?? ''}</span><span>${e.endDate ? fmt(e.endDate) : fmt(e.startDate ?? '')}</span></div>
    <div class="sub">${e.studyType ?? ''}${e.area ? ' in ' + e.area : ''}${e.gpa ? ' | GPA: ' + e.gpa : ''}</div>
  </div>`).join('')}</div>` : ''}

  ${r.certificates.length ? `<div class="sec"><div class="sec-title">Certifications</div><ul>${r.certificates.map((c: any) => `<li>${c.name}${c.issuer ? ' — ' + c.issuer : ''}${c.date ? ' (' + fmt(c.date) + ')' : ''}</li>`).join('')}</ul></div>` : ''}

  ${r.awards.length ? `<div class="sec"><div class="sec-title">Awards</div><ul>${r.awards.map((a: any) => `<li>${a.title}${a.awarder ? ' — ' + a.awarder : ''}${a.date ? ' (' + fmt(a.date) + ')' : ''}</li>`).join('')}</ul></div>` : ''}
</body></html>`;
    }

    async generate(resumeJSON: any): Promise<string> {
        const outputPath = path.join(process.cwd(), 'output.pdf');
        const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
        const page = await browser.newPage();
        await page.setContent(this.buildHTML(resumeJSON), { waitUntil: 'networkidle0' });
        await page.pdf({ path: outputPath, format: 'A4', printBackground: true });
        await browser.close();
        return outputPath;
    }
}