import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Dialog } from '@angular/cdk/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { JobApplicationService } from '../../features/job-applications/api/job-application.service';
import { JobApplicationsStore } from '../../features/job-applications/store/job-applications.store';
import {
  JobApplication,
  JobStatus,
  CreateJobPayload,
  PointOfContact
} from '../../features/job-applications/types/job-application.type';
import {
  JOB_STATUS_OPTIONS,
  JOB_STATUS_COLORS,
} from '../../features/job-applications/constants';
import { formatDateForDisplay, formatDateForInput, formatDateConsistent } from '../../features/job-applications/utils/date-format.util';
import { EmptyStateComponent } from '../../features/job-applications/components/EmptyState/EmptyState.component';
import { AddContactModalComponent } from '../../features/job-applications/components/add-contact-modal/add-contact-modal.component';

import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-job-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './job-table.html',
  styleUrl: './job-table.scss',
  imports: [
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatTooltipModule,
    MatPaginatorModule,
    EmptyStateComponent,
    ReactiveFormsModule,
  ],
})
export class JobTable {
  protected readonly service = inject(JobApplicationService);
  protected readonly store = inject(JobApplicationsStore);
  protected readonly themeService = inject(ThemeService);
  private readonly dialog = inject(Dialog);
  private readonly matDialog = inject(MatDialog);

  protected readonly statusOptions = JOB_STATUS_OPTIONS;
  protected readonly statusColors = JOB_STATUS_COLORS;
  protected readonly displayedColumns: string[] = [
    'jobTitle',
    'company',
    'location',
    'techStack',
    'status',
    'appliedDate',
    'reminderDate',
    'poc',
    'documents',
    'actions',
  ];

  // Editing state management
  protected readonly editingId = signal<string | null>(null);
  protected readonly editingField = signal<string | null>(null);
  protected readonly editingValue = signal<string>('');

  protected startEditing(id: string, field: string, currentValue: string): void {
    this.editingId.set(id);
    this.editingField.set(field);
    this.editingValue.set(currentValue);
  }

  protected saveField(id: string, field: string, value: string): void {
    // Type assertion to handle the field parameter
    this.service.updateJobField(id, field as any, value);
    this.cancelEditing();
  }

  protected cancelEditing(): void {
    this.editingId.set(null);
    this.editingField.set(null);
    this.editingValue.set('');
  }

  protected cancelEdit(): void {
    this.cancelEditing();
  }

  protected formatDate(dateStr: string): string {
    return formatDateConsistent(dateStr);
  }

  protected formatDateForEdit(dateStr: string): string {
    return formatDateForInput(dateStr);
  }

  protected getStatusColor(status: JobStatus): string {
    return this.statusColors[status] ?? '#9ca3af';
  }

