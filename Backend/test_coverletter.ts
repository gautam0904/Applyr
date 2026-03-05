import { CoverLetterService } from './src/services/coverLetter.service.js';
import { ModelRouter } from './src/utils/modelRouter.js';

async function run() {
    console.log('Testing CoverLetterService (PDF Generation Only)...');

    // 1. Initialize dependencies
    const router = new ModelRouter(['dummy-key']); // We won't use it
    const coverLetterService = new CoverLetterService(router);

    // 2. Mock Data for PDF
    const mockCoverLetterData = {
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        recipient: {
            name: "Hiring Manager",
            company: "Tech Innovations Inc."
        },
        content: {
            salutation: "Dear Hiring Manager,",
            introduction: "I am writing to express my strong interest in the Senior Backend Engineer position at Tech Innovations Inc.",
            body_paragraphs: [
                "With over 5 years of experience in designing and implementing scalable backend systems, I am confident in my ability to contribute to your core platform team. At my previous role, I successfully led the migration of our monolithic application to a microservices architecture using Node.js and AWS, resulting in a 40% reduction in response times.",
                "I am particularly drawn to Tech Innovations Inc.'s commitment to leveraging cutting-edge cloud infrastructure. My expertise aligns perfectly with your requirements for optimizing database performance and building robust APIs."
            ],
            closing: "Thank you for considering my application. I look forward to the opportunity to discuss how my skills and experiences can benefit your team.",
            sign_off: "Sincerely,"
        }
    };

    try {
        // 4. Test generatePDF
        console.log('\n--- Testing generatePDF ---');
        console.log('Using mock data:', mockCoverLetterData);
        const pdfPath = await coverLetterService.generatePDF(mockCoverLetterData);
        console.log('PDF generated successfully at:', pdfPath);

        console.log('\nTest completed successfully.');
    } catch (error) {
        console.error('\nTest failed:', error);
    }
}

run();
