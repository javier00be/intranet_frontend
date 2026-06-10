import { Component, OnInit, inject, signal , ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar';
import { SkeletonModule } from 'primeng/skeleton';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { forkJoin, switchMap } from 'rxjs';
import { PadreService } from '../../../core/services/padre.service';
import { EstudianteService, EstudianteDTO, CalificacionDTO } from '../../../core/services/estudiante.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-padre-calificaciones',
  standalone: true,
  imports: [CommonModule, TableModule, ButtonModule, TagModule, AvatarModule, SkeletonModule, ToastModule],
  providers: [MessageService],
  templateUrl: './padre-calificaciones.component.html',
  styleUrl: './padre-calificaciones.component.scss'
})
export class PadreCalificacionesComponent implements OnInit {
  private padreService     = inject(PadreService);
  private estudianteService = inject(EstudianteService);
  private route            = inject(ActivatedRoute);
  private messageService   = inject(MessageService);

  loading = signal(true);
  hijos   = signal<EstudianteDTO[]>([]);
  selected = signal<EstudianteDTO | null>(null);
  calificaciones = signal<CalificacionDTO[]>([]);
  loadingNotas = signal(false);

  promedio = signal<number | null>(null);

  ngOnInit() {
    const hijoIdParam = Number(this.route.snapshot.queryParamMap.get('hijo'));
    this.padreService.getMe().pipe(
      switchMap(padre => {
        const ids = padre.hijoIds ?? [];
        return forkJoin(ids.map(id => this.estudianteService.getById(id)));
      })
    ).subscribe({
      next: hijos => {
        this.hijos.set(hijos);
        const initial = hijoIdParam ? hijos.find(h => h.id === hijoIdParam) : hijos[0];
        if (initial) this.selectHijo(initial);
        this.loading.set(false);
      },
      error: () => { this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los hijos' }); this.loading.set(false); }
    });
  }

  selectHijo(h: EstudianteDTO) {
    this.selected.set(h);
    this.loadingNotas.set(true);
    this.estudianteService.getCalificaciones(h.id).subscribe({
      next: data => {
        this.calificaciones.set(data);
        const vals = data.map(c => c.valor ?? 0).filter(v => v > 0);
        this.promedio.set(vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : null);
        this.loadingNotas.set(false);
      },
      error: () => this.loadingNotas.set(false)
    });
  }

  initials(h: EstudianteDTO): string {
    return `${h.usuario?.nombre?.[0] ?? ''}${h.usuario?.apellido?.[0] ?? ''}`.toUpperCase() || '?';
  }

  tipoLabel(t: string): string {
    return ({ EXAMEN: 'Examen', TAREA: 'Tarea', PARTICIPACION: 'Participación', PROYECTO: 'Proyecto' } as any)[t] ?? t;
  }

  tipoSeverity(t: string): any {
    return ({ EXAMEN: 'danger', TAREA: 'info', PARTICIPACION: 'secondary', PROYECTO: 'success' } as any)[t] ?? 'secondary';
  }

  valorColor(v: number): string {
    if (v >= 14) return 'var(--green-500)';
    if (v >= 11) return 'var(--yellow-500)';
    return 'var(--red-500)';
  }
}
