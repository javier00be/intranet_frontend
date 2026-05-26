import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { InputMaskModule } from 'primeng/inputmask';
import { PasswordModule } from 'primeng/password';
import { Profesor, ProfesorFormOutput } from '../../../core/services/profesor.service';

@Component({
  selector: 'app-profesor-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonModule, InputTextModule, SelectModule, InputMaskModule, PasswordModule],
  template: `
    <form [formGroup]="profeForm" (ngSubmit)="onSubmit()" class="flex flex-col gap-4 pt-4">

      @if (!editMode) {
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

        <div class="flex flex-col gap-2">
          <label class="font-semibold text-sm">Correo Electrónico</label>
          <input pInputText type="email" formControlName="email" placeholder="ejemplo@colegio.edu" />
        </div>

        <div class="flex flex-col gap-2">
          <label class="font-semibold text-sm">Contraseña temporal</label>
          <p-password formControlName="password" [feedback]="false" [toggleMask]="true" styleClass="w-full" inputStyleClass="w-full" />
        </div>
      } @else {
        <div class="info-banner">
          <i class="pi pi-user mr-2"></i>
          <span>{{ profesor?.usuario?.nombre }} {{ profesor?.usuario?.apellido }}</span>
        </div>
      }

      <div class="grid grid-cols-2 gap-4">
        <div class="flex flex-col gap-2">
          <label class="font-semibold text-sm">Teléfono</label>
          <p-inputmask mask="999-999-999" formControlName="telefono" placeholder="999-999-999" />
        </div>
        <div class="flex flex-col gap-2">
          <label class="font-semibold text-sm">Especialidad</label>
          <p-select [options]="especialidades" formControlName="especialidad" placeholder="Seleccionar" />
        </div>
      </div>

      <div class="flex justify-end gap-2 mt-4">
        <p-button label="Cancelar" severity="secondary" text (click)="onCancel()" />
        <p-button [label]="editMode ? 'Actualizar' : 'Registrar Profesor'" type="submit" [disabled]="profeForm.invalid" />
      </div>
    </form>
  `,
  styles: [`
    .info-banner {
      background: #f0f4ff;
      border: 1px solid #c7d2fe;
      border-radius: 8px;
      padding: 0.75rem 1rem;
      display: flex;
      align-items: center;
      color: #3730a3;
      font-weight: 500;
    }
  `]
})
export class ProfesorFormComponent implements OnInit {
  private fb = inject(FormBuilder);

  @Input() profesor: Profesor | null = null;
  @Output() save = new EventEmitter<ProfesorFormOutput>();
  @Output() cancel = new EventEmitter<void>();

  editMode = false;
  profeForm!: FormGroup;

  especialidades = [
    { label: 'Matemática', value: 'Matemática' },
    { label: 'Comunicación', value: 'Comunicación' },
    { label: 'Ciencias', value: 'Ciencias' },
    { label: 'Sociales', value: 'Sociales' },
    { label: 'Inglés', value: 'Inglés' },
    { label: 'Educación Física', value: 'Educación Física' },
    { label: 'Arte', value: 'Arte' }
  ];

  ngOnInit() {
    this.editMode = !!this.profesor;

    if (this.editMode) {
      this.profeForm = this.fb.group({
        telefono: [this.profesor!.telefono ?? '', [Validators.required]],
        especialidad: [this.profesor!.especialidad ?? '', [Validators.required]]
      });
    } else {
      this.profeForm = this.fb.group({
        nombre: ['', [Validators.required]],
        apellido: ['', [Validators.required]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        telefono: ['', [Validators.required]],
        especialidad: ['', [Validators.required]]
      });
    }
  }

  onSubmit() {
    if (this.profeForm.valid) {
      this.save.emit(this.profeForm.value as ProfesorFormOutput);
    }
  }

  onCancel() {
    this.cancel.emit();
  }
}
