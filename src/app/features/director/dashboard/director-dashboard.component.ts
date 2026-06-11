import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { forkJoin } from 'rxjs';
import { DashboardService, DashboardData } from '../../../core/services/dashboard.service';
import { AuthService } from '../../../core/services/auth.service';
import { MatriculaService, MatriculaDTO } from '../../../core/services/matricula.service';
import { PagoService, Pago } from '../../../core/services/pago.service';

interface MatriculaItem {
  nombre: string;
  iniciales: string;
  color: string;
  curso: string;
  fecha: string;
  estado: string;
}

interface ActividadItem {
  icono: string;
  tipo: string;
  descripcion: string;
  tiempo: string;
}

const AVATAR_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#3b82f6', '#8b5cf6', '#ec4899'];

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-director-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, CardModule, ButtonModule, AvatarModule, TagModule, SkeletonModule],
  templateUrl: './director-dashboard.component.html',
  styleUrl: './director-dashboard.component.scss'
})
export class DirectorDashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private authService     = inject(AuthService);
  private matriculaService = inject(MatriculaService);
  private pagoService      = inject(PagoService);

  loading          = signal(true);
  data             = signal<DashboardData | null>(null);
  ultimasMatriculas = signal<MatriculaItem[]>([]);
  actividades       = signal<ActividadItem[]>([]);

  nombreDirector = computed(() => this.authService.user()?.nombre ?? '');

  ngOnInit() {
    forkJoin({
      dashboard: this.dashboardService.get(),
      matriculas: this.matriculaService.getAll(),
      pagos:      this.pagoService.getAll()
    }).subscribe({
      next: ({ dashboard, matriculas, pagos }) => {
        this.data.set(dashboard);
        this.ultimasMatriculas.set(this.buildUltimasMatriculas(matriculas));
        this.actividades.set(this.buildActividades(matriculas, pagos));
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  private buildUltimasMatriculas(matriculas: MatriculaDTO[]): MatriculaItem[] {
    return [...matriculas]
      .sort((a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime())
      .slice(0, 4)
      .map(m => ({
        nombre:    m.estudianteNombre,
        iniciales: this.iniciales(m.estudianteNombre),
        color:     this.colorFromName(m.estudianteNombre),
        curso:     `${m.grado}° ${this.nivelLabel(m.nivel)}`,
        fecha:     this.fechaRelativa(m.fechaCreacion),
        estado:    m.estadoPago === 'PAGADO' ? 'Confirmado' : 'Pendiente'
      }));
  }

  private buildActividades(matriculas: MatriculaDTO[], pagos: Pago[]): ActividadItem[] {
    const entradas: { fecha: Date; item: ActividadItem }[] = [];

    matriculas.forEach(m => {
      if (m.fechaCreacion) {
        entradas.push({
          fecha: new Date(m.fechaCreacion),
          item: {
            icono:       'pi pi-user-plus',
            tipo:        'usuario',
            descripcion: `Matrícula registrada: ${m.estudianteNombre}`,
            tiempo:      this.fechaRelativa(m.fechaCreacion)
          }
        });
      }
    });

    pagos.forEach(p => {
      if (p.fechaPago) {
        entradas.push({
          fecha: new Date(p.fechaPago),
          item: {
            icono:       'pi pi-wallet',
            tipo:        'pago',
            descripcion: `Pago registrado: ${p.concepto}`,
            tiempo:      this.fechaRelativa(p.fechaPago)
          }
        });
      }
    });

    return entradas
      .sort((a, b) => b.fecha.getTime() - a.fecha.getTime())
      .slice(0, 5)
      .map(e => e.item);
  }

  private iniciales(nombre: string): string {
    return (nombre ?? '').split(' ').filter(Boolean).slice(0, 2)
      .map(p => p[0]).join('').toUpperCase() || '?';
  }

  private colorFromName(nombre: string): string {
    let hash = 0;
    for (let i = 0; i < nombre.length; i++) hash = nombre.charCodeAt(i) + hash * 31;
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
  }

  private nivelLabel(nivel: string): string {
    return ({ INICIAL: 'Inicial', PRIMARIA: 'Primaria', SECUNDARIA: 'Secundaria' } as Record<string, string>)[nivel] ?? nivel;
  }

  private fechaRelativa(fecha: string | null | undefined): string {
    if (!fecha) return '';
    const days = Math.floor((Date.now() - new Date(fecha).getTime()) / 86_400_000);
    if (days === 0) return 'Hoy';
    if (days === 1) return 'Ayer';
    return `Hace ${days} días`;
  }
}
