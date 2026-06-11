import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule, ButtonSeverity } from 'primeng/button';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-director-cursos',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ButtonModule, ToastModule, SkeletonModule,
    TooltipModule, TagModule, InputTextModule, IconFieldModule, InputIconModule,
    CursoFormComponent, ModalComponent, ConfirmModalComponent
  ],
  providers: [MessageService],
  templateUrl: './cursos.component.html',
  styleUrl: './cursos.component.scss'
})
export class DirectorCursosComponent implements OnInit {
  private cursoService = inject(CursoService);
  private messageService = inject(MessageService);

  readonly GRADOS_POR_NIVEL = GRADOS_POR_NIVEL;
  readonly NIVELES = NIVELES;

  loading = signal(true);
  cursos = signal<Curso[]>([]);
  activeNivel = signal<NivelEducativo>('INICIAL');
  searchTerm = signal('');
  showModal = false;
  showConfirm = false;
  editingCurso: Curso | null = null;
  pendingCurso: Curso | null = null;
  pendingAction: 'desactivar' | 'reactivar' = 'desactivar';
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

  selectNivel(nivel: NivelEducativo) {
    this.activeNivel.set(nivel);
    this.searchTerm.set('');
  }

  countPorNivel(nivel: string): number {
    return this.cursos().filter(c => c.nivel === nivel).length;
  }

  cursosActivos(): Curso[] {
    const nivel = this.activeNivel();
    const term = this.searchTerm().trim().toLowerCase();
    const base = this.cursos().filter(c => c.nivel === nivel);
    if (!term) return base;
    return base.filter(c =>
      c.nombre.toLowerCase().includes(term) ||
      c.profesorNombres?.some(n => n.toLowerCase().includes(term))
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

  onToggleActivo(curso: Curso) {
    this.pendingCurso = curso;
    this.pendingAction = curso.activo !== false ? 'desactivar' : 'reactivar';
    this.showConfirm = true;
  }

  executeAction() {
    if (!this.pendingCurso?.id) return;
    const op = this.pendingAction === 'desactivar'
      ? this.cursoService.delete(this.pendingCurso.id)
      : this.cursoService.reactivate(this.pendingCurso.id);
    op.subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: `Curso ${this.pendingAction === 'desactivar' ? 'desactivado' : 'reactivado'}` });
        this.pendingCurso = null;
        this.loadCursos();
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo completar la acción' })
    });
  }

  get confirmSev(): ButtonSeverity { return this.pendingAction === 'desactivar' ? 'danger' : 'success'; }

  nivelColor(nivel: string): string { return ({ INICIAL: '#d97706', PRIMARIA: '#6366f1', SECUNDARIA: '#059669' } as any)[nivel] ?? '#6b7280'; }
  nivelLabel(nivel: string): string { return ({ INICIAL: 'Inicial', PRIMARIA: 'Primaria', SECUNDARIA: 'Secundaria' } as any)[nivel] ?? nivel; }
  gradoLabel(nivel: string, grado: number): string {
    return this.GRADOS_POR_NIVEL[nivel]?.find(g => g.value === grado)?.label ?? String(grado);
  }
}
