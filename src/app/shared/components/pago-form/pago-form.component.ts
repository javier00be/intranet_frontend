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
        <label class="font-semibold text-sm">Estudiante (ID)</label>
        <p-select [options]="estudiantes" formControlName="estudianteId" placeholder="Seleccionar estudiante" />
      </div>

      <div class="flex flex-col gap-2">
        <label class="font-semibold text-sm">Concepto</label>
        <p-select [options]="conceptos" formControlName="concepto" placeholder="Seleccionar concepto" />
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="flex flex-col gap-2">
          <label class="font-semibold text-sm">Monto</label>
          <input pInputText type="number" formControlName="monto" placeholder="0.00" />
        </div>
        <div class="flex flex-col gap-2">
          <label class="font-semibold text-sm">Fecha de Pago</label>
          <p-datepicker formControlName="fechaPago" />
        </div>
      </div>

      <div class="flex flex-col gap-2">
        <label class="font-semibold text-sm">Método de Pago</label>
        <p-select [options]="metodos" formControlName="metodoPago" placeholder="Seleccionar método" />
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
    fechaPago: [new Date(), [Validators.required]],
    metodoPago: ['Transferencia', [Validators.required]],
    estado: ['PENDIENTE']
  });

  estudiantes = [
    { label: 'Estudiante #1', value: 1 },
    { label: 'Estudiante #2', value: 2 },
    { label: 'Estudiante #3', value: 3 }
  ];

  conceptos = [
    { label: 'Matrícula', value: 'Matrícula' },
    { label: 'Pensión Mensual', value: 'Pensión Mensual' },
    { label: 'Derecho de Examen', value: 'Derecho de Examen' },
    { label: 'Material Didáctico', value: 'Material Didáctico' }
  ];

  metodos = [
    { label: 'Efectivo', value: 'Efectivo' },
    { label: 'Transferencia', value: 'Transferencia' },
    { label: 'Tarjeta Crédito/Débito', value: 'Tarjeta' }
  ];

  onSubmit() {
    if (this.pagoForm.valid) {
      const value = this.pagoForm.value;
      const pago: Pago = {
        estudianteId: value.estudianteId,
        concepto: value.concepto,
        monto: value.monto,
        fechaPago: value.fechaPago instanceof Date ? value.fechaPago.toISOString() : value.fechaPago,
        metodoPago: value.metodoPago,
        estado: value.estado
      };
      this.save.emit(pago);
    }
  }

  onCancel() {
    this.cancel.emit();
  }
}
