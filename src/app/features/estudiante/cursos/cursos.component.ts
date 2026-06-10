import { Component, OnInit, inject, signal , ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { CursoService, Curso } from '../../../core/services/curso.service';
import { MatriculaService, MatriculaDTO } from '../../../core/services/matricula.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-estudiante-cursos',
  standalone: true,
  imports: [CommonModule, SkeletonModule, TagModule, ToastModule],
  providers: [MessageService],
  template: `
    <div class="page">
      <p-toast />

      <div class="page-header">
        <div>
          <h1 class="page-title">Mis cursos</h1>
          @if (matricula()) {
            <p class="page-subtitle">
              {{ matricula()!.grado }}° {{ nivelLabel(matricula()!.nivel) }} · {{ cursos().length }} curso{{ cursos().length !== 1 ? 's' : '' }}
            </p>
          }
        </div>
      </div>

      @if (loading()) {
        <div class="cards-grid">
          @for (i of [1,2,3,4,5,6]; track i) {
            <div class="curso-card skeleton-card">
              <p-skeleton height="0.75rem" width="40%" styleClass="mb-3" />
              <p-skeleton height="1.125rem" width="80%" styleClass="mb-2" />
              <p-skeleton height="0.75rem" width="65%" />
            </div>
          }
        </div>
      } @else if (!matricula()) {
        <div class="empty-state">
          <i class="pi pi-info-circle"></i>
          <p>No tenés una matrícula activa este año.</p>
        </div>
      } @else if (cursos().length === 0) {
        <div class="empty-state">
          <i class="pi pi-book"></i>
          <p>No hay cursos registrados para tu grado todavía.</p>
        </div>
      } @else {
        <div class="cards-grid">
          @for (curso of cursos(); track curso.id) {
            <div class="curso-card">
              <div class="card-accent" [style.background]="nivelColor(curso.nivel)"></div>
              <div class="card-body">
                <h3 class="card-nombre">{{ curso.nombre }}</h3>
                @if (curso.descripcion) {
                  <p class="card-desc">{{ curso.descripcion }}</p>
                }
              </div>
              <div class="card-footer">
                @if (curso.profesorNombres?.length) {
                  <div class="card-profesor">
                    <i class="pi pi-user"></i>
                    <span>{{ curso.profesorNombres!.join(', ') }}</span>
                  </div>
                } @else {
                  <span class="sin-profesor">Sin docente asignado</span>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .page { padding: 1.75rem 2rem; display: flex; flex-direction: column; gap: 1.5rem; min-height: 100%; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; }
    .page-title { font-size: 1.625rem; font-weight: 700; color: #111827; margin: 0; letter-spacing: -0.02em; }
    .page-subtitle { font-size: 0.875rem; color: #9ca3af; margin: 0.25rem 0 0; }

    .cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1rem; }

    .curso-card {
      background: white; border: 1px solid #f3f4f6; border-radius: 14px;
      overflow: hidden; display: flex; flex-direction: column;
      transition: box-shadow 0.2s, transform 0.2s;
    }
    .curso-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.07); transform: translateY(-2px); }
    .card-accent { height: 3px; }
    .card-body { padding: 1rem 1.125rem 0.75rem; flex: 1; display: flex; flex-direction: column; gap: 0.5rem; }
    .card-nombre { font-size: 0.9375rem; font-weight: 650; color: #111827; margin: 0; line-height: 1.3; }
    .card-desc { font-size: 0.8125rem; color: #6b7280; margin: 0; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .card-footer { padding: 0.625rem 1.125rem; border-top: 1px solid #f9fafb; }
    .card-profesor { display: flex; align-items: center; gap: 0.375rem; font-size: 0.8125rem; color: #6b7280; }
    .card-profesor i { font-size: 0.75rem; }
    .sin-profesor { font-size: 0.75rem; color: #d1d5db; font-style: italic; }

    .skeleton-card { padding: 1.25rem; min-height: 120px; }

    .empty-state { display: flex; flex-direction: column; align-items: center; padding: 4rem; gap: 0.75rem; }
    .empty-state i { font-size: 2.5rem; color: #e5e7eb; }
    .empty-state p { font-size: 0.9375rem; color: #9ca3af; margin: 0; }

    :host-context(.dark-mode) .page-title, :host-context(.dark-mode) .card-nombre { color: #f9fafb; }
    :host-context(.dark-mode) .curso-card { background: #1e293b; border-color: #334155; }
    :host-context(.dark-mode) .card-footer { border-color: #334155; }
  `]
})
export class EstudianteCursosComponent implements OnInit {
  private cursoService = inject(CursoService);
  private matriculaService = inject(MatriculaService);
  private messageService = inject(MessageService);

  loading = signal(true);
  cursos = signal<Curso[]>([]);
  matricula = signal<MatriculaDTO | null>(null);

  ngOnInit() {
    this.matriculaService.getMiMatricula().subscribe({
      next: (m) => {
        this.matricula.set(m);
        this.cursoService.getByNivelAndGrado(m.nivel, m.grado).subscribe({
          next: (data) => { this.cursos.set(data); this.loading.set(false); },
          error: () => this.loading.set(false)
        });
      },
      error: () => {
        this.matricula.set(null);
        this.loading.set(false);
      }
    });
  }

  nivelColor(nivel: string): string { return ({ INICIAL: '#d97706', PRIMARIA: '#6366f1', SECUNDARIA: '#059669' } as any)[nivel] ?? '#6366f1'; }
  nivelLabel(nivel: string): string { return ({ INICIAL: 'Inicial', PRIMARIA: 'Primaria', SECUNDARIA: 'Secundaria' } as any)[nivel] ?? nivel; }
}
