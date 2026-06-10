import { Component, OnInit, Output, EventEmitter, inject, signal , ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputMaskModule } from 'primeng/inputmask';
import { PasswordModule } from 'primeng/password';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { MatriculaService, MatriculaCreateRequest, MatriculaDTO } from '../../../core/services/matricula.service';
import { DniService } from '../../../core/services/dni.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-matricula-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    ButtonModule, InputTextModule, InputMaskModule, PasswordModule, SelectModule, DatePickerModule, TagModule, TooltipModule
  ],
  template: `
    <div class="mf-root">

      <!-- Indicador de pasos -->
      <div class="steps">
        <div class="step" [class.active]="step() === 1" [class.done]="step() > 1">
          <span class="step-num">{{ step() > 1 ? '✓' : '1' }}</span>
          <span class="step-lbl">Padre / Tutor</span>
        </div>
        <div class="step-line" [class.done]="step() > 1"></div>
        <div class="step" [class.active]="step() === 2" [class.done]="step() > 2">
          <span class="step-num">{{ step() > 2 ? '✓' : '2' }}</span>
          <span class="step-lbl">Alumnos</span>
        </div>
        <div class="step-line" [class.done]="step() > 2"></div>
        <div class="step" [class.active]="step() === 3">
          <span class="step-num">3</span>
          <span class="step-lbl">Confirmar</span>
        </div>
      </div>

      <form [formGroup]="form">

        <!-- PASO 1: Datos del padre -->
        @if (step() === 1) {
          <div class="form-section" formGroupName="padre">
            <span class="section-label">Datos del padre / tutor</span>

            <div class="field-row">
              <div class="field">
                <label>
                  DNI <span class="req">*</span>
                  @if (dniLoadingPadre()) {
                    <i class="pi pi-spin pi-spinner dni-spin"></i>
                  } @else {
                    <span class="dni-hint" pTooltip="Ingresá el DNI para autocompletar los nombres">
                      <i class="pi pi-info-circle"></i>
                    </span>
                  }
                </label>
                <p-inputmask mask="99999999" formControlName="dni"
                  placeholder="45678901" (onComplete)="buscarDniPadre()" />
                @if (padreGroup.get('dni')?.invalid && padreGroup.get('dni')?.touched) {
                  <small class="field-error">Requerido (8 dígitos)</small>
                }
              </div>
              <div class="field">
                <label>Correo electrónico <span class="req">*</span></label>
                <input pInputText type="email" formControlName="email" placeholder="padre@email.com" />
                @if (padreGroup.get('email')?.invalid && padreGroup.get('email')?.touched) {
                  <small class="field-error">Email inválido</small>
                }
              </div>
              <div class="field">
                <label>Teléfono</label>
                <p-inputmask mask="999999999" formControlName="telefono" placeholder="999888777" />
              </div>
            </div>

            <div class="field-row">
              <div class="field">
                <label>Nombre <span class="req">*</span></label>
                <input pInputText formControlName="nombre" placeholder="Se completa con el DNI" />
                @if (padreGroup.get('nombre')?.invalid && padreGroup.get('nombre')?.touched) {
                  <small class="field-error">Requerido</small>
                }
              </div>
              <div class="field">
                <label>Apellido paterno <span class="req">*</span></label>
                <input pInputText formControlName="apellidoPaterno" placeholder="Se completa con el DNI" />
                @if (padreGroup.get('apellidoPaterno')?.invalid && padreGroup.get('apellidoPaterno')?.touched) {
                  <small class="field-error">Requerido</small>
                }
              </div>
              <div class="field">
                <label>Apellido materno</label>
                <input pInputText formControlName="apellidoMaterno" placeholder="Se completa con el DNI" />
              </div>
            </div>

            <div class="field-row-half">
              <div class="field">
                <label>Contraseña <span class="req">*</span></label>
                <p-password formControlName="password" [feedback]="false" [toggleMask]="true"
                  styleClass="w-full" inputStyleClass="w-full" placeholder="Mínimo 6 caracteres" />
                @if (padreGroup.get('password')?.invalid && padreGroup.get('password')?.touched) {
                  <small class="field-error">Mínimo 6 caracteres</small>
                }
              </div>
            </div>
          </div>

          <div class="form-footer">
            <p-button label="Cancelar" severity="secondary" [text]="true" (click)="cancel.emit()" />
            <p-button label="Siguiente" icon="pi pi-arrow-right" iconPos="right" (click)="nextStep1()" />
          </div>
        }

        <!-- PASO 2: Alumnos -->
        @if (step() === 2) {
          <div class="form-section">
            <span class="section-label">Configuración de pagos</span>
            <div class="field-row-half">
              <div class="field">
                <label>Día de cobro mensual <span class="req">*</span></label>
                <input pInputText type="number" formControlName="diaPago"
                  placeholder="15" min="1" max="31" />
                <small class="field-hint">Día del mes en que vence cada mensualidad (1-31). Si el mes tiene menos días se usa el último.</small>
                @if (form.get('diaPago')?.invalid && form.get('diaPago')?.touched) {
                  <small class="field-error">Ingresá un día entre 1 y 31</small>
                }
              </div>
            </div>
          </div>
          <div class="form-section alumno-section" formArrayName="alumnos">
            @for (alumno of alumnoGroups; track $index; let i = $index) {
              <div class="alumno-card" [formGroupName]="i">
                <div class="alumno-header">
                  <span class="alumno-title">
                    <i class="pi pi-user"></i>
                    Alumno {{ i + 1 }}
                    @if (alumno.get('nombre')?.value) {
                      <span class="alumno-preview">— {{ alumno.get('nombre')?.value }} {{ alumno.get('apellidoPaterno')?.value }}</span>
                    }
                  </span>
                  @if (alumnoGroups.length > 1) {
                    <p-button icon="pi pi-times" severity="danger" [text]="true" [rounded]="true"
                      size="small" (click)="removeAlumno(i)" pTooltip="Quitar alumno" />
                  }
                </div>

                <div class="field-row">
                  <div class="field">
                    <label>
                      DNI <span class="req">*</span>
                      @if (dniLoadingAlumnos()[i]) {
                        <i class="pi pi-spin pi-spinner dni-spin"></i>
                      } @else {
                        <span class="dni-hint" pTooltip="Ingresá el DNI para autocompletar los nombres">
                          <i class="pi pi-info-circle"></i>
                        </span>
                      }
                    </label>
                    <p-inputmask mask="99999999" formControlName="dni"
                      placeholder="12345678" (onComplete)="buscarDniAlumno(i)" />
                  </div>
                  <div class="field">
                    <label>Correo electrónico <span class="req">*</span></label>
                    <input pInputText type="email" formControlName="email" placeholder="alumno@email.com" />
                  </div>
                  <div class="field">
                    <label>Contraseña <span class="req">*</span></label>
                    <p-password formControlName="password" [feedback]="false" [toggleMask]="true"
                      styleClass="w-full" inputStyleClass="w-full" placeholder="Mínimo 6 caracteres" />
                  </div>
                </div>

                <div class="field-row">
                  <div class="field">
                    <label>Nombre <span class="req">*</span></label>
                    <input pInputText formControlName="nombre" placeholder="Se completa con el DNI" />
                  </div>
                  <div class="field">
                    <label>Apellido paterno <span class="req">*</span></label>
                    <input pInputText formControlName="apellidoPaterno" placeholder="Se completa con el DNI" />
                  </div>
                  <div class="field">
                    <label>Apellido materno</label>
                    <input pInputText formControlName="apellidoMaterno" placeholder="Se completa con el DNI" />
                  </div>
                </div>

                <div class="field-row">
                  <div class="field">
                    <label>Nivel <span class="req">*</span></label>
                    <p-select [options]="niveles" formControlName="nivel"
                      optionLabel="label" optionValue="value"
                      placeholder="Seleccionar" appendTo="body"
                      (onChange)="onNivelChange(i)" />
                  </div>
                  <div class="field">
                    <label>Grado <span class="req">*</span></label>
                    <p-select [options]="getGrados(i)" formControlName="grado"
                      optionLabel="label" optionValue="value"
                      placeholder="Seleccionar" appendTo="body"
                      [disabled]="!alumno.get('nivel')?.value" />
                  </div>
                  <div class="field">
                    <label>Sección</label>
                    <p-select [options]="secciones" formControlName="seccion"
                      optionLabel="label" optionValue="value"
                      placeholder="A / B / C" appendTo="body" />
                  </div>
                </div>

                <div class="field-row">
                  <div class="field">
                    <label>Monto matrícula <span class="req">*</span></label>
                    <input pInputText type="number" formControlName="montoMatricula" placeholder="S/ 0.00" />
                  </div>
                  <div class="field">
                    <label>Monto mensualidad <span class="req">*</span></label>
                    <input pInputText type="number" formControlName="montoMensualidad" placeholder="S/ 0.00" />
                  </div>
                  <div class="field">
                    <label>Año lectivo <span class="req">*</span></label>
                    <input pInputText type="number" formControlName="anio" placeholder="2026" />
                  </div>
                </div>

                <div class="field-row-half">
                  <div class="field">
                    <label>Fecha de nacimiento</label>
                    <p-datepicker formControlName="fechaNacimiento"
                      dateFormat="dd/mm/yy" placeholder="dd/mm/yyyy"
                      [showIcon]="true" appendTo="body" />
                  </div>
                </div>
              </div>
            }

            <button type="button" class="btn-add-alumno" (click)="addAlumno()">
              <i class="pi pi-plus"></i> Agregar otro alumno
            </button>
          </div>

          <div class="form-footer">
            <p-button label="Anterior" icon="pi pi-arrow-left" severity="secondary" [text]="true" (click)="step.set(1)" />
            <p-button label="Siguiente" icon="pi pi-arrow-right" iconPos="right" (click)="nextStep2()" />
          </div>
        }

        <!-- PASO 3: Confirmación -->
        @if (step() === 3) {
          <div class="form-section">
            <span class="section-label">Resumen de la matrícula</span>

            <div class="summary-card">
              <div class="summary-title"><i class="pi pi-user"></i> Padre / Tutor</div>
              <div class="summary-name">
                {{ padreGroup.get('nombre')?.value }}
                {{ padreGroup.get('apellidoPaterno')?.value }}
                {{ padreGroup.get('apellidoMaterno')?.value }}
              </div>
              <div class="summary-meta">
                DNI {{ padreGroup.get('dni')?.value }} · {{ padreGroup.get('email')?.value }}
              </div>
            </div>

            <div class="summary-divider">
              {{ alumnoGroups.length }} alumno{{ alumnoGroups.length !== 1 ? 's' : '' }} a matricular · Día de cobro: <strong>{{ form.get('diaPago')?.value }}</strong> de cada mes
            </div>

            @for (alumno of alumnoGroups; track $index; let i = $index) {
              <div class="summary-card summary-alumno">
                <div class="summary-title">
                  <i class="pi pi-graduation-cap"></i> Alumno {{ i + 1 }}
                </div>
                <div class="summary-name">
                  {{ alumno.get('nombre')?.value }}
                  {{ alumno.get('apellidoPaterno')?.value }}
                  {{ alumno.get('apellidoMaterno')?.value }}
                </div>
                <div class="summary-meta">DNI {{ alumno.get('dni')?.value }} · {{ alumno.get('email')?.value }}</div>
                <div class="summary-tags">
                  <p-tag [value]="nivelLabel(alumno.get('nivel')?.value)" severity="info" />
                  <p-tag [value]="alumno.get('grado')?.value + '°' + (alumno.get('seccion')?.value ? ' ' + alumno.get('seccion')?.value : '')" severity="success" />
                  <p-tag [value]="'Año ' + alumno.get('anio')?.value" severity="secondary" />
                </div>
                <div class="summary-hint">
                  <i class="pi pi-info-circle"></i>
                  Se asignarán los cursos activos de {{ alumno.get('grado')?.value }}° de {{ nivelLabel(alumno.get('nivel')?.value) }}
                </div>
              </div>
            }

            @if (errorSubmit()) {
              <div class="error-banner">
                <i class="pi pi-exclamation-triangle"></i> {{ errorSubmit() }}
              </div>
            }
          </div>

          <div class="form-footer">
            <p-button label="Anterior" icon="pi pi-arrow-left" severity="secondary" [text]="true"
              (click)="step.set(2)" [disabled]="loading()" />
            <p-button label="Confirmar matrícula" icon="pi pi-check"
              (click)="submit()" [loading]="loading()" />
          </div>
        }

      </form>
    </div>
  `,
  styles: [`
    .mf-root { display: flex; flex-direction: column; }

    /* Steps */
    .steps {
      display: flex; align-items: center; padding: 1.25rem 1.75rem 1rem;
      border-bottom: 1px solid #f3f4f6;
    }
    .step { display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0; }
    .step-num {
      width: 26px; height: 26px; border-radius: 50%; border: 2px solid #e5e7eb;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.75rem; font-weight: 700; color: #9ca3af; transition: all 0.2s;
    }
    .step-lbl { font-size: 0.8125rem; color: #9ca3af; font-weight: 500; }
    .step.active .step-num { border-color: #6366f1; background: #6366f1; color: white; }
    .step.active .step-lbl { color: #6366f1; font-weight: 600; }
    .step.done .step-num  { border-color: #10b981; background: #10b981; color: white; }
    .step.done .step-lbl  { color: #10b981; }
    .step-line { flex: 1; height: 2px; background: #e5e7eb; margin: 0 0.75rem; transition: background 0.2s; }
    .step-line.done { background: #10b981; }

    /* Section */
    .form-section { padding: 1.25rem 1.75rem; display: flex; flex-direction: column; gap: 1rem; overflow-y: auto; max-height: 60vh; }
    .section-label { font-size: 0.7rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #9ca3af; }

    /* Fields */
    .field-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.875rem; }
    .field-row-half { display: grid; grid-template-columns: 1fr 1fr; gap: 0.875rem; }
    .field { display: flex; flex-direction: column; gap: 0.375rem; }
    .field label { font-size: 0.8125rem; font-weight: 500; color: #374151; }
    .req { color: #6366f1; }
    .field-error { color: #e11d48; font-size: 0.75rem; }

    /* Alumno card */
    .alumno-card {
      border: 1.5px solid #e5e7eb; border-radius: 12px;
      padding: 1rem 1.25rem; display: flex; flex-direction: column; gap: 0.875rem;
    }
    .alumno-card:focus-within { border-color: #a5b4fc; }
    .alumno-header { display: flex; justify-content: space-between; align-items: center; }
    .alumno-title { font-size: 0.875rem; font-weight: 600; color: #6366f1; display: flex; align-items: center; gap: 0.5rem; }
    .alumno-preview { font-weight: 400; color: #9ca3af; }

    .btn-add-alumno {
      display: flex; align-items: center; gap: 0.5rem; justify-content: center;
      padding: 0.625rem; border: 2px dashed #c7d2fe; border-radius: 10px;
      background: transparent; color: #6366f1; font-size: 0.875rem; font-weight: 500;
      cursor: pointer; transition: all 0.15s;
    }
    .btn-add-alumno:hover { background: #eef2ff; border-color: #6366f1; }

    /* Summary */
    .summary-card { border: 1.5px solid #e5e7eb; border-radius: 12px; padding: 1rem 1.25rem; display: flex; flex-direction: column; gap: 0.5rem; }
    .summary-alumno { border-color: #e0e7ff; background: #fafafa; }
    .summary-title { font-size: 0.8125rem; font-weight: 600; color: #6366f1; display: flex; align-items: center; gap: 0.375rem; }
    .summary-name { font-size: 1rem; font-weight: 600; color: #111827; }
    .summary-meta { font-size: 0.8125rem; color: #6b7280; }
    .summary-tags { display: flex; gap: 0.375rem; flex-wrap: wrap; }
    .summary-hint { font-size: 0.75rem; color: #9ca3af; display: flex; align-items: center; gap: 0.375rem; }
    .summary-divider {
      text-align: center; font-size: 0.8125rem; font-weight: 600; color: #6b7280;
      padding: 0.25rem 0; border-top: 1px dashed #e5e7eb; border-bottom: 1px dashed #e5e7eb;
    }

    /* Error */
    .error-banner {
      display: flex; align-items: center; gap: 0.5rem;
      background: #fff1f2; border: 1px solid #fecdd3; border-radius: 8px;
      padding: 0.625rem 0.875rem; font-size: 0.8125rem; color: #e11d48;
    }

    /* Footer */
    .form-footer {
      display: flex; justify-content: flex-end; gap: 0.5rem;
      padding: 1rem 1.75rem; border-top: 1px solid #f3f4f6;
    }

    .dni-spin { color: #6366f1; margin-left: 0.375rem; font-size: 0.75rem; }
    .dni-hint { color: #9ca3af; margin-left: 0.375rem; font-size: 0.75rem; cursor: default; }
    .field-hint { font-size: 0.75rem; color: #9ca3af; }
    .alumno-section { border-top: 1px solid #f3f4f6; }

    /* PrimeNG overrides */
    :host ::ng-deep input.p-inputtext,
    :host ::ng-deep .p-inputmask,
    :host ::ng-deep .p-select,
    :host ::ng-deep .p-password input {
      width: 100%; border-radius: 8px; font-size: 0.875rem;
    }
    :host ::ng-deep .p-password { width: 100%; }
    :host ::ng-deep .p-datepicker { width: 100%; }
    :host ::ng-deep .p-datepicker input { width: 100%; border-radius: 8px; font-size: 0.875rem; }
  `]
})
export class MatriculaFormComponent implements OnInit {
  @Output() save = new EventEmitter<MatriculaDTO[]>();
  @Output() cancel = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private matriculaService = inject(MatriculaService);
  private dniService = inject(DniService);