  protected onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.store.setSearchTerm(value);
    this.store.setPage(0); // Reset to first page when searching
  }

  protected onStatusFilter(value: JobStatus | ''): void {
    // Legacy method - convert single value to array
    this.store.setStatusFilter(value ? [value] : []);
  }

  protected onMultiStatusFilter(value: JobStatus[]): void {
    this.store.setStatusFilter(value);
  }

  protected clearSearch(): void {
    this.store.setSearchTerm('');
  }

  protected toggleStatusFilter(status: JobStatus): void {
    const current = this.store.statusFilter();
    let updated;
    if (current.includes(status)) {
      updated = current.filter((s: JobStatus) => s !== status);
    } else {
      updated = [...current, status];
    }
    this.store.setStatusFilter(updated);
    this.store.setPage(0); // Reset to first page when filtering
  }

  protected onPageChange(event: PageEvent): void {
    this.store.setPage(event.pageIndex);
    this.store.setPageSize(event.pageSize);
  }

  protected onSort(column: string): void {
    this.store.setSort(column);
  }

  protected getSortIcon(column: string): string {
    if (this.store.sortColumn() !== column) {
      return 'unfold_more';
    }
    return this.store.sortDirection() === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }

  protected async addJob(): Promise<void> {
    const id = await this.service.addBlankJob();
    if (id) {
      // Find the job in the current list to start editing
      // Since signals are reactive, it should appear in service.jobs() soon
      // We might need a small delay or check the signal
      this.store.setPage(0);
      setTimeout(() => {
        this.startEditing(id, 'jobTitle', '');
      }, 100);
    }
  }

  protected addPOC(jobId: string): void {
    const dialogRef = this.matDialog.open(AddContactModalComponent, {
      width: '500px',
      disableClose: false,
      panelClass: 'add-contact-dialog'
    });

    dialogRef.afterClosed().subscribe((result: PointOfContact | undefined) => {
      if (result) {
        const job = this.service.jobs().find(j => j.id === jobId);
        if (job) {
          const updatedPOCs = [...job.poc, result];
          this.service.updateJobField(jobId, 'poc', updatedPOCs);
          
          // Show success toast
          this.showSuccessToast(`Contact ${result.name} added successfully`);
        }
      }
    });
  }

  protected removePOC(jobId: string, index: number): void {
    const job = this.service.jobs().find(j => j.id === jobId);
    if (!job) return;

    const updatedPOCs = job.poc.filter((_, i) => i !== index);
    this.service.updateJobField(jobId, 'poc', updatedPOCs);
  }

  protected updatePOC(jobId: string, index: number, field: string, value: string): void {
    const job = this.service.jobs().find(j => j.id === jobId);
    if (!job) return;

    const updatedPOCs = job.poc.map((p, i) => i === index ? { ...p, [field]: value } : p);
    this.service.updateJobField(jobId, 'poc', updatedPOCs);
  }

  protected onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.saveEditing();
    } else if (event.key === 'Escape') {
      this.cancelEditing();
    }
  }

  protected onTechStackKeyDown(event: KeyboardEvent, job: JobApplication): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.processTechStack(job.id);
    } else if (event.key === 'Escape') {
      this.cancelEditing();
    }
  }

  protected processTechStack(jobId: string): void {
    const value = this.editingValue() as string;
    const tags = value.split(',').map(t => t.trim()).filter(t => !!t);
    // Validate that tags aren't empty or just whitespace
    const validTags = tags.filter(tag => tag.length > 0);
    this.service.updateJobField(jobId, 'techStack', validTags);
    this.store.clearEditingCell();
  }

  protected hasLink(job: JobApplication): boolean {
    return !!(job.linkedInUrl || job.resumeUrl || job.coverLetterUrl);
  }

  protected onLinksKeyDown(event: KeyboardEvent, job: JobApplication): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.processLinks(job.id);
    } else if (event.key === 'Escape') {
      this.cancelEditing();
    }
  }

  protected processLinks(jobId: string): void {
    const value = this.editingValue() as string;
    const urls = value.split(',').map(u => u.trim()).filter(u => !!u);

    // Processing URLs - assign to respective fields
    const updates: Partial<JobApplication> = {};
    if (urls[0]) {
      if (!this.isValidUrl(urls[0])) {
        console.warn('Invalid LinkedIn URL:', urls[0]);
        return; // Don't save invalid URL
      }
      updates.linkedInUrl = urls[0];
    }
    if (urls[1]) {
      if (!this.isValidUrl(urls[1])) {
        console.warn('Invalid Resume URL:', urls[1]);
        return; // Don't save invalid URL
      }
      updates.resumeUrl = urls[1];
    }
    if (urls[2]) {
      if (!this.isValidUrl(urls[2])) {
        console.warn('Invalid Cover Letter URL:', urls[2]);
        return; // Don't save invalid URL
      }
      updates.coverLetterUrl = urls[2];
    }
    // Clear any remaining URLs that don't fit in the first three slots
    if (!urls[0]) updates.linkedInUrl = '';
    if (!urls[1]) updates.resumeUrl = '';
    if (!urls[2]) updates.coverLetterUrl = '';

    this.service.updateMultipleFields(jobId, updates);
    this.store.clearEditingCell();
  }

  protected readonly lastDeletedJob = signal<JobApplication | null>(null);
  protected readonly showUndoNotification = signal(false);
  private undoTimeout?: any;

  protected updateStatus(jobId: string, status: JobStatus): void {
    this.service.updateJobField(jobId, 'status', status);
  }

  protected deleteJob(id: string): void {
    const job = this.service.jobs().find((j) => j.id === id);
    if (!job) return;

    this.lastDeletedJob.set(job);
    this.service.deleteJob(id);
    this.showUndoNotification.set(true);

    if (this.undoTimeout) clearTimeout(this.undoTimeout);
    this.undoTimeout = setTimeout(() => {
      this.showUndoNotification.set(false);
      this.lastDeletedJob.set(null);
    }, 5000);
  }

  protected confirmDelete(job: JobApplication): void {
    // Simple delete without confirmation dialog for now
    this.deleteJob(job.id);
  }

  protected async duplicateJob(job: JobApplication): Promise<void> {
    const { id, ...data } = job;
    const newJobData: CreateJobPayload = {
      ...data,
      appliedDate: new Date().toISOString().split('T')[0],
      status: JobStatus.APPLIED,
    };

    await this.service.createJob(newJobData);
  }

  private generateId(): string {
    return `job-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  protected saveEditing(): void {
    // This method is deprecated but kept for compatibility
    this.cancelEditing();
  }

  protected showSuccessToast(message: string): void {
    // Simple console log for now - can be enhanced with a proper toast service
    console.log('✅ Success:', message);
    // Show temporary success indicator
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #10b981;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      font-family: var(--mat-sys-body-medium-font);
      font-size: var(--mat-sys-body-medium-size);
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
  }

  // Status change handlers
  protected undoDelete(): void {
    const job = this.lastDeletedJob();
    if (job) {
      this.service.restoreJob(job);
      this.showUndoNotification.set(false);
      this.lastDeletedJob.set(null);
      if (this.undoTimeout) clearTimeout(this.undoTimeout);
    }
  }
}
