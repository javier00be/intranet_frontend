import { Component, OnInit, inject, signal, computed , ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { CursoService, Curso } from '../../../core/services/curso.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-profesor-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, CardModule, TagModule, SkeletonModule],
  template: `
    <div class="dashboard">

      <div class="stats-grid" *ngIf="!loading()">
        <p-card>
          <div class="stat">
            <span class="stat-num">{{ cursos().length }}</span>
            <span class="stat-label">Mis Cursos</span>
          </div>
        </p-card>
        <p-card>
          <div class="stat">
            <span class="stat-num">{{ cursosActivos() }}</span>
            <span class="stat-label">Activos</span>
          </div>
        </p-card>
      </div>

      <div *ngIf="loading()" class="stats-grid">
        <p-skeleton *ngFor="let _ of [1,2]" height="96px" />
      </div>

      <div class="section">
        <h3>Mis Cursos</h3>

        <div *ngIf="loading()" class="courses-grid">
          <p-skeleton *ngFor="let _ of [1,2,3]" height="140px" />
        </div>

        <div *ngIf="!loading()" class="courses-grid">
          @for (curso of cursos(); track curso.id) {
            <div class="curso-card">
              <div class="curso-header">
                <strong>{{ curso.nombre }}</strong>
                <p-tag
                  [value]="curso.activo ? 'Activo' : 'Inactivo'"
                  [severity]="curso.activo ? 'success' : 'warn'" />
              </div>
              <div class="curso-meta">
                <span class="badge nivel">{{ curso.nivel }}</span>
                <span class="badge grado">Grado {{ curso.grados[0] }} {{ curso.seccion ?? '' }}</span>
              </div>
              <div class="curso-actions">
                <a [routerLink]="['/profesor/alumnos']"
                   [queryParams]="{ curso: curso.id }"
                   class="btn-link">
                  <i class="pi pi-users"></i> Alumnos
                </a>
                <a [routerLink]="['/profesor/notas']"
                   [queryParams]="{ curso: curso.id }"
                   class="btn-link btn-accent">
                  <i class="pi pi-pencil"></i> Notas
                </a>
              </div>
            </div>
          }

          <div *ngIf="cursos().length === 0" class="empty-state">
            <i class="pi pi-book"></i>
            <p>No tenés cursos asignados.</p>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .stat {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 0.5rem;
    }
    .stat-num { font-size: 2.5rem; font-weight: 700; color: var(--accent, #818cf8); }
    .stat-label { color: var(--text-secondary); font-size: 0.875rem; }
    h3 { margin-bottom: 1rem; }
    .courses-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1rem;
    }
    .curso-card {
      background: var(--surface-b);
      border: 1px solid var(--surface-d);
      border-radius: 10px;
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .curso-header { display: flex; justify-content: space-between; align-items: center; }
    .curso-meta { display: flex; gap: 0.5rem; }
    .badge {
      font-size: 0.75rem;
      padding: 0.2rem 0.6rem;
      border-radius: 999px;
      background: var(--surface-d);
      color: var(--text-secondary);
      text-transform: capitalize;
    }
    .curso-actions { display: flex; gap: 0.75rem; margin-top: 0.25rem; }
    .btn-link {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.4rem 0.8rem;
      border-radius: 6px;
      background: var(--surface-d);
      color: var(--text-color);
      text-decoration: none;
      font-size: 0.85rem;
      transition: opacity 0.2s;
    }
    .btn-link:hover { opacity: 0.8; }
    .btn-link.btn-accent { background: var(--accent, #818cf8); color: white; }
    .empty-state { text-align: center; padding: 3rem; color: var(--text-secondary); }
    .empty-state i { font-size: 3rem; display: block; margin-bottom: 1rem; }
  `]
})
export class ProfesorDashboardComponent implements OnInit {
  private cursoService = inject(CursoService);

  cursos = signal<Curso[]>([]);
  loading = signal(true);

  cursosActivos = computed(() => this.cursos().filter(c => c.activo).length);

  ngOnInit(): void {
    this.cursoService.getMisCursos().subscribe({
      next: (data) => { this.cursos.set(data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }
}