  step = signal<1 | 2 | 3>(1);
  loading = signal(false);
  errorSubmit = signal('');
  dniLoadingPadre = signal(false);
  dniLoadingAlumnos = signal<boolean[]>([false]);

  form!: FormGroup;

  niveles = [
    { label: 'Inicial',    value: 'INICIAL'    },
    { label: 'Primaria',   value: 'PRIMARIA'   },
    { label: 'Secundaria', value: 'SECUNDARIA' }
  ];

  secciones = ['A','B','C','D'].map(s => ({ label: s, value: s }));

  private gradosPorNivel: Record<string, { label: string; value: number }[]> = {
    INICIAL:    [3,4,5].map(n => ({ label: `${n} años`, value: n })),
    PRIMARIA:   [1,2,3,4,5,6].map(n => ({ label: `${n}°`, value: n })),
    SECUNDARIA: [1,2,3,4,5].map(n => ({ label: `${n}°`, value: n }))
  };

  get padreGroup()   { return this.form.get('padre') as FormGroup; }
  get alumnosArray() { return this.form.get('alumnos') as FormArray; }
  get alumnoGroups() { return this.alumnosArray.controls as FormGroup[]; }

  ngOnInit() {
    this.form = this.fb.group({
      padre: this.fb.group({
        nombre:           ['', Validators.required],
        apellidoPaterno:  ['', Validators.required],
        apellidoMaterno:  [''],
        dni:              ['', Validators.required],
        email:            ['', [Validators.required, Validators.email]],
        password:         ['', [Validators.required, Validators.minLength(6)]],
        telefono:         ['']
      }),
      diaPago: [15, [Validators.required, Validators.min(1), Validators.max(31)]],
      alumnos: this.fb.array([this.createAlumnoGroup()])
    });
  }

