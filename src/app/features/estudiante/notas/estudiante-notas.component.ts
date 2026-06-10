import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SkeletonModule } from 'primeng/skeleton';
import { EstudianteService, CalificacionDTO } from '../../../core/services/estudiante.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-estudiante-notas',
  standalone: true,
  imports: [CommonModule, SkeletonModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Mis notas</h1>
          @if (!loading()) {
            <p class="page-subtitle">{{ notas().length }} evaluación{{ notas().length !== 1 ? 'es' : '' }} · Promedio general: <strong>{{ promedio() }}</strong></p>
          }
        </div>
      </div>

      @if (loading()) {
        <div class="table-wrap">
          <table class="notas-table">
            <thead>
              <tr>
                <th>Curso</th><th>Tipo</th><th>Nota</th><th>Fecha</th><th>Observaciones</th>
              </tr>
            </thead>
            <tbody>
              @for (i of [1,2,3,4,5]; track i) {
                <tr>
                  @for (j of [1,2,3,4,5]; track j) {
                    <td><p-skeleton height="1rem" /></td>
                  }
                </tr>
              }
            </tbody>
          </table>
        </div>
      } @else if (notas().length === 0) {
        <div class="empty-state">
          <i class="pi pi-star"></i>
          <p>No tenés calificaciones registradas todavía.</p>
        </div>
      } @else {
        <div class="table-wrap">
          <table class="notas-table">
            <thead>
              <tr>
                <th>Curso</th>
                <th>Tipo</th>
                <th>Nota</th>
                <th>Fecha</th>
                <th>Observaciones</th>
              </tr>
            </thead>
            <tbody>
              @for (nota of notas(); track nota.id) {
                <tr>
                  <td class="td-curso">{{ nota.cursoNombre ?? '—' }}</td>
                  <td><span class="badge" [class]="tipoClass(nota.tipo)">{{ nota.tipo ?? '—' }}</span></td>
                  <td class="td-nota" [class]="notaClass(nota.valor)">{{ nota.valor ?? '—' }}</td>
                  <td class="td-fecha">{{ nota.fecha ? (nota.fecha | date:'dd/MM/yyyy') : '—' }}</td>
                  <td class="td-obs">{{ nota.observaciones ?? '' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
  styles: [`
    .page { padding: 1.75rem 2rem; display: flex; flex-direction: column; gap: 1.5rem; min-height: 100%; }

    .page-header { display: flex; justify-content: space-between; align-items: flex-start; }
    .page-title   { font-size: 1.625rem; font-weight: 700; color: var(--ink); margin: 0; letter-spacing: -0.02em; }
    .page-subtitle { font-size: 0.875rem; color: var(--ink-4); margin: 0.25rem 0 0; }
    .page-subtitle strong { color: var(--ink-2); }

    .table-wrap {
      background: var(--card-bg);
      border: 1px solid var(--line);
      border-radius: 12px;
      overflow: auto;
    }

    .notas-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }

    .notas-table thead tr {
      border-bottom: 1px solid var(--line);
    }

    .notas-table th {
      padding: 0.75rem 1rem;
      text-align: left;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--ink-3);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      white-space: nowrap;
    }

    .notas-table tbody tr {
      border-bottom: 1px solid var(--line);
      transition: background 0.12s;
    }
    .notas-table tbody tr:last-child { border-bottom: none; }
    .notas-table tbody tr:hover { background: var(--bg-2); }

    .notas-table td {
      padding: 0.875rem 1rem;
      color: var(--ink-2);
      vertical-align: middle;
    }

    .td-curso { font-weight: 600; color: var(--ink); }
    .td-nota  { font-weight: 700; font-size: 1rem; }
    .td-fecha { color: var(--ink-3); font-size: 0.8125rem; white-space: nowrap; }
    .td-obs   { color: var(--ink-3); font-size: 0.8125rem; max-width: 200px; }

    .nota-aprobado { color: var(--ok); }
    .nota-regular  { color: var(--warn); }
    .nota-reprobado { color: var(--err); }

    .badge {
      display: inline-block;
      padding: 0.2em 0.6em;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      background: var(--bg-2);
      color: var(--ink-3);
    }
    .badge-examen   { background: var(--info-bg);  color: var(--info); }
    .badge-practica { background: color-mix(in srgb, var(--ok) 14%, transparent); color: var(--ok); }
    .badge-tarea    { background: var(--accent-soft); color: var(--accent); }

    .empty-state { display: flex; flex-direction: column; align-items: center; padding: 4rem; gap: 0.75rem; }
    .empty-state i { font-size: 2.5rem; color: var(--line); }
    .empty-state p { font-size: 0.9375rem; color: var(--ink-4); margin: 0; }
  `]
})
export class EstudianteNotasComponent implements OnInit {
  private estudianteService = inject(EstudianteService);

  loading = signal(true);
  notas   = signal<CalificacionDTO[]>([]);

  promedio = computed(() => {
    const n = this.notas();
    if (!n.length) return '—';
    const avg = n.reduce((s, c) => s + (c.valor ?? 0), 0) / n.length;
    return avg.toFixed(1);
  });

  ngOnInit() {
    this.estudianteService.getMisNotas().subscribe({
      next: (data) => { this.notas.set(data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  notaClass(valor?: number): string {
    if (valor == null) return '';
    if (valor >= 14) return 'nota-aprobado';
    if (valor >= 11) return 'nota-regular';
    return 'nota-reprobado';
  }

  tipoClass(tipo?: string): string {
    if (!tipo) return '';
    const map: Record<string, string> = {
      EXAMEN: 'badge-examen',
      PRACTICA: 'badge-practica',
      TAREA: 'badge-tarea',
    };
    return map[tipo.toUpperCase()] ?? '';
  }
}
