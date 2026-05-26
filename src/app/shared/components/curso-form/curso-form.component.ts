import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { TextareaModule } from 'primeng/textarea';
import { Curso } from '../../../core/services/curso.service';

@Component({
  selector: 'app-curso-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ButtonModule, InputTextModule, SelectModule, MultiSelectModule, TextareaModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()">

      <div class="form-section">
        <span class="section-label">Información del curso</span>

        <div class="field">
          <label>Nombre del curso <span class="req">*</span></label>
          <input pInputText formControlName="nombre" placeholder="Ej: Matemática Básica" />
        </div>

        <div class="field">
          <label>Descripción</label>
          <textarea pTextarea formControlName="descripcion" rows="2"
            placeholder="Breve descripción del contenido…" autoResize="true"></textarea>
        </div>

        <div class="field-row">
          <div class="field">
            <label>Nivel <span class="req">*</span></label>
            <p-select [options]="niveles" formControlName="nivel" placeholder="Seleccionar"
              optionLabel="label" optionValue="value"
              appendTo="body" (onChange)="onNivelChange()" />
          </div>
          <div class="field">
            <label>Grados <span class="req">*</span></label>
            <p-multiselect
              [options]="gradosDisponibles"
              [(ngModel)]="selectedGrados"
              [ngModelOptions]="{standalone: true}"
              optionLabel="label"
              optionValue="value"
              placeholder="Seleccionar grados"
              [disabled]="!form.get('nivel')?.value"
              display="chip"
              appendTo="body" />
          </div>
        </div>

        <div class="field-row">
          <div class="field">
            <label>Sección</label>
            <p-select [options]="secciones" formControlName="seccion" placeholder="Sección"
              optionLabel="label" optionValue="value" appendTo="body" />
          </div>
          <div class="field">
            <label>Año lectivo <span class="req">*</span></label>
            <input pInputText type="number" formControlName="anio" placeholder="2026" />
          </div>
        </div>
      </div>

      <div class="form-footer">
        <p-button label="Cancelar" severity="secondary" [text]="true" (click)="onCancel()" />
        <p-button
          [label]="editMode ? 'Guardar cambios' : 'Crear curso'"
          type="submit"
          [disabled]="form.invalid || !selectedGrados.length" />
      </div>
    </form>
  `,
  styles: [`
    form { display: flex; flex-direction: column; gap: 0; }

    .form-section {
      padding: 1.5rem 1.75rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .section-label {
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #9ca3af;
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
      flex: 1;
    }

    .field label {
      font-size: 0.8125rem;
      font-weight: 500;
      color: #374151;
    }

    .req { color: #6366f1; }

    .field-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.875rem;
    }

    .form-footer {
      padding: 1rem 1.75rem 1.5rem;
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
    }

    :host ::ng-deep input.p-inputtext,
    :host ::ng-deep textarea.p-textarea,
    :host ::ng-deep .p-select {
      width: 100%;
      border-radius: 8px;
      font-size: 0.875rem;
    }
  `]
})
export class CursoFormComponent implements OnInit {
  private fb = inject(FormBuilder);

  @Input() curso: Curso | null = null;
  @Output() save = new EventEmitter<Curso>();
  @Output() cancel = new EventEmitter<void>();

  editMode = false;
  gradosDisponibles: { label: string; value: number }[] = [];
  selectedGrados: number[] = [];

  form!: FormGroup;

  niveles = [
    { label: 'Inicial',    value: 'INICIAL'    },
    { label: 'Primaria',   value: 'PRIMARIA'   },
    { label: 'Secundaria', value: 'SECUNDARIA' }
  ];

  secciones = [
    { label: 'A', value: 'A' },
    { label: 'B', value: 'B' },
    { label: 'C', value: 'C' },
    { label: 'D', value: 'D' }
  ];

  private gradosPorNivel: Record<string, { label: string; value: number }[]> = {
    INICIAL:    [{ label: '3 años', value: 1 }, { label: '4 años', value: 2 }, { label: '5 años', value: 3 }],
    PRIMARIA:   [1,2,3,4,5,6].map(n => ({ label: `${n}°`, value: n })),
    SECUNDARIA: [1,2,3,4,5].map(n => ({ label: `${n}°`, value: n }))
  };

  ngOnInit() {
    this.editMode = !!this.curso;

    if (this.curso?.nivel) {
      this.gradosDisponibles = this.gradosPorNivel[this.curso.nivel] ?? [];
    }

    this.selectedGrados = [...(this.curso?.grados ?? [])];

    this.form = this.fb.group({
      nombre:      [this.curso?.nombre      ?? '', [Validators.required]],
      descripcion: [this.curso?.descripcion ?? ''],
      nivel:       [this.curso?.nivel       ?? null, [Validators.required]],
      seccion:     [this.curso?.seccion     ?? null],
      anio:        [this.curso?.anio        ?? new Date().getFullYear(), [Validators.required]]
    });
  }

  onNivelChange() {
    const nivel = this.form.get('nivel')?.value;
    this.gradosDisponibles = nivel ? this.gradosPorNivel[nivel] : [];
    this.selectedGrados = [];
  }

  onSubmit() {
    if (this.form.invalid || !this.selectedGrados.length) return;
    const val = this.form.value;
    const curso: Curso = {
      ...(this.curso?.id         ? { id: this.curso.id }                 : {}),
      ...(this.curso?.profesorId ? { profesorId: this.curso.profesorId } : {}),
      nombre:      val.nombre,
      descripcion: val.descripcion || undefined,
      nivel:       val.nivel,
      grados:      [...this.selectedGrados],
      seccion:     val.seccion || undefined,
      anio:        val.anio
    };
    this.save.emit(curso);
  }

  onCancel() {
    this.cancel.emit();
  }
}