  private createAlumnoGroup(): FormGroup {
    return this.fb.group({
      nombre:            ['', Validators.required],
      apellidoPaterno:   ['', Validators.required],
      apellidoMaterno:   [''],
      dni:               ['', Validators.required],
      email:             ['', [Validators.required, Validators.email]],
      password:          ['', [Validators.required, Validators.minLength(6)]],
      fechaNacimiento:   [null],
      nivel:             ['PRIMARIA', Validators.required],
      grado:             [null, Validators.required],
      seccion:           [''],
      anio:              [new Date().getFullYear(), Validators.required],
      montoMatricula:    [null, Validators.required],
      montoMensualidad:  [null, Validators.required]
    });
  }

  addAlumno(): void {
    this.alumnosArray.push(this.createAlumnoGroup());
    this.dniLoadingAlumnos.update(arr => [...arr, false]);
  }

  removeAlumno(i: number): void {
    this.alumnosArray.removeAt(i);
    this.dniLoadingAlumnos.update(arr => arr.filter((_, idx) => idx !== i));
  }

  buscarDniPadre(): void {
    const dni = this.padreGroup.get('dni')?.value?.replace(/_/g, '');
    if (dni?.length !== 8) return;
    this.dniLoadingPadre.set(true);
    this.dniService.buscar(dni).subscribe({
      next: (data) => {
        this.padreGroup.patchValue({
          nombre:          this.dniService.toTitleCase(data.nombres),
          apellidoPaterno: this.dniService.toTitleCase(data.apellidoPaterno),
          apellidoMaterno: this.dniService.toTitleCase(data.apellidoMaterno)
        });
        this.dniLoadingPadre.set(false);
      },
      error: () => this.dniLoadingPadre.set(false)
    });
  }

