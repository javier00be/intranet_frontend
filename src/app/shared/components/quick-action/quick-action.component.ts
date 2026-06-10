import { Component, Input , ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export type ActionColor = 'blue' | 'green' | 'orange' | 'purple' | 'red';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-quick-action',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <a [routerLink]="routerLink" class="quick-action">
      <div class="action-icon" [ngClass]="'action-icon-' + color">
        <i [class]="icon"></i>
      </div>
      <span class="action-label">{{ label }}</span>
      <span class="action-desc">{{ description }}</span>
    </a>
  `,
  styles: [`
    :host { display: block; }
    .quick-action {
      display: flex; flex-direction: column; align-items: center;
      padding: 1.5rem; border-radius: 12px; background: #f9fafb;
      text-decoration: none; transition: all 0.2s; cursor: pointer;
    }
    .quick-action:hover {
      background: #e0e7ff; transform: translateY(-2px);
    }
    .action-icon {
      width: 3rem; height: 3rem; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 0.75rem;
    }
    .action-icon i { font-size: 1.25rem; }
    .action-icon-blue { background: #e0e7ff; }
    .action-icon-blue i { color: #6366f1; }
    .action-icon-green { background: #d1fae5; }
    .action-icon-green i { color: #10b981; }
    .action-icon-orange { background: #fef3c7; }
    .action-icon-orange i { color: #f59e0b; }
    .action-icon-purple { background: #ede9fe; }
    .action-icon-purple i { color: #7c3aed; }
    .action-icon-red { background: #ffe4e6; }
    .action-icon-red i { color: #f43f5e; }
    .action-label { font-weight: 600; color: #111827; margin-bottom: 0.25rem; }
    .action-desc { font-size: 0.75rem; color: #6b7280; text-align: center; }

    :host-context(.dark-mode) .quick-action { background: #1e293b; }
    :host-context(.dark-mode) .quick-action:hover { background: #312e81; }
    :host-context(.dark-mode) .action-label { color: #f9fafb; }
    :host-context(.dark-mode) .action-desc { color: #9ca3af; }
  `]
})
export class QuickActionComponent {
  @Input() label = '';
  @Input() description = '';
  @Input() icon = 'pi pi-plus';
  @Input() routerLink = '';
  @Input() color: ActionColor = 'blue';
}