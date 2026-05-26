import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { CursoService, Curso, NivelEducativo } from '../../../core/services/curso.service';
import { CursoFormComponent } from '../../../shared/components/curso-form/curso-form.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';

type FilterNivel = 'all' | NivelEducativo;

@Component({
  selector: 'app-director-cursos',
  standalone: true,
  imports: [CommonModule, ButtonModule, ToastModule, SkeletonModule, TooltipModule, CursoFormComponent, ModalComponent, ConfirmModalComponent],
  providers: [MessageService],
  template: `
    <div class="page">
      <p-toast />

      <div class="page-header">
        <div>
          <h1 class="page-title">Cursos</h1>
          <p class="page-subtitle">{{ cursos().length }} curso{{ cursos().length !== 1 ? 's' : '' }} registrados · {{ anioActual }}</p>
        </div>
        <button class="btn-primary" (click)="openCreate()">
          <i class="pi pi-plus"></i> Nuevo curso
        </button>
      </div>

      <div class="stats-row">
        @for (stat of stats(); track stat.label) {
          <div class="stat-card" [style.--accent]="stat.color">
            <div class="stat-dot"></div>
            <div class="stat-body">
              <span class="stat-num">{{ stat.count }}</span>
              <span class="stat-lbl">{{ stat.label }}</span>
            </div>
          </div>
        }
      </div>

      <div class="filter-bar">
        @for (f of filters; track f.value) {
          <button class="filter-chip" [class.active]="activeFilter() === f.value" (click)="activeFilter.set(f.value)">
            {{ f.label }}
          </button>
        }
      </div>

      @if (loading()) {
        <div class="cards-grid">
          @for (i of skeletons; track i) {
            <div class="curso-card skeleton-card">
              <p-skeleton height="1rem" width="60%" styleClass="mb-3" />
              <p-skeleton height="1.25rem" width="85%" styleClass="mb-2" />
              <p-skeleton height="0.75rem" width="70%" />
            </div>
          }
        </div>
      } @else if (filteredCursos().length === 0) {
        <div class="empty-state">
          <i class="pi pi-book"></i>
          <p>No hay cursos en este nivel todavía.</p>
          <button class="btn-ghost" (click)="openCreate()">Crear el primero</button>
        </div>
      } @else {
        <div class="cards-grid">
          @for (curso of filteredCursos(); track curso.id) {
            <div class="curso-card" [style.--nivel-color]="nivelColor(curso.nivel)">
              <div class="card-accent"></div>
              <div class="card-body">
                <div class="card-badges">
                  <span class="badge-nivel"
                    [style.background]="nivelBg(curso.nivel)"
                    [style.color]="nivelColor(curso.nivel)">
                    {{ nivelLabel(curso.nivel) }}
                  </span>
                  @for (g of curso.grados; track g) {
                    <span class="badge-grado">{{ g }}°</span>
                  }
                  @if (curso.seccion) {
                    <span class="badge-grado">{{ curso.seccion }}</span>
                  }
                  @if (curso.anio) {
                    <span class="badge-grado">{{ curso.anio }}</span>
                  }
                  @if (curso.activo === false) {
                    <span class="badge-inactive">Inactivo</span>
                  }
                </div>
                <h3 class="card-nombre">{{ curso.nombre }}</h3>
                @if (curso.descripcion) {
                  <p class="card-desc">{{ curso.descripcion }}</p>
                }
              </div>
              <div class="card-footer">
                <div class="card-profesor">
                  @if (curso.profesorNombre) {
                    <i class="pi pi-user"></i>
                    <span>{{ curso.profesorNombre }}</span>
                  } @else {
                    <span class="sin-profesor">Sin docente asignado</span>
                  }
                </div>
                <div class="card-actions">
                  <button class="action-btn" (click)="openEdit(curso)" pTooltip="Editar" tooltipPosition="top">
                    <i class="pi pi-pencil"></i>
                  </button>
                  <button class="action-btn danger" (click)="onDelete(curso)" pTooltip="Desactivar" tooltipPosition="top">
                    <i class="pi pi-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          }
        </div>
      }

      <app-confirm-modal
        [(visible)]="showConfirm"
        title="Desactivar curso"
        [message]="'¿Desactivar ' + (pendingCurso?.nombre ?? '') + '? Ya no aparecerá en el sistema.'"
        confirmLabel="Desactivar"
        (confirm)="executeDelete()"
        (cancel)="showConfirm = false" />

      <app-modal
        [(visible)]="showModal"
        [title]="editingCurso ? 'Editar curso' : 'Nuevo curso'"
        [subtitle]="editingCurso ? editingCurso.nombre : 'Completá los campos para registrar el curso'">
        @if (showModal) {
          <app-curso-form
            [curso]="editingCurso"
            (save)="onSave($event)"
            (cancel)="showModal = false" />
        }
      </app-modal>
    </div>
  `,
  styles: [`
    .page { padding: 1.75rem 2rem; display: flex; flex-direction: column; gap: 1.5rem; min-height: 100%; }

    .page-header { display: flex; justify-content: space-between; align-items: flex-start; }
    .page-title { font-size: 1.625rem; font-weight: 700; color: #111827; margin: 0; letter-spacing: -0.02em; }
    .page-subtitle { font-size: 0.875rem; color: #9ca3af; margin: 0.25rem 0 0; }

    .btn-primary {
      display: flex; align-items: center; gap: 0.5rem;
      background: #6366f1; color: white; border: none; border-radius: 10px;
      padding: 0.625rem 1.125rem; font-size: 0.875rem; font-weight: 600;
      cursor: pointer; transition: background 0.15s, transform 0.1s;
    }
    .btn-primary:hover { background: #4f46e5; transform: translateY(-1px); }

    .stats-row { display: flex; gap: 0.875rem; }

    .stat-card {
      display: flex; align-items: center; gap: 0.875rem;
      background: white; border: 1px solid #f3f4f6; border-radius: 12px;
      padding: 0.875rem 1.25rem; min-width: 140px;
    }
    .stat-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--accent); flex-shrink: 0; }
    .stat-body { display: flex; flex-direction: column; }
    .stat-num { font-size: 1.375rem; font-weight: 700; color: #111827; line-height: 1; }
    .stat-lbl { font-size: 0.75rem; color: #9ca3af; margin-top: 0.125rem; }

    .filter-bar { display: flex; gap: 0.5rem; }
    .filter-chip {
      padding: 0.375rem 0.875rem; border-radius: 20px; border: 1.5px solid #e5e7eb;
      background: transparent; font-size: 0.8125rem; font-weight: 500; color: #6b7280;
      cursor: pointer; transition: all 0.15s;
    }
    .filter-chip:hover { border-color: #6366f1; color: #6366f1; }
    .filter-chip.active { background: #6366f1; border-color: #6366f1; color: white; }

    .cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; }

    .curso-card {
      background: white; border: 1px solid #f3f4f6; border-radius: 14px;
      overflow: hidden; display: flex; flex-direction: column;
      transition: box-shadow 0.2s, transform 0.2s;
    }
    .curso-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.07); transform: translateY(-2px); }

    .card-accent { height: 3px; background: var(--nivel-color, #6366f1); }

    .card-body { padding: 1.125rem 1.25rem 0.875rem; flex: 1; display: flex; flex-direction: column; gap: 0.625rem; }

    .card-badges { display: flex; gap: 0.375rem; flex-wrap: wrap; }
    .badge-nivel { font-size: 0.7rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; padding: 0.2rem 0.55rem; border-radius: 20px; }
    .badge-grado { font-size: 0.7rem; font-weight: 600; padding: 0.2rem 0.55rem; border-radius: 20px; background: #f3f4f6; color: #6b7280; }

    .card-nombre { font-size: 1rem; font-weight: 650; color: #111827; margin: 0; line-height: 1.3; }
    .card-desc { font-size: 0.8125rem; color: #6b7280; margin: 0; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

    .card-footer { padding: 0.75rem 1.25rem; border-top: 1px solid #f9fafb; display: flex; justify-content: space-between; align-items: center; }
    .card-profesor { display: flex; align-items: center; gap: 0.375rem; font-size: 0.8125rem; color: #6b7280; }
    .card-profesor i { font-size: 0.75rem; }
    .sin-profesor { font-size: 0.75rem; color: #d1d5db; font-style: italic; }

    .card-actions { display: flex; gap: 0.25rem; }
    .action-btn {
      width: 30px; height: 30px; border-radius: 8px; border: 1px solid #f3f4f6;
      background: transparent; color: #9ca3af; cursor: pointer;
      display: flex; align-items: center; justify-content: center; font-size: 0.75rem; transition: all 0.15s;
    }
    .action-btn:hover { background: #f9fafb; color: #6366f1; border-color: #e0e7ff; }
    .action-btn.danger:hover { background: #fff1f2; color: #f43f5e; border-color: #fecdd3; }

    .skeleton-card { padding: 1.25rem; background: white; border: 1px solid #f3f4f6; border-radius: 14px; min-height: 140px; }

    .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4rem; gap: 0.75rem; }
    .empty-state i { font-size: 2.5rem; color: #e5e7eb; }
    .empty-state p { font-size: 0.9375rem; color: #9ca3af; margin: 0; }
    .btn-ghost { background: transparent; border: 1.5px solid #e5e7eb; border-radius: 8px; padding: 0.5rem 1rem; font-size: 0.8125rem; font-weight: 500; color: #6b7280; cursor: pointer; margin-top: 0.25rem; transition: all 0.15s; }
    .btn-ghost:hover { border-color: #6366f1; color: #6366f1; }

    :host-context(.dark-mode) .page-title, :host-context(.dark-mode) .stat-num, :host-context(.dark-mode) .card-nombre { color: #f9fafb; }
    :host-context(.dark-mode) .stat-card, :host-context(.dark-mode) .curso-card { background: #1e293b; border-color: #334155; }
    :host-context(.dark-mode) .filter-chip { border-color: #334155; color: #94a3b8; }
    :host-context(.dark-mode) .filter-chip.active { background: #6366f1; border-color: #6366f1; color: white; }
    :host-context(.dark-mode) .card-footer { border-color: #334155; }
    :host-context(.dark-mode) .badge-grado { background: #334155; color: #94a3b8; }
    :host-context(.dark-mode) .action-btn { border-color: #334155; color: #64748b; }
  `]
})
export class DirectorCursosComponent implements OnInit {
  private cursoService = inject(CursoService);
  private messageService = inject(MessageService);

