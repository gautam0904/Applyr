import { Injectable, signal, computed, inject } from '@angular/core';
import { JobApplication, CreateJobPayload, UpdateJobPayload, JobStatus } from '../types/job-application.type';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class JobApplicationService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = 'http://localhost:3000/api/jobs';

    private readonly _jobs = signal<JobApplication[]>([]);
    readonly jobs = this._jobs.asReadonly();
    readonly isEmpty = computed(() => this._jobs().length === 0);

    constructor() {
        this.fetchJobs();
    }

    private async fetchJobs() {
        try {
            const jobs = await lastValueFrom(this.http.get<JobApplication[]>(this.apiUrl));
            this._jobs.set(jobs);
        } catch (error) {
            console.error('Failed to fetch jobs from API, using local storage', error);
            // Fall back to local storage
            const localJobs = this.loadFromStorage();
            this._jobs.set(localJobs);
        }
    }

    async addBlankJob(): Promise<string> {
        const newJob: Partial<JobApplication> = {
            jobTitle: 'New Job',
            company: '',
            location: '',
            techStack: [],
            experience: '',
            status: JobStatus.APPLIED,
            appliedDate: new Date().toISOString().split('T')[0],
            reminderDate: '',
            linkedInUrl: '',
            resumeUrl: '',
            coverLetterUrl: '',
            poc: [],
        };
        return this.createJob(newJob as CreateJobPayload);
    }

    async createJob(payload: CreateJobPayload): Promise<string> {
        try {
            const savedJob = await lastValueFrom(this.http.post<JobApplication>(this.apiUrl, payload));
            this._jobs.update(jobs => [savedJob, ...jobs]);
            return savedJob.id;
        } catch (error) {
            console.error('Failed to create job', error);
            return '';
        }
    }

    async updateJob(payload: UpdateJobPayload): Promise<void> {
        try {
            const { id, ...data } = payload;
            const updatedJob = await lastValueFrom(this.http.patch<JobApplication>(`${this.apiUrl}/${id}`, data));
            this._jobs.update(jobs => jobs.map(j => j.id === id ? updatedJob : j));
        } catch (error) {
            console.error('Failed to update job', error);
        }
    }

    async updateJobField(id: string, field: keyof JobApplication, value: any): Promise<void> {
        try {
            const updatedJob = await lastValueFrom(this.http.patch<JobApplication>(`${this.apiUrl}/${id}`, { [field]: value }));
            this._jobs.update(jobs => jobs.map(j => j.id === id ? updatedJob : j));
        } catch (error) {
            console.error('Failed to update job field', error);
        }
    }

    async updateMultipleFields(id: string, updates: Partial<JobApplication>): Promise<void> {
        try {
            const updatedJob = await lastValueFrom(this.http.patch<JobApplication>(`${this.apiUrl}/${id}`, updates));
            this._jobs.update(jobs => jobs.map(j => j.id === id ? updatedJob : j));
        } catch (error) {
            console.error('Failed to update multiple fields', error);
        }
    }

    async deleteJob(id: string): Promise<void> {
        try {
            await lastValueFrom(this.http.delete(`${this.apiUrl}/${id}`));
            this._jobs.update(jobs => jobs.filter(j => j.id !== id));
        } catch (error) {
            console.error('Failed to delete job', error);
        }
    }

    async restoreJob(job: JobApplication): Promise<void> {
        // For restore, we recreate it on the backend
        try {
            const { id, ...data } = job;
            const restoredJob = await lastValueFrom(this.http.post<JobApplication>(this.apiUrl, data));
            this._jobs.update(jobs => [restoredJob, ...jobs]);
        } catch (error) {
            console.error('Failed to restore job', error);
        }
    }

    private loadFromStorage(): JobApplication[] {
        try {
            const raw = localStorage.getItem('jobApplications');
            if (raw) {
                return JSON.parse(raw) as JobApplication[];
            }
            return [];
        } catch {
            return [];
        }
    }
}
