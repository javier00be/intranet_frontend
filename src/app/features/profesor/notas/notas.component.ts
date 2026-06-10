import { Component, OnInit, inject, signal, computed , ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Tabs, TabList, Tab, TabPanels, TabPanel } from 'primeng/tabs';
import { Select } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePicker } from 'primeng/datepicker';
import { Textarea } from 'primeng/textarea';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageService } from 'primeng/api';
import { CursoService, Curso } from '../../../core/services/curso.service';
import { EstudianteService, EstudianteDTO, CalificacionDTO, AsistenciaDTO } from '../../../core/services/estudiante.service';

interface AsistenciaRow {
  estudianteId: number;
  nombre: string;
  presente: boolean;
  observaciones: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-notas',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    Tabs, TabList, Tab, TabPanels, TabPanel,
    Select, InputNumberModule, DatePicker, Textarea,
    InputTextModule, TableModule, ButtonModule,
    TagModule, ToastModule, SkeletonModule
  ],
  providers: [MessageService],
  template: `
    <p-toast />

    <div class="notas-container">
      <div class="filter-bar">
        <p-select
          [options]="cursoOptions()"
          [(ngModel)]="selectedCursoId"
          optionLabel="label"
          optionValue="value"
          placeholder="Seleccioná un curso"
          [style]="{ minWidth: '320px' }"
          (onChange)="onCursoChange()" />
      </div>

      <div *ngIf="loading()" class="loading">
        <p-skeleton *ngFor="let _ of [1,2,3]" height="60px" styleClass="mb-2" />
      </div>

      <p-tabs *ngIf="selectedCursoId && !loading()">
        <p-tablist>
          <p-tab value="0">Calificaciones</p-tab>
          <p-tab value="1">Asistencia</p-tab>
        </p-tablist>
        <p-tabpanels>
        <p-tabpanel value="0">

          <div class="nota-form">
            <h4>Registrar calificación</h4>
            <div class="form-row">
              <p-select
                [options]="estudianteOptions()"
                [(ngModel)]="notaForm.estudianteId"
                optionLabel="label"
                optionValue="value"
                placeholder="Alumno"
                [style]="{ minWidth: '200px' }" />
              <p-inputNumber
                [(ngModel)]="notaForm.valor"
                placeholder="Nota (0–20)"
                [min]="0" [max]="20"
                [maxFractionDigits]="2"
                [style]="{ width: '140px' }" />
              <p-select
                [options]="tipoOptions"
                [(ngModel)]="notaForm.tipo"
                optionLabel="label"
                optionValue="value"
                placeholder="Tipo"
                [style]="{ width: '150px' }" />
              <p-datepicker
                [(ngModel)]="notaForm.fecha"
                dateFormat="dd/mm/yy"
                placeholder="Fecha"
                [style]="{ width: '150px' }" />
            </div>
            <div class="form-row">
              <textarea
                pInputTextarea
                [(ngModel)]="notaForm.observaciones"
                placeholder="Observaciones (opcional)"
                rows="2"
                style="flex:1"></textarea>
              <p-button
                label="Guardar nota"
                icon="pi pi-check"
                (onClick)="saveNota()"
                [loading]="savingNota()"
                [disabled]="!notaForm.estudianteId || notaForm.valor == null" />
            </div>
          </div>

          <p-table
            [value]="calificaciones()"
            responsiveLayout="scroll"
            stripedRows
            [rows]="20"
            [paginator]="calificaciones().length > 20">
            <ng-template pTemplate="header">
              <tr>
                <th>Alumno</th>
                <th>Nota</th>
                <th>Tipo</th>
                <th>Fecha</th>
                <th>Observaciones</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-c>
              <tr>
                <td>{{ nombreAlumno(c.estudianteId) }}</td>
                <td><strong>{{ c.valor }}</strong></td>
                <td><p-tag [value]="c.tipo ?? '-'" severity="info" /></td>
                <td>{{ c.fecha | date:'dd/MM/yyyy HH:mm' }}</td>
                <td>{{ c.observaciones ?? '-' }}</td>
              </tr>
            </ng-template>
            <ng-template pTemplate="emptymessage">
              <tr>
                <td colspan="5" class="text-center text-secondary p-4">Sin calificaciones registradas</td>
              </tr>
            </ng-template>
          </p-table>
        </p-tabpanel>

        <p-tabpanel value="1">
          <div class="asistencia-header">
            <p-datepicker
              [(ngModel)]="asistenciaFecha"
              dateFormat="dd/mm/yy"
              placeholder="Fecha de asistencia"
              [style]="{ width: '180px' }" />
            <p-button
              label="Guardar asistencia"
              icon="pi pi-check"
              (onClick)="saveAsistencia()"
              [loading]="savingAsistencia()"
              [disabled]="!asistenciaFecha || asistenciaRows().length === 0" />
          </div>

          <p-table [value]="asistenciaRows()" responsiveLayout="scroll" stripedRows>
            <ng-template pTemplate="header">
              <tr>
                <th>Alumno</th>
                <th class="text-center" style="width: 120px">Presente</th>
                <th>Observaciones</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-row>
              <tr>
                <td>{{ row.nombre }}</td>
                <td class="text-center">
                  <button
                    class="toggle-btn"
                    [class.presente]="row.presente"
                    (click)="row.presente = !row.presente"
                    [title]="row.presente ? 'Presente' : 'Ausente'">
                    <i class="pi" [class.pi-check]="row.presente" [class.pi-times]="!row.presente"></i>
                  </button>
                </td>
                <td>
                  <input pInputText [(ngModel)]="row.observaciones" placeholder="Observaciones" class="obs-input" />
                </td>
              </tr>
            </ng-template>
            <ng-template pTemplate="emptymessage">
              <tr>
                <td colspan="3" class="text-center text-secondary p-4">Seleccioná un curso para ver los alumnos</td>
              </tr>
            </ng-template>
          </p-table>
        </p-tabpanel>
        </p-tabpanels>
      </p-tabs>

      <div *ngIf="!selectedCursoId" class="select-prompt">
        <i class="pi pi-chart-bar"></i>
        <p>Seleccioná un curso para registrar notas y asistencia</p>
      </div>
    </div>
  `,
  styles: [`
    .notas-container { display: flex; flex-direction: column; gap: 1.5rem; }
    .filter-bar { display: flex; gap: 1rem; align-items: center; }
    .nota-form {
      background: var(--surface-b);
      border: 1px solid var(--surface-d);
      border-radius: 10px;
      padding: 1.25rem;
      margin-bottom: 1.25rem;
    }
    .nota-form h4 { margin-bottom: 1rem; }
    .form-row { display: flex; gap: 0.75rem; align-items: flex-start; flex-wrap: wrap; margin-bottom: 0.75rem; }
    .asistencia-header { display: flex; gap: 1rem; align-items: center; margin-bottom: 1rem; }
    .toggle-btn {
      width: 36px; height: 36px;
      border-radius: 50%;
      border: 2px solid #ccc;
      background: transparent;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      font-size: 0.9rem;
    }
    .toggle-btn.presente { border-color: #22c55e; color: #22c55e; background: #22c55e15; }
    .toggle-btn:not(.presente) { border-color: #ef4444; color: #ef4444; background: #ef444415; }
    .obs-input { width: 100%; }
    .text-center { text-align: center; }
    .text-secondary { color: var(--text-secondary); }
    .select-prompt { text-align: center; padding: 4rem; color: var(--text-secondary); }
    .select-prompt i { font-size: 3rem; display: block; margin-bottom: 1rem; }
  `]
})
export class NotasComponent implements OnInit {
  private cursoService = inject(CursoService);
  private estudianteService = inject(EstudianteService);
  private route = inject(ActivatedRoute);
  private messageService = inject(MessageService);

