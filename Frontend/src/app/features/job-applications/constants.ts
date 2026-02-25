import { JobStatus } from './types/job-application.type';

export const LOCAL_STORAGE_KEY = 'jobApplications';

export const JOB_STATUS_OPTIONS: JobStatus[] = [
    JobStatus.APPLIED,
    JobStatus.INTERVIEWING,
    JobStatus.OFFER,
    JobStatus.REJECTED,
    JobStatus.WITHDRAWN,
];

export const JOB_STATUS_COLORS: Record<JobStatus, string> = {
    [JobStatus.APPLIED]: '#4285f4',
    [JobStatus.INTERVIEWING]: '#f59e0b',
    [JobStatus.OFFER]: '#34d399',
    [JobStatus.REJECTED]: '#ef4444',
    [JobStatus.WITHDRAWN]: '#9ca3af',
};

export const SEED_DATA = [
    {
        id: 'seed-1',
        jobTitle: 'Senior Frontend Developer',
        company: 'Google',
        location: 'Mountain View, CA',
        techStack: ['Angular', 'TypeScript', 'RxJS', 'SCSS'],
        experience: '5+ years',
        status: JobStatus.APPLIED,
        appliedDate: '2026-02-20',
        reminderDate: '2026-03-01',
        linkedInUrl: 'https://linkedin.com/in/googler recruiter',
        resumeUrl: 'https://docs.google.com/document/d/sample-resume-1',
        coverLetterUrl: '',
        poc: [
            {
                name: 'Sarah Johnson',
                email: 'sarah.johnson@google.com',
                mobile: '+1 (650) 123-4567',
                designation: 'Technical Recruiter'
            },
            {
                name: 'Michael Chen',
                email: 'michael.chen@google.com',
                mobile: '+1 (650) 234-5678',
                designation: 'Hiring Manager'
            }
        ],
    },
    {
        id: 'seed-2',
        jobTitle: 'Full Stack Engineer',
        company: 'Microsoft',
        location: 'Redmond, WA',
        techStack: ['React', 'Node.js', 'Azure', 'TypeScript'],
        experience: '3+ years',
        status: JobStatus.INTERVIEWING,
        appliedDate: '2026-02-18',
        reminderDate: '2026-02-25',
        linkedInUrl: 'https://linkedin.com/in/ms-recruiter',
        resumeUrl: 'https://docs.google.com/document/d/sample-resume-2',
        coverLetterUrl: 'https://docs.google.com/document/d/sample-cover-2',
        poc: [
            {
                name: 'Emily Rodriguez',
                email: 'emily.rodriguez@microsoft.com',
                mobile: '+1 (425) 555-0123',
                designation: 'Recruiter'
            },
            {
                name: 'David Kim',
                email: 'david.kim@microsoft.com',
                mobile: '+1 (425) 555-0456',
                designation: 'Team Lead'
            }
        ],
    },
    {
        id: 'seed-3',
        jobTitle: 'Backend Developer',
        company: 'Amazon',
        location: 'Seattle, WA',
        techStack: ['Java', 'AWS', 'Spring Boot', 'Docker'],
        experience: '4+ years',
        status: JobStatus.OFFER,
        appliedDate: '2026-02-10',
        reminderDate: '2026-02-28',
        linkedInUrl: 'https://linkedin.com/in/amazon-hiring',
        resumeUrl: 'https://docs.google.com/document/d/sample-resume-3',
        coverLetterUrl: 'https://docs.google.com/document/d/sample-cover-3',
        poc: [
            {
                name: 'Robert Wilson',
                email: 'robert.wilson@amazon.com',
                mobile: '+1 (206) 555-0789',
                designation: 'Hiring Manager'
            }
        ],
    },
    {
        id: 'seed-4',
        jobTitle: 'DevOps Engineer',
        company: 'Netflix',
        location: 'Los Gatos, CA',
        techStack: ['Kubernetes', 'AWS', 'Terraform', 'Python'],
        experience: '4+ years',
        status: JobStatus.APPLIED,
        appliedDate: '2026-02-22',
        reminderDate: '2026-03-05',
        linkedInUrl: 'https://linkedin.com/in/netflix-recruiter',
        resumeUrl: 'https://docs.google.com/document/d/sample-resume-4',
        coverLetterUrl: '',
        poc: [
            {
                name: 'Lisa Thompson',
                email: 'lisa.thompson@netflix.com',
                mobile: '+1 (408) 555-0987',
                designation: 'Technical Recruiter'
            }
        ],
    },
    {
        id: 'seed-5',
        jobTitle: 'Data Scientist',
        company: 'Meta',
        location: 'Menlo Park, CA',
        techStack: ['Python', 'TensorFlow', 'SQL', 'AWS'],
        experience: '3+ years',
        status: JobStatus.REJECTED,
        appliedDate: '2026-01-15',
        reminderDate: '',
        linkedInUrl: 'https://linkedin.com/in/meta-hiring',
        resumeUrl: 'https://docs.google.com/document/d/sample-resume-5',
        coverLetterUrl: 'https://docs.google.com/document/d/sample-cover-5',
        poc: [
            {
                name: 'James Park',
                email: 'james.park@meta.com',
                mobile: '+1 (650) 555-0654',
                designation: 'Recruiter'
            },
            {
                name: 'Amanda Lee',
                email: 'amanda.lee@meta.com',
                mobile: '+1 (650) 555-0321',
                designation: 'Data Science Manager'
            }
        ],
    }
];