  loading = signal(true);
  cursos = signal<Curso[]>([]);
  activeFilter = signal<FilterNivel>('all');
  showModal = false;
  showConfirm = false;
  editingCurso: Curso | null = null;
  pendingCurso: Curso | null = null;
  anioActual = new Date().getFullYear();
  skeletons = [1, 2, 3, 4, 5, 6];

  filters = [
    { label: 'Todos',      value: 'all'        as FilterNivel },
    { label: 'Inicial',    value: 'INICIAL'    as FilterNivel },
    { label: 'Primaria',   value: 'PRIMARIA'   as FilterNivel },
    { label: 'Secundaria', value: 'SECUNDARIA' as FilterNivel }
  ];

  filteredCursos = computed(() => {
    const f = this.activeFilter();
    const all = this.cursos();
    return f === 'all' ? all : all.filter(c => c.nivel === f);
  });

  stats = computed(() => {
    const all = this.cursos();
    return [
      { label: 'Total cursos', count: all.length,                                       color: '#6366f1' },
      { label: 'Primaria',     count: all.filter(c => c.nivel === 'PRIMARIA').length,   color: '#6366f1' },
      { label: 'Secundaria',   count: all.filter(c => c.nivel === 'SECUNDARIA').length, color: '#10b981' },
      { label: 'Inicial',      count: all.filter(c => c.nivel === 'INICIAL').length,    color: '#f59e0b' }
    ];
  });

