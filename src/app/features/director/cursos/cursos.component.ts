import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { MessageService } from 'primeng/api';
import { CursoService, Curso, NivelEducativo } from '../../../core/services/curso.service';
import { CursoFormComponent } from '../../../shared/components/curso-form/curso-form.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';

interface GradoInfo { value: number; label: string; }

const GRADOS_POR_NIVEL: Record<string, GradoInfo[]> = {
  INICIAL:    [{ value: 1, label: '3 años' }, { value: 2, label: '4 años' }, { value: 3, label: '5 años' }],
  PRIMARIA:   [1,2,3,4,5,6].map(n => ({ value: n, label: `${n}°` })),
  SECUNDARIA: [1,2,3,4,5].map(n => ({ value: n, label: `${n}°` }))
};

const NIVELES: NivelEducativo[] = ['INICIAL', 'PRIMARIA', 'SECUNDARIA'];

@Component({
  selector: 'app-director-cursos',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ButtonModule, ToastModule, SkeletonModule,
    TooltipModule, TagModule, InputTextModule, IconFieldModule, InputIconModule,
    CursoFormComponent, ModalComponent, ConfirmModalComponent
  ],
  providers: [MessageService],
  template: `
    <div class="page">
      <p-toast />

      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Cursos</h1>
          <p class="page-subtitle">{{ cursos().length }} curso{{ cursos().length !== 1 ? 's' : '' }} · {{ anioActual }}</p>
        </div>
        <div class="header-actions">
          <p-iconfield>
            <p-inputicon styleClass="pi pi-search" />
            <input pInputText [(ngModel)]="searchTerm" placeholder="Buscar…" class="search-input" />
          </p-iconfield>
          <p-button label="Nuevo curso" icon="pi pi-plus" (click)="openCreate()" />
        </div>
      </div>

      @if (loading()) {
        <div class="skeleton-wrap">
          @for (i of [1,2,3]; track i) {
            <p-skeleton height="140px" borderRadius="14px" />
          }
        </div>
      } @else {

        @for (nivel of NIVELES; track nivel) {
          @if (hayEnNivel(nivel)) {
            <div class="nivel-block">

              <!-- Cabecera del nivel -->
              <div class="nivel-header" [style.--nc]="nivelColor(nivel)">
                <div class="nivel-left">
                  <div class="nivel-pill">{{ nivelLabel(nivel) }}</div>
                  <span class="nivel-count">{{ cursosPorNivel(nivel).length }} curso{{ cursosPorNivel(nivel).length !== 1 ? 's' : '' }}</span>
                </div>
              </div>

              <!-- Filas de grado -->
              @for (grado of GRADOS_POR_NIVEL[nivel]; track grado.value) {
                @if (cursosPorGrado(nivel, grado.value).length > 0) {
                  <div class="grado-row">
                    <div class="grado-label">
                      <span class="grado-num">{{ grado.label }}</span>
                      <span class="grado-count">{{ cursosPorGrado(nivel, grado.value).length }}</span>
                    </div>
                    <div class="cursos-lista">
                      @for (curso of cursosPorGrado(nivel, grado.value); track curso.id) {
                        <div class="curso-chip" [class.inactivo]="!curso.activo">
                          <div class="chip-body">
                            <span class="chip-nombre">{{ curso.nombre }}</span>
                            @if (curso.profesorNombre) {
                              <span class="chip-prof">
                                <i class="pi pi-user"></i> {{ curso.profesorNombre }}
                              </span>
                            } @else {
                              <span class="chip-prof sin">Sin docente</span>
                            }
                          </div>
                          <div class="chip-actions">
                            <p-button icon="pi pi-pencil" [text]="true" [rounded]="true"
                              severity="secondary" size="small"
                              (click)="openEdit(curso)"
                              pTooltip="Editar" tooltipPosition="top" />
                            <p-button icon="pi pi-trash" [text]="true" [rounded]="true"
                              severity="danger" size="small"
                              (click)="onDelete(curso)"
                              pTooltip="Desactivar" tooltipPosition="top" />
                          </div>
                        </div>
                      }
                    </div>
                  </div>
                }
              }

            </div>
          }
        }

        @if (cursos().length === 0) {
          <div class="empty-state">
            <i class="pi pi-book"></i>
            <p>No hay cursos registrados todavía.</p>
            <p-button label="Crear el primero" [text]="true" (click)="openCreate()" />
          </div>
        }
      }

      <app-confirm-modal
        [(visible)]="showConfirm"
        title="Desactivar curso"
        [message]="'¿Desactivar ' + (pendingCurso?.nombre ?? '') + '?'"
        confirmLabel="Desactivar"
        (confirm)="executeDelete()"
        (cancel)="showConfirm = false" />

      <app-modal
        [(visible)]="showModal"
        [title]="editingCurso ? 'Editar curso' : 'Nuevo curso'"
        [subtitle]="editingCurso ? editingCurso.nombre : 'Completá los campos para registrar el curso'">
        @if (showModal) {
          <app-curso-form [curso]="editingCurso" (save)="onSave($event)" (cancel)="showModal = false" />
        }
      </app-modal>
    </div>
  `,
  styles: [`
    .page { padding: 1.75rem 2rem; display: flex; flex-direction: column; gap: 1rem; min-height: 100%; }

    .page-header { display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap; }
    .page-title { font-size: 1.625rem; font-weight: 700; color: #111827; margin: 0; letter-spacing: -0.02em; }
    .page-subtitle { font-size: 0.875rem; color: #9ca3af; margin: 0.2rem 0 0; }
    .header-actions { display: flex; align-items: center; gap: 0.75rem; }
    .search-input { width: 200px; border-radius: 8px; font-size: 0.875rem; }

    /* Nivel block */
    .nivel-block {
      border: 1px solid #e5e7eb;
      border-radius: 14px;
      overflow: hidden;
      background: white;
    }

    .nivel-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 0.75rem 1.25rem;
      background: linear-gradient(90deg, color-mix(in srgb, var(--nc) 8%, white), white);
      border-bottom: 1px solid #f3f4f6;
      border-left: 4px solid var(--nc, #6366f1);
    }
    .nivel-left { display: flex; align-items: center; gap: 0.75rem; }
    .nivel-pill {
      font-size: 0.75rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;
      color: var(--nc, #6366f1);
      background: color-mix(in srgb, var(--nc) 12%, white);
      padding: 0.25rem 0.75rem; border-radius: 20px;
    }
    .nivel-count { font-size: 0.8125rem; color: #9ca3af; }

    /* Grado row */
    .grado-row {
      display: flex; align-items: flex-start; gap: 0;
      border-bottom: 1px solid #f9fafb;
      min-height: 56px;
    }
    .grado-row:last-child { border-bottom: none; }

    .grado-label {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      min-width: 72px; padding: 0.875rem 0.75rem;
      background: #fafafa;
      border-right: 1px solid #f3f4f6;
      gap: 0.25rem;
      align-self: stretch;
    }
    .grado-num { font-size: 0.875rem; font-weight: 700; color: #374151; }
    .grado-count {
      font-size: 0.65rem; font-weight: 700;
      background: #e5e7eb; color: #6b7280;
      padding: 0.1rem 0.4rem; border-radius: 8px;
    }

    /* Cursos lista */
    .cursos-lista {
      flex: 1; display: flex; flex-wrap: wrap; gap: 0.5rem;
      padding: 0.75rem 1rem; align-content: flex-start;
    }

    .curso-chip {
      display: flex; align-items: center; gap: 0.625rem;
      background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px;
      padding: 0.5rem 0.375rem 0.5rem 0.75rem;
      transition: box-shadow 0.15s, border-color 0.15s;
    }
    .curso-chip:hover { border-color: #c7d2fe; box-shadow: 0 2px 8px rgba(99,102,241,0.08); }
    .curso-chip.inactivo { opacity: 0.5; }

    .chip-body { display: flex; flex-direction: column; gap: 0.1rem; min-width: 0; }
    .chip-nombre { font-size: 0.875rem; font-weight: 600; color: #111827; white-space: nowrap; }
    .chip-prof {
      display: flex; align-items: center; gap: 0.25rem;
      font-size: 0.7rem; color: #9ca3af;
    }
    .chip-prof i { font-size: 0.65rem; }
    .chip-prof.sin { color: #d1d5db; font-style: italic; }

    .chip-actions { display: flex; gap: 0; opacity: 0; transition: opacity 0.12s; }
    .curso-chip:hover .chip-actions { opacity: 1; }

    /* Skeleton */
    .skeleton-wrap { display: flex; flex-direction: column; gap: 0.75rem; }

    /* Empty */
    .empty-state { display: flex; flex-direction: column; align-items: center; padding: 5rem; gap: 0.75rem; }
    .empty-state i { font-size: 2.5rem; color: #e5e7eb; }
    .empty-state p { font-size: 0.9375rem; color: #9ca3af; margin: 0; }

    /* Dark mode */
    :host-context(.dark-mode) .page-title { color: #f1f5f9; }
    :host-context(.dark-mode) .nivel-block { background: #1e293b; border-color: #334155; }
    :host-context(.dark-mode) .nivel-header {
      background: linear-gradient(90deg, color-mix(in srgb, var(--nc) 15%, #1e293b), #1e293b);
      border-color: #334155;
    }
    :host-context(.dark-mode) .nivel-pill {
      background: color-mix(in srgb, var(--nc) 20%, #1e293b);
    }
    :host-context(.dark-mode) .grado-row { border-color: #334155; }
    :host-context(.dark-mode) .grado-label { background: #162032; border-color: #334155; }
    :host-context(.dark-mode) .grado-num { color: #e2e8f0; }
    :host-context(.dark-mode) .grado-count { background: #334155; color: #94a3b8; }
    :host-context(.dark-mode) .curso-chip { background: #162032; border-color: #334155; }
    :host-context(.dark-mode) .curso-chip:hover { border-color: #4f46e5; }
    :host-context(.dark-mode) .chip-nombre { color: #f1f5f9; }
  `]
})
export class DirectorCursosComponent implements OnInit {
  private cursoService = inject(CursoService);
  private messageService = inject(MessageService);

