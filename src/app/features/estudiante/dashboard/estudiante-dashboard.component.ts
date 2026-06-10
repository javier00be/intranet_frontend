import { Component, computed, inject , ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-estudiante-dashboard',
  standalone: true,
  imports: [CommonModule, CardModule, TagModule, RouterModule],
  template: `
    <div class="dashboard">
      <h1>Bienvenido, {{ authService.user()?.nombre }}</h1>
      
      <div class="stats">
        <p-card header="Mis Cursos">
          <span class="stat-value">6</span>
        </p-card>
        <p-card header="Tareas Pendientes">
          <span class="stat-value warning">4</span>
        </p-card>
        <p-card header="Asistencia">
          <span class="stat-value success">95%</span>
        </p-card>
        <p-card header="Promedio">
          <span class="stat-value">16.5</span>
        </p-card>
      </div>

      <div class="section">
        <p-card header="Mis Cursos">
          <div class="courses-list">
            @for (curso of misCursos; track curso.id) {
              <div class="course-item">
                <div class="course-info">
                  <strong>{{ curso.nombre }}</strong>
                  <span>{{ curso.profesor }}</span>
                </div>
                <p-tag [value]="curso.nivel" severity="info" />
              </div>
            }
          </div>
        </p-card>
      </div>

      <div class="section">
        <p-card header="Próximas Tareas">
          <div class="tasks-list">
            @for (tarea of tareasPendientes; track tarea.id) {
              <div class="task-item">
                <div class="task-info">
                  <strong>{{ tarea.titulo }}</strong>
                  <span>{{ tarea.curso }} - Entrega: {{ tarea.fecha }}</span>
                </div>
                <p-tag [value]="tarea.prioridad" [severity]="tarea.prioridad === 'Urgente' ? 'danger' : 'warn'" />
              </div>
            }
          </div>
        </p-card>
      </div>
    </div>
  `,
  styles: [`
    .dashboard h1 { margin-bottom: 1.5rem; }
    .stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
    }
    .stat-value {
      font-size: 2rem;
      font-weight: bold;
      color: #818cf8;
    }
    .stat-value.warning { color: #f59e0b; }
    .stat-value.success { color: #10b981; }
    .section { margin-top: 1.5rem; }
    .courses-list, .tasks-list { display: flex; flex-direction: column; gap: 1rem; }
    .course-item, .task-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      background: var(--bg-tertiary);
      border-radius: 8px;
    }
    .course-info, .task-info { display: flex; flex-direction: column; }
    .course-info span, .task-info span { color: var(--text-secondary); font-size: 0.9rem; }
  `]
})
export class EstudianteDashboardComponent {
  authService = inject(AuthService);

  misCursos = [
    { id: 1, nombre: 'Matemáticas', profesor: 'Prof. Juan Pérez', nivel: 'Secundaria' },
    { id: 2, nombre: 'Lenguaje', profesor: 'Prof. María García', nivel: 'Secundaria' },
    { id: 3, nombre: 'Ciencias', profesor: 'Prof. Carlos López', nivel: 'Secundaria' },
    { id: 4, nombre: 'Historia', profesor: 'Prof. Ana Martínez', nivel: 'Secundaria' },
  ];

  tareasPendientes = [
    { id: 1, titulo: 'Trabajo de investigación', curso: 'Ciencias', fecha: '10/05/2026', prioridad: 'Urgente' },
    { id: 2, titulo: 'Ejercicios de álgebra', curso: 'Matemáticas', fecha: '12/05/2026', prioridad: 'Normal' },
    { id: 3, titulo: 'Ensayo sobre historia', curso: 'Historia', fecha: '15/05/2026', prioridad: 'Normal' },
  ];
}