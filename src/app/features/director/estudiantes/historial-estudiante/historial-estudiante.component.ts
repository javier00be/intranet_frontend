import { Component, OnInit, inject, signal, computed , ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar';
import { SkeletonModule } from 'primeng/skeleton';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { forkJoin } from 'rxjs';
import { EstudianteService, EstudianteDTO, CalificacionDTO, AsistenciaDTO } from '../../../../core/services/estudiante.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-historial-estudiante',
  standalone: true,
  imports: [CommonModule, TableModule, ButtonModule, TagModule, AvatarModule, SkeletonModule, ToastModule],
  providers: [MessageService],
  templateUrl: './historial-estudiante.component.html',
  styleUrl: './historial-estudiante.component.scss'
})
export class HistorialEstudianteComponent implements OnInit {
  private estudianteService = inject(EstudianteService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private messageService = inject(MessageService);

  loading = signal(true);
  estudiante = signal<EstudianteDTO | null>(null);
  calificaciones = signal<CalificacionDTO[]>([]);
  asistencias = signal<AsistenciaDTO[]>([]);
  activeTab: 'notas' | 'asistencias' = 'notas';

  promedio = computed(() => {
    const vals = this.calificaciones().map(c => c.valor ?? 0).filter(v => v > 0);
    if (!vals.length) return null;
    return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
  });

  asistenciaPct = computed(() => {
    const all = this.asistencias();
    if (!all.length) return null;
    return Math.round((all.filter(a => a.presente).length / all.length) * 100);
  });

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    forkJoin({
      estudiante: this.estudianteService.getById(id),
      calificaciones: this.estudianteService.getCalificaciones(id),
      asistencias: this.estudianteService.getAsistencias(id)
    }).subscribe({
      next: ({ estudiante, calificaciones, asistencias }) => {
        this.estudiante.set(estudiante);
        this.calificaciones.set(calificaciones);
        this.asistencias.set(asistencias);
        this.loading.set(false);
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el historial' });
        this.loading.set(false);
      }
    });
  }

  back() {
    this.router.navigate(['/director/estudiantes']);
  }

  initials(e: EstudianteDTO): string {
    return `${e.usuario?.nombre?.[0] ?? ''}${e.usuario?.apellido?.[0] ?? ''}`.toUpperCase() || '?';
  }

  nivelLabel(nivel: string): string {
    return ({ INICIAL: 'Inicial', PRIMARIA: 'Primaria', SECUNDARIA: 'Secundaria' } as any)[nivel] ?? nivel;
  }

  tipoLabel(tipo: string): string {
    return ({ EXAMEN: 'Examen', TAREA: 'Tarea', PARTICIPACION: 'Participación', PROYECTO: 'Proyecto' } as any)[tipo] ?? tipo;
  }

  tipoSeverity(tipo: string): any {
    return ({ EXAMEN: 'danger', TAREA: 'info', PARTICIPACION: 'secondary', PROYECTO: 'success' } as any)[tipo] ?? 'secondary';
  }

  valorColor(v: number): string {
    if (v >= 14) return 'var(--green-500)';
    if (v >= 11) return 'var(--yellow-500)';
    return 'var(--red-500)';
  }
}