  readonly GRADOS_POR_NIVEL = GRADOS_POR_NIVEL;
  readonly NIVELES = NIVELES;

  loading = signal(true);
  cursos = signal<Curso[]>([]);
  searchTerm = '';
  showModal = false;
  showConfirm = false;
  editingCurso: Curso | null = null;
  pendingCurso: Curso | null = null;
  anioActual = new Date().getFullYear();

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

  hayEnNivel(nivel: string): boolean {
    return this.cursos().some(c => c.nivel === nivel);
  }

  cursosPorNivel(nivel: string): Curso[] {
    return this.filtrados().filter(c => c.nivel === nivel);
  }

  cursosPorGrado(nivel: string, grado: number): Curso[] {
    return this.filtrados().filter(c => c.nivel === nivel && c.grados.includes(grado));
  }

  filtrados(): Curso[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) return this.cursos();
    return this.cursos().filter(c =>
      c.nombre.toLowerCase().includes(term) ||
      c.profesorNombre?.toLowerCase().includes(term)
    );
  }

  openCreate() { this.editingCurso = null; this.showModal = true; }
  openEdit(curso: Curso) { this.editingCurso = { ...curso }; this.showModal = true; }

  onSave(curso: Curso) {
    const op = curso.id ? this.cursoService.update(curso.id, curso) : this.cursoService.create(curso);
    op.subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: curso.id ? 'Curso actualizado' : 'Curso creado' });
        this.showModal = false;
        this.loadCursos();
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar el curso' })
    });
  }

  onDelete(curso: Curso) { this.pendingCurso = curso; this.showConfirm = true; }

  executeDelete() {
    if (!this.pendingCurso?.id) return;
    this.cursoService.delete(this.pendingCurso.id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Curso desactivado' });
        this.pendingCurso = null;
        this.loadCursos();
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo desactivar' })
    });
  }

  nivelColor(nivel: string): string { return ({ INICIAL: '#d97706', PRIMARIA: '#6366f1', SECUNDARIA: '#059669' } as any)[nivel] ?? '#6b7280'; }
  nivelLabel(nivel: string): string { return ({ INICIAL: 'Inicial', PRIMARIA: 'Primaria', SECUNDARIA: 'Secundaria' } as any)[nivel] ?? nivel; }
}