  cursos = signal<Curso[]>([]);
  estudiantes = signal<EstudianteDTO[]>([]);
  calificaciones = signal<CalificacionDTO[]>([]);
  asistenciaRows = signal<AsistenciaRow[]>([]);
  loading = signal(false);
  savingNota = signal(false);
  savingAsistencia = signal(false);
  selectedCursoId: number | null = null;

  notaForm = {
    estudianteId: null as number | null,
    valor: null as number | null,
    tipo: 'EXAMEN',
    fecha: new Date() as Date | null,
    observaciones: ''
  };

  tipoOptions = [
    { label: 'Examen', value: 'EXAMEN' },
    { label: 'Tarea', value: 'TAREA' },
    { label: 'Participación', value: 'PARTICIPACION' },
    { label: 'Proyecto', value: 'PROYECTO' }
  ];

  asistenciaFecha: Date | null = new Date();

  cursoOptions = computed(() =>
    this.cursos().map(c => ({
      label: `${c.nombre} — ${c.nivel} Grado ${c.grados?.[0]} ${c.seccion ?? ''}`.trim(),
      value: c.id as number
    }))
  );

  estudianteOptions = computed(() =>
    this.estudiantes().map(e => ({
      label: `${e.usuario?.nombre} ${e.usuario?.apellido}`,
      value: e.id
    }))
  );

