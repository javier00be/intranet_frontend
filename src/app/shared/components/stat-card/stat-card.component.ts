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
    .stat-icon-blue { background: #e0e7ff; }
    .stat-icon-blue i { color: #6366f1; }
    .stat-icon-green { background: #d1fae5; }
    .stat-icon-green i { color: #10b981; }
    .stat-icon-orange { background: #fef3c7; }
    .stat-icon-orange i { color: #f59e0b; }
    .stat-icon-red { background: #ffe4e6; }
    .stat-icon-red i { color: #f43f5e; }
    .stat-icon-purple { background: #ede9fe; }
    .stat-icon-purple i { color: #7c3aed; }
    .stat-details { display: flex; flex-direction: column; }
    .stat-label { font-size: 0.875rem; color: #6b7280; }
    .stat-value { font-size: 2rem; font-weight: 700; color: #111827; line-height: 1.2; }
    .stat-change { font-size: 0.75rem; margin-top: 0.25rem; }
    .stat-change.positive { color: #10b981; }
    .stat-change.negative { color: #f43f5e; }
    .stat-change.neutral { color: #6b7280; }

    :host-context(.dark-mode) .stat-value { color: #f9fafb; }
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