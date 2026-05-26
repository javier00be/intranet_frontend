import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { ModalComponent } from '../modal/modal.component';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [ButtonModule, ModalComponent],
  template: `
    <app-modal [(visible)]="visible" [title]="title" width="420px" (visibleChange)="onVisibleChange($event)">
      @if (visible) {
        <div class="confirm-body">
          <div class="confirm-icon">
            <i class="pi pi-exclamation-triangle"></i>
          </div>
          <p class="confirm-message">{{ message }}</p>
          <div class="confirm-footer">
            <p-button label="Cancelar" severity="secondary" [text]="true" (click)="onCancel()" />
            <p-button [label]="confirmLabel" severity="danger" (click)="onConfirm()" />
          </div>
        </div>
      }
    </app-modal>
  `,
  styles: [`
    .confirm-body {
      padding: 1.5rem 1.75rem 1.75rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      text-align: center;
    }

    .confirm-icon {
      width: 52px;
      height: 52px;
      border-radius: 50%;
      background: #fff1f2;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .confirm-icon i {
      font-size: 1.375rem;
      color: #f43f5e;
    }

    .confirm-message {
      font-size: 0.9375rem;
      color: #374151;
      margin: 0;
      line-height: 1.5;
    }

    .confirm-footer {
      display: flex;
      gap: 0.5rem;
      justify-content: center;
      padding-top: 0.25rem;
    }

    :host-context(.dark-mode) .confirm-icon { background: #4c0519; }
    :host-context(.dark-mode) .confirm-message { color: #cbd5e1; }
  `]
})
export class ConfirmModalComponent {
  @Input() visible = false;
  @Input() title = 'Confirmar acción';
  @Input() message = '¿Estás seguro de que querés continuar?';
  @Input() confirmLabel = 'Confirmar';
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  onConfirm() {
    this.confirm.emit();
    this.close();
  }

  onCancel() {
    this.cancel.emit();
    this.close();
  }

  onVisibleChange(val: boolean) {
    if (!val) this.cancel.emit();
    this.visibleChange.emit(val);
  }

  private close() {
    this.visible = false;
    this.visibleChange.emit(false);
  }
}