  buscarDniAlumno(i: number): void {
    const dni = this.alumnoGroups[i].get('dni')?.value?.replace(/_/g, '');
    if (dni?.length !== 8) return;
    this.dniLoadingAlumnos.update(arr => { const c = [...arr]; c[i] = true; return c; });
    this.dniService.buscar(dni).subscribe({
      next: (data) => {
        this.alumnoGroups[i].patchValue({
          nombre:          this.dniService.toTitleCase(data.nombres),
          apellidoPaterno: this.dniService.toTitleCase(data.apellidoPaterno),
          apellidoMaterno: this.dniService.toTitleCase(data.apellidoMaterno)
        });
        this.dniLoadingAlumnos.update(arr => { const c = [...arr]; c[i] = false; return c; });
      },
      error: () => {
        this.dniLoadingAlumnos.update(arr => { const c = [...arr]; c[i] = false; return c; });
      }
    });
  }

  getGrados(i: number): { label: string; value: number }[] {
    const nivel = this.alumnoGroups[i].get('nivel')?.value;
    return nivel ? (this.gradosPorNivel[nivel] ?? []) : [];
  }

  onNivelChange(i: number): void {
    this.alumnoGroups[i].get('grado')?.setValue(null);
  }

  nextStep1(): void {
    if (this.padreGroup.invalid) {
      this.padreGroup.markAllAsTouched();
      return;
    }
    this.step.set(2);
  }

