import {
    Component,
    ChangeDetectionStrategy,
    output,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'feat-empty-state',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [MatButtonModule, MatIconModule],
    styles: `
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 64px 24px;
      text-align: center;
    }

    .empty-icon {
      width: 96px;
      height: 96px;
      border-radius: 50%;
      background: var(--mat-sys-primary-container);
      color: var(--mat-sys-on-primary-container);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 24px;

      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
      }
    }

    h2 {
      margin: 0 0 8px;
      font: var(--mat-sys-headline-small);
      color: var(--mat-sys-on-surface);
    }

    p {
      margin: 0 0 24px;
      font: var(--mat-sys-body-large);
      color: var(--mat-sys-on-surface-variant);
      max-width: 400px;
    }
  `,
    template: `
    <div class="empty-state">
      <div class="empty-icon">
        <mat-icon>work_outline</mat-icon>
      </div>
      <h2>No Job Applications Yet</h2>
      <p>You haven't added any jobs yet. Click the button below to get started tracking your applications.</p>
      <button mat-flat-button color="primary" (click)="addJobClicked.emit()">
        <mat-icon>add</mat-icon>
        Add Your First Job
      </button>
    </div>
  `,
})
export class EmptyStateComponent {
    addJobClicked = output();
}
