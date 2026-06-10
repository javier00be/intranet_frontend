import { Component, OnInit, inject, signal, computed , ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { forkJoin, of, switchMap } from 'rxjs';
import { PadreService } from '../../../core/services/padre.service';
import { EstudianteService, EstudianteDTO, CalificacionDTO, AsistenciaDTO } from '../../../core/services/estudiante.service';
import { MensualidadService, MensualidadDTO } from '../../../core/services/mensualidad.service';
import { AuthService } from '../../../core/services/auth.service';

export interface HijoResumen {
  estudiante: EstudianteDTO;
  promedio: number | null;
  asistenciaPct: number | null;
  proximaCuota: MensualidadDTO | null;
  alertaNotas: boolean;
  alertaAsistencia: boolean;
  alertaPago: boolean;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-padre-dashboard',
  standalone: true,
  imports: [CommonModule, ButtonModule, AvatarModule, TagModule, SkeletonModule, ToastModule],
  providers: [MessageService],
  templateUrl: './padre-dashboard.component.html',
  styleUrl: './padre-dashboard.component.scss'
})
export class PadreDashboardComponent implements OnInit {
  private padreService   = inject(PadreService);
  private estudianteService = inject(EstudianteService);
  private mensualidadService = inject(MensualidadService);
  authService = inject(AuthService);
  private router = inject(Router);
  private messageService = inject(MessageService);

  loading = signal(true);
  hijos = signal<HijoResumen[]>([]);

  tieneAlertas = computed(() => this.hijos().some(h => h.alertaNotas || h.alertaAsistencia || h.alertaPago));

  ngOnInit() {
    this.padreService.getMe().pipe(
      switchMap(padre => {
        const ids = padre.hijoIds ?? [];
        if (!ids.length) return of([]);
        return forkJoin(ids.map(id => forkJoin({
          estudiante: this.estudianteService.getById(id),
          calificaciones: this.estudianteService.getCalificaciones(id),
          asistencias: this.estudianteService.getAsistencias(id),
          mensualidades: this.mensualidadService.getByEstudiante(id)
        })));
      })
    ).subscribe({
      next: results => {
        this.hijos.set(results.map(r => this.buildResumen(r)));
        this.loading.set(false);
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar la información' });
        this.loading.set(false);
      }
    });
  }

  private buildResumen(r: { estudiante: EstudianteDTO; calificaciones: CalificacionDTO[]; asistencias: AsistenciaDTO[]; mensualidades: MensualidadDTO[] }): HijoResumen {
    const vals = r.calificaciones.map(c => c.valor ?? 0).filter(v => v > 0);
    const promedio = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
    const asistenciaPct = r.asistencias.length
      ? Math.round((r.asistencias.filter(a => a.presente).length / r.asistencias.length) * 100)
      : null;
    const pendientes = r.mensualidades
      .filter(m => m.estadoPago !== 'PAGADO')
      .sort((a, b) => {
        const mOrder = ['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO','JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE'];
        return mOrder.indexOf(a.mes) - mOrder.indexOf(b.mes);
      });
    return {
      estudiante: r.estudiante,
      promedio: promedio !== null ? Math.round(promedio * 10) / 10 : null,
      asistenciaPct,
      proximaCuota: pendientes[0] ?? null,
      alertaNotas: promedio !== null && promedio < 11,
      alertaAsistencia: asistenciaPct !== null && asistenciaPct < 70,
      alertaPago: pendientes.some(m => m.estadoPago === 'VENCIDO')
    };
  }

  verCalificaciones(id: number) { this.router.navigate(['/padre/calificaciones'], { queryParams: { hijo: id } }); }
  verAsistencia(id: number)     { this.router.navigate(['/padre/asistencia'],     { queryParams: { hijo: id } }); }
  verPagos(id: number)          { this.router.navigate(['/padre/pagos'],           { queryParams: { hijo: id } }); }

  initials(h: HijoResumen): string {
    return `${h.estudiante.usuario?.nombre?.[0] ?? ''}${h.estudiante.usuario?.apellido?.[0] ?? ''}`.toUpperCase() || '?';
  }

  nivelLabel(n: string): string {
    return ({ INICIAL: 'Inicial', PRIMARIA: 'Primaria', SECUNDARIA: 'Secundaria' } as any)[n] ?? n;
  }

  promedioColor(p: number): string {
    if (p >= 14) return 'var(--green-500)';
    if (p >= 11) return 'var(--yellow-500)';
    return 'var(--red-500)';
  }

  estadoSeverity(e: string): any {
    return ({ PAGADO: 'success', PENDIENTE: 'warn', VENCIDO: 'danger' } as any)[e] ?? 'secondary';
  }
}
