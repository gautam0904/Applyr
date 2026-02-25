export enum JobStatus {
  APPLIED = 'Applied',
  INTERVIEWING = 'Interviewing',
  OFFER = 'Offer',
  REJECTED = 'Rejected',
  WITHDRAWN = 'Withdrawn',
}

export interface PointOfContact {
  name: string;
  email: string;
  mobile: string;
  designation: string;
}

export interface JobApplication {
  id: string;
  jobTitle: string;
  company: string;
  location: string;
  techStack: string[];
  experience: string;
  status: JobStatus;
  appliedDate: string; // stored as YYYY-MM-DD
  reminderDate: string; // stored as YYYY-MM-DD or ''
  linkedInUrl: string;
  resumeUrl: string;
  coverLetterUrl: string;
  poc: PointOfContact[];
}

export interface CreateJobPayload {
  jobTitle: string;
  company: string;
  location: string;
  techStack: string[];
  experience: string;
  status: JobStatus;
  appliedDate: string;
  reminderDate: string;
  linkedInUrl: string;
  resumeUrl: string;
  coverLetterUrl: string;
  poc: PointOfContact[];
}

export interface UpdateJobPayload extends CreateJobPayload {
  id: string;
}
