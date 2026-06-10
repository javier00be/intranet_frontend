import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SkeletonModule } from 'primeng/skeleton';
import { AuthService } from '../../../core/services/auth.service';
import { DashboardService, DashboardData } from '../../../core/services/dashboard.service';
import { EstudianteService, CalificacionDTO } from '../../../core/services/estudiante.service';
import { forkJoin } from 'rxjs';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-estudiante-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, SkeletonModule],
  template: `
    <div class="dashboard">
      <div class="page-header">
        <h1 class="page-title">Bienvenido, {{ authService.user()?.nombre }}</h1>
        <p class="page-subtitle">Resumen de tu actividad escolar</p>
      </div>

      @if (loading()) {
        <div class="stats-grid">
          @for (i of [1,2,3,4]; track i) {
            <div class="stat-card"><p-skeleton height="80px" /></div>
          }
        </div>
      } @else {
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon blue"><i class="pi pi-book"></i></div>
            <div class="stat-body">
              <span class="stat-value">{{ data()?.misCursos ?? 0 }}</span>
              <span class="stat-label">Cursos</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon green"><i class="pi pi-check-circle"></i></div>
            <div class="stat-body">
              <span class="stat-value">{{ asistenciaPct() }}%</span>
              <span class="stat-label">Asistencia</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon orange"><i class="pi pi-star"></i></div>
            <div class="stat-body">
              <span class="stat-value">{{ promedio() }}</span>
              <span class="stat-label">Promedio</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon purple"><i class="pi pi-chart-line"></i></div>
            <div class="stat-body">
              <span class="stat-value">{{ notas().length }}</span>
              <span class="stat-label">Evaluaciones</span>
            </div>
          </div>
        </div>
      }

      <div class="quick-links">
        <a routerLink="../cursos" class="quick-link">
          <i class="pi pi-book"></i>
          <span>Mis Cursos</span>
        </a>
        <a routerLink="../notas" class="quick-link">
          <i class="pi pi-star"></i>
          <span>Mis Notas</span>
        </a>
      </div>
    </div>
  `,
  styles: [`
    .dashboard { padding: 1.75rem 2rem; display: flex; flex-direction: column; gap: 1.5rem; }

    .page-header { display: flex; flex-direction: column; gap: 0.25rem; }
    .page-title  { font-size: 1.625rem; font-weight: 700; color: var(--ink); margin: 0; letter-spacing: -0.02em; }
    .page-subtitle { font-size: 0.875rem; color: var(--ink-4); margin: 0; }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 1rem;
    }

    .stat-card {
      background: var(--card-bg);
      border: 1px solid var(--line);
      border-radius: 12px;
      padding: 1.25rem;
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .stat-icon {
      width: 3rem; height: 3rem; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .stat-icon i { font-size: 1.25rem; }
    .stat-icon.blue   { background: var(--info-bg);   } .stat-icon.blue i   { color: var(--info); }
    .stat-icon.green  { background: color-mix(in srgb, var(--ok) 14%, transparent); } .stat-icon.green i  { color: var(--ok); }
    .stat-icon.orange { background: var(--warn-bg);   } .stat-icon.orange i { color: var(--warn); }
    .stat-icon.purple { background: var(--purple-bg); } .stat-icon.purple i { color: var(--purple); }

    .stat-body  { display: flex; flex-direction: column; gap: 2px; }
    .stat-value { font-size: 1.75rem; font-weight: 700; color: var(--ink); line-height: 1; }
    .stat-label { font-size: 0.8rem; color: var(--ink-3); }

    .quick-links {
      display: flex;
      gap: 1rem;
    }

    .quick-link {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.25rem;
      background: var(--accent-soft);
      border-radius: 8px;
      color: var(--accent);
      font-weight: 600;
      font-size: 0.875rem;
      text-decoration: none;
      transition: background 0.15s;
    }
    .quick-link:hover { background: color-mix(in srgb, var(--accent) 20%, transparent); }
    .quick-link i { font-size: 0.875rem; }
  `]
})
export class EstudianteDashboardComponent implements OnInit {
  authService = inject(AuthService);
  private dashboardService = inject(DashboardService);
  private estudianteService = inject(EstudianteService);

  loading = signal(true);
  data    = signal<DashboardData | null>(null);
  notas   = signal<CalificacionDTO[]>([]);

  promedio = signal('—');
  asistenciaPct = signal(0);

  ngOnInit() {
    forkJoin({
      dashboard:  this.dashboardService.get(),
      notas:      this.estudianteService.getMisNotas(),
      asistencia: this.estudianteService.getMiAsistencia(),
    }).subscribe({
      next: ({ dashboard, notas, asistencia }) => {
        this.data.set(dashboard);
        this.notas.set(notas);
        this.promedio.set(this.calcPromedio(notas));
        this.asistenciaPct.set(this.calcAsistencia(asistencia));
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  private calcAsistencia(asistencia: import('../../../core/services/estudiante.service').AsistenciaDTO[]): number {
    if (!asistencia.length) return 0;
    const presentes = asistencia.filter(a => a.presente).length;
    return Math.round((presentes / asistencia.length) * 100);
  }

  private calcPromedio(notas: CalificacionDTO[]): string {
    if (!notas.length) return '—';
    const avg = notas.reduce((s, n) => s + (n.valor ?? 0), 0) / notas.length;
    return avg.toFixed(1);
  }
}
