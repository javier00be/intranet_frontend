import { Component, Input, Output, EventEmitter , ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  template: `
    <div class="page-header">
      <div class="header-content">
        <h1>{{ title }}</h1>
        <p *ngIf="subtitle">{{ subtitle }}</p>
      </div>
      <div class="header-actions" *ngIf="showActions">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styles: [`
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
    }
    .header-content h1 {
      font-size: 1.75rem;
      font-weight: 700;
      margin: 0;
      color: #111827;
    }
    .header-content p {
      color: #6b7280;
      margin: 0.5rem 0 0;
    }
    .header-actions {
      display: flex;
      gap: 0.5rem;
    }

    :host-context(.dark-mode) .header-content h1 {
      color: #f9fafb;
    }
    :host-context(.dark-mode) .header-content p {
      color: #9ca3af;
    }
  `]
})
export class PageHeaderComponent {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() showActions = true;
}