  ngOnInit(): void {
    this.cursoService.getMisCursos().subscribe(cursos => {
      this.cursos.set(cursos);
      const cursoParam = this.route.snapshot.queryParamMap.get('curso');
      const estudianteParam = this.route.snapshot.queryParamMap.get('estudiante');
      if (cursoParam) {
        this.selectedCursoId = Number(cursoParam);
        if (estudianteParam) this.notaForm.estudianteId = Number(estudianteParam);
        this.loadCursoData();
      }
    });
  }

  onCursoChange(): void {
    this.estudiantes.set([]);
    this.calificaciones.set([]);
    this.asistenciaRows.set([]);
    this.loadCursoData();
  }

  private loadCursoData(): void {
    if (!this.selectedCursoId) return;
    const curso = this.cursos().find(c => c.id === this.selectedCursoId);
    if (!curso) return;

    this.loading.set(true);
    forkJoin({
      estudiantes: this.estudianteService.getByNivelAndGrado(curso.nivel, curso.grados?.[0] ?? 1),
      calificaciones: this.estudianteService.getCalificacionesByCurso(this.selectedCursoId!)
    }).subscribe({
      next: ({ estudiantes, calificaciones }) => {
        this.estudiantes.set(estudiantes);
        this.calificaciones.set(calificaciones);
        this.asistenciaRows.set(estudiantes.map(e => ({
          estudianteId: e.id,
          nombre: `${e.usuario?.nombre ?? ''} ${e.usuario?.apellido ?? ''}`.trim(),
          presente: true,
          observaciones: ''
        })));
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  nombreAlumno(id: number | undefined): string {
    if (!id) return '-';
    const e = this.estudiantes().find(x => x.id === id);
    return e ? `${e.usuario?.nombre ?? ''} ${e.usuario?.apellido ?? ''}`.trim() : String(id);
  }

  saveNota(): void {
    if (!this.notaForm.estudianteId || this.notaForm.valor == null || !this.selectedCursoId) return;
    this.savingNota.set(true);

    const dto: Partial<CalificacionDTO> = {
      estudianteId: this.notaForm.estudianteId,
      cursoId: this.selectedCursoId,
      valor: this.notaForm.valor,
      tipo: this.notaForm.tipo,
      fecha: this.notaForm.fecha ? this.notaForm.fecha.toISOString().slice(0, 19) : new Date().toISOString().slice(0, 19),
      observaciones: this.notaForm.observaciones || undefined
    };

    this.estudianteService.saveCalificacion(dto).subscribe({
      next: (saved) => {
        this.calificaciones.update(list => [saved, ...list]);
        this.notaForm.valor = null;
        this.notaForm.observaciones = '';
        this.savingNota.set(false);
        this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Calificación registrada' });
      },
      error: () => {
        this.savingNota.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar la calificación' });
      }
    });
  }

  saveAsistencia(): void {
    if (!this.asistenciaFecha || !this.selectedCursoId || this.asistenciaRows().length === 0) return;
    this.savingAsistencia.set(true);

    const fechaStr = this.asistenciaFecha.toISOString().slice(0, 10);
    const dtos = this.asistenciaRows().map(row => ({
      estudianteId: row.estudianteId,
      cursoId: this.selectedCursoId!,
      fecha: fechaStr,
      presente: row.presente,
      observaciones: row.observaciones || undefined
    }));

    this.estudianteService.saveAsistenciasBatch(dtos).subscribe({
      next: () => {
        this.savingAsistencia.set(false);
        this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Asistencia guardada correctamente' });
      },
      error: () => {
        this.savingAsistencia.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar la asistencia' });
      }
    });
  }
}