  nextStep2(): void {
    this.form.get('diaPago')?.markAsTouched();
    this.alumnosArray.markAllAsTouched();
    if (this.form.get('diaPago')?.invalid || this.alumnosArray.invalid) return;
    this.step.set(3);
  }

  submit(): void {
    this.loading.set(true);
    this.errorSubmit.set('');

    const v = this.form.value;
    const request: MatriculaCreateRequest = {
      padreNombre:          v.padre.nombre,
      padreApellidoPaterno: v.padre.apellidoPaterno,
      padreApellidoMaterno: v.padre.apellidoMaterno,
      padreDni:             v.padre.dni,
      padreEmail:           v.padre.email,
      padrePassword:        v.padre.password,
      padreTelefono:        v.padre.telefono,
      diaPago:              v.diaPago,
      alumnos: v.alumnos.map((a: any) => ({
        nombre:           a.nombre,
        apellidoPaterno:  a.apellidoPaterno,
        apellidoMaterno:  a.apellidoMaterno,
        dni:              a.dni,
        email:            a.email,
        password:         a.password,
        fechaNacimiento:  this.formatDate(a.fechaNacimiento),
        grado:            a.grado,
        seccion:          a.seccion || '',
        nivel:            a.nivel,
        anio:             a.anio,
        montoMatricula:   a.montoMatricula,
        montoMensualidad: a.montoMensualidad
      }))
    };

    this.matriculaService.crear(request).subscribe({
      next: (result) => {
        this.loading.set(false);
        this.save.emit(result);
      },
      error: (err) => {
        this.loading.set(false);
        const msg = typeof err.error === 'string' ? err.error : 'Error al registrar la matrícula.';
        this.errorSubmit.set(msg);
      }
    });
  }

  private formatDate(date: Date | null): string | undefined {
    if (!date) return undefined;
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  nivelLabel(nivel: string): string {
    return ({ INICIAL: 'Inicial', PRIMARIA: 'Primaria', SECUNDARIA: 'Secundaria' } as any)[nivel] ?? nivel;
  }
}
