import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SkeletonModule } from 'primeng/skeleton';
import { TareaService, TareaDTO } from '../../../core/services/tarea.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-estudiante-tareas',
  standalone: true,
  imports: [CommonModule, SkeletonModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1 class="page-title">Mis tareas</h1>
        @if (!loading()) {
          <p class="page-subtitle">{{ pendientes() }} pendiente{{ pendientes() !== 1 ? 's' : '' }}</p>
        }
      </div>

      @if (loading()) {
        <div class="tasks-list">
          @for (i of [1,2,3]; track i) {
            <div class="task-card skeleton-card">
              <p-skeleton height="1rem" width="30%" styleClass="mb-2" />
              <p-skeleton height="1.25rem" width="70%" styleClass="mb-1" />
              <p-skeleton height="0.875rem" width="50%" />
            </div>
          }
        </div>
      } @else if (tareas().length === 0) {
        <div class="empty-state">
          <i class="pi pi-check-circle"></i>
          <p>¡No tenés tareas pendientes!</p>
        </div>
      } @else {
        <div class="tasks-list">
          @for (tarea of tareasOrdenadas(); track tarea.id) {
            <div class="task-card" [class.vencida]="estaVencida(tarea)">
              <div class="task-meta">
                <span class="curso-badge">{{ tarea.cursoNombre ?? 'Curso' }}</span>
                @if (tarea.fechaEntrega) {
                  <span class="fecha" [class.fecha-vencida]="estaVencida(tarea)">
                    <i class="pi pi-calendar"></i>
                    Entrega: {{ tarea.fechaEntrega | date:'dd/MM/yyyy' }}
                  </span>
                }
              </div>
              <h3 class="task-titulo">{{ tarea.titulo }}</h3>
              @if (tarea.descripcion) {
                <p class="task-desc">{{ tarea.descripcion }}</p>
              }
              @if (tarea.archivoUrl) {
                <a [href]="tarea.archivoUrl" target="_blank" class="archivo-link">
                  <i class="pi pi-paperclip"></i> Ver archivo adjunto
                </a>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .page { padding: 1.75rem 2rem; display: flex; flex-direction: column; gap: 1.5rem; min-height: 100%; }

    .page-header { display: flex; flex-direction: column; gap: 0.25rem; }
    .page-title    { font-size: 1.625rem; font-weight: 700; color: var(--ink); margin: 0; letter-spacing: -0.02em; }
    .page-subtitle { font-size: 0.875rem; color: var(--ink-4); margin: 0; }

    .tasks-list { display: flex; flex-direction: column; gap: 0.75rem; }

    .task-card {
      background: var(--card-bg);
      border: 1px solid var(--line);
      border-radius: 12px;
      padding: 1.125rem 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .task-card.vencida { border-color: color-mix(in srgb, var(--err) 35%, transparent); }

    .skeleton-card { min-height: 90px; }

    .task-meta {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .curso-badge {
      font-size: 0.75rem;
      font-weight: 600;
      background: var(--accent-soft);
      color: var(--accent);
      padding: 0.2em 0.6em;
      border-radius: 6px;
    }

    .fecha {
      display: flex;
      align-items: center;
      gap: 0.3rem;
      font-size: 0.8125rem;
      color: var(--ink-3);
    }
    .fecha i { font-size: 0.75rem; }
    .fecha-vencida { color: var(--err); }

    .task-titulo { font-size: 1rem; font-weight: 600; color: var(--ink); margin: 0; }
    .task-desc   { font-size: 0.875rem; color: var(--ink-3); margin: 0; line-height: 1.5; }

    .archivo-link {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.8125rem;
      color: var(--accent);
      text-decoration: none;
    }
    .archivo-link:hover { text-decoration: underline; }

    .empty-state { display: flex; flex-direction: column; align-items: center; padding: 4rem; gap: 0.75rem; }
    .empty-state i { font-size: 2.5rem; color: var(--ok); }
    .empty-state p { font-size: 0.9375rem; color: var(--ink-4); margin: 0; }
  `]
})
export class EstudianteTareasComponent implements OnInit {
  private tareaService = inject(TareaService);

  loading = signal(true);
  tareas  = signal<TareaDTO[]>([]);

  pendientes = () => this.tareas().filter(t => !this.estaVencida(t)).length;

  tareasOrdenadas = () =>
    [...this.tareas()].sort((a, b) => {
      if (!a.fechaEntrega) return 1;
      if (!b.fechaEntrega) return -1;
      return new Date(a.fechaEntrega).getTime() - new Date(b.fechaEntrega).getTime();
    });

  ngOnInit() {
    this.tareaService.getMisTareas().subscribe({
      next: (data) => { this.tareas.set(data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  estaVencida(tarea: TareaDTO): boolean {
    if (!tarea.fechaEntrega) return false;
    return new Date(tarea.fechaEntrega) < new Date();
  }
}
