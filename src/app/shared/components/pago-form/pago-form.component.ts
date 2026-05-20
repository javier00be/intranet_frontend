import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { Pago } from '../../../core/services/pago.service';

@Component({
  selector: 'app-pago-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonModule, InputTextModule, SelectModule, DatePickerModule],
  template: `
    <form [formGroup]="pagoForm" (ngSubmit)="onSubmit()" class="flex flex-col gap-4 pt-4">
      <div class="flex flex-col gap-2">
        <label class="font-semibold text-sm">Estudiante</label>
        <p-select [options]="estudiantes" formControlName="estudianteId" placeholder="Seleccionar estudiante" filter="true" />
      </div>

      <div class="flex flex-col gap-2">
        <label class="font-semibold text-sm">Concepto</label>
        <p-select [options]="conceptos" formControlName="concepto" placeholder="Seleccionar concepto" />
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="flex flex-col gap-2">
          <label for="monto" class="font-semibold text-sm">Monto</label>
          <input pInputText type="number" id="monto" formControlName="monto" placeholder="0.00" />
        </div>
        <div class="flex flex-col gap-2">
          <label class="font-semibold text-sm">Fecha</label>
          <p-datepicker formControlName="fecha" />
        </div>
      </div>

      <div class="flex flex-col gap-2">
        <label class="font-semibold text-sm">Método de Pago</label>
        <p-select [options]="metodos" formControlName="metodo" placeholder="Seleccionar método" />
      </div>

      <div class="flex justify-end gap-2 mt-4">
        <p-button label="Cancelar" severity="secondary" text (click)="onCancel()" />
        <p-button label="Registrar Pago" type="submit" [disabled]="pagoForm.invalid" />
      </div>
    </form>
  `
})
export class PagoFormComponent {
  private fb = inject(FormBuilder);
  
  @Output() save = new EventEmitter<Pago>();
  @Output() cancel = new EventEmitter<void>();

  pagoForm: FormGroup = this.fb.group({
    estudianteId: [null, [Validators.required]],
    concepto: ['', [Validators.required]],
    monto: [null, [Validators.required, Validators.min(0)]],
    fecha: [new Date(), [Validators.required]],
    metodo: ['Transferencia', [Validators.required]],
    estado: ['Completado']
  });

  estudiantes = [
    { label: 'Ana García', value: 1 },
    { label: 'Carlos López', value: 2 },
    { label: 'María Pérez', value: 3 }
  ];

  conceptos = [
    { label: 'Matrícula', value: 'Matrícula' },
    { label: 'Pensión Marzo', value: 'Pensión Marzo' },
    { label: 'Pensión Abril', value: 'Pensión Abril' },
    { label: 'Derecho de Examen', value: 'Derecho de Examen' }
  ];

  metodos = [
    { label: 'Efectivo', value: 'Efectivo' },
    { label: 'Transferencia', value: 'Transferencia' },
    { label: 'Tarjeta Crédito/Débito', value: 'Tarjeta' }
  ];

  onSubmit() {
    if (this.pagoForm.valid) {
      this.save.emit(this.pagoForm.value);
    }
  }

  onCancel() {
    this.cancel.emit();
  }
}
