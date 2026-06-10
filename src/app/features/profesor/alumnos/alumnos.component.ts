import { Component, OnInit, inject, signal, computed , ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { Select } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { CursoService, Curso } from '../../../core/services/curso.service';
import { EstudianteService, EstudianteDTO } from '../../../core/services/estudiante.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-alumnos',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, CardModule, Select, TableModule, ButtonModule, SkeletonModule],
  template: `
    <div class="alumnos-container">

      <div class="filter-bar">
        <p-select
          [options]="cursoOptions()"
          [(ngModel)]="selectedCursoId"
          optionLabel="label"
          optionValue="value"
          placeholder="Seleccioná un curso"
          [style]="{ minWidth: '320px' }"
          (onChange)="onCursoChange()" />
        <span *ngIf="selectedCursoId" class="alumno-count">
          {{ estudiantes().length }} alumno{{ estudiantes().length !== 1 ? 's' : '' }}
        </span>
      </div>

      <div *ngIf="loadingStudents()" class="loading">
        <p-skeleton *ngFor="let _ of [1,2,3,4,5]" height="52px" styleClass="mb-2" />
      </div>

      <p-table
        *ngIf="!loadingStudents() && selectedCursoId"
        [value]="estudiantes()"
        [rows]="30"
        [paginator]="estudiantes().length > 30"
        responsiveLayout="scroll"
        stripedRows>
        <ng-template pTemplate="header">
          <tr>
            <th>Alumno</th>
            <th>DNI</th>
            <th>Sección</th>
            <th class="text-right">Acciones</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-e>
          <tr>
            <td>{{ e.usuario?.nombre }} {{ e.usuario?.apellido }}</td>
            <td>{{ e.dni ?? '-' }}</td>
            <td>{{ e.seccion ?? '-' }}</td>
            <td class="text-right">
              <p-button
                label="Ver notas"
                icon="pi pi-pencil"
                size="small"
                [routerLink]="['/profesor/notas']"
                [queryParams]="{ curso: selectedCursoId, estudiante: e.id }" />
            </td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="4" class="text-center p-4 text-secondary">
              No hay alumnos registrados para este nivel y grado
            </td>
          </tr>
        </ng-template>
      </p-table>

      <div *ngIf="!selectedCursoId && !loadingStudents()" class="select-prompt">
        <i class="pi pi-users"></i>
        <p>Seleccioná un curso para ver los alumnos</p>
      </div>

    </div>
  `,
  styles: [`
    .alumnos-container { display: flex; flex-direction: column; gap: 1.5rem; }
    .filter-bar { display: flex; align-items: center; gap: 1rem; }
    .alumno-count { font-size: 0.875rem; color: var(--text-secondary); }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .text-secondary { color: var(--text-secondary); }
    .select-prompt { text-align: center; padding: 3rem; color: var(--text-secondary); }
    .select-prompt i { font-size: 2.5rem; display: block; margin-bottom: 1rem; }
  `]
})
export class AlumnosComponent implements OnInit {
  private cursoService = inject(CursoService);
  private estudianteService = inject(EstudianteService);
  private route = inject(ActivatedRoute);

  cursos = signal<Curso[]>([]);
  estudiantes = signal<EstudianteDTO[]>([]);
  loadingStudents = signal(false);
  selectedCursoId: number | null = null;

  cursoOptions = computed(() =>
    this.cursos().map(c => ({
      label: `${c.nombre} — ${c.nivel} Grado ${c.grados?.[0]} ${c.seccion ?? ''}`.trim(),
      value: c.id as number
    }))
  );

  ngOnInit(): void {
    this.cursoService.getMisCursos().subscribe(cursos => {
      this.cursos.set(cursos);
      const param = this.route.snapshot.queryParamMap.get('curso');
      if (param) {
        this.selectedCursoId = Number(param);
        this.loadStudents();
      }
    });
  }

  onCursoChange(): void {
    this.estudiantes.set([]);
    this.loadStudents();
  }

  private loadStudents(): void {
    if (!this.selectedCursoId) return;
    const curso = this.cursos().find(c => c.id === this.selectedCursoId);
    if (!curso) return;

    this.loadingStudents.set(true);
    this.estudianteService.getByNivelAndGrado(curso.nivel, curso.grados?.[0] ?? 1, curso.seccion).subscribe({
      next: (data) => { this.estudiantes.set(data); this.loadingStudents.set(false); },
      error: () => this.loadingStudents.set(false)
    });
  }
}
