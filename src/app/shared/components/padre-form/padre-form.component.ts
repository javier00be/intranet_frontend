import { Component, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputMaskModule } from 'primeng/inputmask';
import { PasswordModule } from 'primeng/password';
import { TooltipModule } from 'primeng/tooltip';
import { Padre, PadreFormOutput } from '../../../core/services/padre.service';
import { DniService } from '../../../core/services/dni.service';

@Component({
  selector: 'app-padre-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonModule, InputTextModule, InputMaskModule, PasswordModule, TooltipModule],
  template: `
    <form [formGroup]="padreForm" (ngSubmit)="onSubmit()" class="flex flex-col gap-4 pt-4">

      @if (!editMode) {
        <div class="flex flex-col gap-2">
          <label class="font-semibold text-sm">
            DNI
            @if (dniLoading()) {
              <i class="pi pi-spin pi-spinner" style="color:#6366f1;font-size:0.75rem;margin-left:0.25rem"></i>
            } @else {
              <i class="pi pi-info-circle" style="color:#9ca3af;font-size:0.75rem;margin-left:0.25rem"
                pTooltip="Al completar 8 dígitos se autocompletan los nombres"></i>
            }
          </label>
          <p-inputmask mask="99999999" formControlName="dni"
            placeholder="45678901" (onComplete)="buscarDni()" />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-2">
            <label class="font-semibold text-sm">Nombres</label>
            <input pInputText formControlName="nombre" />
          </div>
          <div class="flex flex-col gap-2">
            <label class="font-semibold text-sm">Apellidos</label>
            <input pInputText formControlName="apellido" />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-2">
            <label class="font-semibold text-sm">Correo Electrónico</label>
            <input pInputText type="email" formControlName="email" placeholder="ejemplo@correo.com" />
          </div>
          <div class="flex flex-col gap-2">
            <label class="font-semibold text-sm">Contraseña temporal</label>
            <p-password formControlName="password" [feedback]="false" [toggleMask]="true" styleClass="w-full" inputStyleClass="w-full" />
          </div>
        </div>
      } @else {
        <div class="info-banner">
          <i class="pi pi-user mr-2"></i>
          <span>{{ padre?.usuario?.nombre }} {{ padre?.usuario?.apellido }}</span>
        </div>
      }

      <div class="flex flex-col gap-2">
        <label class="font-semibold text-sm">Teléfono</label>
        <p-inputmask mask="999-999-999" formControlName="telefono" placeholder="999-999-999" />
      </div>

      <div class="flex justify-end gap-2 mt-4">
        <p-button label="Cancelar" severity="secondary" text (click)="onCancel()" />
        <p-button [label]="editMode ? 'Actualizar' : 'Registrar Padre'" type="submit" [disabled]="padreForm.invalid" />
      </div>
    </form>
  `,
  styles: [`
    .info-banner {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 8px;
      padding: 0.75rem 1rem;
      display: flex;
      align-items: center;
      color: #166534;
      font-weight: 500;
    }
  `]
})
export class PadreFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dniService = inject(DniService);

  @Input() padre: Padre | null = null;
  @Output() save = new EventEmitter<PadreFormOutput>();
  @Output() cancel = new EventEmitter<void>();

  editMode = false;
  dniLoading = signal(false);
  padreForm!: FormGroup;

  ngOnInit() {
    this.editMode = !!this.padre;

    if (this.editMode) {
      this.padreForm = this.fb.group({
        telefono: [this.padre!.telefono ?? '', [Validators.required]]
      });
    } else {
      this.padreForm = this.fb.group({
        dni:      [''],
        nombre:   ['', [Validators.required]],
        apellido: ['', [Validators.required]],
        email:    ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        telefono: ['', [Validators.required]]
      });
    }
  }

  buscarDni(): void {
    const dni = this.padreForm.get('dni')?.value?.replace(/_/g, '');
    if (dni?.length !== 8) return;
    this.dniLoading.set(true);
    this.dniService.buscar(dni).subscribe({
      next: (data) => {
        this.padreForm.patchValue({
          nombre:   this.dniService.toTitleCase(data.nombres),
          apellido: this.dniService.toTitleCase(data.apellidoPaterno)
                  + ' ' + this.dniService.toTitleCase(data.apellidoMaterno)
        });
        this.dniLoading.set(false);
      },
      error: () => this.dniLoading.set(false)
    });
  }

  onSubmit() {
    if (this.padreForm.valid) {
      const { dni, ...rest } = this.padreForm.value;
      this.save.emit(rest as PadreFormOutput);
    }
  }

  onCancel() {
    this.cancel.emit();
  }
}
