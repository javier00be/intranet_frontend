import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { InputMaskModule } from 'primeng/inputmask';
import { Profesor } from '../../../core/services/profesor.service';

@Component({
  selector: 'app-profesor-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonModule, InputTextModule, SelectModule, InputMaskModule],
  template: `
    <form [formGroup]="profeForm" (ngSubmit)="onSubmit()" class="flex flex-col gap-4 pt-4">
      <div class="grid grid-cols-2 gap-4">
        <div class="flex flex-col gap-2">
          <label for="nombre" class="font-semibold text-sm">Nombres</label>
          <input pInputText id="nombre" formControlName="nombre" />
        </div>
        <div class="flex flex-col gap-2">
          <label for="apellido" class="font-semibold text-sm">Apellidos</label>
          <input pInputText id="apellido" formControlName="apellido" />
        </div>
      </div>

      <div class="flex flex-col gap-2">
        <label for="email" class="font-semibold text-sm">Correo Electrónico</label>
        <input pInputText type="email" id="email" formControlName="email" placeholder="ejemplo@colegio.edu" />
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="flex flex-col gap-2">
          <label for="telefono" class="font-semibold text-sm">Teléfono</label>
          <p-inputmask mask="999-999-999" id="telefono" formControlName="telefono" placeholder="999-999-999" />
        </div>
        <div class="flex flex-col gap-2">
          <label class="font-semibold text-sm">Especialidad</label>
          <p-select [options]="especialidades" formControlName="especialidad" placeholder="Seleccionar" />
        </div>
      </div>

      <div class="flex flex-col gap-2">
        <label for="dni" class="font-semibold text-sm">DNI / Documento</label>
        <input pInputText id="dni" formControlName="dni" />
      </div>

      <div class="flex justify-end gap-2 mt-4">
        <p-button label="Cancelar" severity="secondary" text (click)="onCancel()" />
        <p-button label="Registrar Profesor" type="submit" [disabled]="profeForm.invalid" />
      </div>
    </form>
  `
})
export class ProfesorFormComponent {
  private fb = inject(FormBuilder);
  
  @Output() save = new EventEmitter<Profesor>();
  @Output() cancel = new EventEmitter<void>();

  profeForm: FormGroup = this.fb.group({
    nombre: ['', [Validators.required]],
    apellido: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    telefono: ['', [Validators.required]],
    especialidad: ['', [Validators.required]],
    dni: ['', [Validators.required]],
    estado: ['Activo']
  });

  especialidades = [
    { label: 'Matemática', value: 'Matemática' },
    { label: 'Comunicación', value: 'Comunicación' },
    { label: 'Ciencias Naturales', value: 'Ciencias' },
    { label: 'Ciencias Sociales', value: 'Sociales' },
    { label: 'Inglés', value: 'Inglés' }
  ];

  onSubmit() {
    if (this.profeForm.valid) {
      this.save.emit(this.profeForm.value);
    }
  }

  onCancel() {
    this.cancel.emit();
  }
}