  ngOnInit() { this.loadCursos(); }

  loadCursos() {
    this.loading.set(true);
    this.cursoService.getAll().subscribe({
      next: (data) => { this.cursos.set(data); this.loading.set(false); },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los cursos' });
        this.loading.set(false);
      }
    });
  }

  openCreate() {
    this.editingCurso = null;
    this.showModal = true;
  }

  openEdit(curso: Curso) {
    this.editingCurso = { ...curso };
    this.showModal = true;
  }

  onSave(curso: Curso) {
    const op = curso.id
      ? this.cursoService.update(curso.id, curso)
      : this.cursoService.create(curso);

    op.subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: curso.id ? 'Curso actualizado' : 'Curso creado' });
        this.showModal = false;
        this.loadCursos();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar el curso' });
      }
    });
  }

  onDelete(curso: Curso) {
    this.pendingCurso = curso;
    this.showConfirm = true;
  }

  executeDelete() {
    if (!this.pendingCurso?.id) return;
    this.cursoService.delete(this.pendingCurso.id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Curso desactivado' });
        this.pendingCurso = null;
        this.loadCursos();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo desactivar' });
      }
    });
  }

  nivelColor(nivel: string): string { return ({ INICIAL: '#f59e0b', PRIMARIA: '#6366f1', SECUNDARIA: '#10b981' } as any)[nivel] ?? '#6b7280'; }
  nivelBg(nivel: string):    string { return ({ INICIAL: '#fef3c7', PRIMARIA: '#e0e7ff', SECUNDARIA: '#d1fae5' } as any)[nivel] ?? '#f3f4f6'; }
  nivelLabel(nivel: string): string { return ({ INICIAL: 'Inicial', PRIMARIA: 'Primaria', SECUNDARIA: 'Secundaria' } as any)[nivel] ?? nivel; }
}
