import { Component, Input , ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';

export type StatColor = 'blue' | 'green' | 'orange' | 'red' | 'purple';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule, CardModule],
  template: `
    <p-card styleClass="stat-card">
      <div class="stat-content">
        <div class="stat-icon-wrapper" [ngClass]="'stat-icon-' + color">
          <i [class]="icon"></i>
        </div>
        <div class="stat-details">
          <span class="stat-label">{{ label }}</span>
          <span class="stat-value">{{ value }}</span>
          <span class="stat-change" [ngClass]="changeType">{{ change }}</span>
        </div>
      </div>
    </p-card>
  `,
  styles: [`
    :host { display: block; }
    .stat-card { padding: 1.25rem; }
    .stat-content { display: flex; gap: 1rem; align-items: flex-start; }
    .stat-icon-wrapper {
      width: 3.5rem; height: 3.5rem; border-radius: 12px;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .stat-icon-wrapper i { font-size: 1.5rem; }
    .stat-icon-blue   { background: var(--info-bg); }
    .stat-icon-blue i { color: var(--info); }
    .stat-icon-green   { background: color-mix(in srgb, var(--ok) 14%, transparent); }
    .stat-icon-green i { color: var(--ok); }
    .stat-icon-orange   { background: var(--warn-bg); }
    .stat-icon-orange i { color: var(--warn); }
    .stat-icon-red   { background: var(--err-bg); }
    .stat-icon-red i { color: var(--err); }
    .stat-icon-purple   { background: var(--purple-bg); }
    .stat-icon-purple i { color: var(--purple); }
    .stat-details { display: flex; flex-direction: column; }
    .stat-label { font-size: 0.875rem; color: var(--ink-3); }
    .stat-value { font-size: 2rem; font-weight: 700; color: var(--ink); line-height: 1.2; }
    .stat-change { font-size: 0.75rem; margin-top: 0.25rem; }
    .stat-change.positive { color: var(--ok); }
    .stat-change.negative { color: var(--err); }
    .stat-change.neutral  { color: var(--ink-3); }
  `]
})
export class StatCardComponent {
  @Input() label = '';
  @Input() value = '';
  @Input() change = '';
  @Input() changeType: 'positive' | 'negative' | 'neutral' = 'neutral';
  @Input() icon = 'pi pi-chart-line';
  @Input() color: StatColor = 'blue';
}