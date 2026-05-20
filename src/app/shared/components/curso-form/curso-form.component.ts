import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { Curso } from '../../../core/services/curso.service';

@Component({
  selector: 'app-curso-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonModule, InputTextModule, SelectModule],
  template: `
    <form [formGroup]="cursoForm" (ngSubmit)="onSubmit()" class="flex flex-col gap-4 pt-4">
      <div class="flex flex-col gap-2">
        <label for="codigo" class="font-semibold text-sm">Código del Curso</label>
        <input pInputText id="codigo" formControlName="codigo" placeholder="Ej: MAT-101" />
      </div>

      <div class="flex flex-col gap-2">
        <label for="nombre" class="font-semibold text-sm">Nombre del Curso</label>
        <input pInputText id="nombre" formControlName="nombre" placeholder="Ej: Matemática I" />
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="flex flex-col gap-2">
          <label class="font-semibold text-sm">Nivel</label>
          <p-select [options]="niveles" formControlName="nivel" placeholder="Seleccionar" />
        </div>
        <div class="flex flex-col gap-2">
          <label class="font-semibold text-sm">Grado</label>
          <p-select [options]="grados" formControlName="grado" placeholder="Seleccionar" />
        </div>
      </div>

      <div class="flex flex-col gap-2">
        <label for="capacidad" class="font-semibold text-sm">Capacidad Máxima</label>
        <input pInputText type="number" id="capacidad" formControlName="capacidad" />
      </div>

      <div class="flex justify-end gap-2 mt-4">
        <p-button label="Cancelar" severity="secondary" text (click)="onCancel()" />
        <p-button label="Guardar Curso" type="submit" [disabled]="cursoForm.invalid" />
      </div>
    </form>
  `
})
export class CursoFormComponent {
  private fb = inject(FormBuilder);
  
  @Output() save = new EventEmitter<Curso>();
  @Output() cancel = new EventEmitter<void>();

  cursoForm: FormGroup = this.fb.group({
    codigo: ['', [Validators.required]],
    nombre: ['', [Validators.required]],
    nivel: [null, [Validators.required]],
    grado: [null, [Validators.required]],
    capacidad: [30, [Validators.required, Validators.min(1)]],
    estado: ['Activo'],
    matriculados: [0]
  });

  niveles = [
    { label: 'Primaria', value: 'PRIMARIA' },
    { label: 'Secundaria', value: 'SECUNDARIA' }
  ];

  grados = [
    { label: '1ero', value: '1' },
    { label: '2do', value: '2' },
    { label: '3ero', value: '3' },
    { label: '4to', value: '4' },
    { label: '5to', value: '5' }
  ];

  onSubmit() {
    if (this.cursoForm.valid) {
      this.save.emit(this.cursoForm.value);
    }
  }

  onCancel() {
    this.cancel.emit();
  }
}
