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
      padding: 1.5rem; border-radius: 12px; background: var(--bg-2);
      text-decoration: none; transition: all 0.2s; cursor: pointer;
    }
    .quick-action:hover { background: var(--accent-soft); transform: translateY(-2px); }
    .action-icon {
      width: 3rem; height: 3rem; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 0.75rem;
    }
    .action-icon i { font-size: 1.25rem; }
    .action-icon-blue   { background: var(--info-bg); }
    .action-icon-blue i { color: var(--info); }
    .action-icon-green   { background: color-mix(in srgb, var(--ok) 14%, transparent); }
    .action-icon-green i { color: var(--ok); }
    .action-icon-orange   { background: var(--warn-bg); }
    .action-icon-orange i { color: var(--warn); }
    .action-icon-purple   { background: var(--purple-bg); }
    .action-icon-purple i { color: var(--purple); }
    .action-icon-red   { background: var(--err-bg); }
    .action-icon-red i { color: var(--err); }
    .action-label { font-weight: 600; color: var(--ink); margin-bottom: 0.25rem; }
    .action-desc  { font-size: 0.75rem; color: var(--ink-3); text-align: center; }
  `]
})
export class QuickActionComponent {
  @Input() label = '';
  @Input() description = '';
  @Input() icon = 'pi pi-plus';
  @Input() routerLink = '';
  @Input() color: ActionColor = 'blue';
}