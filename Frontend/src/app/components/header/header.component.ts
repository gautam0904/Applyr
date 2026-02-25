import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
  ],
  template: `
    <header class="app-header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="app-title">Job Application Tracker</h1>
          <div class="app-subtitle">Manage your job applications efficiently</div>
        </div>
        
        <div class="header-right">
          <button 
            mat-icon-button 
            class="theme-toggle"
            (click)="toggleTheme()"
            [matTooltip]="themeService.theme() === 'light' ? 'Switch to dark mode' : 'Switch to light mode'"
            matTooltipPosition="below">
            <mat-icon>{{ themeService.theme() === 'light' ? 'dark_mode' : 'light_mode' }}</mat-icon>
          </button>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .app-header {
      background: var(--mat-sys-surface);
      border-bottom: 1px solid var(--mat-sys-outline-variant);
      padding: 16px 0;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .header-content {
      max-width: 1400px;
      margin: 0 auto;
      padding: 0 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .header-left {
      flex: 1;
    }

    .app-title {
      margin: 0 0 4px 0;
      font: var(--mat-sys-headline-medium);
      color: var(--mat-sys-on-surface);
      font-weight: 600;
    }

    .app-subtitle {
      font: var(--mat-sys-body-medium);
      color: var(--mat-sys-on-surface-variant);
      opacity: 0.8;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .theme-toggle {
      background: var(--mat-sys-surface-variant);
      color: var(--mat-sys-on-surface-variant);
      border-radius: 12px;
      width: 40px;
      height: 40px;
      transition: all 0.2s ease;
    }

    .theme-toggle:hover {
      background: var(--mat-sys-primary);
      color: var(--mat-sys-on-primary);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
    }

    .theme-toggle mat-icon {
      font-size: 20px;
    }

    @media (max-width: 768px) {
      .header-content {
        padding: 0 16px;
        flex-direction: column;
        gap: 16px;
        text-align: center;
      }
      
      .app-title {
        font: var(--mat-sys-headline-small);
      }
      
      .header-right {
        position: absolute;
        right: 16px;
        top: 16px;
      }
    }
  `]
})
export class HeaderComponent {
  protected readonly themeService = inject(ThemeService);
  
  protected toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}