import { Component, EventEmitter, Input, Output , ChangeDetectionStrategy } from '@angular/core';
import { DialogModule } from 'primeng/dialog';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-modal',
  standalone: true,
  imports: [DialogModule],
  template: `
    <p-dialog
      [(visible)]="visible"
      (visibleChange)="visibleChange.emit($event)"
      [modal]="true"
      [draggable]="false"
      [resizable]="false"
      [showHeader]="false"
      [style]="{ width: width }"
      [contentStyle]="{ padding: '0', borderRadius: '14px', overflow: 'hidden' }"
      styleClass="app-modal-dialog">

      <div class="shell">
        <div class="shell-header">
          <div class="shell-titles">
            <h2 class="shell-title">{{ title }}</h2>
            @if (subtitle) {
              <p class="shell-subtitle">{{ subtitle }}</p>
            }
          </div>
          <button class="shell-close" (click)="doClose()">
            <i class="pi pi-times"></i>
          </button>
        </div>
        <ng-content />
      </div>

    </p-dialog>
  `,
  styles: [`
    .shell {
      background: var(--card-bg);
      border-radius: 14px;
      overflow: hidden;
    }

    .shell-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 1.375rem 1.75rem 0;
    }

    .shell-titles { display: flex; flex-direction: column; }

    .shell-title {
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--ink);
      margin: 0;
      letter-spacing: -0.01em;
    }

    .shell-subtitle {
      font-size: 0.8125rem;
      color: var(--ink-4);
      margin: 0.2rem 0 0;
    }

    .shell-close {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      border: 1px solid var(--line);
      background: var(--card-bg);
      color: var(--ink-4);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8125rem;
      flex-shrink: 0;
      transition: all 0.15s;
    }

    .shell-close:hover { background: var(--bg-2); color: var(--ink-2); }
  `]
})
export class ModalComponent {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() visible = false;
  @Input() width = '520px';
  @Output() visibleChange = new EventEmitter<boolean>();

  doClose() {
    this.visible = false;
    this.visibleChange.emit(false);
  }
}
