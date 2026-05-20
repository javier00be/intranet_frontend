import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { CursoService, Curso } from '../../../core/services/curso.service';
import { CursoFormComponent } from '../../../shared/components/curso-form/curso-form.component';

@Component({
  selector: 'app-director-cursos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    CardModule,
    ButtonModule,
    TagModule,
    DialogModule,
    ProgressSpinnerModule,
    ToastModule,
    CursoFormComponent
  ],
  providers: [MessageService],
  template: `
    <div class="page-container">
      <p-toast />
      <div class="header">
        <div class="title-section">
          <h1>Administración de Cursos</h1>
          <p class="subtitle">Gestiona la malla curricular y asignación de docentes</p>
        </div>
        <div class="actions">
          <p-button label="Nuevo Curso" icon="pi pi-plus" (click)="showDialog()" />
        </div>
      </div>

      <div class="stats-row">
        <div class="stat-mini-card">
          <span class="label">Cursos Activos</span>
          <span class="value">{{ cursos.length }}</span>
        </div>
        <div class="stat-mini-card">
          <span class="label">Horas Semanales</span>
          <span class="value">160</span>
        </div>
        <div class="stat-mini-card">
          <span class="label">Alumnos Matriculados</span>
          <span class="value">{{ totalMatriculados }}</span>
        </div>
      </div>

      <p-card>
        <div *ngIf="isLoading()" class="flex justify-center p-8">
          <p-progressspinner styleClass="w-16 h-16" strokeWidth="4" fill="transparent" animationDuration=".5s" />
        </div>

        <p-table 
          *ngIf="!isLoading()"
          [value]="cursos" 
          [paginator]="true" 
          [rows]="10"
          styleClass="p-datatable-striped">
          <ng-template pTemplate="header">
            <tr>
              <th>Código</th>
              <th>Curso</th>
              <th>Nivel/Grado</th>
              <th>Capacidad</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-curso>
            <tr>
              <td><span class="font-mono font-bold">{{ curso.codigo }}</span></td>
              <td>
                <div class="course-cell">
                  <span class="course-name">{{ curso.nombre }}</span>
                  <span class="course-category">{{ curso.categoria }}</span>
                </div>
              </td>
              <td>{{ curso.grado }}</td>
              <td>
                <div class="capacity-bar">
                  <span class="capacity-text">{{ curso.matriculados }}/{{ curso.capacidad }}</span>
                  <div class="bar-bg">
                    <div class="bar-fill" [style.width.%]="(curso.matriculados/curso.capacidad)*100"></div>
                  </div>
                </div>
              </td>
              <td>
                <p-tag [value]="curso.estado" [severity]="curso.estado === 'Activo' ? 'success' : 'secondary'" />
              </td>
              <td>
                <div class="table-actions">
                  <p-button icon="pi pi-pencil" severity="secondary" rounded text />
                  <p-button icon="pi pi-trash" severity="danger" rounded text (click)="onDeleteCurso(curso.id!)" />
                </div>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="6" class="text-center p-8">No se encontraron cursos registrados.</td>
            </tr>
          </ng-template>
        </p-table>
      </p-card>

      <p-dialog header="Crear Nuevo Curso" [(visible)]="display" [modal]="true" [style]="{ width: '500px' }">
        <app-curso-form (save)="onSaveCurso($event)" (cancel)="display = false" />
      </p-dialog>
    </div>
  `,
  styles: [`
    .page-container {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .title-section h1 {
      font-size: 1.75rem;
      margin: 0;
      color: #111827;
    }

    .subtitle {
      color: #6b7280;
      margin: 0.25rem 0 0;
    }

    .stats-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.5rem;
    }

    .stat-mini-card {
      background: white;
      padding: 1.25rem;
      border-radius: 12px;
      border: 1px solid #e5e7eb;
      display: flex;
      flex-direction: column;
    }

    .stat-mini-card .label {
      font-size: 0.875rem;
      color: #6b7280;
    }

    .stat-mini-card .value {
      font-size: 1.5rem;
      font-weight: 700;
      color: #111827;
    }

    .course-cell {
      display: flex;
      flex-direction: column;
    }

    .course-name {
      font-weight: 600;
      color: #111827;
    }

    .course-category {
      font-size: 0.75rem;
      color: #6b7280;
    }

    .capacity-bar {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      width: 100px;
    }

    .capacity-text {
      font-size: 0.75rem;
      color: #6b7280;
    }

    .bar-bg {
      height: 6px;
      background: #f3f4f6;
      border-radius: 3px;
      overflow: hidden;
    }

    .bar-fill {
      height: 100%;
      background: #6366f1;
    }

    .table-actions {
      display: flex;
      gap: 0.25rem;
    }

    .flex { display: flex; }
    .justify-center { justify-content: center; }
    .p-8 { padding: 2rem; }
    .w-16 { width: 4rem; }
    .h-16 { height: 4rem; }

    /* Dark mode */
    :host-context(.dark-mode) .stat-mini-card {
      background: #1e293b;
      border-color: #334155;
    }

    :host-context(.dark-mode) .stat-mini-card .value,
    :host-context(.dark-mode) .title-section h1,
    :host-context(.dark-mode) .course-name {
      color: #f9fafb;
    }
  `]
})
export class DirectorCursosComponent implements OnInit {
  private cursoService = inject(CursoService);
  private messageService = inject(MessageService);

  display: boolean = false;
  isLoading = signal<boolean>(true);
  cursos: Curso[] = [];
  totalMatriculados = 0;

  ngOnInit() {
    this.loadCursos();
  }

  loadCursos() {
    this.isLoading.set(true);
    this.cursoService.getAll().subscribe({
      next: (data) => {
        this.cursos = data;
        this.totalMatriculados = this.cursos.reduce((acc, curr) => acc + (curr.matriculados || 0), 0);
        this.isLoading.set(false);
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los cursos' });
        this.isLoading.set(false);
      }
    });
  }

  showDialog() {
    this.display = true;
  }

  onSaveCurso(curso: Curso) {
    this.cursoService.create(curso).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Curso creado correctamente' });
        this.display = false;
        this.loadCursos();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear el curso' });
      }
    });
  }

  onDeleteCurso(id: number) {
    if (confirm('¿Estás seguro de eliminar este curso?')) {
      this.cursoService.delete(id).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Curso eliminado' });
          this.loadCursos();
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el curso' });
        }
      });
    }
  }
}