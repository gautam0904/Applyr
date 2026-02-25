import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { PointOfContact } from '../../types/job-application.type';

@Component({
  selector: 'app-add-contact-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
  ],
  template: `
    <div class="modal-container">
      <div class="modal-header">
        <h2>Add New Contact</h2>
        <button mat-icon-button (click)="closeModal()">
          <mat-icon>close</mat-icon>
        </button>
      </div>
      
      <div class="modal-content">
        <form (ngSubmit)="saveContact()" #contactForm="ngForm">
          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Name *</mat-label>
            <input matInput [(ngModel)]="contactData.name" name="name" required 
                   placeholder="Enter contact name" #nameInput="ngModel">
            <mat-error *ngIf="nameInput.invalid && nameInput.touched">
              Name is required
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Email *</mat-label>
            <input matInput [(ngModel)]="contactData.email" name="email" type="email" required
                   placeholder="Enter email address" #emailInput="ngModel"
                   pattern="^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$">
            <mat-error *ngIf="emailInput.invalid && emailInput.touched">
              Please enter a valid email address
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Mobile Number</mat-label>
            <input matInput [(ngModel)]="contactData.mobile" name="mobile"
                   placeholder="Enter mobile number" #mobileInput="ngModel">
          </mat-form-field>

          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Designation *</mat-label>
            <mat-select [(ngModel)]="contactData.designation" name="designation" required
                        #designationInput="ngModel">
              <mat-option value="Recruiter">Recruiter</mat-option>
              <mat-option value="Hiring Manager">Hiring Manager</mat-option>
              <mat-option value="HR">HR</mat-option>
              <mat-option value="Technical Lead">Technical Lead</mat-option>
              <mat-option value="Director">Director</mat-option>
              <mat-option value="Team Lead">Team Lead</mat-option>
              <mat-option value="VP Engineering">VP Engineering</mat-option>
            </mat-select>
            <mat-error *ngIf="designationInput.invalid && designationInput.touched">
              Designation is required
            </mat-error>
          </mat-form-field>

          <div class="modal-actions">
            <button mat-button type="button" (click)="closeModal()" class="cancel-btn">
              Cancel
            </button>
            <button mat-flat-button color="primary" type="submit" 
                    [disabled]="!contactData.name || !contactData.email || !contactData.designation"
                    class="save-btn">
              Save Contact
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .modal-container {
      min-width: 400px;
      max-width: 500px;
      padding: 0;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 24px 24px 16px;
      border-bottom: 1px solid var(--mat-sys-outline-variant);
    }

    .modal-header h2 {
      margin: 0;
      font: var(--mat-sys-headline-small);
      color: var(--mat-sys-on-surface);
    }

    .modal-content {
      padding: 24px;
    }

    .form-field {
      width: 100%;
      margin-bottom: 16px;
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid var(--mat-sys-outline-variant);
    }

    .cancel-btn {
      color: var(--mat-sys-on-surface-variant);
    }

    .save-btn {
      background: var(--mat-sys-primary);
      color: var(--mat-sys-on-primary);
    }

    .save-btn:disabled {
      background: var(--mat-sys-outline-variant);
      color: var(--mat-sys-on-surface-variant);
    }
  `]
})
export class AddContactModalComponent {
  private readonly dialogRef = inject(MatDialogRef<AddContactModalComponent>);
  
  protected contactData = {
    name: '',
    email: '',
    mobile: '',
    designation: ''
  };

  protected closeModal(): void {
    this.dialogRef.close();
  }

  protected saveContact(): void {
    if (this.contactData.name && this.contactData.email && this.contactData.designation) {
      const newContact: PointOfContact = {
        name: this.contactData.name.trim(),
        email: this.contactData.email.trim(),
        mobile: this.contactData.mobile.trim(),
        designation: this.contactData.designation
      };
      this.dialogRef.close(newContact);
    }
  }
}